# Changelog

All notable changes to the IdentaBar project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2026-07-04

### Added

- **Community Standardization Guides:** Created `CODE_OF_CONDUCT.md`, `SECURITY.md`, and `CONTRIBUTING.md`.
- **Editor & Formatting Rules:** Configured `.editorconfig` (spaces, LF, trim trailing whitespaces) and `.prettierrc` for consistent formatting.
- **Pre-commit Guards & Workflows:** Added `.pre-commit-config.yaml` with Prettier checks and created `.github/workflows/auto-format.yml` to automate style corrections on push/PRs.
- **Repository Metadata Gatekeepers:** Added `.github/CODEOWNERS` requesting reviews from `@cyberfascinate`, along with pull request and issue templates.
- **Agent Instructions:** Created `agent.md` providing system instructions for AI coding assistants.

## [1.2.0] - 2026-06-30

### Added

- **Unified Cryptographic Module:** Created a single cross-platform `shared/verification.js` script containing JCS canonicalization, base64 conversion, Ed25519 verification, and registry attestation retrieval.
- **Dynamic Linking Sync Script:** Built `sync-shared.js` to create directory junctions/symlinks locally (for instant development reloading) and copy files in CI environments.
- **Dedicated GitHub Actions Workflows:** Replaced `package.yml` with separate, path-triggered `browser.yml` and `vscode.yml` workflows.

### Changed

- **VS Code Extension Build Process:** Configured extension packaging to run `sync-shared.js` automatically.
- **Repository Metadata:** Programmatically configured the repository description, homepage, and topics using `gh repo edit`.

## [1.1.2] - 2026-06-29

### Added

- **Firefox Add-on compliance:** Configured browser extension package for Firefox Add-on submission with data collection permissions and background script fallbacks.
- **VS Code Marketplace Publication:** Published the official VS Code client extension as "IdentaBar Client for VS Code".

### Changed

- **Branding Alignment:** Standardized display names, publisher settings, and icon resources across extensions.

## [1.1.1] - 2026-06-28

### Changed

- **Domain Migration:** Migrated default registry endpoints from `registry.idevsec.com` to `creduent.idevsec.com` across VS Code and browser extensions.

## [1.1.0] - 2026-06-27

### Fixed

- **Corrected Ed25519 Cryptographic Checks:** Replaced incorrect hashing verifiers in the VS Code client with direct `crypto.verify(null, ...)` calls to properly validate Ed25519 signatures.
- **JCS Canonicalization Order:** Standardized serialization formatting using RFC 8785 JSON Canonicalization Scheme (JCS) in both clients to eliminate signature mismatches.
- **Secured Gating Conditions:** Resolved task verification race conditions during startup in VS Code client by enforcing strict mode caches.
- **Key File Permissions:** Standardized secure `0o600` owner-only file permissions when saving private key files.
- **HTTP request timeouts:** Added connection timeouts on network fetches from the Creduent registry to prevent app starvation.

## [1.0.0] - 2026-06-25

### Added

- **Initial Release:** Launched client verification suite including the VS Code extension and the Web Browser extension.
- **Browser Extension (Manifest V3):** Real-time badge indicators (`★`, `✓`, `!`, `✕`, `?`) and devtools playground for agent verification.
- **VS Code Extension:** Desktop integration status indicators, credential scanner, and side panel display for AI agent metadata.
