# Changelog

All notable changes to the IdentaBar project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
