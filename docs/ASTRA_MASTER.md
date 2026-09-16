# ASTRA_MASTER

**Status:** Canonical index (2026-09-16)  
**Owner:** Documentation Manager  
**Purpose:** Single entry point for Astra product/system docs.  
**Canon home:** `docs/` in `astra-ui` ([DOCUMENTATION_ARCHITECTURE.md](./DOCUMENTATION_ARCHITECTURE.md))

## What Astra is

Astra is a multi-surface AI operating environment:

- **Astra UI (desktop)** — control-plane web app on Mini-Beast (ports `:5000` / `:5173`)
- **AstraPhone** — iOS companion client against the live Astra API
- Shared fleet nodes (Mini-Beast, Hades, Hermes, Talos, Atlas, …) behind that API

## Visual identity (non-negotiable)

Canonical design source: **[`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)**

Summary:

- One Design System across platforms
- Desktop chrome = Core mark + ASTRA wordmark (do **not** clone Phone nav/chrome)
- Phone adapts the same system for touch
- Shared DNA: orb, Core logo, cyan, space atmosphere, motion, type, components, shape grammar, glass
- No identity redesign without Jason’s explicit approval

## Documentation architecture

Authoritative rules: **[`DOCUMENTATION_ARCHITECTURE.md`](./DOCUMENTATION_ARCHITECTURE.md)**

- Canon = `astra-ui/docs`
- Other repos **reference**, do not duplicate
- Dedicated `astra-docs` repo deferred

## Doc map (canon)

| Doc | Owner focus | Path |
|---|---|---|
| Documentation Architecture | Docs Manager | [`DOCUMENTATION_ARCHITECTURE.md`](./DOCUMENTATION_ARCHITECTURE.md) |
| Design System (Bible) | UI/UX Director | [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) |
| Motion System | UI/UX Director | [`MOTION_SYSTEM.md`](./MOTION_SYSTEM.md) |
| Product | Product | [`PRODUCT.md`](./PRODUCT.md) |
| Architecture (platform) | CTO | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| Frontend architecture | UI + Eng | [`frontend-architecture.md`](./frontend-architecture.md) |
| Roadmap | EM | [`ROADMAP.md`](./ROADMAP.md) |
| Component Library | Design + Eng | [`COMPONENT_LIBRARY.md`](./COMPONENT_LIBRARY.md) |
| Project status | EM (+ Design backlog) | [`project_status.yaml`](./project_status.yaml) |
| ADRs | CTO + Docs | [`adr/`](./adr/) |
| Handoffs | Eng + Docs | [`handoffs/`](./handoffs/) |
| Templates | Docs | [`templates/`](./templates/) |
| Release notes | Docs + EM | [`releases/`](./releases/) |

## Doc map (Eng-local references)

| Doc | Owner focus | Path |
|---|---|---|
| Phase 2 cinematic shell | UI | [`PHASE2_SHELL.md`](./PHASE2_SHELL.md) |
| Runtime / network setup | Systems / Eng | [`ARCHITECTURE_SETUP.md`](./ARCHITECTURE_SETUP.md) |
| Chat pipeline | Eng | [`CHAT_PIPELINE.md`](./CHAT_PIPELINE.md) |
| Hermes mount | Systems | [`HERMES_MOUNT.md`](./HERMES_MOUNT.md) |
| Agent coding guardrails | Eng | [`../AGENTS.md`](../AGENTS.md) |

## Role map

| Role | Bot / human | Docs duty |
|---|---|---|
| Documentation Manager | Astra Docs | Structure, sync, Master, handoffs, ADRs index, release notes |
| Product | Steve Jobs / Jason | Product vision; identity approval |
| UI/UX Director | Astra Design | Design System + Motion substance |
| CTO | Astra CTO | Architecture impacts; ADR acceptance |
| Engineering Manager | Astra EM | Roadmap milestones; status YAML |
| QA | Astra QA | Release readiness notes |
| Programmer | Programmer | Eng-local accuracy; handoffs after sessions |

## Current UI branches (honesty — Sprint 0 Track A)

**On GitHub (`biggyclops/astra-ui`):**

- `docs/canon-v1` @ `3c9dc6a` — institutional docs (this canon line)
- `feature/autonomy-ui` @ `52c96eb` — Phone-style Autonomy UI lock (**local Mini-Beast tip `8e0a8a2` is ahead 1 and not pushed**: Phase 1 read-only `/api/autonomy/snapshot`)
- `feature/astra-cinematic-shell` @ `6f7307b` — cinematic shell on remote

**Mini-Beast only (not on GitHub):**

- `feature/phase2-shell` — local cinematic polish + Design Bible restore commits; **do not treat as a remote branch**. Related remote line is `feature/astra-cinematic-shell`. No push/restart without approval.

Docs and status must name GitHub branches when claiming “published,” and label Mini-Beast-only tips explicitly.

## Working agreements

- Design reviews UI for consistency before further voice/chrome ships when EM flags it
- Architecture (BFF / auth / status ontology) changes that touch clients get a design pass before UI forks
- Secrets never in docs or commits (`AGENTS.md`)
- Other Astra repositories link here; they do not fork the bible

## Restore / history notes

- Design Bible restored 2026-09-16 so Eng stops guessing visual law (`PHASE2_SHELL` docs gap).
- Documentation Architecture approved 2026-09-16: canon = `astra-ui/docs`.
