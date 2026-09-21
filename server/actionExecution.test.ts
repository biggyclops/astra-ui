import {
  createAction,
  getAction,
  approveAction,
  rejectAction,
  cancelAction,
  getAuditEvents,
  executeAction,
  registerRefreshHandler,
  _resetStore,
} from "./actionExecution";

beforeEach(() => {
  _resetStore();
});

test("cannot execute before approval", async () => {
  const { action } = createAction("force_refresh_node_status", "req1");
  const res = await executeAction(action!.actionId, "app1");
  expect(res.error).toMatch(/Invalid transition/);
});

test("successful force_refresh_node_status execution", async () => {
  registerRefreshHandler(async () => ({ nodes: [{}, {}], checkedAt: "2026-01-01T00:00:00Z" }));
  const { action } = createAction("force_refresh_node_status", "req1");
  approveAction(action!.actionId, "app1");
  const res = await executeAction(action!.actionId, "app1");
  expect(res.action!.state).toBe("succeeded");
  expect(res.action!.result).toEqual({ refreshedAt: "2026-01-01T00:00:00Z", nodeCount: 2 });
});

test("failed refresh transitions to failed", async () => {
  registerRefreshHandler(async () => { throw new Error("boom"); });
  const { action } = createAction("force_refresh_node_status", "req1");
  approveAction(action!.actionId, "app1");
  const res = await executeAction(action!.actionId, "app1");
  expect(res.action!.state).toBe("failed");
  expect(res.action!.error).toMatch(/boom/);
});

test("duplicate approval rejected", () => {
  const { action } = createAction("force_refresh_node_status", "req1");
  approveAction(action!.actionId, "app1");
  const dup = approveAction(action!.actionId, "app2");
  expect(dup.error).toMatch(/Invalid transition/);
});

test("unsupported action rejected", () => {
  const res = createAction("unknown_action", "req1");
  expect(res.error).toMatch(/Unsupported/);
});

test("cancellation before execution", () => {
  const { action } = createAction("force_refresh_node_status", "req1");
  const c = cancelAction(action!.actionId, "op1");
  expect(c.action!.state).toBe("cancelled");
});

test("audit event ordering", () => {
  registerRefreshHandler(async () => ({ nodes: [], checkedAt: "t" }));
  const { action } = createAction("force_refresh_node_status", "req1");
  approveAction(action!.actionId, "app1");
  executeAction(action!.actionId, "app1");
  const events = getAuditEvents(action!.actionId);
  const states = events.map(e => e.to);
  expect(states).toContain("awaiting_approval");
  expect(states).toContain("approved");
  expect(states).toContain("running");
  expect(states).toContain("succeeded");
});

test("repeated safe execution", async () => {
  registerRefreshHandler(async () => ({ nodes: [{}], checkedAt: "t2" }));
  const { action } = createAction("force_refresh_node_status", "req1");
  approveAction(action!.actionId, "app1");
  await executeAction(action!.actionId, "app1");
  expect(getAction(action!.actionId)!.state).toBe("succeeded");
  // second action
  const { action: a2 } = createAction("force_refresh_node_status", "req2");
  approveAction(a2!.actionId, "app2");
  const r2 = await executeAction(a2!.actionId, "app2");
  expect(r2.action!.state).toBe("succeeded");
});
