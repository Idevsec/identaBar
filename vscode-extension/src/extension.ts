import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as https from 'https';
import * as path from 'path';
import * as fs from 'fs';

// Ephemeral cache to store resolved attestation documents in memory
const attestationCache = new Map<string, any>();

// Output channel for logs
let outputChannel: vscode.OutputChannel;
let statusBarItem: vscode.StatusBarItem;
let agentTreeProvider: AgentTreeProvider;

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('IdentaBar');
  outputChannel.appendLine('[IdentaBar] VS Code Extension Activated.');

  // Create Status Bar Item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'identabar.verifyWorkspace';
  statusBarItem.text = '$(shield) IdentaBar: Ready';
  statusBarItem.tooltip = 'Click to scan workspace for AI Agent attestation records.';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Register Sidebar Tree Provider
  agentTreeProvider = new AgentTreeProvider();
  vscode.window.registerTreeDataProvider('identabar.agentsView', agentTreeProvider);

  // Register task start listener for zero-trust gating
  context.subscriptions.push(
    vscode.tasks.onDidStartTask((event) => {
      const config = vscode.workspace.getConfiguration('identabar');
      const strictness = config.get<string>('attestationStrictness', 'standard');
      
      if (strictness === 'strict') {
        const cachedResults = Array.from(attestationCache.values());
        if (cachedResults.length === 0) {
          vscode.window.showErrorMessage(
            `[IdentaBar Gating Block] Task "${event.execution.task.name}" execution blocked. Workspace agents have not been verified yet. Run verification first.`,
            'OK'
          );
          event.execution.terminate();
          return;
        }
        const hasUnverified = cachedResults.some(a => a.status === 'unverified' || a.status === 'revoked');
        
        if (hasUnverified) {
          vscode.window.showErrorMessage(
            `[IdentaBar Gating Block] Task "${event.execution.task.name}" execution blocked. Active unverified or revoked agents found in workspace. Set strictness to standard/lax to bypass.`,
            'OK'
          );
          event.execution.terminate();
        }
      }
    })
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('identabar.verifyWorkspace', async () => {
      await runWorkspaceVerification();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('identabar.clearCache', () => {
      attestationCache.clear();
      outputChannel.appendLine('[IdentaBar] Attestation memory cache cleared.');
      vscode.window.showInformationMessage('IdentaBar attestation cache cleared successfully.');
      updateStatusBar('ready', 'Cache cleared. Ready to verify.');
      agentTreeProvider.refresh([]);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('identabar.createAgentIdentity', async () => {
      await createAgentIdentity();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('identabar.signFile', async (uri: vscode.Uri) => {
      await signFile(uri);
    })
  );

  // Auto-scan on load if enabled
  const config = vscode.workspace.getConfiguration('identabar');
  if (config.get<boolean>('enableAutomaticScanning', true)) {
    runWorkspaceVerification();
  }
}

export function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}

/**
 * Searches the workspace for agent metadata and verifies attestation records.
 */
async function runWorkspaceVerification() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) {
    updateStatusBar('none', 'No workspace folders open.');
    return;
  }

  outputChannel.appendLine('--- Initiating Agent Attestation Scan ---');
  updateStatusBar('scanning', 'Scanning workspace files...');

  const foundAgents: any[] = [];

  for (const folder of folders) {
    const rootPath = folder.uri.fsPath;
    
    // Look in common directories (.well-known/agent.json and .creduent/agent.json)
    const pathsToCheck = [
      path.join(rootPath, '.well-known', 'agent.json'),
      path.join(rootPath, '.creduent', 'agent.json'),
      path.join(rootPath, 'agent.json')
    ];

    for (const filePath of pathsToCheck) {
      if (fs.existsSync(filePath)) {
        try {
          outputChannel.appendLine(`Found agent identity configuration: ${filePath}`);
          const content = fs.readFileSync(filePath, 'utf8');
          const agentJson = JSON.parse(content);
          
          if (!agentJson.agent_id) {
            outputChannel.appendLine('[Warning] agent.json missing required "agent_id" field.');
            continue;
          }

          const verification = await verifyAgentAttestation(agentJson);
          foundAgents.push(verification);
        } catch (err: any) {
          outputChannel.appendLine(`[Error] Failed to read or parse ${filePath}: ${err.message}`);
        }
      }
    }
  }

  if (foundAgents.length === 0) {
    outputChannel.appendLine('No agent identity records (.well-known/agent.json) found in workspace.');
    updateStatusBar('none', 'No agents found');
    agentTreeProvider.refresh([]);
    return;
  }

  // Update tree view with all verified agents
  agentTreeProvider.refresh(foundAgents);

  // Set general status based on highest warning severity found
  let finalStatus = 'trusted';
  let statusMessage = 'All agents verified.';

  if (foundAgents.some(a => a.status === 'revoked')) {
    finalStatus = 'revoked';
    statusMessage = 'Revoked agent identity detected!';
  } else if (foundAgents.some(a => a.status === 'unverified')) {
    finalStatus = 'unverified';
    statusMessage = 'Unverified agent signatures present.';
  } else if (foundAgents.some(a => a.status === 'expired')) {
    finalStatus = 'expired';
    statusMessage = 'Expired attestation records present.';
  } else if (foundAgents.every(a => a.status === 'verified')) {
    finalStatus = 'verified';
    statusMessage = 'Agents verified successfully.';
  }

  updateStatusBar(finalStatus, statusMessage);
  outputChannel.appendLine(`Scan complete. Overall state: ${finalStatus.toUpperCase()}`);
}

/**
 * Validates agent metadata against the registry and verifies signatures locally.
 */
async function verifyAgentAttestation(agentJson: any): Promise<any> {
  const agentId = agentJson.agent_id;
  const config = vscode.workspace.getConfiguration('identabar');
  const registryUrl = config.get<string>('registryUrl', 'https://registry.idevsec.com');

  // Check memory cache first
  if (attestationCache.has(agentId)) {
    outputChannel.appendLine(`[Cache Hit] Using cached attestation for ${agentId}`);
    return attestationCache.get(agentId);
  }

  const result: any = {
    agentId,
    owner: agentJson.owner || 'Unknown',
    capabilities: agentJson.capabilities || [],
    status: 'unverified',
    message: 'Attestation verification failed.'
  };

  try {
    // 1. Fetch attestation from registry
    outputChannel.appendLine(`Contacting registry for attestation: ${registryUrl}/attest/${encodeURIComponent(agentId)}`);
    const attestationRaw = await fetchHttp(`${registryUrl}/attest/${encodeURIComponent(agentId)}`);
    const attestation = JSON.parse(attestationRaw);

    if (!attestation || !attestation.signature) {
      result.message = 'Registry attestation record contains no signature.';
      return cacheAndReturn(agentId, result);
    }

    // 2. Fetch public key from registry
    const publicKeyRaw = await fetchHttp(`${registryUrl}/public-key`);
    const publicKeyData = JSON.parse(publicKeyRaw);
    const publicKeyPem = publicKeyData.publicKeyPem || publicKeyData.public_key;

    if (!publicKeyPem) {
      result.message = 'Could not retrieve registry public verification key.';
      return cacheAndReturn(agentId, result);
    }

    // 3. Verify attestation document signature using Ed25519
    const isSignatureValid = verifyEd25519Signature(
      attestation,
      attestation.signature,
      publicKeyPem
    );

    if (!isSignatureValid) {
      result.status = 'unverified';
      result.message = 'Attestation signature validation failed.';
      return cacheAndReturn(agentId, result);
    }

    // 4. Check revocation
    if (attestation.revoked === true) {
      result.status = 'revoked';
      result.message = 'Identity revoked by issuer.';
      return cacheAndReturn(agentId, result);
    }

    // 5. Check expiration date (valid_until or expires_at)
    const expires = attestation.expires_at || attestation.valid_until;
    if (expires) {
      const expirationDate = new Date(expires);
      if (expirationDate.getTime() < Date.now()) {
        result.status = 'expired';
        result.message = `Attestation expired on ${expirationDate.toISOString()}`;
        return cacheAndReturn(agentId, result);
      }
    }

    // Passed all checks
    result.status = attestation.level === 'trusted' ? 'trusted' : 'verified';
    result.message = 'Cryptographically secure. Attestation valid.';
  } catch (err: any) {
    outputChannel.appendLine(`[Error] Verification process failed: ${err.message}`);
    result.message = `Registry check error: ${err.message}`;
  }

  return cacheAndReturn(agentId, result);
}

function cacheAndReturn(agentId: string, result: any): any {
  attestationCache.set(agentId, result);
  return result;
}

/**
 * JCS Canonicalization Scheme (RFC 8785)
 */
function canonicalize(val: any): string {
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
 * Handles HTTP GET query.
 */
function fetchHttp(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res: any) => {
      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        return reject(new Error(`Server returned status code ${res.statusCode}`));
      }
      let body = '';
      res.on('data', (chunk: any) => body += chunk);
      res.on('end', () => resolve(body));
    });
    req.on('error', (err: any) => reject(err));
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timed out after 5000ms'));
    });
  });
}

