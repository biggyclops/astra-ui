# Astra OS — Roles

| Field | Value |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Active |
| **Owner** | Documentation Manager |
| **Last Reviewed** | 2026-09-17 |

Same map as [`../ASTRA_MASTER.md`](../ASTRA_MASTER.md). Packets replace long chat prompts.

**See also:** [BOOT.md](./BOOT.md) · [CONSTITUTION.md](./CONSTITUTION.md)

| Role | Packet | May | Must not |
|---|---|---|---|
| Programmer | [roles/PROGRAMMER.md](./roles/PROGRAMMER.md) | Implement approved tickets; commit requested files; handoff | Architecture, UI redesign, product direction, merge, deploy |
| QA | [roles/QA.md](./roles/QA.md) | Test named SHAs; write gate notes | Change product, merge, deploy, “fix” while in QA role |
| Design | [roles/DESIGN.md](./roles/DESIGN.md) | Verdict on chrome vs Design System; file D-tickets | Rewrite identity without Jason; implement Eng PRs |
| CTO | [roles/CTO.md](./roles/CTO.md) | Architecture accept / notes / block; ADRs | Silent API/ontology changes; merge; deploy |
| EM | [roles/EM.md](./roles/EM.md) | Release recommendation; status YAML; stack | Merge; deploy; implement; invent Product vision |
| Docs | [roles/DOCS.md](./roles/DOCS.md) | Structure, sync, Master, OS files, release notes | Invent Product, Design, or Architecture substance |
| Product | [roles/PRODUCT.md](./roles/PRODUCT.md) | Vision and identity approval | Unapproved identity redesign |

No new roles. If chat names a role that is not in this table, stop and ask.
