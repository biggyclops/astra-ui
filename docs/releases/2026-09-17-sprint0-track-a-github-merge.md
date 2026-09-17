# Release note: 2026-09-17 — Sprint 0 Track A GitHub merge

**Docs tag / commit:** ASTRA-DOC-001 (sync on tip after this note lands)  
**Eng commits / branches:** `main` @ `0207e05`  
**Surfaces:** Docs canon · Autonomy `/autonomy` · Astra OS  

## Summary

Jason merged PRs **#1–#7** on 2026-09-17. GitHub `main` now holds institutional docs (including Astra OS + Product canon 1.0.4) and the Autonomy honesty stack (Phase 1 snapshot, Q-001 path fix, D-003 Preview/Local).

**Merge is not live QA and not deploy.** Mini-Beast bounce to `0207e05` is not claimed here.

## Changes

| PR | What landed |
|---|---|
| #4 | D-003 — disable stub controls; Preview/Local |
| #3 | Q-001 — `/api/autonomy/snapshot` on apiRouter |
| #2 | Phase 1 read-only Autonomy snapshot |
| #6 | ASTRA-OS-001 agent operating layer |
| #7 | ASTRA-OS-002 Chief of Staff role |
| #5 | Product canon 1.0.4 |
| #1 | Institutional canon → `main` |

## Known gaps

- QA live READY on `main@0207e05` — **QA owner**
- Design D-003 close on merged SHA — **Design owner**
- CTO architecture clear — **CTO owner**
- EM release recommendation — waits on the three live-closeout conditions
- Open drafts #8 / #9 still base `docs/canon-v1` (behind `main`) — **Product/Eng owner**

## References

- [ASTRA_MASTER.md](../ASTRA_MASTER.md)
- [project_status.yaml](../project_status.yaml) v1.2.0
- [qa/SPRINT0_TRACK_A_GATE.md](../qa/SPRINT0_TRACK_A_GATE.md)
- [handoffs/2026-09-16-d003-autonomy-honesty.md](../handoffs/2026-09-16-d003-autonomy-honesty.md)
- [astra-os/tickets/ASTRA-DOC-001.md](../astra-os/tickets/ASTRA-DOC-001.md)