/**
 * Verifies Ed25519 signature of JCS data.
 */
function verifyEd25519Signature(data: any, signatureB64: string, publicKeyPem: string): boolean {
  try {
    const dataToVerify = { ...data };
    delete dataToVerify.signature;
    delete dataToVerify.status;
    delete dataToVerify.expired;

    const message = canonicalize(dataToVerify);
    const signatureBuffer = Buffer.from(signatureB64, 'base64');
    
    return crypto.verify(null, Buffer.from(message), publicKeyPem, signatureBuffer);
  } catch (err) {
    outputChannel.appendLine(`[Crypto Error] Signature verification process failed: ${err}`);
    return false;
  }
}

/**
 * Updates status bar colors and icons based on validation results.
 */
function updateStatusBar(status: string, message: string) {
  statusBarItem.tooltip = `IdentaBar: ${message}`;
  switch (status) {
    case 'scanning':
      statusBarItem.text = '$(sync~spin) IdentaBar: Auditing...';
      statusBarItem.backgroundColor = undefined;
      break;
    case 'trusted':
      statusBarItem.text = '$(verified-filled) IdentaBar: ★ TRUSTED';
      statusBarItem.backgroundColor = undefined; // Default color
      break;
    case 'verified':
      statusBarItem.text = '$(verified) IdentaBar: ✓ VERIFIED';
      statusBarItem.backgroundColor = undefined;
      break;
    case 'expired':
      statusBarItem.text = '$(warning) IdentaBar: ! EXPIRED';
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      break;
    case 'revoked':
      statusBarItem.text = '$(error) IdentaBar: ✕ REVOKED';
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      break;
    case 'unverified':
      statusBarItem.text = '$(question) IdentaBar: ? UNVERIFIED';
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      break;
    default:
      statusBarItem.text = '$(shield) IdentaBar: Ready';
      statusBarItem.backgroundColor = undefined;
  }
}

