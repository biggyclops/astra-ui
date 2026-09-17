# ASTRA-OS-001 — Astra Operating System

| Field | Value |
|---|---|
| **State** | In progress |
| **Owner** | Documentation Manager / Programmer |
| **Approved** | Jason — 2026-09-17 (proposal + refinements, then implement) |
| **Branch** | `cursor/astra-os-001-726d` |
| **Base** | `docs/canon-v1` |

## Goal

Build the Astra Operating System: a documentation layer so every AI role works from the repository instead of a long prompt.

## Approved shape

- Path: `docs/astra-os/` (not `docs/os/`)
- `BOOT.md` is the single AI entry point
- Root `AGENTS.md` is a minimal pointer to `docs/astra-os/BOOT.md`
- Add `GLOSSARY.md` and `DECISION_LOG.md`
- Extension of existing canon — do not replace Master or Documentation Architecture
- Documentation only: no product code, UI, APIs, or architecture changes

## Out of scope

- Filling `PRODUCT.md` substance
- Merging PRs #1–#4
- Deploy
- Public `astra-docs` repo
- Agent orchestration

## Verify

- [ ] `docs/astra-os/` matches the approved tree
- [ ] `AGENTS.md` points only at `BOOT.md`
- [ ] Master and Documentation Architecture link here without dropping existing rows
- [ ] No product/UI/API files in this ticket
