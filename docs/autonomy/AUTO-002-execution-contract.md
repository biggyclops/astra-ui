# AUTO-002: Autonomy Execution Contract (Architecture)

**Status:** Approved architecture baseline — implementation deferred to AUTO-003+
**Date:** 2026-09-21
**Branch:** feat/auto-002-execution-contract
**Base commit:** 8f7509d7c941419b792569121b31939247e000d6

## 1. Action Identity

Every autonomous action carries:
- actionId: UUID
- requestedBy: user/session identity
- target: node/service identifier (e.g., "hades", "fleet-node-X")
- actionType: string enum (read-only, write, control, maintenance)
- parameters: JSON object (schema per actionType)
- createdAt: ISO timestamp
- expiresAt: ISO timestamp (default 15 min for approval-required actions)

## 2. Action States (State Machine)

proposed → awaiting_approval → (approved | rejected)
approved → queued → running → (succeeded | failed | cancelled)
any state → expired (on timeout)
running → cancelled (explicit request)

## 3. Approval Policy Matrix

| Action Category       | Approval Required | Examples                          |
|-----------------------|-------------------|-----------------------------------|
| Read-only queries     | None              | snapshot, status, fleet list      |
| Low-risk maintenance  | Explicit          | clear temp cache, restart dev svc |
| High-impact / write   | Explicit + dual   | deploy, delete data, scale prod   |
| Prohibited            | Never             | production data mutation, secrets |

## 4. Safety Controls

- Scope limits: actionType whitelist per identity
- Timeout: 5 min default for running actions
- Retry: max 2, exponential backoff
- Concurrency: 1 per target node
- Cancellation: best-effort; running actions must support cooperative cancel
- Idempotency: every actionId is unique; duplicate requests rejected
- Rollback: documented per actionType (or "none")
- Failure isolation: errors do not affect other queued actions

## 5. Audit Requirements

Every transition records:
- actor, actionId, fromState, toState, timestamp, reason (if any)
- full parameters snapshot
- target, outcome, error (if any), correlationId

Stored in immutable audit log (append-only table or file).

## 6. Proposed Future API Surface (not implemented)

POST   /api/autonomy/actions          → {actionId}
POST   /api/autonomy/actions/{id}/approve
POST   /api/autonomy/actions/{id}/reject
POST   /api/autonomy/actions/{id}/cancel
GET    /api/autonomy/actions/{id}
GET    /api/autonomy/actions?status=...
GET    /api/autonomy/audit?correlationId=...

All endpoints require authenticated session + policy check.

## 7. UI Contract (future)

When execution exists, Autonomy page may show:
- Pending approvals queue (with approve/reject)
- Running actions + progress + cancel button
- Audit history list
- Clearly disabled or hidden prohibited actions

No controls shown until backend supports them.

## 8. Explicit Exclusions (AUTO-002)

- No write endpoints implemented
- No execution engine
- No new database tables
- No UI buttons that imply execution
- No simulated activity

## 9. Recommended AUTO-003

**AUTO-003: First Safe Write Action — Refresh Fleet Snapshot Cache**

- Action: POST /api/autonomy/actions {type: "refresh_fleet_cache"}
- Target: fleet service (non-production impact)
- Risk: low (cache invalidation only)
- Rollback: none required (cache rebuilds automatically)
- Approval: explicit single approval
- Benefit: exercises full contract with reversible, observable effect
