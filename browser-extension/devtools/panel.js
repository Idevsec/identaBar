// panel.js - Manages the DevTools panel UI and playground logic

let currentAgents = [];
let activeAgent = null;

const tabJsonBtn = document.getElementById('tab-json-btn');
const tabVerifyBtn = document.getElementById('tab-verify-btn');
const tabJsonContent = document.getElementById('tab-json');
const tabVerifyContent = document.getElementById('tab-verify');

const mainGrid = document.getElementById('main-grid');
const noAgentState = document.getElementById('no-agent-state');
const domainDisplay = document.getElementById('domain-display');

const selectorContainer = document.getElementById('sidebar-selector-container');
const agentSelector = document.getElementById('sidebar-agent-selector');

// Attestation fields
const statusBadge = document.getElementById('agent-status');
const agentIdEl = document.getElementById('agent-id');
const ownerEl = document.getElementById('agent-owner');
const capsEl = document.getElementById('agent-caps');
const pubkeyEl = document.getElementById('agent-pubkey');
const jsonView = document.getElementById('json-view');

// Verify fields
const verifyMsgInput = document.getElementById('verify-msg');
const verifySigInput = document.getElementById('verify-sig');
const verifyRunBtn = document.getElementById('verify-run-btn');
const verifyConsole = document.getElementById('verify-console');

// Tab Selection Logic
tabJsonBtn.addEventListener('click', () => {
  tabJsonBtn.classList.add('active');
  tabVerifyBtn.classList.remove('active');
  tabJsonContent.classList.add('active');
  tabVerifyContent.classList.remove('active');
});

tabVerifyBtn.addEventListener('click', () => {
  tabVerifyBtn.classList.add('active');
  tabJsonBtn.classList.remove('active');
  tabVerifyContent.classList.add('active');
  tabJsonContent.classList.remove('active');
});

// Copy JSON listener
const copyJsonBtn = document.getElementById('btn-copy-json');
if (copyJsonBtn) {
  copyJsonBtn.addEventListener('click', () => {
    if (!activeAgent) return;
    const jsonStr = JSON.stringify(activeAgent, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      const originalText = copyJsonBtn.textContent;
      copyJsonBtn.textContent = 'Copied!';
      copyJsonBtn.style.pointerEvents = 'none';
      setTimeout(() => {
        copyJsonBtn.textContent = originalText;
        copyJsonBtn.style.pointerEvents = 'auto';
      }, 1500);
    }).catch(err => {
      console.error('Failed to copy JSON attestation: ', err);
    });
  });
}

// Clear Console listener
const clearConsoleBtn = document.getElementById('btn-clear-console');
if (clearConsoleBtn) {
  clearConsoleBtn.addEventListener('click', () => {
    verifyConsole.textContent = 'Console Idle - ready to verify signature.';
  });
}

// Ctrl+Enter keyboard shortcut on playground textareas
[verifyMsgInput, verifySigInput].forEach(el => {
  if (el) {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        verifyRunBtn.click();
      }
    });
  }
});

// Load and render active tab data
function loadActiveTabData() {
  const tabId = chrome.devtools.inspectedWindow.tabId;
  try {
    chrome.runtime.sendMessage({ action: 'getAgentData', tabId }, (response) => {
      if (chrome.runtime.lastError) {
        // Extension context invalidated or background worker restarting - fail silently
        console.warn('[Creduent] sendMessage failed:', chrome.runtime.lastError.message);
        return;
      }
      if (!response || response.status === 'none' || !response.agents || response.agents.length === 0) {
        mainGrid.style.display = 'none';
        noAgentState.style.display = 'flex';
        domainDisplay.textContent = response ? response.domain : 'unknown-domain.com';
        return;
      }

    // Found active agents
    mainGrid.style.display = 'grid';
    noAgentState.style.display = 'none';
    domainDisplay.textContent = response.domain;

    currentAgents = response.agents;
    
    // Setup agent selector
    if (currentAgents.length > 1) {
      selectorContainer.style.display = 'flex';
      agentSelector.innerHTML = '';
      currentAgents.forEach((agent, index) => {
        const option = document.createElement('option');
        option.value = index;
        let name = agent.agent_id;
        try {
          const parts = agent.agent_id.replace('agent://', '').split('/');
          name = parts[parts.length - 1] || agent.agent_id;
        } catch (e) {}
        option.textContent = name;
        agentSelector.appendChild(option);
      });

      agentSelector.onchange = (e) => {
        renderAgentDetails(currentAgents[e.target.value]);
      };
    } else {
      selectorContainer.style.display = 'none';
    }

    // Render first agent
    renderAgentDetails(currentAgents[0]);
    });
  } catch (err) {
    // Extension context was invalidated - panel was open during extension reload
    console.warn('[Creduent] DevTools panel lost extension context:', err.message);
  }
}

