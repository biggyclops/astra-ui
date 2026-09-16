# Sprint 0 Track A — QA release gate

| Field | Value |
|---|---|
| **Track** | A (Jason-approved) |
| **Primary scope** | Autonomy UI Phase 1 first |
| **Branch** | `feature/autonomy-ui` (Phase 1 snapshot @ `8e0a8a2` unless EM names a newer SHA) |
| **Owner (gate)** | Astra QA |
| **Collaborators** | EM · CoS · Design · Programmer |
| **Evidence rule** | Live desktop pass required — screenshots alone = **not ready** |
| **Created** | 2026-09-16 |

**See also:** [ROADMAP.md](../ROADMAP.md) · [PHASE2_SHELL.md](../PHASE2_SHELL.md) · [frontend-architecture.md](../frontend-architecture.md) · [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

---

## 1. Acceptance criteria (must pass)

### A. Autonomy Phase 1 (primary — in sprint)

| # | Criterion | Pass evidence |
|---|---|---|
| A1 | `/autonomy` loads on live desktop (`:5173` or `:5000` after approved restart) | Live URL + timestamp |
| A2 | Hero orb renders; Phase 1 snapshot is **read-only** (no write/mutate path in scope) | Live observation |
| A3 | `registerAutonomyRoutes` / Phase 1 route bindings intact | Live nav + route check |
| A4 | Sidebar brand → `/autonomy` | Live click |
| A5 | Oracle / right rail default-collapsed on `/autonomy` | Live observation |
| A6 | Design System DNA only — no identity redesign; Phone chrome **not** force-aligned onto desktop | Live spot-check vs Design System |
| A7 | Build / lint / typecheck green for touched packages | CI or local command log + SHA |

### B. Phone smoke (optional — only if time; device SoT)

| # | Criterion | Pass evidence |
|---|---|---|
| B1 | Launch + sign-in on **lasarus** (not Simulator for voice claims) | Device notes |
| B2 | Chat opens; Settings Speak/Wake controls visible | Device notes |
| B3 | Do **not** treat sim screenshots as wake/STT proof | N/A |

### C. Phase 2 cinematic shell (conditional — only if EM keeps `feature/phase2-shell` in-sprint after restart go/no-go)

| # | Criterion | Pass evidence |
|---|---|---|
| C1 | Atmosphere-only CSS; no backend/auth/deploy/service changes in the PR | Diff review |
| C2 | Preferred chrome intact (Core mark + ASTRA wordmark; brand → `/autonomy`; Oracle collapse on Autonomy) | Live |
| C3 | Chat stage polish + `prefers-reduced-motion` respected | Live |
| C4 | Phone→desktop chrome force-align **absent** (hard fail if present) | Live |
| C5 | Visual QA on live `:5173` / `:5000` after Jason restart approval | Live |

If Phase 2 is **out of sprint**, mark section C `N/A — deferred` and do not block Autonomy P1 on it.

---

## 4. Definition of Done (QA will sign)

QA signs **ready** only when **all** of the following are true:

1. **Live desktop pass** for section A (not screenshot gallery alone).
2. **Build / lint / typecheck** green for the Autonomy P1 SHA under test.
3. **Handoff SHAs** recorded: branch name, commit SHA(s), what was restarted, known gaps, deferred items.
4. Design System spot-check passed; Phone-align chrome verified absent on desktop.
5. Phone section B either passed on lasarus **or** explicitly deferred with reason.
6. Phase 2 section C either passed, marked N/A (out of sprint), or failed with blockers listed.
7. QA posts an explicit verdict: **READY** or **NOT READY** — no silent merge recommendation.

**Hard rule:** No merge recommendation without live pass + build/lint/typecheck + handoff SHAs.

---

## Sign-off (fill after live evidence)

| Item | Value |
|---|---|
| Autonomy P1 SHA | _pending_ |
| Live desktop host / ports | _pending_ |
| Build/lint/typecheck | _pending_ |
| Phone (lasarus) | _pending / deferred_ |
| Phase 2 in sprint? | _EM go/no-go_ |
| **QA verdict** | **NOT READY** — awaiting live evidence |
| Signed by | Astra QA |
| Date | 2026-09-16 |
