<h1 align="center">IdentaBar Client for VS Code</h1>

<p align="center">
  <strong>Cryptographic AI Agent attestation and identity verifier built directly into VS Code, implementing the Creduent identity protocol.</strong>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=idevsec.identabar">Visual Studio Marketplace</a>
  &nbsp;&bull;&nbsp;
  <a href="https://open-vsx.org/extension/IDevSec/identabar">Open VSX Registry</a>
</p>

---

## Features

- **Real-Time Workspace Watching**: Listens to workspace file events in real-time. Any changes, additions, or deletions of `agent.json` files automatically trigger a workspace re-verification.
- **Live Registry Refresh**: Manual scans and real-time triggers automatically bypass the memory cache and pull live attestation status directly from the registry server to reflect registry-side trust level changes immediately.
- **Dynamic Status Bar Badge**: Displays the current workspace trust rating in the status bar:
    - `★ TRUSTED` (Gold) - Verified enterprise entity
    - `✓ VERIFIED` (Cyan) - Cryptographically validated keys & records
    - `! EXPIRED` (Amber) - Expired attestation certificate
    - `✕ REVOKED` (Red) - Identity revoked by the registry
    - `? UNVERIFIED` (Gray) - Signature mismatch or invalid metadata
- **Local Ed25519 Cryptographic Verification**: Resolves key signatures and performs verification locally using Node.js's native `crypto` module (zero external library dependencies).
- **Zero-Trust Task Gating**: Intercepts active VS Code task executions. If `identabar.attestationStrictness` is set to `strict`, task execution is immediately blocked if any unverified or revoked agent keys are active in the workspace.
- **Identity Initialization Wizard**: Generates a local Ed25519 keypair, canonicalizes/signs metadata, creates `.creduent/agent.json`, and automatically appends the private key to `.gitignore` for safety.
- **Detached File Signing**: Explorer context menu command to generate a detached signature file (`.sig`) of any script or config file in the workspace.
- **Premium Workspace Explorer Panel**: Redesigned tree explorer displaying:
    - Clean namespace IDs (e.g. `idevsec/steward`) with combined owner and status description tags.
    - Dedicated codicons and colors (e.g., green `organization` icon, blue `globe` icon for Domain, purple `cloud` icon for Endpoint).
    - A collapsible `Capabilities` folder with individual sub-items.
    - Clean layout: conditional warning/error messaging shown only if verification fails.
- **Detailed Output Channel**: Logs all network queries, validation steps, public key fetches, and signature validation details to a dedicated `IdentaBar` Output Channel.

---

## Configuration Settings

You can customize the extension via VS Code settings (`ctrl+,`):

| Setting                             | Default                        | Description                                                                                                                                      |
| ----------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `identabar.registryUrl`             | `https://creduent.idevsec.com` | Custom endpoint for your Creduent registry resolver.                                                                                             |
| `identabar.enableAutomaticScanning` | `true`                         | Scans workspace directories on startup.                                                                                                          |
| `identabar.attestationStrictness`   | `standard`                     | Strictness policy: `strict` (block tasks on unverified agent detection), `standard` (warn on missing/expired credentials), `lax` (logging only). |

---

## Available Commands

Open the command palette (`ctrl+shift+p` or `cmd+shift+p`) to run:

- `IdentaBar: Verify Workspace Agents` - Triggers a manual scan, bypasses attestation caches, and updates badges/explorer view.
- `IdentaBar: Clear Attestation Cache` - Purges the resolved identity memory cache and resets status indicators.
- `IdentaBar: Initialize Agent Identity` - Launches key generator wizard and generates `.creduent/agent.json` and `private.pem`.
- `IdentaBar: Sign File with Agent Key` - (Also available via File Explorer context menu) Generates a `.sig` signature for the selected file using the workspace private key.

---

## Troubleshooting: Local Development Signature Verification

If you are running the registry server locally (`http://localhost:3000`) and the extension reports `Attestation signature validation failed.`, this happens because:

1. Your local dev registry uses the production Upstash Redis database, which contains attestations signed by the **production private key**.
2. When the extension fetches the public key from `http://localhost:3000/public-key`, it receives the **local development public key** (`registry_public_key.pem`).
3. Cryptographic verification fails due to the key mismatch.

**Solution:**

- To test locally with production data, copy the production registry public key string to your local environment configurations (`CREDUENT_REGISTRY_PUBKEY`).
- Alternatively, keep `identabar.registryUrl` configured to `https://creduent.idevsec.com` in VS Code settings.

---

## Developer Installation (Manual Build)

To build and run the extension locally in VS Code:

1. Clone the repository and navigate to the `vscode-extension/` directory.
2. Install compilation dependencies:
    ```bash
    npm install
    ```
3. Compile the TypeScript code (this automatically runs `sync-shared.js` to link the shared core verification module to `src/shared/`):
    ```bash
    npm run compile
    ```
4. Press `F5` in VS Code to launch a new **Extension Development Host** session and run the extension live.
5. Pack the extension into a `.vsix` file (this automatically copies the shared verification files in release/prepublish mode):
    ```bash
    npx @vscode/vsce package
    ```

---

## License

Apache 2.0 - See the root `LICENSE` file for terms.
