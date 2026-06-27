// content.js - Scrapes page tags for creduent-agent identifiers
function findAgentMeta() {
  // 1. Check meta tag: <meta name="creduent-agent" content="agent://...">
  const metaTag = document.querySelector('meta[name="creduent-agent"]');
  if (metaTag && metaTag.content) {
    return metaTag.content.trim();
  }

  // 2. Check link tag: <link rel="creduent-agent" href="agent://...">
  const linkTag = document.querySelector('link[rel="creduent-agent"]');
  if (linkTag && linkTag.href) {
    // If it's a full URL or relative, we want to extract the content/URI value
    return linkTag.getAttribute('href').trim();
  }

  return null;
}

const agentId = findAgentMeta();
if (agentId) {
  console.log(`[Creduent] Found on-page agent attestation reference: ${agentId}`);
  chrome.runtime.sendMessage({
    action: 'agentMetaFound',
    agentId: agentId
  });
}
