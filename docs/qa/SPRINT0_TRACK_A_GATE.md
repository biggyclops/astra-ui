# Sprint 0 Track A — QA release gate

| Field | Value |
|---|---|
| **Track** | A (Jason-approved) |
| **Primary scope** | Autonomy UI Phase 1 — **read-only** Autonomy surface only |
| **PRs** | [#2](https://github.com/biggyclops/astra-ui/pull/2) Phase 1 @ `8e0a8a2` · [#3](https://github.com/biggyclops/astra-ui/pull/3) Q-001 fix @ `1135510` |
| **Live** | Mini-Beast `:5173` after `astra-ui.service` bounce (apiRouter registration) |
| **Owner (gate)** | Astra QA |
| **Merge gate** | QA technical READY below · Design **APPROVE WITH TICKETS** · Jason **D-003** call still open |
| **Updated** | 2026-09-16 (Q-001 re-pass PASS) |

**See also:** [ROADMAP.md](../ROADMAP.md) · [project_status.yaml](../project_status.yaml) · [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

---

## Quarantine

- Unrelated dirty `server/routes.ts` — out of DoD (#3 only touches Phase 1 registration).
- Autonomy mutating APIs — out of scope (GET snapshot only).
- Phone full Design System pass — deferred (smoke only).

---

## Drift tickets

| ID | Severity | Note |
|---|---|---|
| **D-001** | Residual | Live DOM + snapshot API archived via Chronos AppleScript; PNG screen-capture still tooling-blocked |
| **D-002** | Soft | `AstraPhoneOrb` naming — Design soft risk |
| **D-003** | Honesty / merge policy | Local stubs visible; **not mutating**. Jason ship-as-is call **still pending** |
| **Q-001** | **Cleared** | After Eng fix + service bounce: signed-in snapshot **200**; unauth **401** |

Design: **APPROVE WITH TICKETS** (chrome PASS).

---

## 1. Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| A1 | `/autonomy` loads signed-in | **Pass** | Chronos Chrome `http://100.81.216.117:5173/autonomy` · operator **comeau** · no login plate (2026-09-16 ~11:02 ET) |
| A2 | Hero orb + read-only snapshot | **Pass** | Footer read-only snapshot · UI **not** “NO SNAPSHOT” · signed-in `GET /api/autonomy/snapshot` → **200** JSON (`orbState: offline`, `hadesReachable: false`, `hadesError: fetch failed` — **noted, not a Q-001 fail**) |
| A3 | No mutating Autonomy auto | **Pass** + D-003 honesty | GET-only; stubs visible |
| A4 | Routes intact | **Pass** | Live Autonomy page |
| A5 | Brand → `/autonomy` | **Pass** | `MYTHIC INTELLIGENCE` → `/autonomy` |
| A6 | Oracle collapsed | **Pass** | `astra-live-shell-oracle-collapsed` · `aria-expanded=false` |
| A7 | Design DNA / no Phone-align | **Pass** | Live + Design |
| A8 | Build/typecheck | **Pass** | `8e0a8a2` tsc/build/verify ok; #3 is small registration fix on top |

Phone B* deferred · Phase 2 N/A for this merge set.

---

## Sign-off

| Item | Value |
|---|---|
| Phase 1 SHA | `8e0a8a2` (#2) |
| Q-001 fix SHA | `1135510` (#3) |
| Unauth snapshot | **401** |
| Signed-in snapshot | **200** |
| Hades `:5050` | Offline / unreachable — **noted**, separate from Q-001 |
| Design | APPROVE WITH TICKETS |
| D-003 Jason call | **Pending** |
| **QA verdict** | **READY (technical)** for Autonomy P1 live chrome + snapshot on #2+#3 — **merge still waits on Jason D-003 ship-as-is call** (and Design tickets acknowledged) |
| Signed by | Astra QA |
| Date | 2026-09-16 |
