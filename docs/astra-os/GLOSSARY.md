# Astra OS — Glossary

| Field | Value |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Active |
| **Owner** | Documentation Manager |
| **Last Reviewed** | 2026-09-17 |

Shared vocabulary for every AI role. If a term is missing, ask Docs or Product. Do not invent a meaning.

**See also:** [BOOT.md](./BOOT.md) · [../ASTRA_MASTER.md](../ASTRA_MASTER.md) · [../DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

| Term | Meaning |
|---|---|
| **Ask First** | Displayed Phase 1 Autonomy policy. Operator approves each action. Auto is not selectable. |
| **Astra OS** | Agent operating layer under `docs/astra-os/`. Extension of canon, not a replacement. |
| **Astra UI** | Desktop operator control plane (this repo). |
| **Atlas** | Fleet node. See live/status docs; do not invent capabilities. |
| **Auto** | Autonomy mode that would run pre-approved work. Forbidden until explicitly approved. |
| **Autonomy** | Operator surface for assistant/fleet work. Phase 1 is **read-only** (snapshot + honest chrome). |
| **BOOT** | [`BOOT.md`](./BOOT.md) — single entry point for every AI agent. |
| **Canon** | Authoritative institutional docs in `astra-ui/docs`. |
| **Core** | Astra core mark / orb identity. Desktop chrome uses Core mark + ASTRA wordmark. |
| **Decision log** | [`DECISION_LOG.md`](./DECISION_LOG.md) — product and org decisions. Not architecture ADRs. |
| **Design System** | Visual law: [`../DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md). |
| **Fleet** | Named nodes behind the Astra API (Mini-Beast, Hades, Hermes, Talos, Atlas, …). |
| **Hades** | Fleet compute / AI node. Reachability is reported by snapshot (`hadesReachable`). Offline is not automatically a Track A fail. |
| **Hermes** | NAS / media node. Mount and proxy notes live in Eng-local Hermes docs. |
| **Honesty** | UI and docs must not present stubs or unpublished tips as live/published. |
| **Master** | [`../ASTRA_MASTER.md`](../ASTRA_MASTER.md) — product/system front door. |
| **Mini-Beast** | Live Eng host and control-plane checkout. GitHub and Mini-Beast tips must be named separately. |
| **Nodes** | Operator surface for fleet reachability, services, and machine metrics. |
| **Operator** | Human using Astra (Jason). |
| **Orb** | Core visual / motion mark on Autonomy and related surfaces. |
| **Phase 1** | Current Autonomy slice: read-only snapshot, no mutating Autonomy APIs, no auto. |
| **Phone** | AstraPhone. Phone chrome is allowed on Phone. Do **not** clone Phone nav onto desktop. |
| **Preview / Local** | Visible control that is disabled and not connected in Phase 1. Honesty label for stubs. |
| **Quarantine** | Named out-of-scope dirty work (example: unrelated `server/routes.ts`). Not in DoD. |
| **Snapshot** | `GET /api/autonomy/snapshot` — read-only Autonomy API. |
| **Talos** | Fleet node. See live/status docs; do not invent capabilities. |
| **Track A** | Sprint 0 focus: Autonomy honesty first. |
