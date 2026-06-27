// Load cross-browser compatibility shim (Chrome + Firefox)
importScripts('../lib/browser-compat.js');

// Cache to store resolved agent data to avoid redundant network lookups
const resolutionCache = new Map();


/**
 * Checks if a domain has a Creduent Agent associated with it
 */
async function checkDomainAgent(tabId, url) {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;
    const rootDomain = domain.startsWith('www.') ? domain.slice(4) : domain;

    // Check cache first
    if (resolutionCache.has(domain)) {
      const cachedData = resolutionCache.get(domain);
      updateBadge(tabId, cachedData);
      return;
    }

    // Update status to searching
    chrome.action.setBadgeText({ tabId, text: '...' });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#64748d' });

    let agentData = null;

    // Helper to fetch /.well-known/agent.json directly
    async function tryFetchAgentJson(host) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
        
        const response = await fetch(`https://${host}/.well-known/agent.json`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const agentJson = await response.json();
          if (agentJson && agentJson.agent_id) {
            const singleAttest = await fetchRegistryAttestation(agentJson.agent_id, domain);
            if (singleAttest) {
              return {
                status: 'found',
                agents: [singleAttest],
                domain: domain
              };
            }
          }
        }
      } catch (e) {
        console.log(`[Creduent] Direct fetch failed for ${host}:`, e);
      }
      return null;
    }

    // Helper to query registry by host string (fetches all matching agents in parallel)
    async function tryQueryRegistry(queryHost) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`https://registry.idevsec.com/agents?query=${encodeURIComponent(queryHost)}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const matchingAgents = await response.json();
          if (Array.isArray(matchingAgents) && matchingAgents.length > 0) {
            const attestationPromises = matchingAgents.map(agent => fetchRegistryAttestation(agent.agent_id, domain));
            const resolvedAttestations = await Promise.all(attestationPromises);
            const validAttestations = resolvedAttestations.filter(a => a !== null);
            if (validAttestations.length > 0) {
              return {
                status: 'found',
                agents: validAttestations,
                domain: domain
              };
            }
          }
        }
      } catch (e) {
        console.log(`[Creduent] Registry query failed for domain ${queryHost}:`, e);
      }
      return null;
    }

    // 1. Try direct fetch from the current tab domain
    agentData = await tryFetchAgentJson(domain);

    // 2. Try direct fetch from the root domain (if subdomain)
    if (!agentData && domain.startsWith('www.')) {
      agentData = await tryFetchAgentJson(rootDomain);
    }

    // 3. Query registry by current tab domain
    if (!agentData) {
      agentData = await tryQueryRegistry(domain);
    }

    // 4. Query registry by root domain (if subdomain)
    if (!agentData && domain.startsWith('www.')) {
      agentData = await tryQueryRegistry(rootDomain);
    }

    // If still no agent, register as none
    if (!agentData) {
      agentData = { status: 'none', domain };
    }

    // Save to cache
    resolutionCache.set(domain, agentData);
    updateBadge(tabId, agentData);

  } catch (error) {
    console.error('[Creduent] Error during agent check:', error);
    chrome.action.setBadgeText({ tabId, text: '' });
  }
}

/**
 * Fetches attestation details for a specific agent ID from the registry
 */
async function fetchRegistryAttestation(agentId, domain) {
  try {
    const cleanAgentId = agentId.startsWith('agent:/') && !agentId.startsWith('agent://') 
      ? 'agent://' + agentId.slice(7) 
      : agentId;

    const response = await fetch(`https://registry.idevsec.com/attest/${encodeURIComponent(cleanAgentId)}`);
    if (response.ok) {
      const attestation = await response.json();
      
      // Perform cryptographic signature verification locally!
      let signatureVerified = false;
      const signatureB64 = attestation.signature;
      if (signatureB64) {
        const attestationDoc = { ...attestation };
        delete attestationDoc.signature; // Pop signature for canonical checks
        delete attestationDoc.status;    // Pop any ephemeral status tags added by endpoints
        delete attestationDoc.expired;   // Pop ephemeral expiration flags
        
        const canonicalStr = canonicalize(attestationDoc);
        const registryPubKey = await getRegistryPublicKey();
        if (registryPubKey) {
          try {
            const sigBytes = base64ToBytes(signatureB64);
            const dataBytes = new TextEncoder().encode(canonicalStr);
            signatureVerified = await crypto.subtle.verify(
              "Ed25519",
              registryPubKey,
              sigBytes,
              dataBytes
            );
            console.log(`[Creduent] Signature verification for ${cleanAgentId}:`, signatureVerified ? 'PASSED' : 'FAILED');
          } catch (cryptoErr) {
            console.error('[Creduent] Crypto verification execution error:', cryptoErr);
          }
        }
      }

      // Check for expiration
      let isExpired = false;
      if (attestation.expired === true) {
        isExpired = true;
      } else {
        const expValue = attestation.valid_until || attestation.expires;
        if (expValue) {
          try {
            let expMs = 0;
            if (typeof expValue === 'number') {
              expMs = expValue < 10000000000 ? expValue * 1000 : expValue;
            } else if (typeof expValue === 'string') {
              expMs = Date.parse(expValue);
            }
            if (expMs && Date.now() > expMs) {
              isExpired = true;
            }
          } catch (e) {
            console.error('[Creduent] Error parsing expiration time:', e);
          }
        }
      }

      return {
        status: 'found',
        level: isExpired ? 'expired' : (signatureVerified ? (attestation.level || 'unverified') : 'unverified'),
        signature_verified: signatureVerified,
        expired: isExpired,
        agent_id: attestation.agent_id || cleanAgentId,
        public_key: attestation.public_key || '',
        capabilities: attestation.capabilities || [],
        owner: attestation.owner || 'Unknown',
        domain: domain,
        registry_url: `https://registry.idevsec.com/resolver?uri=${encodeURIComponent(cleanAgentId)}`
      };
    } else if (response.status === 410) {
      // Revoked agents return 410
      return {
        status: 'found',
        level: 'revoked',
        signature_verified: false,
        expired: false,
        agent_id: cleanAgentId,
        public_key: '',
        capabilities: [],
        owner: 'Revoked',
        domain: domain,
        registry_url: `https://registry.idevsec.com/resolver?uri=${encodeURIComponent(cleanAgentId)}`
      };
    }
  } catch (e) {
    console.error(`[Creduent] Error fetching attestation for ${agentId}:`, e);
  }
  return null;
}

