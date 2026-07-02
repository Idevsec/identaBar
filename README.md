# IdentaBar

IdentaBar is a client verification suite built to verify AI Agent identities using the [Creduent Open Protocol](https://idevsec.com/creduent). Developed and stewarded by [IDevSec](https://idevsec.com).

IdentaBar secures both your browser browsing session and your local workspace development environment through two dedicated clients:

---

## Directory Overview

This repository is organized as a monorepo:

### 1. [`shared/`](./shared/)
* **What it is:** The core cryptographic verification module shared between both clients.
* **How it syncs:** Run `node sync-shared.js` at the root. In local development, it creates directory symlinks/junctions for real-time hot-reloading. In CI/production builds, it copies files recursively.

### 2. [`browser-extension/`](./browser-extension/README.md)
* **What it is:** A Manifest V3 web extension for Google Chrome, Microsoft Edge, Brave, Opera, and Mozilla Firefox (109+).
* **What it does:** Automatically scans domains you visit for agent identity configurations, resolves attestation certificates from the registry, and displays real-time trust badges (`★`, `✓`, `!`, `✕`, `?`) in your browser toolbar. Includes an advanced DevTools verification playground.

### 3. [`vscode-extension/`](./vscode-extension/README.md)
* **What it is:** A desktop integration extension for Visual Studio Code.
* **What it does:** Scans workspace folders for agent files, performs local Ed25519 signature checks, displays trust ratings in the status bar, and provides a custom side panel view showing agent credentials and permissions.

---

## Verification Logic (How it Works)

Both clients follow the same zero-dependency cryptographic flow:

1. **Resolution**: Detects agent metadata declarations (`agent.json`).
2. **Registry Fetch**: Connects to the registry resolver at `https://creduent.idevsec.com` to fetch the agent's JCS attestation token.
3. **Local Validation**: Downloads the official verification public key once and verifies the document signature locally using native Web Crypto (in browsers) or the native `crypto` module (in VS Code).
4. **Enforcement**: Validates revocation status and expiration limits (`valid_until` / `expires_at`), updating the visual trust badges accordingly.

---

## Browser & IDE Support

- **Browsers**: Firefox 109+ (available on [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/identabar/)), Chrome & Edge (coming soon, currently in store review), Brave, Opera.
- **IDEs**: VS Code & VSCodium (available on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=idevsec.identabar) and the [Open VSX Registry](https://open-vsx.org/extension/IDevSec/identabar)).

---

## Technical Specifications

- **License:** Apache 2.0 (includes patent protection rights)
- **Cryptography:** Ed25519 signatures
- **Canonicalization:** JCS - JSON Canonicalization Scheme (RFC 8785)
- **Security:** 100% client-side verification, zero data tracking or storage logs

---

## Security & Robustness Guarantees

IdentaBar clients implement strict safety and cryptographic validation measures:

- **Correct Ed25519 Checking:** Employs raw Node.js `crypto.verify` (and Web Crypto API in browser engines) instead of hash-based streams to directly check Ed25519/EdDSA signature fields.
- **Canonical JCS Standardization:** Serializes documents using RFC 8785 JSON Canonicalization Scheme (JCS) before signing or verifying to guarantee payload format consistency.
- **Race Condition Prevention:** Integrates strict task gating at startup in the VS Code extension to block tasks if workspace initialization has not fully completed.
- **Secure File Permissions:** Enforces Unix `0o600` (read/write by owner only) permissions when writing private keys to local storage to prevent key compromise.
- **HTTP request timeouts:** Cares for connection issues by enforcing a strict 5-second timeout on all outbound requests to the attestation registry to prevent app lockups.

---

## Licensing

Apache 2.0 - See the [LICENSE](./LICENSE) file for the full legal text.

Copyright 2026 IDevSec
