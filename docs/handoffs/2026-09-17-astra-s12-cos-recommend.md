# Handoff: 2026-09-17 — ASTRA-S12 CoS recommendation engine v1

**Author:** Programmer  
**Branch / commit:** `cursor/astra-s12-cos-recommend-726d`  
**Surfaces touched:** local CLI only (no Astra UI, no Autonomy, no API)

## Goal

ASTRA-S12 / ASTRA-PD-005: first Chief of Staff recommendation engine. Read local Astra OS canon. Print one next ticket, one next role, rationale. If unknown, say unknown.

## Done

- `scripts/cos-recommend.ts` — local read-only recommender
- `package.json` — `npm run cos:recommend`
- Does not invoke roles, call models, merge, deploy, or talk to GitHub
- Track A files untouched
- ASTRA-S4 is forced parked (Phase 2 ID; never CoS orchestrator)

## Not done / blockers

- Not pushed (instructed to stop after local commit)
- Product STORIES on this base (`docs/canon-v1`) do not yet include the S12 row (PD-005 lives on `cursor/product-canon-v1-4e50`). Engine still runs from local canon.
- Next role may be `unknown` when `project_status.yaml` lists more than one blocker owner (honest; CoS must not multi-assign)

## How to verify

```bash
npm run cos:recommend
# or: npx tsx scripts/cos-recommend.ts
```

Expect `KIND: recommendation`, `NOT: approval`, `NOT: dispatch`, exactly one `NEXT_TICKET` and one `NEXT_ROLE` (either an OS role or `unknown`).

## Risks

- Treating output as a dispatch
- Mixing this branch into Autonomy PRs #2 / #3 / #4

## Doc updates needed

- [ ] Master / status — only if EM/Docs ask
- [ ] Design System / Motion — none
- [ ] Architecture / ADR — none
- [ ] Release note — after Jason gate

## Next actions

1. CoS: read the printed recommendation; do not treat it as approval.
2. Programmer: push / PR only when instructed. Do not merge. Do not deploy.
