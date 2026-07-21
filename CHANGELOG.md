# Changelog

All notable changes to the IdentaBar project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-07-21

### Changed
- **Roadmap Alignment**: Corrected the references for specifications CREDUENT-006 (Prompt Integrity / APH) and CREDUENT-007 (Delegation Token / CDT) in the extension and root roadmap documents.

### Added
- **Contributing Guidelines**: Added Project Roadmap & Wanted Features hotspots section to `CONTRIBUTING.md`.

## [1.1.0] - 2026-07-05

### Added

- **Multi-Section VS Code Sidebar:** Redesigned the IdentaBar Explorer into four distinct sections: Workspace Agents, Detected Frameworks, Registries, and Help and Feedback.
- **Automated AI Framework Detection:** The VS Code extension now automatically scans `package.json`, `requirements.txt`, and `pyproject.toml` to detect AI agent frameworks including Langchain, CrewAI, AutoGen, LlamaIndex, Semantic Kernel, OpenAI, Anthropic, Google Generative AI, and Haystack.
- **One-Click Agent Registration:** Added an inline action button on each detected framework item in the sidebar to auto-generate Ed25519 keypairs and publish the agent identity directly to the Creduent registry without leaving the IDE.
- **Registry Configuration UI:** Added an inline settings gear action to the Registries sidebar view for configuring custom registry URLs.
- **Open VSX Publication:** Published the VS Code extension to the Open VSX Registry (`open-vsx.org/extension/IDevSec/identabar`) for VSCodium and Eclipse Theia users.

### Fixed

- **Runtime Module Resolution:** Resolved a critical packaging bug where `shared/verification.js` was not present in the compiled `out/` directory at runtime. The `compile` and `vscode:prepublish` scripts now explicitly copy the shared module into `out/shared/` after TypeScript compilation.
- **Node.js Type Definitions:** Pinned `@types/node` to a stable v20 release to resolve TypeScript compilation errors for built-in modules (`crypto`, `fs`, `path`, `https`, `Buffer`, `URL`).
- **Missing View Icons:** Added the required `icon` property to the `frameworksView`, `registriesView`, and `helpView` sidebar view definitions in `package.json`.
- **Launch Configuration:** Changed `preLaunchTask` from `npm: watch` to `npm: compile` so the shared module is physically present when the Extension Development Host launches.

## [1.0.4] - 2026-07-04

### Added

- **Community Standardization Guides:** Created `CODE_OF_CONDUCT.md`, `SECURITY.md`, and `CONTRIBUTING.md`.
- **Editor and Formatting Rules:** Configured `.editorconfig` and `.prettierrc` for consistent cross-contributor formatting.
- **Pre-commit Guards and Workflows:** Added `.pre-commit-config.yaml` with Prettier checks and a `.github/workflows/auto-format.yml` workflow.
- **Repository Metadata Gatekeepers:** Added `.github/CODEOWNERS`, pull request templates, and issue templates.
- **Agent Instructions:** Created `agent.md` providing context for AI coding assistants working on this repository.

## [1.0.3] - 2026-06-30

### Added

- **Unified Cryptographic Module:** Created a single cross-platform `shared/verification.js` module containing JCS canonicalization, base64 conversion, Ed25519 verification, and registry attestation retrieval.
- **Dynamic Linking Sync Script:** Built `sync-shared.js` to create directory junctions or symlinks locally and copy files recursively in CI environments.
- **Dedicated GitHub Actions Workflows:** Replaced the monolithic `package.yml` with separate path-triggered `browser.yml` and `vscode.yml` workflows.

### Changed

- **VS Code Extension Build Process:** Configured extension packaging to run `sync-shared.js` automatically before compilation.
- **Repository Metadata:** Configured repository description, homepage, and topics programmatically using the GitHub CLI.

## [1.0.2] - 2026-06-29

### Added

- **Firefox Add-on Compliance:** Configured the browser extension package for Firefox Add-on submission with data collection permissions and background script fallbacks.
- **VS Code Marketplace Publication:** Published the official VS Code client extension as "IdentaBar Client for VS Code".

### Changed

- **Branding Alignment:** Standardized display names, publisher settings, and icon resources across both extensions.

## [1.0.1] - 2026-06-28

### Changed

- **Domain Migration:** Migrated default registry endpoints from `registry.idevsec.com` to `creduent.idevsec.com` across VS Code and browser extensions.

## [1.0.0] - 2026-06-25

### Added

- **Initial Release:** Launched the client verification suite including the VS Code extension and the browser extension.
- **Browser Extension (Manifest V3):** Real-time badge indicators (`Trusted`, `Verified`, `Warning`, `Danger`, `Unverified`) and a DevTools verification playground for agent attestation.
- **VS Code Extension:** Status bar trust indicators, credential scanner, and an Explorer panel for AI agent metadata display.
