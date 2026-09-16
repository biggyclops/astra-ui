# Astra Roadmap

| Field | Value |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Active — Sprint 0 Track A |
| **Owner** | Astra EM |
| **Maintained by** | Documentation Manager |
| **Last Reviewed** | 2026-09-16 |
| **Approved By** | Jason (Sprint 0 Track A via CoS) |

**See also:** [project_status.yaml](./project_status.yaml) · [PRODUCT.md](./PRODUCT.md) · [ASTRA_MASTER.md](./ASTRA_MASTER.md) · [releases/](./releases/)

## Purpose

Narrate phases and milestones so humans and agents share one view of where Astra is going. Machine-readable in-flight detail lives in `project_status.yaml`.

## Sprint 0 — Track A (current)

**Goal:** Autonomy honesty first — prove the Autonomy UI Phase 1 read-only surface is design-true and QA-gated before any further chrome or auto behavior.

**Laws this sprint**
- Design System is law: desktop = Core mark + ASTRA wordmark; do **not** clone Phone chrome onto desktop.
- No Autonomy auto.
- No deferred infra P0.
- Dirty unrelated `server/routes.ts` is **quarantined** — not in DoD, not in merge scope.
- Programmer opens PRs only; **no merge without Design + QA**.

### Now
1. **Autonomy honesty** — Design + QA on `feature/autonomy-ui` @ `8e0a8a2` (hero orb + Phase 1 read-only snapshot). Pass or ticket list before any merge.
2. **Canon status** — this ROADMAP 1.0 + `project_status.yaml` with owners and Track A milestones (Docs syncs Mini-Beast/GitHub).
3. **Phase 2 posture** — keep `feature/phase2-shell` as **pending_restart_qa** until Astra Systems reports restart facts; then EM sets **restart QA** or **park** explicitly in status.
4. **Phone (secondary)** — AstraPhone v0.1.14 smoke only (wake path); full HUD/Settings consistency is Next unless Design finishes early.

### Next
1. Phase 2 cinematic shell visual QA **only if** Jason/Systems greenlight restart; otherwise remain parked in status.
2. Close Design drift tickets from Autonomy honesty (and Phone smoke if filed).
3. Product decision: Shared Drive UI (Chronos stash) vs park.
4. Optional: Phone HUD/Settings full consistency pass vs Design System.

### Later
1. Autonomy beyond read-only (requires Product + CTO; still no auto without explicit approval).
2. Branded wake-chime asset + Phone chrome polish.
3. HTTPS / Keychain for Phone.
4. On-device wake model / false-wake reduction.
5. Hermes / Downloads reliability (not Sprint 0 P0).

## Known tracks (reference)

| Track | Branch / note | Sprint 0 role |
|---|---|---|
| Autonomy UI Phase 1 | `feature/autonomy-ui` @ `8e0a8a2` | **Primary — honesty QA** |
| Phase 2 cinematic shell | `feature/phase2-shell` | Capacity after Autonomy; pending restart facts |
| Docs canon | `docs/canon-v1` | Live — EM substance, Docs sync |
| AstraPhone | main v0.1.14 (15) | Secondary smoke only |
| Dirty `server/routes.ts` | local / unrelated | **Quarantined — out of DoD** |

## Definition of Done — Sprint 0 Track A

- [ ] Autonomy Phase 1 Design pass (or ticket list) recorded in handoffs/
- [ ] Autonomy Phase 1 QA acceptance recorded; release-ready call made
- [ ] No merge of Autonomy/Phase 2 without Design + QA sign-off
- [ ] `routes.ts` quarantine respected (not in PR DoD)
- [ ] Phase 2 status is explicit: `pending_restart_qa`, `restart_qa`, or `parked`
- [ ] ROADMAP + `project_status.yaml` match reality; Docs synced to Mini-Beast checkout
- [ ] Phone: smoke note only (or explicit skip)

## Milestone log

Link closed milestones under [`releases/`](./releases/).

## Change control

- Roadmap substance is EM-owned.
- Docs Manager keeps sync + cross-links; does not invent priorities.
- Bump **Version** when phase structure or accepted milestones change.
- Identity redesign requires Jason’s explicit approval (see Design System).
