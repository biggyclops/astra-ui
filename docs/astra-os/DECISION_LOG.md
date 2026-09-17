# Astra OS — Decision log

| Field | Value |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Active |
| **Owner** | Product / EM / Docs |
| **Last Reviewed** | 2026-09-17 |

Product and organizational decisions. **Architecture decisions stay in [`../adr/`](../adr/).**

Newest first. Record date, decider, and a one-line consequence.

**See also:** [CONSTITUTION.md](./CONSTITUTION.md) · [../ROADMAP.md](../ROADMAP.md)

| Date | ID | Decision | Decider | Consequence |
|---|---|---|---|---|
| 2026-09-17 | ASTRA-OS-001 | Add `docs/astra-os/` as the agent operating layer. Extension of existing canon, not a replacement. `BOOT.md` is the single AI entry. `AGENTS.md` is a thin pointer. Include Glossary and this log. | Jason | Agents boot from the repo. Role prompts move into `roles/`. |
| 2026-09-16 | D-003 | False affordances must be **fixed**, not shipped as-is. Approved variant: **disable + Preview / Local** (not removal). | Jason | Pause / Resume / Command / Approve / mode chips stay visible, disabled, labeled. No mutating Autonomy APIs. |
| 2026-09-16 | Gate | Release waits on QA READY, D-003 resolved, and CTO clear. Programmer never merges or deploys. | Jason / EM | Merge, live QA, and Mini-Beast deploy are separate gates. |
| 2026-09-16 | Track A | Sprint 0 Track A = Autonomy honesty first. No Autonomy auto. Dirty `server/routes.ts` quarantined. | Jason | PRs #2 / #3 hold without the honesty tip. |
| 2026-09-16 | Identity | One Design System. Desktop = Core mark + ASTRA wordmark. Do not clone Phone nav/chrome onto desktop. | Jason | Design System is law. No identity redesign without explicit approval. |
| 2026-09-16 | Canon | Institutional docs live in `astra-ui/docs`. Dedicated `astra-docs` repo deferred. Other repos reference, do not duplicate. | Jason | [`../DOCUMENTATION_ARCHITECTURE.md`](../DOCUMENTATION_ARCHITECTURE.md) is v1. Master is the product/system front door. |
