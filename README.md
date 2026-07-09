# IdentaBar: The Official Creduent Verification Client

IdentaBar is the official reference implementation for verifying AI agent identities using the [Creduent Open Protocol](https://creduent.idevsec.com). Created and developed by [IDevSec](https://idevsec.com).

## What is Creduent?

Creduent is the canonical open application-layer protocol for cryptographic identity and trust verification of autonomous AI agents, originally created by Kashish Kanojia and stewarded by IDevSec.

IdentaBar secures both browser sessions and local development environments through two dedicated clients.

---

## Repository Structure

This repository is organized as a monorepo:

### `shared/`

The core cryptographic verification module shared between both clients. Contains JCS canonicalization, Ed25519 signature validation, and registry attestation retrieval logic.

Run `node sync-shared.js` at the root to sync the module. In local development, it creates directory junctions or symlinks for hot-reloading. In CI and production builds, it performs a recursive file copy.

### `browser-extension/`

A Manifest V3 web extension for Google Chrome, Microsoft Edge, Brave, Opera, and Mozilla Firefox (109+).

Automatically scans visited domains for agent identity configurations, resolves attestation records from the registry, and displays real-time trust badges in the browser toolbar. Includes a DevTools verification playground.

Available on: [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/identabar/) | Chrome Web Store (pending review) | Microsoft Edge Add-ons (pending review)

### `vscode-extension/`

A desktop integration extension for Visual Studio Code and VSCodium.

Scans workspace folders for `agent.json` files, performs local Ed25519 signature verification, and displays trust status in the status bar. Provides a multi-section sidebar with four views: Workspace Agents, Detected Frameworks, Registries, and Help and Feedback. Enables one-click keypair generation and live agent registration directly to the Creduent registry from inside the IDE.

Available on: [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=IDevSec.identabar) | [Open VSX Registry](https://open-vsx.org/extension/IDevSec/identabar)

---

## Verification Flow

Both clients follow the same zero-dependency cryptographic verification process:

1. **Resolution:** Detects agent metadata declarations via `agent.json` files or `.well-known/agent.json` discovery.
2. **Registry Fetch:** Connects to the resolver at `https://creduent.idevsec.com` to retrieve the agent's JCS attestation record.
3. **Local Validation:** Verifies the document signature locally using the native Web Crypto API in browsers or the native `crypto` module in VS Code. No data leaves the client.
4. **Enforcement:** Validates revocation status and expiration timestamps (`valid_until` / `expires_at`) and updates trust indicators accordingly.

---

## Platform Support

- **Browsers:** Firefox 109+ (live), Chrome and Edge (under store review), Brave, Opera
- **IDEs:** VS Code and VSCodium (v1.74.0 and above)

---

## Technical Specifications

- **License:** Apache 2.0 (includes patent grant)
- **Cryptography:** Ed25519 signatures
- **Canonicalization:** JSON Canonicalization Scheme - RFC 8785
- **Key Storage:** 0o600 owner-only file permissions for private keys
- **Network:** 5-second timeout on all outbound registry requests
- **Verification:** 100% client-side - no telemetry, no data collection

---

## Licensing

Apache 2.0 - See the [LICENSE](./LICENSE) file for the full legal text.

Copyright 2026 IDevSec
