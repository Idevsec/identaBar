# Contributing to IdentaBar

Thank you for your interest in contributing to IdentaBar! This guide helps you set up your local development environment and outlines how to test and contribute to our monorepo components.

---

## Development Setup

IdentaBar is organized as a monorepo containing:

1. `shared/`: The core cryptographic verification module.
2. `browser-extension/`: A Manifest V3 web extension for Chromium-based browsers and Firefox.
3. `vscode-extension/`: A desktop integration extension for Visual Studio Code.

### 1. Clone the Repository

```bash
git clone https://github.com/idevsec/IdentaBar.git
cd IdentaBar
```

### 2. Install Root & Extension Dependencies

```bash
npm install
```

### 3. Synchronize Shared Files

Before developing, you must run the shared synchronization script to create local development links:

```bash
# For Chromium browsers & VS Code:
node sync-shared.js

# For Firefox (copy mode):
node sync-shared.js --copy
```

For specific details on running and packaging each client, please refer to:

- [browser-extension/README.md](./browser-extension/README.md)
- [vscode-extension/README.md](./vscode-extension/README.md)

---

## Code Guidelines & Robustness Guarantees

Please ensure all contributions respect our strict design and security principles:

- **Correct Ed25519 Checking:** Employs raw Node.js `crypto.verify` (and Web Crypto API in browser engines) instead of hash-based streams to directly check Ed25519/EdDSA signature fields.
- **Canonical JCS Standardization:** Serializes documents using RFC 8785 JSON Canonicalization Scheme (JCS) before signing or verifying to guarantee payload format consistency.
- **Race Condition Prevention:** Integrates strict task gating at startup in the VS Code extension to block tasks if workspace initialization has not fully completed.
- **Secure File Permissions:** Enforces Unix `0o600` (read/write by owner only) permissions when writing private keys to local storage to prevent key compromise.
- **HTTP Request Timeouts:** Cares for connection issues by enforcing a strict 5-second timeout on all outbound requests to the attestation registry to prevent app lockups.

---

## Git Workflow & Branching Strategy

To keep the repository clean and manageable, please follow our branching conventions:

### Branch Naming Conventions

- **Features:** Use prefix `feature/` (e.g., `feature/devtools-filtering`) for new verification features or clients.
- **Bugfixes:** Use prefix `bugfix/` (e.g., `bugfix/race-condition-on-startup`) for fixing bugs or issues.
- **Documentation:** Use prefix `docs/` (e.g., `docs/contributing-guidelines`) for changes to documentation or README files.
- **Refactoring:** Use prefix `refactor/` (e.g., `refactor/subtle-crypto-wrapper`) for code refactors with no functional changes.

### Pull Request Process

1. Create a local branch from the `main` branch following the naming conventions above.
2. Make changes and verify them locally. Ensure code formatting is clean.
3. Push your branch to GitHub.
4. Open a Pull Request (PR) against the `main` branch.
5. Fill out the Pull Request template completely.
6. Ensure any checks (CI workflows) pass and request review from maintainers.

---

## Project Roadmap & Wanted Features

IdentaBar development follows our unified [Product Roadmap](ROADMAP.md). If you are looking for ways to contribute, here are the active task hotspots across our monorepo components:

### shared/ (Verification Engine)
* **Offline Mode (Phase 4):** Implement an offline signature check helper that uses a locally cached registry public key when origin registry is unreachable.

### browser-extension/ (Manifest V3 Client)
* **Store Launches (Phase 2):** Assist in preparing and testing the Manifest V3 builds for Edge and Chrome store submissions.
* **Trust Breakdown Card (Phase 2):** Update the browser popup UI card to render capability-level trust ratings (e.g. showing green checkmarks for verified scopes).
* **DID Resolution (Phase 4):** Integrate decentralized identifier (`did:creduent` and `did:web`) parsing into the background service worker.

### vscode-extension/ (IDE Integration Client)
* **Editor Diagnostics (Phase 3):** Implement inline squiggly error underlines and Problems panel messages for invalid or expired `agent.json` files.
* **In-IDE Playground (Phase 3):** Help construct a WebView panel allowing local key generation and document signing without registry interaction.
* **CDT Chain Visualizer (Phase 4):** Render collapsible tree views of Creduent Delegation Token chains in the custom sidebar explorer.

