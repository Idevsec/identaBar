<h1 align="center">IdentaBar Client for VS Code</h1>

<p align="center">
  <strong>Cryptographic AI agent attestation and identity verifier built directly into VS Code, implementing the Creduent identity protocol.</strong>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=IDevSec.identabar">Visual Studio Marketplace</a>
  &nbsp;&bull;&nbsp;
  <a href="https://open-vsx.org/extension/IDevSec/identabar">Open VSX Registry</a>
</p>

---

## Features

- **Multi-Section Sidebar Explorer:** The IdentaBar activity bar panel is organized into four dedicated views: Workspace Agents, Detected Frameworks, Registries, and Help and Feedback.
- **AI Framework Detection:** Automatically scans `package.json`, `requirements.txt`, and `pyproject.toml` at workspace open to detect AI agent frameworks including Langchain, CrewAI, AutoGen, LlamaIndex, Semantic Kernel, OpenAI Agents SDK, Anthropic, Google Generative AI, and Haystack.
- **One-Click Agent Registration:** Inline action button on each detected framework item auto-generates an Ed25519 keypair and publishes the agent identity directly to the Creduent registry without leaving the IDE.
- **Real-Time Workspace Watching:** Listens to workspace file system events. Any changes, additions, or deletions of `agent.json` files trigger automatic re-verification.
- **Live Registry Refresh:** Manual scans and real-time triggers bypass the memory cache and pull live attestation status directly from the registry to reflect trust level changes immediately.
- **Dynamic Status Bar Badge:** Displays the current workspace trust rating in the status bar:
    - `TRUSTED` (Gold) - Verified enterprise entity
    - `VERIFIED` (Cyan) - Cryptographically validated keys and records
    - `EXPIRED` (Amber) - Expired attestation certificate
    - `REVOKED` (Red) - Identity revoked by the registry
    - `UNVERIFIED` (Gray) - Signature mismatch or invalid metadata
- **Local Ed25519 Cryptographic Verification:** Resolves key signatures and performs verification locally using Node.js native `crypto` module with zero external library dependencies.
- **Zero-Trust Task Gating:** When `identabar.attestationStrictness` is set to `strict`, task execution is blocked if any unverified or revoked agent keys are active in the workspace.
- **Identity Initialization Wizard:** Generates a local Ed25519 keypair, canonicalizes and signs metadata via RFC 8785 JCS, creates `.creduent/agent.json`, and automatically appends the private key to `.gitignore`.
- **Detached File Signing:** Explorer context menu command to generate a `.sig` signature file for any script or config file in the workspace using the agent private key.
- **Detailed Output Channel:** Logs all network queries, validation steps, public key fetches, and signature validation results to a dedicated `IdentaBar` Output Channel.

---

## Configuration Settings

Configure the extension via VS Code Settings (`Ctrl+,`):

| Setting | Default | Description |
| --- | --- | --- |
| `identabar.registryUrl` | `https://creduent.idevsec.com` | Endpoint for the Creduent registry resolver. |
| `identabar.enableAutomaticScanning` | `true` | Scans workspace directories on startup. |
| `identabar.attestationStrictness` | `standard` | `strict` blocks tasks on unverified agents; `standard` warns on missing or expired credentials; `lax` logs only. |

---

## Available Commands

Open the command palette (`Ctrl+Shift+P`) and type `IdentaBar` to access:

- `IdentaBar: Verify Workspace Agents` - Manual scan, bypasses attestation cache, updates badges and sidebar.
- `IdentaBar: Clear Attestation Cache` - Purges the resolved identity memory cache and resets status indicators.
- `IdentaBar: Initialize Agent Identity` - Launches the key generation wizard, creates `.creduent/agent.json` and `private.pem`.
- `IdentaBar: Sign File with Agent Key` - Also available via the File Explorer context menu. Generates a `.sig` signature for the selected file.

---

## Troubleshooting: Signature Verification Against a Local Registry

If you are running the registry server locally (`http://localhost:3000`) and the extension reports `Attestation signature validation failed`, this occurs because:

1. Your local development registry uses the production database, which contains attestations signed by the production private key.
2. When the extension fetches the public key from `http://localhost:3000/public-key`, it receives the local development public key.
3. Cryptographic verification fails due to the key mismatch.

**Solution:** Set `identabar.registryUrl` in VS Code settings to `https://creduent.idevsec.com`, or copy the production public key string into your local registry environment configuration (`CREDUENT_REGISTRY_PUBKEY`).

---

## Developer Build Instructions

To build and run the extension locally:

1. Clone the repository and navigate to the `vscode-extension/` directory.
2. Install compilation dependencies:
    ```
    npm install
    ```
3. Compile the TypeScript source. This automatically runs `sync-shared.js` to copy the shared cryptographic module into `src/shared/` and `out/shared/`:
    ```
    npm run compile
    ```
4. Open the `vscode-extension/` folder in VS Code and press `F5` to launch an Extension Development Host session.
5. To package a `.vsix` file for manual installation or distribution:
    ```
    npx @vscode/vsce package
    ```

---

## License

Apache 2.0 - See the root `LICENSE` file for terms.
