// server/actionExecution.test.ts
// AUTO-003A focused lifecycle tests

import {
  createAction,
  getAction,
  approveAction,
  rejectAction,
  cancelAction,
  getAuditEvents,
  _resetStore,
} from "./actionExecution";

beforeEach(() => {
  _resetStore();
});

test("createAction rejects unsupported type", () => {
  const res = createAction("unknown_type", "tester");
  expect(res.error).toMatch(/Unsupported/);
  expect(res.action).toBeNull();
});

test("full happy path: propose -> approve -> state approved", () => {
  const { action } = createAction("validate_execution_framework", "req1");
  expect(action!.state).toBe("awaiting_approval");

  const approved = approveAction(action!.actionId, "app1");
  expect(approved.action!.state).toBe("approved");
  expect(approved.action!.approver).toBe("app1");
});

test("reject records actor and reason", () => {
  const { action } = createAction("validate_execution_framework", "req1");
  const rejected = rejectAction(action!.actionId, "app2", "policy");
  expect(rejected.action!.state).toBe("rejected");
  const events = getAuditEvents(action!.actionId);
  expect(events.some(e => e.note === "policy")).toBe(true);
});

test("cancel only from allowed states", () => {
  const { action } = createAction("validate_execution_framework", "req1");
  const c1 = cancelAction(action!.actionId, "op1");
  expect(c1.action!.state).toBe("cancelled");

  const c2 = cancelAction(action!.actionId, "op2");
  expect(c2.error).toMatch(/Invalid transition/);
});

test("invalid transitions rejected", () => {
  const { action } = createAction("validate_execution_framework", "req1");
  approveAction(action!.actionId, "app1");
  const bad = rejectAction(action!.actionId, "app1");
  expect(bad.error).toMatch(/Invalid transition/);
});

test("audit trail records all transitions with timestamps and actors", () => {
  const { action } = createAction("validate_execution_framework", "req1");
  approveAction(action!.actionId, "app1");
  const events = getAuditEvents(action!.actionId);
  expect(events.length).toBeGreaterThan(1);
  expect(events[0].actor).toBe("req1");
  expect(events.every(e => e.timestamp && e.from && e.to)).toBe(true);
});

test("requester and approver recorded correctly", () => {
  const { action } = createAction("validate_execution_framework", "alice");
  approveAction(action!.actionId, "bob");
  const final = getAction(action!.actionId)!;
  expect(final.requester).toBe("alice");
  expect(final.approver).toBe("bob");
});
