# IdentaBar - Product Roadmap

IdentaBar is the official client verification suite for the Creduent Protocol. It surfaces cryptographic agent trust signals at every point where developers and users interact with autonomous agents - in the browser toolbar and inside the IDE.

> [!NOTE]
> **Status:** Active Development. Phase 1 complete. Phase 2 in progress (July 2026).
> IdentaBar phases track directly against Creduent Protocol milestones. Refer to sub-roadmaps for extension-specific details: [VS Code Extension](vscode-extension/ROADMAP.md) | [Browser Extension](browser-extension/ROADMAP.md)

---

## Roadmap Overview

```
+------------------+-----------------+------------------+-------------------+
|     PHASE 1      |     PHASE 2     |     PHASE 3      |     PHASE 4       |
|  Core            |  Store          |  Developer       |  Delegation and   |
|  Foundations     |  Approvals and  |  Integrations    |  Hardware Trust   |
|  (Complete)      |  Protocol Sync  |  and Visibility  |  (2027+)          |
|                  |  (Jul-Sep 2026) |  (Oct-Dec 2026)  |                   |
+------------------+-----------------+------------------+-------------------+
```

---

## Phase 1: Core Client Foundations - Complete

**Goal:** Build and release stable, cryptographically correct verification clients for web browsers and VS Code.
**Creduent Alignment:** Protocol Phases 1-3 (Foundation, Ecosystem, Scale).

- [x] **Unified Cryptographic Engine:** Standardized Ed25519 validation and JCS canonicalization (RFC 8785) into a single cross-platform `shared/` module used by both clients identically.
- [x] **Browser Extension (Manifest V3):** Real-time trust badges in the toolbar (`Trusted`, `Verified`, `Warning`, `Danger`, `Unverified`), live registry lookups against `creduent.idevsec.com`, and a DevTools verification playground.
- [x] **VS Code Extension:** Workspace `agent.json` scanner, live Ed25519 verification via Node.js native `crypto`, status bar badge, Explorer panel, zero-trust task gating, and identity initialization wizard.
- [x] **Firefox Add-on Release:** Published to the official Mozilla Add-ons directory.
- [x] **VS Code Marketplace Release:** Published as `idevsec.identabar` on Visual Studio Marketplace and Open VSX Registry.
- [x] **Security Hardening:** `0o600` key file permissions, 5-second registry fetch timeouts, startup task gating to prevent initialization race conditions.

---

## Phase 2: Store Approvals and Protocol v2.0 Sync - July -> September 2026

**Goal:** Expand marketplace presence across all major browser stores and align both clients with Creduent Protocol Phase 4 changes.
**Creduent Alignment:** Protocol Phase 4 (Schema Decoupling v2.0, Short-Lived Attestation 30-day TTL, Capability-Level Attestations, Key Revocation and Cache Tuning).

- [ ] **Chrome Web Store Launch:** Ship the Manifest V3 browser extension live on the Google Chrome Web Store.
- [ ] **Microsoft Edge Add-ons Launch:** Publish to the Microsoft Edge Add-ons store.
- [ ] **Schema v2.0 Client Parsing:** Update both clients to parse the decoupled v2.0 `agent.json` structure (cryptographic identity fields separated from transient policy/capability declarations) while maintaining backward compatibility with v1.x flat documents.
- [ ] **Attestation Expiry Indicators:** Surface 7-day pre-expiry warnings in both clients - countdown in VS Code status bar and Explorer panel, `Expiring Soon` badge in browser popup - tied to the Creduent 30-day TTL window.
- [ ] **Local Cache Optimization (5-min TTL):** Implement an in-memory LRU cache in both clients to minimize redundant registry calls, consistent with Creduent Phase 4 edge-caching strategy.
- [ ] **Capability-Level Trust Breakdown:** Show per-capability attestation status (e.g. `osint: Verified`, `code_execution: Unverified`) in the VS Code Explorer tree and browser popup attestation card.

---

## Phase 3: Developer Integrations and Platform Visibility - October -> December 2026

**Goal:** Make agent trust status visible exactly where developers build, review, and share agent code - not just in a toolbar.
**Creduent Alignment:** Protocol Phase 4 (Creduent Playground, Identity-Based Rate Limiting (IBRL), Agent Discovery API, Framework Integrations: LangChain, LlamaIndex, Semantic Kernel).

- [ ] **Inline Editor Diagnostics (VS Code):** Native VS Code diagnostics (squiggly underlines, Problems panel) on invalid or expired `agent.json` files - flagging signature mismatches, schema violations, and missing required fields in real-time.
- [ ] **One-Click Registration (VS Code):** CodeLens action (`Register with Creduent`) on unregistered `agent.json` files that invokes `creduent register` from the Creduent CLI without leaving the IDE.
- [ ] **In-Client Attestation Sandbox:** Creduent Playground embedded as a VS Code WebView panel and expanded DevTools panel in the browser - full local keypair generation, `agent.json` signing, and signature verification without touching the registry.
- [ ] **Public Platform Trust Cards (Browser):** Non-obtrusive inline trust overlays injected on GitHub repository views, Hugging Face model cards, and npm package pages when they reference Creduent-declared agent identities.
- [ ] **Agent Discovery Panel:** VS Code sidebar tab and browser action tab querying the Creduent `GET /agents?capability=X` discovery API so developers can explore and verify the full registered agent ecosystem by capability.
- [ ] **Framework Integration Hints (VS Code):** When LangChain, LangGraph, CrewAI, AutoGen, LlamaIndex, or Semantic Kernel agent files are detected in the workspace, surface hints pointing to the corresponding Creduent SDK middleware documentation.

---

## Phase 4: Delegation, Hardware Trust and Governance - 2027+

**Goal:** Visualize and audit the full cryptographic proof chains that Creduent Phase 5 introduces - from delegation tokens to hardware enclave attestations.
**Creduent Alignment:** Protocol Phase 5 (CDT Specification CREDUENT-006, Instruction and Prompt Integrity CREDUENT-007, Verifiable Audit Logging, TPM Attestation, DID Interoperability, IANA agent:// Registration).

- [ ] **CDT Chain Visualization:** Parse and render Creduent Delegation Token (CDT) chains in the VS Code Explorer sidebar and browser popup - showing the full authorization provenance path (Agent A authorized Agent B to call Service C) as a collapsible, human-readable audit trail.
- [ ] **Intent-to-Action Audit View (CREDUENT-006):** Display the cryptographically signed execution trace for agents implementing the CDT binding specification, letting developers and auditors verify that an agent's runtime actions matched its declared authorization scope.
- [ ] **Prompt and Model Integrity Indicator (CREDUENT-007):** Badge for agents that publish signed system prompt hashes and model version identifiers - flagging mid-session prompt tampering in VS Code Problems panel and browser popup.
- [ ] **Hardware-Attested Trust Tier:** Distinct `HARDWARE VERIFIED` badge in VS Code status bar and browser toolbar when an agent's attestation includes a verified TPM 2.0 quote or Intel SGX/AWS Nitro enclave measurement.
- [ ] **DID Resolution Support:** Resolve `did:creduent` and `did:web` decentralized identifiers natively in both clients, supporting agents not registered with the IDevSec reference registry.
- [ ] **agent:// URI Handler (Browser):** Register as a native protocol handler for `agent://` URIs once the scheme is formally registered with IANA.
- [ ] **Offline Verification Mode:** Cache the Creduent registry root public key locally and fall back to purely offline Ed25519 validation when the registry is unreachable.
