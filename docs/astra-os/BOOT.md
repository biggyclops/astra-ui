# Astra OS — Boot

| Field | Value |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Active |
| **Owner** | Documentation Manager |
| **Last Reviewed** | 2026-09-17 |

This is the **single entry point for every AI agent**. Root `AGENTS.md` points here and nowhere else.

Chat should name only the **role** and the **ticket**. This file loads the rest.

## Boot order

Read in this order. Stop if a file is missing and report the gap. Do not invent replacements.

1. [CONSTITUTION.md](./CONSTITUTION.md)
2. [../ASTRA_MASTER.md](../ASTRA_MASTER.md)
3. [roles/](./roles/) — the file for your named role (`PROGRAMMER.md`, `QA.md`, `EM.md`, `DESIGN.md`, `CTO.md`, `DOCS.md`, `PRODUCT.md`)
4. [../project_status.yaml](../project_status.yaml)
5. [../ROADMAP.md](../ROADMAP.md)
6. Latest relevant file in [../handoffs/](../handoffs/)
7. Role-specific canon (see your role packet)
8. The ticket named in chat (see [TICKETS.md](./TICKETS.md))
9. [GLOSSARY.md](./GLOSSARY.md) when a term is unclear

## Then

- Work **only** the named ticket.
- Follow [WORKFLOW.md](./WORKFLOW.md) and [GATES.md](./GATES.md).
- Return the output contract from your role packet.
- Do not merge. Do not deploy.

## Humans

Product and system readers start at [../ASTRA_MASTER.md](../ASTRA_MASTER.md), not here.
