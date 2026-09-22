# Sprint 0 Track A — QA release gate

| Field | Value |
|---|---|
| **Track** | A (Jason-approved) |
| **Primary scope** | Autonomy UI Phase 1 — read-only / truthful preview surface |
| **Served SHA** | `archive/phase2-shell-dirty` @ `994bb6a` |
| **Live surface** | Mini-Beast `http://100.81.216.117:5000` (`:5173` down; no bounce requested) |
| **Owner** | Astra QA |
| **Updated** | 2026-09-21 8:55 PM ET |

## Re-pass scope (small checks only)

| Check | Result | Evidence |
|---|---|---|
| Signed-in `/autonomy` honesty | **PASS** | Operator `comeau`; read-only footer; “COMMAND PREVIEW / Read-only Phase 1”; Resume unavailable; send unavailable; capability/mode buttons disabled or explicitly `PREVIEW ONLY` |
| Signed-in snapshot | **PASS** | `GET /api/autonomy/snapshot` → **200** JSON |
| Unauthenticated snapshot | **PASS** | `GET /api/autonomy/snapshot` → **401** `Authentication required` |
| Brand link | **PASS** | `MYTHIC INTELLIGENCE` → `/autonomy` |
| Oracle | **PASS** | Shell class `astra-live-shell-oracle-collapsed`; toggle `aria-expanded=false` |

## Notes

- Hades remains unreachable (`hadesReachable: false`, `orbState: offline`, `fetch failed`). This is separate from the Track A honesty/snapshot gate and does not fail this re-pass.
- PR #18 action execution is explicitly out of scope for this re-pass.
- Residual D-001 PNG archive remains a tooling limitation; live DOM evidence was captured from signed-in Chronos Chrome.

## Sign-off

| Item | Value |
|---|---|
| Served SHA | `994bb6a` |
| Signed-in page | PASS |
| Snapshot 200/401 contract | PASS |
| D-003 honesty | PASS |
| Brand + Oracle regressions | PASS |
| **QA verdict** | **READY** on the currently served `:5000` SHA |
| Signed by | Astra QA |
| Date | 2026-09-21 |