// Tree view model provider
class AgentTreeProvider implements vscode.TreeDataProvider<AgentTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<AgentTreeItem | undefined | null | void> = new vscode.EventEmitter<AgentTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<AgentTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private agents: any[] = [];

  refresh(agents: any[]): void {
    this.agents = agents;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: AgentTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AgentTreeItem): Thenable<AgentTreeItem[]> {
    if (element) {
      if (element.contextValue === 'agent') {
        const agent = this.agents.find(a => a.agentId === element.label);
        if (!agent) { return Promise.resolve([]); }

        const items = [
          new AgentTreeItem('Owner', agent.owner, vscode.TreeItemCollapsibleState.None, 'attribute'),
          new AgentTreeItem('Status', agent.status.toUpperCase(), vscode.TreeItemCollapsibleState.None, 'attribute', agent.status),
          new AgentTreeItem('Message', agent.message, vscode.TreeItemCollapsibleState.None, 'attribute')
        ];

        if (agent.capabilities && agent.capabilities.length > 0) {
          items.push(new AgentTreeItem(
            'Capabilities',
            agent.capabilities.join(', '),
            vscode.TreeItemCollapsibleState.None,
            'attribute'
          ));
        }

        return Promise.resolve(items);
      }
      return Promise.resolve([]);
    } else {
      return Promise.resolve(
        this.agents.map(a => new AgentTreeItem(a.agentId, a.owner, vscode.TreeItemCollapsibleState.Collapsed, 'agent', a.status))
      );
    }
  }
}

class AgentTreeItem extends vscode.TreeItem {
  constructor(
    label: string,
    private readonly value: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly status?: string
  ) {
    super(label, collapsibleState);
    this.tooltip = `${label}: ${this.value}`;
    this.description = this.value;

    if (this.contextValue === 'agent') {
      this.iconPath = this.getIconForStatus(this.status);
    } else if (label === 'Status') {
      this.iconPath = this.getIconForStatus(this.status);
    }
  }

  private getIconForStatus(status?: string): vscode.ThemeIcon {
    switch (status) {
      case 'trusted':
        return new vscode.ThemeIcon('verified-filled', new vscode.ThemeColor('charts.yellow'));
      case 'verified':
        return new vscode.ThemeIcon('verified', new vscode.ThemeColor('charts.blue'));
      case 'expired':
        return new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.orange'));
      case 'revoked':
        return new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red'));
      case 'unverified':
      default:
        return new vscode.ThemeIcon('question', new vscode.ThemeColor('charts.gray'));
    }
  }
}

/**
 * Prompts user to configure and generate a new signed agent.json and Ed25519 keypair.
 */
