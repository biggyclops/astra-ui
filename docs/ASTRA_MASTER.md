# ASTRA_MASTER

**Status:** Canonical index (2026-09-17)  
**Owner:** Documentation Manager  
**Purpose:** Single entry point for Astra product/system docs.  
**Canon home:** `docs/` in `astra-ui` ([DOCUMENTATION_ARCHITECTURE.md](./DOCUMENTATION_ARCHITECTURE.md))

## What Astra is

Astra is a multi-surface AI operating environment. Product north star (approved): *the calm, honest operator environment for a private fleet — see what is real, act only when action is real.* See [`PRODUCT.md`](./PRODUCT.md).

Surfaces:

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
- Astra OS (`docs/astra-os/`) is an **extension** for AI roles — not a replacement for this file

## Astra OS (AI roles)

Agents do not start from a long chat prompt. They start here:

| Doc | Path |
|---|---|
| OS index | [`astra-os/README.md`](./astra-os/README.md) |
| **Agent entry (BOOT)** | [`astra-os/BOOT.md`](./astra-os/BOOT.md) |
| Constitution | [`astra-os/CONSTITUTION.md`](./astra-os/CONSTITUTION.md) |
| Roles | [`astra-os/ROLES.md`](./astra-os/ROLES.md) |
| Glossary | [`astra-os/GLOSSARY.md`](./astra-os/GLOSSARY.md) |
| Decision log (not ADRs) | [`astra-os/DECISION_LOG.md`](./astra-os/DECISION_LOG.md) |

Root [`../AGENTS.md`](../AGENTS.md) is a minimal bootstrap that points only at BOOT.

## Doc map (canon)

| Doc | Owner focus | Path |
|---|---|---|
| Documentation Architecture | Docs Manager | [`DOCUMENTATION_ARCHITECTURE.md`](./DOCUMENTATION_ARCHITECTURE.md) |
| Design System (Bible) | UI/UX Director | [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) |
| Motion System | UI/UX Director | [`MOTION_SYSTEM.md`](./MOTION_SYSTEM.md) |
| Product | Product | [`PRODUCT.md`](./PRODUCT.md) |
| Product reviews | Product | [`product/REVIEWS.md`](./product/REVIEWS.md) |
| Product stories | Product | [`product/STORIES.md`](./product/STORIES.md) |
| Product decisions | Product | [`product/DECISIONS.md`](./product/DECISIONS.md) |
| Architecture (platform) | CTO | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| Frontend architecture | UI + Eng | [`frontend-architecture.md`](./frontend-architecture.md) |
| Roadmap | EM | [`ROADMAP.md`](./ROADMAP.md) |
| Component Library | Design + Eng | [`COMPONENT_LIBRARY.md`](./COMPONENT_LIBRARY.md) |
| Project status | EM (+ Design backlog) | [`project_status.yaml`](./project_status.yaml) |
| ADRs | CTO + Docs | [`adr/`](./adr/) |
| Handoffs | Eng + Docs | [`handoffs/`](./handoffs/) |
| Templates | Docs | [`templates/`](./templates/) |
| Release notes | Docs + EM | [`releases/`](./releases/) |
| Astra OS (agent layer) | Docs + EM | [`astra-os/README.md`](./astra-os/README.md) |

## Doc map (Eng-local references)

| Doc | Owner focus | Path | On `main`? |
|---|---|---|---|
| Phase 2 cinematic shell | UI | [`PHASE2_SHELL.md`](./PHASE2_SHELL.md) | Yes |
| Hermes mount | Systems | [`HERMES_MOUNT.md`](./HERMES_MOUNT.md) | Yes |
| Agent bootstrap → Astra OS BOOT | Eng | [`../AGENTS.md`](../AGENTS.md) → [`astra-os/BOOT.md`](./astra-os/BOOT.md) | Yes |
| Runtime / network setup | Systems / Eng | `ARCHITECTURE_SETUP.md` | **Missing on `main`** — Eng/Systems to restore or drop |
| Chat pipeline | Eng | `CHAT_PIPELINE.md` | **Missing on `main`** — Eng to restore or drop |

