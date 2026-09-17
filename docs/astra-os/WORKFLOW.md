# Astra OS — Workflow

| Field | Value |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Active |
| **Owner** | Engineering Manager |
| **Last Reviewed** | 2026-09-17 |

**See also:** [TICKETS.md](./TICKETS.md) · [GATES.md](./GATES.md) · [CONSTITUTION.md](./CONSTITUTION.md)

## Path

```text
ticket
  → owner proposal (if asked)
  → Jason / EM approval
  → implement on a named branch
  → push only when instructed
  → stacked PR only when instructed
  → Design + QA
  → CTO if architecture
  → Jason merge approval
  → deploy (separate gate — never assumed)
```

## Rules

- Chat names **role + ticket**. The OS supplies limits.
- Programmer implements approved scope only.
- Docs-only work does not modify product code, UI, APIs, or architecture.
- Stack PRs on the named base. Do not retarget `main` unless instructed.
- Do not merge. Do not deploy.
- After a session, file a handoff in [`../handoffs/`](../handoffs/) when Eng work landed.

## Stack example (Sprint 0 Track A)

```text
main
  ← feature/autonomy-ui          (#2)
    ← fix/q-001-autonomy-snapshot (#3)
      ← D-003 honesty tip         (#4)
```

Docs canon is a **separate** line (`docs/canon-v1` / docs PRs). Do not mix Autonomy honesty commits into the docs OS line unless Jason/EM say so.
