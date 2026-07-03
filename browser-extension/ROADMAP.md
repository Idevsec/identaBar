# IdentaBar Browser Extension - Roadmap

The browser extension is the **web browsing identity layer** for the Creduent Protocol. Its role is to automatically detect AI agent declarations on websites a user visits and surface real-time cryptographic trust signals in the browser toolbar and DevTools - without requiring any manual configuration.

> [!NOTE]
> **Status:** Published on Mozilla Add-ons (Firefox). Chrome Web Store and Edge Add-ons review in progress. Active Development.
> This roadmap tracks against Creduent Protocol milestones. Protocol phase changes directly drive new extension capabilities.

---

## Phase 1: Core Browser Integration - Complete

**Goal:** Build a stable, privacy-first agent trust verifier that works silently in the background across all major browsers.
**Creduent Alignment:** Protocol Phases 1-3 (Foundation, Ecosystem, Scale).

* [x] **Automated Agent Detection:** Background service worker scans visited domains for `<meta name="creduent-agent">` tags, HTTP link headers, and `/.well-known/agent.json` files without any user action.
* [x] **Toolbar Trust Badges:** Real-time trust state displayed in the browser toolbar (`Trusted`, `Verified`, `Warning`, `Danger`, `Unverified`) backed by live registry lookups against `creduent.idevsec.com`.
* [x] **Local Ed25519 Verification:** Zero-latency, zero-dependency signature checking using the native Web Crypto API (`crypto.subtle`) - no external library or server roundtrip required for cryptographic checks.
* [x] **DevTools Playground Panel:** Dedicated verification inspector in the browser DevTools allowing developers to test payloads, inspect raw signatures, and debug Creduent resolution handshakes.
* [x] **Privacy First:** No browsing history, cookies, or user identifiers are collected or stored. All data remains in service worker memory within its lifetime.
* [x] **Cross-Browser Compatibility:** Manifest V3 with `browser-compat.js` shim for unified Chrome/Edge/Brave/Firefox namespace handling.
* [x] **Firefox Add-on Release:** Published to the official Mozilla Add-ons directory.

---

## Phase 2: Store Approvals & Protocol v2.0 Sync - July -> September 2026

**Goal:** Expand market coverage across all Chromium stores and keep the extension aligned with Creduent Protocol v2.0.
**Creduent Alignment:** Protocol Phase 4 (Schema Decoupling v2.0, Short-Lived Attestation Windows, Capability-Level Attestations).

* [ ] **Chrome Web Store Launch:** Ship the Manifest V3 extension live on the Google Chrome Web Store.
* [ ] **Microsoft Edge Add-ons Launch:** Publish to the Microsoft Edge Add-ons store.
* [ ] **Schema v2.0 Popup Rendering:** Update the popup attestation card to correctly display both v2.0 decoupled agent documents (identity + policy separately) and legacy v1.x flat documents without breaking existing UX flows.
* [ ] **Attestation Expiry Indicator:** Display a visible expiry countdown in the popup card when an agent's attestation is within 7 days of its 30-day TTL, with a visual `Expiring Soon` badge state.
* [ ] **Capability-Level Trust Breakdown:** Expand the popup card to show per-capability attestation status (e.g. `osint: Verified`, `code_execution: Unverified`) for agents using Creduent capability-level attestations.
* [ ] **Local Cache Optimization (5-min TTL):** Implement an in-memory LRU cache in the service worker to prevent redundant registry calls on every page navigation for the same domain.

---

## Phase 3: Developer Visibility & Platform Integration - October -> December 2026

**Goal:** Surface Creduent trust signals not just in the toolbar, but inline on the developer platforms where agents are shared and reviewed.
**Creduent Alignment:** Protocol Phase 4 (Creduent Playground, Agent Discovery API).

* [ ] **Platform Trust Cards (GitHub):** Inject non-obtrusive inline trust cards on GitHub repository file views when they reference an `agent.json` - showing the agent's live Creduent status directly on the file preview page.
* [ ] **Platform Trust Cards (Hugging Face):** Inject trust overlays on Hugging Face model cards and Spaces when they declare Creduent agent identity.
* [ ] **Platform Trust Cards (npm):** Surface inline Creduent status on npm package pages where `agent.json` references are detected in `package.json` or repository files.
* [ ] **In-Browser Attestation Sandbox (DevTools):** Evolve the DevTools playground into a full local Creduent Playground - allowing developers to generate Ed25519 keypairs, sign `agent.json` documents, and validate signatures entirely client-side without registry interaction.
* [ ] **Agent Discovery Browser Action:** Add a browser action panel tab that queries the Creduent `GET /agents?capability=X` discovery API, letting users explore and verify the full registered agent ecosystem by capability directly from their browser.

---

## Phase 4: Delegation, Hardware Trust & Standards - 2027+

**Goal:** Render the full cryptographic proof chain that Creduent Phase 5 introduces visible and auditable directly in the browser.
**Creduent Alignment:** Protocol Phase 5 (CDT Specification CREDUENT-006, Prompt Integrity CREDUENT-007, TPM Attestation, DID Interoperability, IANA agent:// Registration).

* [ ] **CDT Chain Popup View:** Parse and render Creduent Delegation Token (CDT) chains in the popup card - showing the full authorization provenance path (Agent A authorized Agent B to call Service C) in a collapsible, human-readable format.
* [ ] **Intent-to-Action Audit Badge:** Surface a distinct badge state for agents that publish cryptographically signed intent-to-action execution traces per CREDUENT-006, allowing users to verify at a glance that the agent acted within its declared authorization scope.
* [ ] **Hardware-Attested Trust Tier Badge:** Render a distinct `Hardware Verified` toolbar badge when an agent's attestation includes a verified TPM 2.0 quote or Intel SGX/AWS Nitro enclave measurement - visually distinguishing it from software-only attestations.
* [ ] **Prompt & Model Integrity Indicator (CREDUENT-007):** Display a verification state in the popup for agents that publish cryptographically signed system prompt hashes and model version identifiers.
* [ ] **DID Resolution Support:** Resolve `did:creduent` and `did:web` decentralized identifiers natively inside the background service worker, supporting verification of agents not registered with the IDevSec reference registry.
* [ ] **agent:// URI Handler:** Register the browser extension as a native protocol handler for `agent://` URIs once the scheme is formally registered with IANA, enabling direct one-click resolution of any Creduent agent identity from within the browser address bar.
* [ ] **Offline Verification Mode:** Cache the Creduent registry root public key locally and fall back to purely offline Ed25519 signature validation when the registry is unreachable.
