// server/actionExecution.ts
// AUTO-003A Minimal Action Execution Foundation
// In-memory only. All actions lost on restart. No real side effects.

export type ActionState =
  | "proposed"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "expired";

export type ActionType =
  | "validate_execution_framework"
  | "force_refresh_node_status";

export type AuditEvent = {
  timestamp: string;
  from: ActionState;
  to: ActionState;
  actor: string;
  note?: string;
};

export type Action = {
  actionId: string;
  actionType: ActionType;
  requester: string;
  approver?: string;
  target?: string;
  parameters: Record<string, unknown>;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
  state: ActionState;
  result?: unknown;
  error?: string;
  auditEvents: AuditEvent[];
};

const store = new Map<string, Action>();

const SUPPORTED_TYPES: ActionType[] = [
  "validate_execution_framework",
  "force_refresh_node_status",
];

function nowIso(): string {
  return new Date().toISOString();
}

function createAuditEvent(
  from: ActionState,
  to: ActionState,
  actor: string,
  note?: string
): AuditEvent {
  return { timestamp: nowIso(), from, to, actor, note };
}

function recordTransition(
  action: Action,
  to: ActionState,
  actor: string,
  note?: string
): void {
  const event = createAuditEvent(action.state, to, actor, note);
  action.auditEvents.push(event);
  action.state = to;
  action.updatedAt = event.timestamp;
}

export function createAction(
  actionType: string,
  requester: string,
  parameters: Record<string, unknown> = {},
  correlationId?: string
): { action: Action | null; error?: string } {
  if (!SUPPORTED_TYPES.includes(actionType as ActionType)) {
    return { action: null, error: `Unsupported action type: ${actionType}` };
  }

  const actionId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const corrId = correlationId || `corr_${Date.now()}`;
  const created = nowIso();

  const action: Action = {
    actionId,
    actionType: actionType as ActionType,
    requester,
    parameters,
    correlationId: corrId,
    createdAt: created,
    updatedAt: created,
    state: "proposed",
    auditEvents: [],
  };

  recordTransition(action, "awaiting_approval", requester, "Action proposed");
  store.set(actionId, action);
  return { action };
}

export function getAction(actionId: string): Action | null {
  return store.get(actionId) || null;
}

export function approveAction(
  actionId: string,
  approver: string
): { action: Action | null; error?: string } {
  const action = store.get(actionId);
  if (!action) return { action: null, error: "Action not found" };
  if (action.state !== "awaiting_approval") {
    return { action: null, error: `Invalid transition from ${action.state}` };
  }
  action.approver = approver;
  recordTransition(action, "approved", approver, "Approved for execution");
  return { action };
}

export function rejectAction(
  actionId: string,
  approver: string,
  reason?: string
): { action: Action | null; error?: string } {
  const action = store.get(actionId);
  if (!action) return { action: null, error: "Action not found" };
  if (action.state !== "awaiting_approval") {
    return { action: null, error: `Invalid transition from ${action.state}` };
  }
  recordTransition(action, "rejected", approver, reason || "Rejected");
  return { action };
}

export function cancelAction(
  actionId: string,
  actor: string
): { action: Action | null; error?: string } {
  const action = store.get(actionId);
  if (!action) return { action: null, error: "Action not found" };
  if (!["proposed", "awaiting_approval", "approved"].includes(action.state)) {
    return { action: null, error: `Invalid transition from ${action.state}` };
  }
  recordTransition(action, "cancelled", actor, "Cancelled before execution");
  return { action };
}

export function listActions(): Action[] {
  return Array.from(store.values());
}

export function getAuditEvents(actionId: string): AuditEvent[] {
  const action = store.get(actionId);
  return action ? action.auditEvents : [];
}

// Real execution handler for force_refresh_node_status
// Reuses the existing status refresh mechanism (statusCacheTime reset + getOrRefreshStatus)
let refreshFn: (() => Promise<{ nodes: any[]; checkedAt: string }>) | null = null;

export function registerRefreshHandler(fn: () => Promise<{ nodes: any[]; checkedAt: string }>): void {
  refreshFn = fn;
}

export async function executeAction(actionId: string, actor: string): Promise<{ action: Action | null; error?: string }> {
  const action = store.get(actionId);
  if (!action) return { action: null, error: "Action not found" };
  if (action.state !== "approved") {
    return { action: null, error: `Invalid transition from ${action.state}` };
  }

  recordTransition(action, "running", actor, "Execution started");

  if (action.actionType === "force_refresh_node_status") {
    if (!refreshFn) {
      recordTransition(action, "failed", actor, "No refresh handler registered");
      action.error = "Refresh handler not available";
      return { action, error: "Refresh handler not registered" };
    }
    try {
      const result = await Promise.race([
        refreshFn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 8000)
        ),
      ]);
      recordTransition(action, "succeeded", actor, "Node status refreshed");
      action.result = { refreshedAt: result.checkedAt, nodeCount: result.nodes.length };
      return { action };
    } catch (e: any) {
      recordTransition(action, "failed", actor, e?.message || "Refresh failed");
      action.error = e?.message || "Refresh failed";
      return { action, error: action.error };
    }
  }

  recordTransition(action, "failed", actor, "Unsupported executable action");
  action.error = "Unsupported action type for execution";
  return { action, error: action.error };
}

// For testing only
export function _resetStore(): void {
  store.clear();
  refreshFn = null;
}
