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
| **Updated** | 2026-09-16 (Design APPROVE WITH TICKETS · build green · D-003 honesty) |

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
| **D-001** | Gate blocker for READY | Signed-in Autonomy visual QA + screenshot archive still required |
| **D-002** | Soft | `AstraPhoneOrb` naming/comments vs rejected Phone-align — Design soft risk |
| **D-003** | Honesty caveat | Pause/Resume/Mode/Command/Approve are **client-local stubs** (no mutating APIs). **Do not fail Phase 1 as mutating.** Design wants label/disable/remove before honesty claim; **Jason decides** whether D-003 ships as-is |

Design status: **APPROVE WITH TICKETS** (chrome/DNA hard gates PASS). **Not** a clean unconditional Design sign-off.

---

## 1. Acceptance criteria

### A. Autonomy Phase 1 — read-only surface (primary)

| # | Criterion | Status | Evidence |
|---|---|---|---|
| A1 | `/autonomy` loads on live desktop | **Partial** | Chronos→Mini-Beast `:5173/autonomy` HTTP **200** (Vite HTML). Unauth SPA shows **login plate** (headless 1280×800 archive). Auth session not completed. |
| A2 | Hero orb + read-only snapshot surface | **Blocked** | Needs signed-in session (D-001). Code: `useAutonomySnapshot` + footer `/autonomy · read-only snapshot`. Unauth `GET /api/autonomy/snapshot` → **401** `authenticated:false` (expected). |
| A3 | No Autonomy auto **behavior** (mutating) | **Pass (API)** / honesty note | Server: GET-only. Client pause/resume/mode/command/approve = **local state** (D-003). Do **not** fail as mutating. |
| A4 | Route bindings intact | **Pass (code + Vite)** | `Route path: "/autonomy"`; live Vite serves Autonomy module HTTP 200. |
| A5 | Sidebar brand → `/autonomy` | **Pass (Design)** | Design chrome PASS; QA signed-in click archive still D-001. |
| A6 | Oracle default-collapsed on `/autonomy` | **Pass (Design + code)** | `useState(!isAutonomy)` / `oracleCollapsed = isAutonomy && !oracleOpen`. |
| A7 | Design System DNA; no Phone-align | **Pass (Design)** | Core+wordmark; no Phone-align clone. Soft D-002 naming. |
| A8 | Build / typecheck green for SHA | **Pass** | On `8e0a8a2` clean checkout: `npm run check` (**tsc**) exit 0; `npm run build` exit 0; `npx tsx scripts/verify-autonomy-snapshot.ts` → `verify-autonomy-snapshot: ok` (Hades soft-offline in verify env expected). No repo `lint` script; CI check runs still **0**. |

### B. Phone smoke (optional this track)

| # | Status |
|---|---|
| B1–B3 | **Deferred** — not run this session |

### C. Phase 2 cinematic shell

| # | Status |
|---|---|
| C* | **N/A for PR #2 merge** — live Vite happens to be `phase2-shell` @ `db93051`; Phase 2 not required for Autonomy P1 DoD. `:5000` prod bounce still Jason-held / stale vs dist per Systems. |

---

## 4. Definition of Done

| Requirement | Status |
|---|---|
| Live desktop pass (signed-in) for section A | **Open (D-001)** |
| Build / typecheck green on Autonomy P1 SHA | **Done** (`8e0a8a2`) |
| Handoff SHAs + quarantine noted | **Partial** — SHA + live Vite tip recorded; full signed-in handoff pending |
| Design sign-off | **APPROVE WITH TICKETS** (not unconditional) |
| Jason call on D-003 ship-as-is | **Pending** |
| Explicit QA verdict | Below |

**Hard rules still in force:** No Eng merge without QA READY + Design + Jason D-003 call. No merge recommendation without signed-in live pass + build evidence + handoff SHAs.

---

## Sign-off

| Item | Value |
|---|---|
| Autonomy P1 SHA | `8e0a8a2c2ca9a581d9f7793b251a350024de88cb` |
| PR | https://github.com/biggyclops/astra-ui/pull/2 |
| Live desktop host / ports | Mini-Beast `100.81.216.117:5173` (Vite up); `:5000` separate/stale until Jason bounce |
| Build/typecheck/verify | **PASS** on `8e0a8a2` (2026-09-16 ~10:31 ET) |
| Quarantine (`server/routes.ts`) | Confirmed out of DoD |
| Autonomy mutating APIs | None in Phase 1 (GET snapshot only) |
| D-003 false affordances | Honesty caveat — not a mutating fail; Jason ship-as-is call pending |
| Design | APPROVE WITH TICKETS |
| Phone (lasarus) smoke | Deferred |
| Phase 2 in sprint for this PR? | No |
| **QA verdict** | **NOT READY** — D-001 signed-in live pass still required |
| Signed by | Astra QA |
| Date | 2026-09-16 |
