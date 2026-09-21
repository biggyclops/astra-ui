# AUTO-003B: Force Refresh Node Status

## Purpose
Operator-initiated forced refresh of node status across the Astra network. Allows operators to trigger a backend node status collection without waiting for scheduled polling.

## Action type
`force_refresh_node_status`

## Lifecycle
proposed → awaiting_approval → approved → running → (succeeded | failed)  
Alternative terminal states: rejected, cancelled

## Real backend behavior (getOrRefreshStatus)
- Calls the registered refresh handler (normally the live node status collector)
- Returns `{ refreshedAt: ISO8601, nodeCount: number }` on success
- Any exception from the handler transitions the action to `failed` with error message

## Approval requirement
Yes — action starts in `proposed`, moves to `awaiting_approval`. Only an approver can move it forward.

## Result fields
- On success: `result = { refreshedAt, nodeCount }`
- On failure: `error` string populated

## Audit behavior
Every state transition emits an audit event with `from`, `to`, `actor`, `at` timestamp. Full history available via `/api/actions/:id/audit`.

## In-memory storage limitation
Actions and audit events live only in server memory. Lost on process restart.

## Restart behavior
After server restart all prior actions disappear. New proposals start fresh. No persistence.

## Cancellation limitations
Can cancel only while in `proposed`, `awaiting_approval`, or `approved`. Cannot cancel once `running`.

## Safety boundaries
- Does NOT modify node configuration
- Does NOT restart services
- Does NOT affect running autonomy jobs
- Only triggers a read of current node telemetry

## Known limitations
- Duplicate-click protection is client-side only
- No pagination on action history
- No real-time websocket updates (polling only)
- Result summary is minimal (timestamp + count)