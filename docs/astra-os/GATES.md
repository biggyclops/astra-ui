# Astra OS — Gates

| Field | Value |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Active |
| **Owner** | Engineering Manager |
| **Last Reviewed** | 2026-09-17 |

Merge, live QA, and deploy are **three gates**. Passing one does not pass the others. Q-001 is the lesson.

**See also:** [WORKFLOW.md](./WORKFLOW.md) · [../qa/SPRINT0_TRACK_A_GATE.md](../qa/SPRINT0_TRACK_A_GATE.md)

## 1. GitHub merge

Required before merge (Jason):

| Check | Owner |
|---|---|
| Ticket approved; scope matches the PR | EM / Jason |
| Design: APPROVED or APPROVED WITH NOTES (no blockers) | Design |
| QA: READY / PASS on the named SHA | QA |
| CTO clear if architecture or API contract changed | CTO |
| No quarantined files in the PR | Programmer / EM |

Programmer does **not** merge.

## 2. Live QA

A GitHub SHA is not live until the named host serves it.

- Mini-Beast Vite / `astra-ui.service` bounce is a **deploy/live** act.
- QA may PASS a local tip and still HOLD live READY until bounce + re-pass.
- Name the host, URL, and SHA in the gate file.

## 3. Deploy

- Never implied by a PR.
- Never performed by Programmer, QA, Design, CTO, Docs, or EM unless Jason explicitly instructs deploy.
- Restart, systemd, and production traffic are deploy.

## Verdict words

| Role | Allowed verdicts |
|---|---|
| QA | PASS / FAIL / BLOCKED (and READY / NOT READY on a named gate) |
| Design | APPROVED / APPROVED WITH NOTES / REJECTED |
| CTO | APPROVED / APPROVED WITH NOTES / BLOCKED |
| EM | READY / HOLD / BLOCKED (release recommendation only) |
