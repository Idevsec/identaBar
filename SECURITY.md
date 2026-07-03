# Security Policy

We take the security of this project and the cryptographic trust model of our verification clients seriously.

---

## Supported Versions

Only the latest release of IdentaBar is actively supported with security patches and enhancements.

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |
| < 1.0.0 | No        |

---

## Security Guarantees & Verification Integrity

IdentaBar implements strict safety and cryptographic validation measures:
*   **100% Client-Side Verification:** Cryptographic computations are executed entirely locally without sending user browsing/development history or keys to third-party endpoints.
*   **Ed25519 Checking:** Employs raw Node.js `crypto.verify` (and Web Crypto API in browser engines) instead of hash-based streams to directly check Ed25519/EdDSA signature fields.
*   **Canonical JCS Standardization:** Serializes documents using RFC 8785 JSON Canonicalization Scheme (JCS) before signing or verifying to guarantee payload format consistency.
*   **Secure File Permissions:** Enforces Unix `0o600` (read/write by owner only) permissions when writing private keys to local storage to prevent key compromise.

---

## Reporting a Vulnerability

If you discover a security vulnerability within the IdentaBar clients or the verification logic itself (e.g. signature bypasses, key leakage, or path traversals), please report it responsibly:

1. Do NOT open a public GitHub issue detailing the vulnerability.
2. Email your findings and a proof-of-concept (PoC) directly to the maintainers or security contacts at `security@idevsec.com`.
3. Allow the maintainers time to analyze, reproduce, and release a patch before disclosing details publicly.
