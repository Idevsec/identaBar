# IdentaBar VS Code Client

A cryptographic AI Agent attestation and identity verifier built directly into VS Code, implementing the Creduent identity protocol.

---

## Features

- **Automatic Workspace Scans**: Scans root workspace directories on startup for `agent.json` or `.well-known/agent.json` configurations.
- **Dynamic Status Bar Badge**: Displays the current workspace trust rating in the status bar:
  - `★ TRUSTED` (Gold) - Verified enterprise entity
  - `✓ VERIFIED` (Cyan) - Crytographically validated keys & records
  - `! EXPIRED` (Amber) - Expired attestation certificate
  - `✕ REVOKED` (Red) - Identity revoked by the registry
  - `? UNVERIFIED` (Gray) - Signature mismatch or invalid metadata
- **Local Ed25519 Cryptographic Verification**: Resolves key signatures and performs verification locally using Node.js's native `crypto` module (zero external library dependencies).
- **Zero-Trust Task Gating**: Intercepts active VS Code task executions. If `identabar.attestationStrictness` is set to `strict`, task execution is immediately blocked if any unverified or revoked agent keys are active in the workspace.
- **Identity Initialization Wizard**: Generates a local Ed25519 keypair, canonicalizes/signs metadata, creates `.creduent/agent.json`, and automatically appends the private key to `.gitignore` for safety.
- **Detached File Signing**: Explorer context menu command to generate a detached signature file (`.sig`) of any script or config file in the workspace.
- **Workspace Explorer Panel**: Adds an IdentaBar Activity Bar icon which populates a tree structure displaying resolved agents, owners, capabilities, and strict validation statuses.
- **Detailed Output Channel**: Logs all network queries, validation steps, public key fetches, and signature validation details to a dedicated `IdentaBar` Output Channel.

---

## Configuration Settings

You can customize the extension via VS Code settings (`ctrl+,`):

| Setting | Default | Description |
|---|---|---|
| `identabar.registryUrl` | `https://registry.idevsec.com` | Custom endpoint for your Creduent registry resolver. |
| `identabar.enableAutomaticScanning` | `true` | Scans workspace directories on startup. |
| `identabar.attestationStrictness` | `standard` | Strictness policy: `strict` (block tasks on unverified agent detection), `standard` (warn on missing/expired credentials), `lax` (logging only). |

---

## Available Commands

Open the command palette (`ctrl+shift+p` or `cmd+shift+p`) to run:

- `IdentaBar: Verify Workspace Agents` - Triggers a manual scan and updates badges/explorer view.
- `IdentaBar: Clear Attestation Cache` - Purges the resolved identity memory cache and resets status indicators.
- `IdentaBar: Initialize Agent Identity` - Launches key generator wizard and generates `.creduent/agent.json` and `private.pem`.
- `IdentaBar: Sign File with Agent Key` - (Also available via File Explorer context menu) Generates a `.sig` signature for the selected file using the workspace private key.

---

## Developer Installation (Manual Build)

To build and run the extension locally in VS Code:

1. Navigate to the `vscode-extension/` directory.
2. Install compilation dependencies:
   ```bash
   npm install
   ```
3. Compile the typescript code:
   ```bash
   npm run compile
   ```
4. Press `F5` in VS Code to launch a new **Extension Development Host** session and run the extension live.

---

## License

Apache 2.0 - See the root `LICENSE` file for terms.