let registryPublicKeyCache = null;

/**
 * Loads the registry's public key from the registry and imports it into subtle crypto.
 */
async function getRegistryPublicKey() {
  if (registryPublicKeyCache) return registryPublicKeyCache;

  try {
    const response = await fetch('https://registry.idevsec.com/public-key');
    if (response.ok) {
      const data = await response.json();
      if (data && data.public_key) {
        let pubKeyBase64 = data.public_key;
        if (pubKeyBase64.startsWith('ed25519:')) {
          pubKeyBase64 = pubKeyBase64.split(':', 2)[1];
        }
        
        const rawKeyBytes = base64ToBytes(pubKeyBase64);
        registryPublicKeyCache = await crypto.subtle.importKey(
          "raw",
          rawKeyBytes,
          { name: "Ed25519" },
          false,
          ["verify"]
        );
        console.log('[Creduent] Loaded Registry Public Key');
        return registryPublicKeyCache;
      }
    }
  } catch (e) {
    console.error('[Creduent] Failed to fetch/import registry public key:', e);
  }
  return null;
}

/**
 * JCS Canonicalization Scheme (RFC 8785) in JavaScript
 */
function canonicalize(val) {
  if (val === null) return 'null';
  if (typeof val !== 'object') {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    return '[' + val.map(canonicalize).join(',') + ']';
  }
  const keys = Object.keys(val).sort();
  const parts = keys.map(k => {
    return JSON.stringify(k) + ':' + canonicalize(val[k]);
  });
  return '{' + parts.join(',') + '}';
}

/**
 * Base64 helper
 */
