# Astra OS — Tickets

| Field | Value |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Active |
| **Owner** | Engineering Manager / Docs |
| **Last Reviewed** | 2026-09-17 |

**See also:** [WORKFLOW.md](./WORKFLOW.md) · [tickets/](./tickets/)

## ID scheme

| Prefix | Meaning | Where it lives |
|---|---|---|
| `ASTRA-OS-NNN` | Operating-system / process tickets | [`tickets/`](./tickets/) |
| `D-NNN` | Design tickets | Design backlog / [`../project_status.yaml`](../project_status.yaml) |
| `Q-NNN` | QA defects | [`../qa/`](../qa/) |
| Eng feature IDs | Implementation on branches / PRs | GitHub — no second tracker |

Do not invent a parallel ticket system for Eng features.

## File a process ticket

1. Copy the heading pattern from [`tickets/ASTRA-OS-001.md`](./tickets/ASTRA-OS-001.md).
2. Name: `docs/astra-os/tickets/ASTRA-OS-NNN.md`.
3. State: Proposed / Approved / In progress / Done / Hold.
4. Link from the next Docs sync of Master or status YAML only when EM/Docs ask.

## Current OS tickets

| ID | Title | State |
|---|---|---|
| [ASTRA-OS-001](./tickets/ASTRA-OS-001.md) | Astra Operating System (agent docs layer) | Implemented — merged PR #6 |
| [ASTRA-OS-002](./tickets/ASTRA-OS-002.md) | Add Chief of Staff role to Astra OS | Approved — ASTRA-PD-004 |
