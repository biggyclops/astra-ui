# Astra Roadmap

| Field | Value |
|---|---|
| **Version** | 1.0.3 |
| **Status** | Active — Sprint 0 Track A (GitHub merged; live closeout open) |
| **Owner** | Astra EM |
| **Maintained by** | Documentation Manager |
| **Last Reviewed** | 2026-09-17 |
| **Approved By** | Jason (Sprint 0 Track A via CoS) |

**See also:** [project_status.yaml](./project_status.yaml) · [PRODUCT.md](./PRODUCT.md) (vision + priority ranking, v1.0.4) · [product/STORIES.md](./product/STORIES.md) · [product/DECISIONS.md](./product/DECISIONS.md) · [ASTRA_MASTER.md](./ASTRA_MASTER.md) · [docs/qa/SPRINT0_TRACK_A_GATE.md](./qa/SPRINT0_TRACK_A_GATE.md) · [releases/](./releases/) · [astra-os/tickets/ASTRA-DOC-001.md](./astra-os/tickets/ASTRA-DOC-001.md)

Product owns *what/why*. This file remains EM-owned sequencing. If they conflict, stop and reconcile — do not silently expand scope.

**Docs sync (ASTRA-DOC-001):** GitHub facts only. Live QA / Design D-003 close / CTO clear / deploy remain owner gates.

## Purpose

Narrate phases and milestones so humans and agents share one view of where Astra is going. Machine-readable in-flight detail lives in `project_status.yaml`.

## Sprint 0 — Track A (current)

**Goal:** Autonomy honesty first — prove the Autonomy UI Phase 1 read-only surface is design-true and QA-gated before any further chrome or auto behavior.

**Laws this sprint**
- Design System is law: desktop = Core mark + ASTRA wordmark; do **not** clone Phone chrome onto desktop.
- No Autonomy auto.
- No deferred infra P0.
- Dirty unrelated `server/routes.ts` is **quarantined** — not in DoD, not in merge scope.
- Programmer opens PRs only. **GitHub merge of #1–#7 happened 2026-09-17.** Merge ≠ live QA ≠ deploy ([GATES.md](./astra-os/GATES.md)).

### Now
1. **Live closeout on `main` @ `0207e05`** — QA re-pass Preview/Local + snapshot on named Mini-Beast tip; Design close D-003 on merged SHA; CTO architecture clear. (Owner actions — not Docs.)
2. **Canon honesty** — ROADMAP + `project_status.yaml` match GitHub (this Docs sync). Mini-Beast docs checkout still to sync after tip lands.
3. **Phase 2 posture** — `feature/phase2-shell` is Mini-Beast-only; related remote `feature/astra-cinematic-shell` @ `6f7307b`. Status **pending_restart_qa** until Astra Systems reports restart facts; then EM sets **restart_qa** or **parked**.
4. **Phone (secondary)** — AstraPhone **v0.1.26 (28)** smoke only (wake path); full HUD/Settings consistency is Next unless Design finishes early.

### Done on GitHub (2026-09-17)
1. **ASTRA-S1** — Phase 1 read-only `GET /api/autonomy/snapshot` (PR #2 @ lineage `699badd`, commit `8e0a8a2`).
2. **Q-001** — apiRouter mount path (PR #3 @ `63a970d`, commit `1135510`).
3. **ASTRA-S2 / D-003** — disable stubs + Preview/Local (PR #4 @ `844d60c`, commit `5720088`).
4. **Institutional canon + Product 1.0.4 + Astra OS** — PRs #1, #5, #6, #7 → `main` @ `0207e05`.

### Next
1. Phase 2 cinematic shell visual QA **only if** Jason/Systems greenlight restart; otherwise remain parked in status.
2. Close Design drift tickets from Autonomy honesty (and Phone smoke if filed) — **Design owner**.
3. Shared Drive UI — Product 🔴 REJECT (park indefinitely; ASTRA-R4).
4. Optional: Phone HUD/Settings full consistency pass vs Design System.
5. Open drafts #8 / #9 (S12) — Product/Eng; **not** Track A live closeout. Retarget base to `main` (owner).

### Later
1. Autonomy beyond read-only (requires Product + CTO; still no auto without explicit approval).
2. Branded wake-chime asset + Phone chrome polish.
3. HTTPS / Keychain for Phone.
4. On-device wake model / false-wake reduction.
5. Hermes / Downloads reliability (not Sprint 0 P0).

## Known tracks (reference)

| Track | Branch / note | Sprint 0 role |
|---|---|---|
| Autonomy honesty stack | **`main` @ `0207e05`** (PRs #2←#3←#4 merged) | **Primary — live closeout** |
| Feature line (merged) | `feature/autonomy-ui` @ `63a970d` | Historical tip after #3+#4 |
| Cinematic shell (remote) | `feature/astra-cinematic-shell` @ `6f7307b` | Capacity after Autonomy live closeout |
| Phase 2 local | `feature/phase2-shell` (Mini-Beast only) | pending restart facts |
| Docs canon | **`main`** (PR #1 merged `docs/canon-v1` @ `3a71cf5`) | Landed — do not treat PR #1 as open |
| Astra OS | on `main` (PRs #6 / #7) | Done |
| AstraPhone | main **v0.1.26 (28)** | Secondary smoke only |
| Dirty `server/routes.ts` | local / unrelated | **Quarantined — out of DoD** |

## Definition of Done — Sprint 0 Track A

- [x] Autonomy Phase 1 + Q-001 + D-003 **merged to GitHub `main`** (PRs #2 / #3 / #4)
- [ ] Autonomy Phase 1 Design close on **merged** tip recorded (Design owner)
- [ ] Autonomy Phase 1 QA acceptance on **live** tip `0207e05` recorded (`SPRINT0_TRACK_A_GATE.md` → live READY) (QA owner)
- [x] `routes.ts` quarantine respected in Track A PRs
- [ ] Phase 2 status is explicit: `pending_restart_qa`, `restart_qa`, or `parked`
- [x] ROADMAP + `project_status.yaml` match GitHub merge reality (ASTRA-DOC-001)
- [ ] Phone: smoke note only (or explicit skip)
- [ ] Mini-Beast serves named tip (deploy / Systems — not Docs)

## Milestone log

- [2026-09-17 — Sprint 0 Track A GitHub merge](./releases/2026-09-17-sprint0-track-a-github-merge.md)

## Change control

- Roadmap substance is EM-owned.
- Docs Manager keeps sync + cross-links; does not invent priorities.
- Bump **Version** when phase structure or accepted milestones change.
- Identity redesign requires Jason’s explicit approval (see Design System).
