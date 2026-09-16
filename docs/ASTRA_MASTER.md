# ASTRA_MASTER

**Status:** Restored index (2026-09-16)  
**Purpose:** Single entry point for Astra product/system docs on the Mini-Beast `astra-ui` tree.

## What Astra is
Astra is a multi-surface AI operating environment:

- **Astra UI (desktop)** — control-plane web app on Mini-Beast (ports `:5000` / `:5173`)
- **AstraPhone** — iOS companion client against the live Astra API
- Shared fleet nodes (Mini-Beast, Hades, Hermes, Talos, Atlas, …) behind that API

## Visual identity (non-negotiable)
Canonical design source: **[`docs/DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)**

Summary:
- One Design System across platforms
- Desktop chrome = Core mark + ASTRA wordmark (do **not** clone Phone nav/chrome)
- Phone adapts the same system for touch
- Shared DNA: orb, Core logo, cyan, space atmosphere, motion, type, components, shape grammar, glass
- No identity redesign without Jason’s explicit approval

## Doc map
| Doc | Owner focus | Path |
|---|---|---|
| Design System (Bible) | UI/UX Director | `docs/DESIGN_SYSTEM.md` |
| Frontend architecture | UI + Eng | `docs/frontend-architecture.md` |
| Project status stub | EM (formal roadmap TBD) | `docs/project_status.yaml` |
| Phase 2 cinematic shell | UI | `docs/PHASE2_SHELL.md` |
| Runtime / network setup | Systems / Eng | `docs/ARCHITECTURE_SETUP.md` |
| Chat pipeline | Eng | `docs/CHAT_PIPELINE.md` |
| Agent coding guardrails | Eng | `AGENTS.md` |

## Current UI branches (Mini-Beast `astra-ui`)
- `feature/phase2-shell` @ `c42e794` — cinematic atmosphere CSS (no push/restart without approval)
- `feature/autonomy-ui` @ `8e0a8a2` — Autonomy Phase 1 snapshot + hero orb

## Working agreements
- Design reviews UI for consistency before further voice/chrome ships when EM flags it
- Architecture (BFF / auth / status ontology) changes that touch clients get a design pass before UI forks
- Secrets never in docs or commits (`AGENTS.md`)

## Restore note
This file was missing when Phase 2 started (`docs/PHASE2_SHELL.md` “Docs gap”). Restored by Astra Design so Eng stops guessing visual law.
