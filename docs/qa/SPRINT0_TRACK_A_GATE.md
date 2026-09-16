# Sprint 0 Track A — QA release gate

| Field | Value |
|---|---|
| **Track** | A (Jason-approved) |
| **Primary scope** | Autonomy UI Phase 1 — **read-only** Autonomy surface only |
| **PR** | [astra-ui#2](https://github.com/biggyclops/astra-ui/pull/2) |
| **Branch / SHA** | `feature/autonomy-ui` @ `8e0a8a2` |
| **Live Vite (Systems)** | `feature/phase2-shell` @ `db93051` on Mini-Beast `:5173` (includes autonomy `8e0a8a2`) |
| **Owner (gate)** | Astra QA |
| **Merge gate** | **No Eng merge** without QA **READY** **and** Design sign-off **and** Jason call on D-003 |
| **Evidence rule** | Live desktop pass required — screenshots alone = **not ready** |
| **EM notes** | No Autonomy auto · Phone = smoke only · dirty `server/routes.ts` **quarantined out of DoD** |
| **Created** | 2026-09-16 |
| **Updated** | 2026-09-16 (signed-in live pass — A2 snapshot 404 blocker) |

**See also:** [ROADMAP.md](../ROADMAP.md) · [project_status.yaml](../project_status.yaml) · [PHASE2_SHELL.md](../PHASE2_SHELL.md) · [frontend-architecture.md](../frontend-architecture.md) · [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

---

## Quarantine (explicitly out of DoD)

- Dirty / uncommitted `server/routes.ts` unrelated mods — **out of DoD** (PR registration lines only).
- Autonomy **auto** execution / mutating APIs — **out of scope**; Phase 1 server registers **GET** `/api/autonomy/snapshot` only.
- Full Phone Design System consistency pass — deferred (smoke only this track).

---

## Drift tickets (track; do not invent remediation)

| ID | Severity | Note |
|---|---|---|
| **D-001** | Partially cleared / residual | Signed-in live DOM pass completed on Chronos Chrome; PNG screenshot archive still tooling-blocked (no screen recording). |
| **D-002** | Soft | `AstraPhoneOrb` naming/comments vs rejected Phone-align — Design soft risk |
| **D-003** | Honesty caveat | Pause/Resume/Mode/Command/Approve visible as local stubs. **Do not fail as mutating.** Jason ship-as-is call still pending. |
| **Q-001** | **Gate blocker (new)** | Signed-in `GET /api/autonomy/snapshot` on live `:5173` returns **404** `No route for GET /autonomy/snapshot` (path loses `/api`). Unauth same URL returns **401** (route present). UI shows **NO SNAPSHOT**. |

Design status: **APPROVE WITH TICKETS** (chrome/DNA hard gates PASS). **Not** a clean unconditional Design sign-off.

---

## 1. Acceptance criteria

### A. Autonomy Phase 1 — read-only surface (primary)

| # | Criterion | Status | Evidence |
|---|---|---|---|
| A1 | `/autonomy` loads on live desktop | **Pass** | Signed-in Chronos Chrome @ `http://100.81.216.117:5173/autonomy` (2026-09-16 ~10:51 ET). No login plate. Operator **comeau** ONLINE. |
| A2 | Hero orb + read-only snapshot surface | **Fail (Q-001)** | UI: idle orb chrome + footer `/AUTONOMY · READ-ONLY SNAPSHOT`, but **NO SNAPSHOT** / no live data. Signed-in fetch `/api/autonomy/snapshot` → **404** path `/autonomy/snapshot`. Unauth → **401**. |
| A3 | No Autonomy auto **behavior** (mutating) | **Pass (API)** / honesty note | GET-only intent. D-003 controls visible (Resume, OFF/SUGGEST/ASK/AUTO RUN APPROVED, Approve copy) — local stubs; not a mutating fail. |
| A4 | Route bindings intact | **Pass** | Live `/autonomy` page renders Autonomy module. |
| A5 | Sidebar brand → `/autonomy` | **Pass (live)** | Brand link `MYTHIC INTELLIGENCE` `href=/autonomy` with core mark + ASTRA wordmark images. |
| A6 | Oracle default-collapsed on `/autonomy` | **Pass (live)** | `astra-live-shell-oracle-collapsed`; Oracle button `aria-expanded=false` (“Expand system rail”). |
| A7 | Design System DNA; no Phone-align | **Pass (live + Design)** | Core mark + wordmark; desktop nav (not Phone chrome). Soft D-002. |
| A8 | Build / typecheck green for SHA | **Pass** | `8e0a8a2`: `tsc` 0, `build` 0, `verify-autonomy-snapshot` ok. CI check runs still 0. |

### B. Phone smoke (optional this track)

| # | Status |
|---|---|
| B1–B3 | **Deferred** |

### C. Phase 2 cinematic shell

| # | Status |
|---|---|
| C* | **N/A for PR #2 merge** |

---

## 4. Definition of Done

| Requirement | Status |
|---|---|
| Live desktop pass (signed-in) for section A | **Incomplete — A2/Q-001 fail** |
| Build / typecheck green on Autonomy P1 SHA | **Done** |
| Handoff SHAs + quarantine noted | **Updated** |
| Design sign-off | **APPROVE WITH TICKETS** |
| Jason call on D-003 ship-as-is | **Pending** (skipped earlier; still needed for merge) |
| Explicit QA verdict | Below |

---

## Sign-off

| Item | Value |
|---|---|
| Autonomy P1 SHA | `8e0a8a2c2ca9a581d9f7793b251a350024de88cb` |
| PR | https://github.com/biggyclops/astra-ui/pull/2 |
| Live desktop host / ports | Mini-Beast `100.81.216.117:5173` |
| Build/typecheck/verify | **PASS** on `8e0a8a2` |
| Signed-in live DOM | **PASS** (A1/A5/A6/A7) |
| Signed-in snapshot API | **FAIL Q-001** |
| Quarantine (`server/routes.ts`) | Out of DoD |
| D-003 | Honesty caveat — Jason call pending |
| Design | APPROVE WITH TICKETS |
| Phone smoke | Deferred |
| **QA verdict** | **NOT READY** — fix live signed-in `/api/autonomy/snapshot` routing (Q-001) before READY |
| Signed by | Astra QA |
| Date | 2026-09-16 |