function renderAgentDetails(agent) {
  activeAgent = agent;

  // Status badge update
  const level = (agent.level || 'unverified').toLowerCase();
  statusBadge.className = `status-badge ${level}`;
  statusBadge.textContent = level.toUpperCase();

  agentIdEl.textContent = agent.agent_id;
  ownerEl.textContent = agent.owner || 'Unknown';
  
  // Capabilities
  capsEl.innerHTML = '';
  const caps = agent.capabilities || [];
  if (caps.length > 0) {
    caps.forEach(cap => {
      const capTag = document.createElement('span');
      capTag.className = 'pill-tag-soft';
      capTag.textContent = cap;
      capsEl.appendChild(capTag);
    });
  } else {
    capsEl.textContent = 'None';
  }

  pubkeyEl.textContent = agent.public_key;

  // Registry validation indicator
  const cryptoCheck = document.getElementById('crypto-check');
  if (agent.signature_verified) {
    cryptoCheck.textContent = '✓ Cryptographically Verified by Registry';
    cryptoCheck.style.color = 'var(--success)';
  } else {
    cryptoCheck.textContent = '✕ Unsigned / Verification Failed';
    cryptoCheck.style.color = 'var(--ruby)';
  }

  // Display raw JSON (JCS serialized for developer reference)
  jsonView.textContent = JSON.stringify(agent, null, 2);

  // Clear playground console
  verifyConsole.textContent = 'Console Idle - ready to verify signature.';
}

// Playground Signature Verification Logic
verifyRunBtn.addEventListener('click', async () => {
  if (!activeAgent || !activeAgent.public_key) {
    printConsoleLog('Error: No active agent public key loaded.', 'error');
    return;
  }

  const message = verifyMsgInput.value;
  const signatureRaw = verifySigInput.value;
  const signatureB64 = signatureRaw.trim();

  if (!message) {
    printConsoleLog('Error: Verification message body cannot be empty.', 'error');
    return;
  }

  if (!signatureB64) {
    printConsoleLog('Error: Base64 signature cannot be empty.', 'error');
    return;
  }

  // Diagnostics checkups
  if (/\s/.test(signatureRaw)) {
    printConsoleLog('Warning: Input signature contains spacing or newlines. Trimming whitespace...', 'error');
  }

  const cleanSig = signatureB64.replace(/[^A-Za-z0-9+/=]/g, '');
  if (cleanSig.length !== signatureB64.length) {
    printConsoleLog('Warning: Signature contains invalid characters (non-Base64 format).', 'error');
  }

  if (signatureB64.length !== 88) {
    printConsoleLog(`Warning: Ed25519 Base64 signature is expected to be exactly 88 characters. Yours is ${signatureB64.length} characters.`, 'error');
  }

  printConsoleLog('Initializing signature verify checks...');
  printConsoleLog(`Agent PublicKey: ${activeAgent.public_key}`);

  let pubKeyBase64 = activeAgent.public_key;
  if (pubKeyBase64.startsWith('ed25519:')) {
    pubKeyBase64 = pubKeyBase64.split(':', 2)[1];
  }

  try {
    const rawKeyBytes = base64ToBytes(pubKeyBase64);
    const sigBytes = base64ToBytes(signatureB64);
    const dataBytes = new TextEncoder().encode(message);

    printConsoleLog('Importing raw public key into SubtleCrypto framework...');
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      rawKeyBytes,
      { name: "Ed25519" },
      false,
      ["verify"]
    );

    printConsoleLog('Executing Ed25519 verifying algorithm...');
    const verified = await crypto.subtle.verify(
      "Ed25519",
      cryptoKey,
      sigBytes,
      dataBytes
    );

    if (verified) {
      printConsoleLog('✓ SIGNATURE VALIDATION: PASSED!', 'success');
      printConsoleLog('The message was signed by the private key corresponding to this agent public key.', 'success');
    } else {
      printConsoleLog('✕ SIGNATURE VALIDATION: FAILED!', 'error');
      printConsoleLog('Warning: Signature does not match the public key or message content was altered.', 'error');
    }
  } catch (err) {
    printConsoleLog(`Verification execution failed: ${err.message}`, 'error');
  }
});

function printConsoleLog(text, type = 'info') {
  const time = new Date().toISOString().substring(11, 19);
  const color = type === 'success' ? '#22c55e' : type === 'error' ? '#ea2261' : '#94a3b8';
  const prefix = type === 'success' ? '✓ ' : type === 'error' ? '✕ ' : '• ';

  const line = document.createElement('div');
  line.style.marginBottom = '4px';
  line.style.display = 'flex';
  line.style.gap = '8px';
  line.style.alignItems = 'baseline';

  // Faint timestamp label
  const ts = document.createElement('span');
  ts.textContent = `[${time}]`;
  ts.style.color = 'rgba(148, 163, 184, 0.4)';
  ts.style.fontFamily = "'JetBrains Mono', monospace";
  ts.style.fontSize = '9px';
  ts.style.flexShrink = '0';
  ts.style.userSelect = 'none';

  // Log message body
  const msg = document.createElement('span');
  msg.textContent = `${prefix}${text}`;
  msg.style.color = color;

  line.appendChild(ts);
  line.appendChild(msg);

  if (verifyConsole.textContent.startsWith('Console Idle')) {
    verifyConsole.innerHTML = '';
  }
  verifyConsole.appendChild(line);
  verifyConsole.scrollTop = verifyConsole.scrollHeight;
}

// Convert Base64 string to Uint8Array
function base64ToBytes(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Listen for tab navigation inside devtools context
chrome.devtools.network.onNavigated.addListener(() => {
  loadActiveTabData();
});

// Run initial loading
loadActiveTabData();