Do not invent missing Eng-local files. Broken links are honesty debt (ASTRA-DOC-001).

## Role map

| Role | Bot / human | Docs duty | OS packet |
|---|---|---|---|
| Documentation Manager | Astra Docs | Structure, sync, Master, handoffs, ADRs index, release notes | [`astra-os/roles/DOCS.md`](./astra-os/roles/DOCS.md) |
| Product | Astra Product Owner / Jason | Product vision; feature reviews; stories; identity approval | [`astra-os/roles/PRODUCT.md`](./astra-os/roles/PRODUCT.md) |
| UI/UX Director | Astra Design | Design System + Motion substance | [`astra-os/roles/DESIGN.md`](./astra-os/roles/DESIGN.md) |
| CTO | Astra CTO | Architecture impacts; ADR acceptance | [`astra-os/roles/CTO.md`](./astra-os/roles/CTO.md) |
| Engineering Manager | Astra EM | Roadmap milestones; status YAML | [`astra-os/roles/EM.md`](./astra-os/roles/EM.md) |
| QA | Astra QA | Release readiness notes | [`astra-os/roles/QA.md`](./astra-os/roles/QA.md) |
| Programmer | Programmer | Eng-local accuracy; handoffs after sessions | [`astra-os/roles/PROGRAMMER.md`](./astra-os/roles/PROGRAMMER.md) |
| Chief of Staff | Astra CoS | Ticket routing, dependency/blocker tracking, one-next-role handoffs | [`astra-os/roles/COS.md`](./astra-os/roles/COS.md) |

## Current UI branches (honesty — Sprint 0 Track A)

**On GitHub (`biggyclops/astra-ui`) — post-merge 2026-09-17:**

- **`main` @ `0207e05`** — institutional canon (PR #1) + Autonomy honesty stack (PRs #2←#3←#4) + Product 1.0.4 + Astra OS (PRs #5–#7)
- `docs/canon-v1` @ `3a71cf5` — historical docs line (**merged into `main`** via PR #1; do not treat as the live tip)
- `feature/autonomy-ui` @ `63a970d` — merged tip after Q-001 + D-003 (also on `main`)
- `feature/astra-cinematic-shell` @ `6f7307b` — cinematic shell on remote (not on `main` tip)
- Open drafts **#8 / #9** still base `docs/canon-v1` (behind `main`) — Product/Eng owner to retarget

**Mini-Beast only (not on GitHub):**

- `feature/phase2-shell` — local cinematic polish + Design Bible restore commits; **do not treat as a remote branch**. Related remote line is `feature/astra-cinematic-shell`. No push/restart without approval.

Docs and status must name GitHub branches when claiming “published,” and label Mini-Beast-only tips explicitly. A merged SHA is **not** live until the named host serves it.

## Working agreements

- Design reviews UI for consistency before further voice/chrome ships when EM flags it
- Architecture (BFF / auth / status ontology) changes that touch clients get a design pass before UI forks
- Secrets never in docs or commits ([`astra-os/CONSTITUTION.md`](./astra-os/CONSTITUTION.md))
- Other Astra repositories link here; they do not fork the bible

## Restore / history notes

- Design Bible restored 2026-09-16 so Eng stops guessing visual law (`PHASE2_SHELL` docs gap).
- Documentation Architecture approved 2026-09-16: canon = `astra-ui/docs`.
- Astra OS (`docs/astra-os/`) added 2026-09-17 as an agent-layer **extension** (ASTRA-OS-001). Master remains the product/system front door.
- ASTRA-OS-002 (Chief of Staff role) merged PR #7 — 2026-09-17.
- ASTRA-DOC-001 (2026-09-17): Docs synced status/ROADMAP/gate/Master to GitHub merge reality after CoS audit. Live QA / Design D-003 close / CTO clear remain owner blockers.
