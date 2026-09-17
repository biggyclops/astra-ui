# Astra OS — Decision log

| Field | Value |
|---|---|
| **Version** | 1.1.0 |
| **Status** | Active |
| **Owner** | Product / EM / Docs |
| **Last Reviewed** | 2026-09-17 |

Product and organizational decisions. **Architecture decisions stay in [`../adr/`](../adr/).**

Newest first. Record date, decider, and a one-line consequence.

**See also:** [CONSTITUTION.md](./CONSTITUTION.md) · [../ROADMAP.md](../ROADMAP.md) · [../product/DECISIONS.md](../product/DECISIONS.md)

| Date | ID | Decision | Decider | Consequence |
|---|---|---|---|---|
| 2026-09-17 | Merge | PRs **#1–#7** merged to GitHub. `main` @ `0207e05` holds canon + Autonomy honesty stack. Merge ≠ live QA ≠ deploy. | Jason | Status/ROADMAP/gate must not say HOLD for GitHub merge. Live closeout remains open. |
| 2026-09-17 | ASTRA-DOC-001 | Docs syncs GitHub facts only; does not invent QA/Design/CTO/live READY. | Docs (CoS audit) | Canon honesty restored for agents. |
| 2026-09-17 | ASTRA-OS-002 | Add Chief of Staff OS role packet (`COS.md`). CoS coordinates; does not replace Product/EM/Design/QA/CTO. | Product (ASTRA-PD-004) | PR #7 merged. |
| 2026-09-17 | ASTRA-OS-001 | Add `docs/astra-os/` as the agent operating layer. Extension of existing canon, not a replacement. `BOOT.md` is the single AI entry. `AGENTS.md` is a thin pointer. Include Glossary and this log. | Jason | Agents boot from the repo. Role prompts move into `roles/`. PR #6 merged. |
| 2026-09-17 | ASTRA-PD-004 | Approve ASTRA-OS-002 CoS role ticket. | Product | Docs implements CoS packet. |
| 2026-09-17 | ASTRA-PD-003 | ASTRA-S3 stays parked after OS-001. OS-001 ≠ live Autonomy honesty. | Product | Do not unpark S3 from docs/OS work. |
| 2026-09-17 | ASTRA-PD-002 | Product hands Track A to **one** next role: Chief of Staff. Product does not sequence Design/QA/CTO/EM. | Product | One-handoff rule. |
| 2026-09-17 | ASTRA-PD-001 | Track A product scope = ASTRA-S1 + ASTRA-S2. Ship-as-is with stubs rejected. | Product | Honesty before atmosphere. |
| 2026-09-16 | D-003 | False affordances must be **fixed**, not shipped as-is. Approved variant: **disable + Preview / Local** (not removal). | Jason | Pause / Resume / Command / Approve / mode chips stay visible, disabled, labeled. No mutating Autonomy APIs. PR #4 merged. |
| 2026-09-16 | Gate | Release waits on QA READY, D-003 resolved, and CTO clear. Programmer never merges or deploys. | Jason / EM | Merge, live QA, and Mini-Beast deploy are separate gates. |
| 2026-09-16 | Track A | Sprint 0 Track A = Autonomy honesty first. No Autonomy auto. Dirty `server/routes.ts` quarantined. | Jason | Honesty tip required with snapshot. |
| 2026-09-16 | Identity | One Design System. Desktop = Core mark + ASTRA wordmark. Do not clone Phone nav/chrome onto desktop. | Jason | Design System is law. No identity redesign without explicit approval. |
| 2026-09-16 | Canon | Institutional docs live in `astra-ui/docs`. Dedicated `astra-docs` repo deferred. Other repos reference, do not duplicate. | Jason | [`../DOCUMENTATION_ARCHITECTURE.md`](../DOCUMENTATION_ARCHITECTURE.md) is v1. Master is the product/system front door. |
