# Astra Roadmap

| Field | Value |
|---|---|
| **Version** | 1.0.2 |
| **Status** | Active — Sprint 0 Track A |
| **Owner** | Astra EM |
| **Maintained by** | Documentation Manager |
| **Last Reviewed** | 2026-09-16 |
| **Approved By** | Jason (Sprint 0 Track A via CoS) |

**See also:** [project_status.yaml](./project_status.yaml) · [PRODUCT.md](./PRODUCT.md) (vision + priority ranking, v1.0.2) · [product/STORIES.md](./product/STORIES.md) · [product/DECISIONS.md](./product/DECISIONS.md) · [ASTRA_MASTER.md](./ASTRA_MASTER.md) · [docs/qa/SPRINT0_TRACK_A_GATE.md](./qa/SPRINT0_TRACK_A_GATE.md) · [releases/](./releases/)

Product owns *what/why*. This file remains EM-owned sequencing. If they conflict, stop and reconcile — do not silently expand scope.

## Purpose

Narrate phases and milestones so humans and agents share one view of where Astra is going. Machine-readable in-flight detail lives in `project_status.yaml`.

## Sprint 0 — Track A (current)

**Goal:** Autonomy honesty first — prove the Autonomy UI Phase 1 read-only surface is design-true and QA-gated before any further chrome or auto behavior.

**Laws this sprint**
- Design System is law: desktop = Core mark + ASTRA wordmark; do **not** clone Phone chrome onto desktop.
- No Autonomy auto.
- No deferred infra P0.
- Dirty unrelated `server/routes.ts` is **quarantined** — not in DoD, not in merge scope.
- Programmer opens PRs only; **no merge without Design + QA** (QA gate: `docs/qa/SPRINT0_TRACK_A_GATE.md` — currently **NOT READY** until live).

### Now
1. **Autonomy honesty** — Design + QA on `feature/autonomy-ui` (GitHub `52c96eb`; Mini-Beast tip `8e0a8a2` unpushed). Hero orb + Phase 1 read-only snapshot. Pass or ticket list before any merge.
2. **Canon status** — ROADMAP + `project_status.yaml` with owners and Track A milestones (Docs syncs Mini-Beast/GitHub). Draft PR #1 canon→main stays unmerged until EM/Jason say so.
3. **Phase 2 posture** — `feature/phase2-shell` is Mini-Beast-only; related remote `feature/astra-cinematic-shell` @ `6f7307b`. Status **pending_restart_qa** until Astra Systems reports restart facts; then EM sets **restart_qa** or **parked**.
4. **Phone (secondary)** — AstraPhone **v0.1.26 (28)** smoke only (wake path); full HUD/Settings consistency is Next unless Design finishes early.

### Next
1. Phase 2 cinematic shell visual QA **only if** Jason/Systems greenlight restart; otherwise remain parked in status.
2. Close Design drift tickets from Autonomy honesty (and Phone smoke if filed).
3. Shared Drive UI — Product 🔴 REJECT (park indefinitely; ASTRA-R4).
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
| Autonomy UI Phase 1 | `feature/autonomy-ui` — GH `52c96eb` / MB `8e0a8a2` | **Primary — honesty QA** |
| Cinematic shell (remote) | `feature/astra-cinematic-shell` @ `6f7307b` | Capacity after Autonomy |
| Phase 2 local | `feature/phase2-shell` (Mini-Beast only) | pending restart facts |
| Docs canon | `docs/canon-v1` (draft PR #1 → main) | Live — do not merge yet |
| AstraPhone | main **v0.1.26 (28)** | Secondary smoke only |
| Dirty `server/routes.ts` | local / unrelated | **Quarantined — out of DoD** |

## Definition of Done — Sprint 0 Track A

- [ ] Autonomy Phase 1 Design pass (or ticket list) recorded in handoffs/
- [ ] Autonomy Phase 1 QA acceptance recorded; release-ready call made (`SPRINT0_TRACK_A_GATE.md` → READY)
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
