# IdentaBar VS Code Extension - Roadmap

The VS Code extension is the **developer workspace identity layer** for the Creduent Protocol. Its role is to surface cryptographic agent trust signals directly inside the IDE where agents are built, configured, and deployed.

> [!NOTE]
> **Status:** Published on Visual Studio Marketplace and Open VSX Registry. Active Development.
> This roadmap tracks against Creduent Protocol milestones. Protocol phase changes directly drive new extension capabilities.

---

## Phase 1: Core Workspace Integration - Complete

**Goal:** Build a stable, cryptographically correct agent identity verifier native to the VS Code developer workflow.
**Creduent Alignment:** Protocol Phases 1-3 (Foundation, Ecosystem, Scale).

- [x] **Local Ed25519 Verification:** Zero-dependency signature checking using Node.js native `crypto.verify()` with RFC 8785 JCS canonicalization - matching Creduent registry logic exactly.
- [x] **Real-Time Workspace Watching:** File system events on `agent.json` files trigger automatic re-verification without manual intervention.
- [x] **Dynamic Status Bar Badge:** Live trust level display in the VS Code status bar (`TRUSTED`, `VERIFIED`, `EXPIRED`, `REVOKED`, `UNVERIFIED`) with color-coded indicators.
- [x] **Premium Workspace Explorer Panel:** Tree view displaying agent namespace IDs, owner, domain, endpoint, and capabilities with distinct codicons and conditional warning/error states.
- [x] **Zero-Trust Task Gating:** `strict` mode blocks VS Code task execution when unverified or revoked agent keys are detected in the active workspace.
- [x] **Identity Initialization Wizard:** One-command keypair generation, `agent.json` creation, JCS signing, and automatic `private.pem` addition to `.gitignore`.
- [x] **Detached File Signing:** Context menu command to generate `.sig` signature files for any workspace file using the agent private key.
- [x] **VS Code Marketplace Release:** Published as `idevsec.identabar` on Visual Studio Marketplace.
- [x] **Open VSX Registry Release:** Published on Open VSX for VSCodium and other VS Code forks.
- [x] **Security Hardening:** `0o600` key file permissions, 5-second registry fetch timeouts, startup task gating to prevent race conditions.

---

## Phase 2: Protocol v2.0 Sync - July -> September 2026

**Goal:** Keep the extension in lockstep with Creduent Protocol v2.0 schema changes.
**Creduent Alignment:** Protocol Phase 4 (Schema Decoupling v2.0, Short-Lived Attestation 30-day TTL, Capability-Level Attestations, Key Revocation and Cache Tuning).

- [ ] **Schema v2.0 Parser:** Update workspace scanner to correctly parse the decoupled v2.0 `agent.json` (cryptographic identity fields separated from transient policy/capability declarations) while maintaining backward-compatible v1.x parsing.
- [ ] **Attestation Expiry Countdown:** Display a visible countdown in the Explorer panel and status bar when an agent's attestation is within 7 days of its 30-day TTL, prompting the developer to run `creduent renew`.
- [ ] **Auto-Renewal Status Indicator:** Detect when the Creduent SDK auto-renewal daemon is active for a workspace agent and surface a `Renewing...` state in the status bar.
- [ ] **Capability-Level Trust Display:** Show per-capability attestation status in the Explorer tree (e.g. `osint: Verified`, `code_execution: Unverified`) based on Creduent capability-level attestation records.
- [ ] **Multi-Agent Workspace Support:** Support workspaces containing multiple `agent.json` files across nested subdirectories with individual status tracking per agent.

---

## Phase 3: Developer Diagnostics Layer - October -> December 2026

**Goal:** Make Creduent validation errors surface as native IDE feedback - not just a panel badge.
**Creduent Alignment:** Protocol Phase 4 (Creduent Playground, IBRL) + Framework Integrations (LangChain, LlamaIndex, Semantic Kernel).

- [ ] **Inline Editor Diagnostics:** Render Creduent validation errors as native VS Code diagnostics (squiggly underlines in editor, Problems panel entries) when editing `agent.json` - flagging invalid signatures, expired attestations, missing required fields, or schema violations in real-time.
- [ ] **One-Click Registration Action:** When an unregistered `agent.json` is detected, surface a CodeLens or lightbulb action (`Register with Creduent`) that invokes `creduent register` from the Creduent CLI without leaving the IDE.
- [ ] **In-IDE Attestation Sandbox (WebView):** Embed a local Creduent Playground inside VS Code as a WebView panel - allowing developers to generate keypairs, sign `agent.json` documents, and validate signatures entirely locally without touching the registry.
- [ ] **Framework Integration Hints:** When a LangChain, LangGraph, CrewAI, or AutoGen agent file is detected in the workspace, surface a hint suggesting Creduent verification middleware integration with a direct link to the relevant SDK docs.
- [ ] **Output Channel Structured Logging:** Upgrade the IdentaBar Output Channel from plain text to structured JSON-line logs, enabling developers to pipe extension telemetry into their existing observability pipelines.

---

## Phase 4: Delegation, Hardware Trust & Governance - 2027+

**Goal:** Visualize the full cryptographic proof chain that Creduent Phase 5 introduces inside the developer's primary tool.
**Creduent Alignment:** Protocol Phase 5 (CDT Specification CREDUENT-006, Prompt Integrity CREDUENT-007, TPM Attestation, DID Interoperability).

- [ ] **CDT Chain Visualizer (Sidebar):** Parse and render Creduent Delegation Token (CDT) chains in the Explorer panel - showing the complete authorization provenance path (Agent A authorized Agent B to call Service C) as a verifiable, human-readable audit trail directly in VS Code.
- [ ] **Intent-to-Action Trace Panel:** For agents implementing CREDUENT-006, display the cryptographically signed execution trace in a dedicated VS Code panel - allowing developers and auditors to verify that an agent's runtime actions matched its declared authorization scope before the session closed.
- [ ] **Prompt & Model Integrity Indicator (CREDUENT-007):** Surface a verification badge for agents that publish cryptographically signed system prompt hashes and model version identifiers, flagging any detected mid-session prompt tampering in the Problems panel.
- [ ] **Hardware-Attested Trust Tier (Status Bar):** Display a distinct `HARDWARE VERIFIED` status bar state when an agent's attestation includes a verified TPM 2.0 quote or Intel SGX/AWS Nitro enclave measurement.
- [ ] **DID Resolution Support:** Resolve `did:creduent` and `did:web` decentralized identifiers natively inside the workspace scanner, supporting verification of agents not registered with the IDevSec reference registry.
- [ ] **Offline Verification Mode:** Cache the Creduent registry root public key locally and fall back to purely offline Ed25519 signature validation when the registry is unreachable - maintaining cryptographic guarantees without network access.
