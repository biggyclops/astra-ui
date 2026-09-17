# Astra OS

| Field | Value |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Active — ASTRA-OS-001 |
| **Owner** | Documentation Manager |
| **Approved By** | Jason (proposal + refinements, 2026-09-17) |
| **Last Reviewed** | 2026-09-17 |

**See also:** [BOOT.md](./BOOT.md) · [CONSTITUTION.md](./CONSTITUTION.md) · [../ASTRA_MASTER.md](../ASTRA_MASTER.md) · [../DOCUMENTATION_ARCHITECTURE.md](../DOCUMENTATION_ARCHITECTURE.md)

## What this is

Astra OS is the **agent operating layer** for `astra-ui`. It lets every AI role work from the repository instead of a long chat prompt.

It is an **extension** of the existing documentation system. It does **not** replace:

- `docs/ASTRA_MASTER.md` (product/system front door)
- `docs/DOCUMENTATION_ARCHITECTURE.md` (canon rules)
- Design System, Product, Architecture, Roadmap, or status YAML

## Who starts where

| Reader | Start here |
|---|---|
| Human / product / system | [`../ASTRA_MASTER.md`](../ASTRA_MASTER.md) |
| Every AI agent | [`BOOT.md`](./BOOT.md) (via root `AGENTS.md`) |

## Map

| File | Purpose |
|---|---|
| [BOOT.md](./BOOT.md) | Single entry point for every AI agent |
| [CONSTITUTION.md](./CONSTITUTION.md) | Standing non-negotiables |
| [ROLES.md](./ROLES.md) | Role index |
| [roles/](./roles/) | Per-role packets (replace long prompts) |
| [WORKFLOW.md](./WORKFLOW.md) | Ticket → approval → implement → PR → gate |
| [TICKETS.md](./TICKETS.md) | ID scheme |
| [GATES.md](./GATES.md) | Merge, live QA, and deploy as separate gates |
| [GLOSSARY.md](./GLOSSARY.md) | Shared vocabulary |
| [DECISION_LOG.md](./DECISION_LOG.md) | Product and org decisions (not architecture ADRs) |

## Non-goals

- New repository (`astra-docs` remains deferred)
- Product, UI, API, or architecture changes
- Agent orchestration software
- Rewriting owner-owned canon
