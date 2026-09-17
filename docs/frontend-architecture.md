# Frontend architecture — Astra UI

**Status:** Restored (2026-09-16); honesty pass 2026-09-17 (ASTRA-DOC-001)  
**Pairs with:** [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) (visual law) · runtime Eng docs when present

## Stack
- React + Vite client under `client/`
- Express API under `server/` (also hosts Vite middleware on `:5000` in single-process mode)
- Shared types/routes under `shared/`
- Styles: Tailwind + global CSS
- **Cinematic atmosphere CSS:** `client/src/styles/cinematic-shell.css` is cited by Phase 2 / cinematic-shell work. **It is not present on GitHub `main` @ `0207e05`.** Do not treat it as shipped on `main`. Related remote: `feature/astra-cinematic-shell` @ `6f7307b`.

## Shell model (preferred desktop chrome)
- Multi-panel cinematic workspace (Phase 2 / shell branches — not required for Track A Autonomy honesty on `main`)
- Brand / chrome: **Core mark + ASTRA wordmark**
- Brand link target: `/autonomy` (current preferred behavior)
- Oracle / right rail: collapsible; default-collapsed on Autonomy
- Conversation stage: glass bubbles, calm composer, optional empty-orb breathe
- **Do not** reintroduce AstraPhone navigation/chrome force-align

## Key surfaces
| Route / area | Notes |
|---|---|
| `/autonomy` | Hero orb + Phase 1 read-only snapshot (**on `main`**) |
| Chat | Focal conversation stage |
| Settings / Nodes / Jobs / Media / Files / Transmission | Operator panels — share glass + cyan DNA |
| Login | Space / cinematic plate; session cookie auth |

## Design constraints for Eng
1. Read `DESIGN_SYSTEM.md` before UI chrome or token changes.
2. Atmosphere-only CSS is fine; identity changes need Product approval.
3. Respect `prefers-reduced-motion`.
4. Keep Phone and desktop platforms independent in nav/layout while sharing DNA.
5. When Architecture freezes BFF / auth / status contracts, design reviews new screens before merge.

## Related Phase notes
- Phase 2 shell: `docs/PHASE2_SHELL.md` (`feature/phase2-shell` Mini-Beast-only; remote `feature/astra-cinematic-shell`)
- Visual QA requires Jason’s explicit restart approval on `:5173` / `:5000`
- Runtime setup doc `ARCHITECTURE_SETUP.md` is **missing on `main`** — Eng/Systems owner
