# ASTRA-OS-002 — Add Chief of Staff role to Astra OS

| Field | Value |
|---|---|
| **State** | Done — merged |
| **Owner** | Documentation Manager |
| **Approved** | Product Owner — ASTRA-PD-004 (2026-09-17) |
| **Base (historical)** | `docs/canon-v1` (includes ASTRA-OS-001) |
| **Branch** | `cursor/astra-os-002-cos-role-95bb` |
| **PR** | [#7](https://github.com/biggyclops/astra-ui/pull/7) merged 2026-09-17 (`190cf73`) → canon → `main` via [#1](https://github.com/biggyclops/astra-ui/pull/1) |
| **Commit** | `f1ed6abdd6a8d85524b5ab2ad3603b9fbe1d6193` |

## Goal

Create an official Chief of Staff AI role so project coordination, ticket routing, dependency tracking, and cross-role workflow have a named owner in Astra OS.

Product already hands work to Chief of Staff (ASTRA-PD-002). The OS has no packet for that role.

## Approved shape

- Add [`../roles/COS.md`](../roles/COS.md) using the same packet sections as existing roles (Mission, May, Must not, Required reads, Required writes, Output contract)
- Update [`../ROLES.md`](../ROLES.md): add Chief of Staff; replace “No new roles” with “roles are only those listed in this table”
- Update [`../BOOT.md`](../BOOT.md): include `COS.md` in the named-role list
- Update [`../../ASTRA_MASTER.md`](../../ASTRA_MASTER.md) role map with a CoS row and OS packet link
- Documentation only

## CoS authority (must appear in the packet)

**May**
- Coordinate after a Product (or other owner) first handoff
- Route a ticket to exactly one next responsible role
- Track dependencies, blockers, and which ticket is in flight
- Point roles at the named ticket, ROADMAP, and `project_status.yaml`

**Must not**
- Own product vision, scope, or identity
- Replace EM release recommendation, Design verdicts, QA gates, or CTO architecture
- Implement code, redesign UI, or change architecture
- Expand Product scope or unpark parked stories
- Merge or deploy
- Assign multiple departments in one handoff

## Out of scope

- Product code, UI, APIs, or architecture
- Workflow / gate redesign (`WORKFLOW.md`, `GATES.md`) beyond naming the CoS role if a role list already exists there
- Unparking ASTRA-S3
- Merge or deploy
- Agent orchestration software

## Verify

- [x] `docs/astra-os/roles/COS.md` exists and matches the packet shape
- [x] `ROLES.md` and `BOOT.md` name Chief of Staff / `COS.md`
- [x] Master role map includes CoS without dropping existing rows
- [x] No product/UI/API/architecture files in this ticket
- [x] CoS May/Must not match ASTRA-PD-004
- [x] Merged to GitHub (`main` tip includes CoS packet)
