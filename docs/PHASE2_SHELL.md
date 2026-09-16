# Phase 2 — Cinematic shell refinement

**Branch:** `feature/phase2-shell` (from `feature/autonomy-ui` @ Phase 1 `8e0a8a2`)  
**Scope:** Frontend shell atmosphere only. No backend, auth, deploy, push, or service restart.

## Docs gap
These briefed sources were **not found** on Mini-Beast/Chronos at Phase 2 start:
- `ASTRA_MASTER.md`
- `project_status.yaml`
- Astra Design Bible
- `frontend-architecture.md`

Work proceeded from the Phase 2 orchestration brief + live preferred shell (core mark + ASTRA wordmark + Mythic Intelligence). Phone→web chrome force-align remains **rejected** and was not re-applied.

## What shipped
- Additive CSS layer: `client/src/styles/cinematic-shell.css`
  - Calmer stage atmosphere and banner hover
  - Sidebar / nav hover rhythm (brand link to `/autonomy` unchanged)
  - Oracle panel soft hover (collapse-on-Autonomy behavior unchanged)
  - Conversation focal polish: bubble glass, spacing, composer focus, empty-orb breathe
  - `prefers-reduced-motion` respect
- Entry: `import "./styles/cinematic-shell.css"` added to `App.tsx` (surgical commit on top of committed App baseline)

## Hard constraints preserved (working tree)
- Phase 1 Autonomy snapshot bindings / `registerAutonomyRoutes`
- Sidebar brand → `/autonomy`
- Oracle rail default-collapsed on `/autonomy`
- Dirty local `server/routes.ts` **not** wholesale committed

## Phase 3 recommendations
1. Restore master docs (ASTRA_MASTER, Design Bible, project_status, frontend-architecture) under `docs/` and reconcile with preferred chrome.
2. Visual QA on `:5173` / `:5000` after an explicit restart approval.
3. Optional client-only streaming caret wiring (`data-streaming`) if Chat reveal path should drive the CSS caret.
4. Commit oracle-collapse + brand→autonomy chrome as their own small commits once Jason wants them on the branch (today they may still be local-only).
5. Do not merge Phone-align chrome; do not merge to `main` without review.
