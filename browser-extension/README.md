# IdentaBar Web Browser Client

IdentaBar is a client-side browser extension (Manifest V3) that verifies the identity and attestation certificates of AI agents using the Creduent protocol standard.

---

## Features

- **Automated Agent Detection**: Automatically scans visited domains for meta tags (`<meta name="creduent-agent">`), link headers, or well-known JSON files (`/.well-known/agent.json`).
- **Toolbar Trust Badging**: Displays trust badges directly in the browser bar:
  - `★` **Trusted** (Gold) - Verified enterprise entity
  - `✓` **Verified** (Cyan) - Valid cryptographic signatures & records
  - `!` **Warning** (Amber) - Expired attestation certificate
  - `✕` **Danger** (Red) - Revoked key/identity
  - `?` **Unverified** (Gray) - Untrusted developer/no signature
- **Local Ed25519 Cryptographic Verification**: Verifies signatures locally in-browser using the native Web Crypto API (`crypto.subtle`) for zero-latency execution.
- **DevTools Playground**: Integrates a dedicated verification inspector panel in the browser DevTools console (press `F12` to open) allowing developers to test payloads, inspect signatures, and debug resolution handshakes.
- **Privacy First**: Does not collect, track, or store browsing history, cookies, or user identifiers. Storage is kept in-memory within the service worker lifetime.

---

## Supported Browsers

- **Google Chrome** (Manifest V3)
- **Microsoft Edge** (Manifest V3)
- **Brave Browser** (Manifest V3)
- **Mozilla Firefox 109+** (Manifest V3 compatible with the `browser-compat` shim)

*Note: DevTools panels are exclusive to Chromium-based browsers; Firefox does not support custom DevTools views containers.*

---

## Local Installation & Development

### 1. Chromium Browsers (Chrome / Edge / Brave / Opera)
1. Clone this repository.
2. From the root directory, synchronize the shared verification files:
   ```bash
   node sync-shared.js
   ```
   *(This creates a directory symlink/junction under `browser-extension/shared/` so that any edits to the core verification code are instantly live.)*
3. Open your browser and go to the Extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
4. Enable **Developer mode** (toggle in the top-right corner).
5. Click **Load unpacked** (button in the top-left corner).
6. Select the `browser-extension/` directory.

### 2. Mozilla Firefox
Firefox requires packing the extension using `web-ext` for MV3 compatibility testing:
1. From the root directory, sync the shared files in copy mode:
   ```bash
   node sync-shared.js --copy
   ```
2. Install `web-ext` globally:
   ```bash
   npm install -g web-ext
   ```
3. Build the extension package:
   ```bash
   web-ext build --source-dir ./browser-extension
   ```
4. Load the generated `.zip` archive as a temporary add-on in `about:debugging`.

---

## Directory Structure

```
browser-extension/
├── manifest.json         # Extension configuration & MV3 parameters
├── assets/
│   └── icons/            # icon16.png, icon48.png, icon128.png (manifest sizes) and icon.svg (vector source)
├── background/
│   └── background.js     # Ephemeral Service worker: resolves attestation APIs
├── content/
│   └── content.js        # Scans HTML headers for creduent-agent meta tags
├── devtools/
│   ├── devtools.html     # Loads DevTools panel
│   ├── panel.html        # DevTools Inspector UI view
│   └── panel.js          # Handles signature checks and verifier playground
├── lib/
│   └── browser-compat.js # Cross-browser chrome vs browser namespace shim
├── popup/
    ├── popup.html        # Attestation card view
    └── popup.js          # Populates attestation records on click
└── shared/               # Link/Copy of the root-level shared/ verification module
```

---

## License

Apache 2.0 - See the root `LICENSE` file for terms.
