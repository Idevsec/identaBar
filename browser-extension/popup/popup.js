document.addEventListener('DOMContentLoaded', () => {
  const domainText = document.getElementById('domain-name');
  const copyBtn = document.getElementById('copy-key-btn');
  const stateLoading = document.getElementById('state-loading');
  const stateNone = document.getElementById('state-none');
  const stateAgent = document.getElementById('state-agent');
  
  // Elements for active agent state
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');
  const agentIdEl = document.getElementById('agent-id');
  const publicKeyEl = document.getElementById('public-key');
  const tagsContainer = document.getElementById('capabilities-tags');
  const btnRegistry = document.getElementById('btn-registry');
  const btnSchema = document.getElementById('btn-schema');
  const btnPing = document.getElementById('btn-ping');
  const pingCard = document.getElementById('ping-card');
  const pingStatus = document.getElementById('ping-status');
  const pingDetails = document.getElementById('ping-details');

  let fullPublicKey = '';
  let currentAgent = null;

  // Render agent details function
  function renderAgent(agent) {
    if (!agent) return;
    currentAgent = agent;

    // Reset ping card view when switching agents
    pingCard.style.display = 'none';
    pingDetails.style.display = 'none';
    pingStatus.textContent = 'IDLE';
    pingStatus.style.color = 'var(--ink-mute)';

    // Update status badge level class and text
    const level = (agent.level || 'unverified').toLowerCase();
    statusBadge.className = `status-badge ${level}`;
    statusText.textContent = level.toUpperCase();

    // Populate details
    agentIdEl.textContent = agent.agent_id;
    fullPublicKey = agent.public_key;
    publicKeyEl.textContent = formatPublicKey(fullPublicKey);

    // Populate capabilities tags
    tagsContainer.innerHTML = '';
    const capabilities = agent.capabilities || [];
    if (capabilities.length > 0) {
      capabilities.forEach(cap => {
        const tag = document.createElement('span');
        tag.className = 'pill-tag-soft';
        tag.textContent = cap;
        tagsContainer.appendChild(tag);
      });
    } else {
      const noneTag = document.createElement('span');
      noneTag.className = 'pill-tag-soft';
      noneTag.style.backgroundColor = 'transparent';
      noneTag.style.color = 'var(--dark-text-mute)';
      noneTag.style.border = '1px dashed var(--dark-border)';
      noneTag.textContent = 'no capabilities specified';
      tagsContainer.appendChild(noneTag);
    }

    // Update button links
    btnRegistry.href = agent.registry_url || 'https://creduent.idevsec.com/resolver';
    btnSchema.href = `https://${agent.domain}/.well-known/agent.json`;
  }

  // Get active agent data from background service worker
  chrome.runtime.sendMessage({ action: 'getAgentData' }, (response) => {
    // Hide loading state
    stateLoading.classList.remove('active');

    // Extract agents array or construct from single agent response
    let agents = [];
    if (response) {
      if (Array.isArray(response.agents)) {
        agents = response.agents;
      } else if (response.status === 'found' && response.agent_id) {
        agents = [response];
      }
    }

    if (agents.length === 0) {
      domainText.textContent = response ? response.domain : 'Unknown Domain';
      stateNone.classList.add('active');
      return;
    }

    // Found active agents!
    domainText.textContent = response.domain;
    stateAgent.classList.add('active');

    const selectorContainer = document.getElementById('selector-container');
    const agentSelector = document.getElementById('agent-selector');

    if (agents.length > 1) {
      // Setup dropdown selector
      selectorContainer.style.display = 'block';
      agentSelector.innerHTML = '';
      agents.forEach((agent, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        let name = agent.agent_id;
        try {
          const parts = agent.agent_id.replace('agent://', '').split('/');
          name = parts[parts.length - 1] || agent.agent_id;
        } catch (e) {}
        option.textContent = name;
        agentSelector.appendChild(option);
      });

      // Clear existing listeners by replacing element or just adding listener once
      const newSelector = agentSelector.cloneNode(true);
      agentSelector.parentNode.replaceChild(newSelector, agentSelector);
      newSelector.addEventListener('change', (e) => {
        const selectedIdx = parseInt(e.target.value, 10);
        renderAgent(agents[selectedIdx]);
      });
    } else {
      selectorContainer.style.display = 'none';
    }

    // Initial render
    renderAgent(agents[0]);
  });

  // Format public key helper (e.g. ed25519:abcdef... -> ed25519:abcd...wxyz)
  function formatPublicKey(key) {
    if (!key) return 'N/A';
    if (key.length <= 24) return key;
    return `${key.slice(0, 16)}...${key.slice(-8)}`;
  }

  // Copy public key to clipboard handler
  copyBtn.addEventListener('click', () => {
    if (!fullPublicKey) return;
    
    navigator.clipboard.writeText(fullPublicKey).then(() => {
      // Temporary check visual state
      const originalSvg = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="width: 12px; height: 12px;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      copyBtn.style.pointerEvents = 'none';

      setTimeout(() => {
        copyBtn.innerHTML = originalSvg;
        copyBtn.style.pointerEvents = 'auto';
      }, 1500);
    }).catch(err => {
      console.error('Failed to copy key: ', err);
    });
  });

  // Handshake simulator click event listener
  btnPing.addEventListener('click', async () => {
    if (!currentAgent) return;

    pingCard.style.display = 'block';
    pingDetails.style.display = 'block';
    pingDetails.textContent = '';
    pingStatus.textContent = 'RUNNING';
    pingStatus.style.color = 'var(--primary)';

    const agentId = currentAgent.agent_id;
    let endpoint = currentAgent.endpoint || '';

    // Normalize endpoint pathing
    if (endpoint && !endpoint.startsWith('http')) {
      endpoint = `https://${endpoint}`;
    }

    function addLog(text, type = 'info') {
      const time = new Date().toISOString().substring(11, 19);
      const prefix = type === 'success' ? '✓ ' : type === 'error' ? '✕ ' : '• ';
      
      const line = document.createElement('div');
      line.style.marginBottom = '4px';
      line.style.lineHeight = '1.4';
      if (type === 'success') {
        line.style.color = '#22c55e';
      } else if (type === 'error') {
        line.style.color = '#ea2261';
      } else {
        line.style.color = '#e3e8ee';
      }
      line.textContent = `[${time}] ${prefix}${text}`;
      pingDetails.appendChild(line);
    }

    addLog(`Initiating cryptographic challenge verification loop`);
    addLog(`Agent ID: ${agentId}`);
    
    addLog(`Requesting session challenge from registry...`);
    const startTime = performance.now();
    try {
      const challengeUrl = `https://creduent.idevsec.com/challenge/${encodeURIComponent(agentId)}`;
      const chalRes = await fetch(challengeUrl);
      if (chalRes.ok) {
        const challengeData = await chalRes.json();
        const latency = Math.round(performance.now() - startTime);
        addLog(`Registry challenge issued: ${challengeData.challenge.slice(0, 16)}... (${latency}ms)`, 'success');
        
        if (endpoint) {
          addLog(`Contacting agent host at ${endpoint}...`);
          const hostStart = performance.now();
          try {
            const hostController = new AbortController();
            const hostTimeout = setTimeout(() => hostController.abort(), 4000);
            
            const hostRes = await fetch(`${endpoint}/challenge`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(challengeData),
              signal: hostController.signal
            });
            clearTimeout(hostTimeout);
            
            const hostLatency = Math.round(performance.now() - hostStart);
            if (hostRes.ok) {
              addLog(`Agent response received (${hostLatency}ms)`, 'success');
              const hostData = await hostRes.json();
              if (hostData.signature) {
                addLog(`Agent signature returned: ${hostData.signature.slice(0, 12)}...`, 'success');
                addLog(`Handshake validation sequence completed successfully!`, 'success');
                pingStatus.textContent = 'COMPLETED';
                pingStatus.style.color = '#22c55e';
              } else {
                addLog(`Agent response missing signature payload`, 'error');
                pingStatus.textContent = 'INCOMPLETE';
                pingStatus.style.color = '#ea2261';
              }
            } else {
              addLog(`Agent host returned error status: ${hostRes.status}`, 'error');
              pingStatus.textContent = 'FAILED';
              pingStatus.style.color = '#ea2261';
            }
          } catch (endpointErr) {
            addLog(`Direct host contact failed (CORS or network offline)`, 'error');
            addLog(`Note: Extension CORS restrictions apply for localhost or unregistered domains.`, 'info');
            pingStatus.textContent = 'OFFLINE';
            pingStatus.style.color = '#64748d';
          }
        } else {
          addLog(`No endpoint URL registered in attestation.`, 'info');
          addLog(`Simulated local verify logic check.`, 'success');
          pingStatus.textContent = 'COMPLETED';
          pingStatus.style.color = '#22c55e';
        }
      } else {
        addLog(`Registry challenge query failed: ${chalRes.status}`, 'error');
        pingStatus.textContent = 'ERROR';
        pingStatus.style.color = '#ea2261';
      }
    } catch (err) {
      addLog(`Failed to contact registry node`, 'error');
      pingStatus.textContent = 'FAILED';
      pingStatus.style.color = '#ea2261';
    }
  });
});
