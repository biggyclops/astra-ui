# Handoff: 2026-09-16 — D-003 Autonomy honesty (Preview / Local)

**Author:** Programmer (Cloud Agent)  
**Branch / commit:** `cursor/d003-autonomy-honesty-8633` @ `572008862e1b67a4235b0ccb52651923895abd2a`  
**Original local tip (unpublished):** `125c76de1cd081eeb3515863585259bfd5d7c48a`  
**Base:** `origin/fix/q-001-autonomy-snapshot` (`1135510`)  
**Surfaces touched:** Astra UI — `/autonomy` only  
**Ticket:** D-003 (false affordances — stub Pause/Resume/Command/Approve/mode chips)

## Goal

Resolve D-003 with the approved **disable + Preview/Local** variant. Keep Phase 1 read-only. Do not add mutating Autonomy APIs. Do not redesign chrome.

## Done

- Disabled Pause / Resume, command field + Send + chips, capability cards, Approve / Not Now, and mode chips.
- Labeled those controls **Preview / Local**.
- Orb / idle / working copy driven only by `GET /api/autonomy/snapshot` (removed local `operatorPaused` / interactive `mode` overrides).
- Ask First shown as Phase 1 display policy; Auto not selectable.
- TODOs left only where future backend integration is expected.
- Single file change: `client/src/pages/Autonomy.tsx`.
- `npm run check` and `npm run build` passed on the original local tip before first commit.
- Published on this branch for stacked PR against `fix/q-001-autonomy-snapshot`. No merge. No deploy.

## Not done / blockers

- Live Mini-Beast restart / serving this tip not requested.
- Do not merge PRs #2 / #3 / this tip until Jason final merge approval.
- Do not deploy.

## How to verify

```bash
git checkout cursor/d003-autonomy-honesty-8633
git show --stat 572008862e1b67a4235b0ccb52651923895abd2a
npm run check
npm run build
npm run dev   # then open /autonomy
```

Checks:

1. `/autonomy` loads.
2. Pause/Resume, command composer, chips, capability cards, Approve/Not Now, mode chips are disabled and labeled Preview / Local.
3. Clicking stubs does not change orb copy or invent live control.
4. Ask First is the displayed mode; Auto cannot be selected.
5. Footer still shows `/autonomy · read-only snapshot`.
6. `GET /api/autonomy/snapshot` remains the only Autonomy API used by the page.
7. Q-001 behavior preserved (public path `/api/autonomy/snapshot`; apiRouter mount helper unchanged).
8. `server/routes.ts` quarantine respected (no unrelated edits).

## Risks

- Design may still prefer removal over disable+label after visual QA.
- Soft D-002 (`AstraPhoneOrb` naming) unchanged on purpose.
- Empty advisor/history means Approve buttons may not appear until Hades returns suggestions — disabled styling still applies when they do.

## Doc updates needed

- [x] Eng handoff (this file)
- [ ] `project_status.yaml` / ROADMAP — mark D-003 resolved after Design+QA accept (Docs/EM)
- [ ] Sprint 0 Track A QA gate — re-pass note after live review
- [ ] Design System / Motion — none
- [ ] Architecture / ADR — none unless CTO files a contract issue
- [ ] Release note — after Jason release gate clears

## Next actions

1. QA: run checklist above on this commit (local or after explicit push/restart approval).
2. Design: confirm Preview / Local labeling closes D-003 (or file residual tickets).
3. EM: when Design+QA+CTO conditions met, return release recommendation for PRs #2/#3 + this tip.
4. Programmer: do not merge or deploy.
