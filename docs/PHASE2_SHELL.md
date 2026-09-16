# Phase 2 — Cinematic shell refinement

**Branch:** `feature/phase2-shell` (from `feature/autonomy-ui` @ Phase 1 `8e0a8a2`)  
**Scope:** Frontend shell atmosphere only. No backend, auth, deploy, push, or service restart.

## Docs gap (resolved 2026-09-16)
Restored under `docs/` by Astra Design (UI/UX Director):
- `DESIGN_SYSTEM.md` — Design Bible / visual identity SoT (Jason Visual Identity Policy)
- `ASTRA_MASTER.md` — master index
- `frontend-architecture.md` — desktop frontend map + chrome rules
- `project_status.yaml` — lightweight stub (EM owns formal roadmap)

Phase 2 work originally proceeded from the orchestration brief + live preferred shell (core mark + ASTRA wordmark + Mythic Intelligence). Phone→web chrome force-align remains **rejected** and was not re-applied.

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
1. ~~Restore master docs~~ **Done 2026-09-16** — see `DESIGN_SYSTEM.md`, `ASTRA_MASTER.md`, `frontend-architecture.md`, `project_status.yaml`.
2. Visual QA on `:5173` / `:5000` after an explicit restart approval.
3. Optional client-only streaming caret wiring (`data-streaming`) if Chat reveal path should drive the CSS caret.
4. Commit oracle-collapse + brand→autonomy chrome as their own small commits once Jason wants them on the branch (today they may still be local-only).
5. Do not merge Phone-align chrome; do not merge to `main` without review.
