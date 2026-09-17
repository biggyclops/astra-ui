# ASTRA-DOC-001 — Sync canon to post–Sprint 0 GitHub state

| Field | Value |
|---|---|
| **State** | In progress — local commit; not pushed |
| **Owner** | Documentation Manager |
| **Approved** | Named in chat after CoS post-merge audit |
| **Base** | `main` @ `0207e05` |
| **Branch** | `cursor/astra-doc-001-canon-sync-95bb` |
| **Source of truth for drift** | Chief of Staff audit (2026-09-17) |

## Goal

Synchronize Astra canon with GitHub after Sprint 0 merges (PRs #1–#7). Stop the OS from describing a false HOLD world.

## Done in this ticket (Docs-owned facts only)

- [x] `project_status.yaml` → 1.2.0: merged PRs, tip `0207e05`, live/Design/CTO conditions left open for owners
- [x] `ROADMAP.md` → 1.0.3: Now/Done/tracks/DoD match GitHub
- [x] `ASTRA_MASTER.md`: branch honesty + broken Eng-local link honesty
- [x] `qa/SPRINT0_TRACK_A_GATE.md`: merge facts; no invented live READY for `0207e05`
- [x] `ASTRA-OS-001` / `ASTRA-OS-002` → Done — merged; verify boxes checked
- [x] `TICKETS.md` + Decision Log sync rows
- [x] Release note for GitHub merge milestone
- [x] `frontend-architecture.md` / Documentation Architecture: missing-file honesty

## Left unchanged (owner action required)

| Item | Owner | Why Docs did not edit |
|---|---|---|
| Live READY on Mini-Beast for `0207e05` | QA | No bounce evidence |
| Design D-003 close on merged SHA | Design | No Design verdict on tip recorded |
| CTO architecture clear / ADR | CTO | No clear recorded |
| EM release recommendation READY | EM | Gates still open |
| Product decision text (PD-001 status lines, PD-005/S12) | Product | Do not modify Product decisions |
| Architecture / ADRs | CTO | Out of scope |
| Open PR #8 / #9 base retarget to `main` | Product / Eng | Not Docs merge authority |
| Mini-Beast deploy/bounce | Jason / Systems | Deploy gate |

## Out of scope

- Product code, UI, APIs, architecture
- Inventing READY / APPROVED / clear
- Push, PR, merge, deploy (unless later instructed)

## Verify

- [x] No product/UI/API/architecture files in this ticket
- [x] Status YAML does not invent owner verdicts
- [x] OS-001 / OS-002 no longer say awaiting merge / Approved-only
- [ ] Push / PR when EM instructs