async function createAgentIdentity() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) {
    vscode.window.showErrorMessage('Please open a workspace folder to initialize an agent identity.');
    return;
  }

  const agentId = await vscode.window.showInputBox({
    prompt: 'Enter your Agent URI',
    placeHolder: 'agent://yourorg/youragent',
    validateInput: text => text.startsWith('agent://') ? null : 'URI must start with agent://'
  });
  if (!agentId) { return; }

  const owner = await vscode.window.showInputBox({
    prompt: 'Enter Owner Organization Name',
    placeHolder: 'My Organization'
  });
  if (!owner) { return; }

  const domain = await vscode.window.showInputBox({
    prompt: 'Enter Domain associated with this agent identity',
    placeHolder: 'myorg.com'
  });
  if (!domain) { return; }

  const capabilities = await vscode.window.showInputBox({
    prompt: 'Enter Capabilities (comma separated)',
    value: 'task_execution'
  });
  if (capabilities === undefined) { return; }

  try {
    outputChannel.appendLine('[IdentaBar] Generating secure Ed25519 keypair...');
    
    // Generate Ed25519 keypair
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    // Extract raw public key bytes from SPKI (DER format starts with 12 bytes of alg OID header)
    const publicKeyBuffer = crypto.createPublicKey(publicKey).export({ format: 'der', type: 'spki' });
    const rawPublicKey = publicKeyBuffer.subarray(12);
    const publicKeyStr = `ed25519:${rawPublicKey.toString('base64')}`;

    // Construct metadata
    const agentObj = {
      version: '1.0',
      issued_at: new Date().toISOString(),
      agent_id: agentId,
      owner: owner,
      public_key: publicKeyStr,
      endpoint: `https://${domain}/agent`,
      capabilities: capabilities.split(',').map(c => c.trim()).filter(Boolean)
    };

    // Sign the canonical payload
    const message = canonicalize(agentObj);
    const signature = crypto.sign(null, Buffer.from(message), privateKey);
    const finalAgentJson = {
      ...agentObj,
      signature: signature.toString('base64')
    };

    // Save to workspace root
    const rootPath = folders[0].uri.fsPath;
    const creduentDir = path.join(rootPath, '.creduent');
    if (!fs.existsSync(creduentDir)) {
      fs.mkdirSync(creduentDir, { recursive: true });
    }

    const agentJsonPath = path.join(creduentDir, 'agent.json');
    const privateKeyPath = path.join(creduentDir, 'private.pem');

    fs.writeFileSync(agentJsonPath, JSON.stringify(finalAgentJson, null, 2), 'utf8');
    fs.writeFileSync(privateKeyPath, privateKey, { encoding: 'utf8', mode: 0o600 });

    // Prompt user about gitignore safety
    const gitignorePath = path.join(rootPath, '.gitignore');
    let gitignoreUpdated = false;
    let gitignoreContent = '';
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    if (!gitignoreContent.includes('.creduent/private.pem')) {
      gitignoreContent += '\n# IdentaBar private keys\n.creduent/private.pem\n';
      fs.writeFileSync(gitignorePath, gitignoreContent, 'utf8');
      gitignoreUpdated = true;
    }

    vscode.window.showInformationMessage(
      `Agent identity initialized! Metadata saved to .creduent/agent.json. Private key saved safely ${gitignoreUpdated ? '(automatically added to .gitignore)' : 'to .creduent/private.pem'}.`
    );
    outputChannel.appendLine(`[Success] Created identity for ${agentId}. Public Key: ${publicKeyStr}`);
  } catch (err: any) {
    vscode.window.showErrorMessage(`Failed to create agent identity: ${err.message}`);
  }
}

/**
 * Signs a workspace file using the local private key.
 */
async function signFile(fileUri: vscode.Uri) {
  if (!fileUri) {
    vscode.window.showErrorMessage('No file selected to sign.');
    return;
  }

  const folders = vscode.workspace.workspaceFolders;
  const privateKeyPath = findPrivateKey(folders);

  if (!privateKeyPath) {
    vscode.window.showErrorMessage('No private key found (.creduent/private.pem) in this workspace. Run "IdentaBar: Initialize Agent Identity" first.');
    return;
  }

  try {
    outputChannel.appendLine(`Signing file: ${fileUri.fsPath} using private key: ${privateKeyPath}`);
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    const fileContent = fs.readFileSync(fileUri.fsPath);

    // Generate detached signature
    const signature = crypto.sign(null, fileContent, privateKey);
    const sigPath = `${fileUri.fsPath}.sig`;
    fs.writeFileSync(sigPath, signature.toString('base64'), 'utf8');

    vscode.window.showInformationMessage(`Signature successfully created: ${path.basename(sigPath)}`);
    outputChannel.appendLine(`[Success] Detached signature generated at ${sigPath}`);
  } catch (err: any) {
    vscode.window.showErrorMessage(`Failed to sign file: ${err.message}`);
  }
}

/**
 * Searches the workspace for private.pem keys.
 */
function findPrivateKey(folders: readonly vscode.WorkspaceFolder[] | undefined): string | null {
  if (!folders) { return null; }
  for (const folder of folders) {
    const rootPath = folder.uri.fsPath;
    const pathsToCheck = [
      path.join(rootPath, '.creduent', 'private.pem'),
      path.join(rootPath, 'private.pem')
    ];
    for (const p of pathsToCheck) {
      if (fs.existsSync(p)) { return p; }
    }
  }
  return null;
}