function base64ToBytes(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Updates the extension badge based on trust level
 */
function updateBadge(tabId, data) {
  if (data.status === 'none' || !data.agents || data.agents.length === 0) {
    chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  // Get the highest trust level among all matching agents
  const levels = data.agents.map(a => (a.level || '').toLowerCase());
  let highestLevel = 'unverified';
  
  if (levels.includes('revoked')) {
    highestLevel = 'revoked';
  } else if (levels.includes('expired')) {
    highestLevel = 'expired';
  } else if (levels.includes('trusted')) {
    highestLevel = 'trusted';
  } else if (levels.includes('verified')) {
    highestLevel = 'verified';
  }

  let badgeText = '?';
  let badgeColor = '#64748d'; // ink-mute

  if (highestLevel === 'trusted') {
    badgeText = '★'; // Star
    badgeColor = '#e2b070'; // Gold/lemon
  } else if (highestLevel === 'verified') {
    badgeText = '✓'; // Check
    badgeColor = '#533afd'; // Primary indigo
  } else if (highestLevel === 'revoked') {
    badgeText = '✕'; // Cross
    badgeColor = '#ea2261'; // Ruby red
  } else if (highestLevel === 'expired') {
    badgeText = '!'; // Warning exclamation
    badgeColor = '#f59e0b'; // Amber warning color
  }

  chrome.action.setBadgeText({ tabId, text: badgeText });
  chrome.action.setBadgeBackgroundColor({ tabId, color: badgeColor });
}

// Listen for tab changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url.startsWith('http')) {
    if (changeInfo.url || changeInfo.status === 'complete') {
      checkDomainAgent(tabId, tab.url);
    }
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    if (tab && tab.url && tab.url.startsWith('http')) {
      checkDomainAgent(activeInfo.tabId, tab.url);
    }
  });
});

// Handle requests from popup.js and content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAgentData') {
    const tabId = request.tabId;
    if (tabId) {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
          // Tab was closed or ID is no longer valid
          sendResponse({ status: 'none', domain: 'unknown' });
          return;
        }
        if (tab && tab.url) {
          const url = new URL(tab.url);
          const domain = url.hostname;
          if (resolutionCache.has(domain)) {
            sendResponse(resolutionCache.get(domain));
          } else {
            checkDomainAgent(tabId, tab.url).then(() => {
              sendResponse(resolutionCache.get(domain) || { status: 'none', domain });
            });
          }
        } else {
          sendResponse({ status: 'none', domain: 'unknown' });
        }
      });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].url) {
          const url = new URL(tabs[0].url);
          const domain = url.hostname;
          if (resolutionCache.has(domain)) {
            sendResponse(resolutionCache.get(domain));
          } else {
            const activeTabId = tabs[0].id;
            checkDomainAgent(activeTabId, tabs[0].url).then(() => {
              sendResponse(resolutionCache.get(domain) || { status: 'none', domain });
            });
          }
        } else {
          sendResponse({ status: 'none', domain: 'unknown' });
        }
      });
    }
    return true; // Keep message channel open for async response
  }

  if (request.action === 'agentMetaFound' && request.agentId) {
    const tabId = sender.tab ? sender.tab.id : null;
    const url = sender.tab ? sender.tab.url : null;
    if (tabId && url) {
      resolveMetaAgent(tabId, url, request.agentId);
    }
  }
});

/**
 * Resolves an agent that was declared on-page in meta/link tags
 */
async function resolveMetaAgent(tabId, url, agentId) {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;

    const agentAttestation = await fetchRegistryAttestation(agentId, domain);
    if (agentAttestation) {
      const cached = resolutionCache.get(domain) || { status: 'none', domain, agents: [] };
      cached.status = 'found';
      
      if (!cached.agents) cached.agents = [];
      
      // Check for duplicates
      const exists = cached.agents.some(a => a.agent_id === agentAttestation.agent_id);
      if (!exists) {
        cached.agents.push(agentAttestation);
      }
      
      resolutionCache.set(domain, cached);
      updateBadge(tabId, cached);
    }
  } catch (e) {
    console.error('[Creduent] Error resolving meta agent:', e);
  }
}
