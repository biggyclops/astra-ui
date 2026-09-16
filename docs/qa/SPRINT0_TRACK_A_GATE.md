# Sprint 0 Track A — QA release gate

| Field | Value |
|---|---|
| **Track** | A (Jason-approved) |
| **Primary scope** | Autonomy UI Phase 1 — **read-only** Autonomy surface only |
| **Branch** | `feature/autonomy-ui` (Phase 1 snapshot @ `8e0a8a2` unless EM names a newer SHA) |
| **Owner (gate)** | Astra QA |
| **Merge gate** | **No Eng merge** without QA sign-off **and** Design sign-off |
| **Collaborators** | EM · CoS · Design · Programmer |
| **Evidence rule** | Live desktop pass required — screenshots alone = **not ready** |
| **EM notes** | No Autonomy auto · Phone = smoke only · dirty `server/routes.ts` **quarantined out of DoD** |
| **Created** | 2026-09-16 |
| **Updated** | 2026-09-16 (EM Track A ask) |

**See also:** [ROADMAP.md](../ROADMAP.md) · [project_status.yaml](../project_status.yaml) · [PHASE2_SHELL.md](../PHASE2_SHELL.md) · [frontend-architecture.md](../frontend-architecture.md) · [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

---

## Quarantine (explicitly out of DoD)

- Dirty / uncommitted `server/routes.ts` — **do not** include in acceptance, build gate, or merge recommendation.
- Autonomy **auto** behaviors — **out of scope** for Track A; Phase 1 is read-only surface only.
- Full Phone Design System consistency pass — deferred (smoke only this track).

---

## 1. Acceptance criteria (must pass)

### A. Autonomy Phase 1 — read-only surface (primary — in sprint)

| # | Criterion | Pass evidence |
|---|---|---|
| A1 | `/autonomy` loads on live desktop (`:5173` or `:5000` after approved restart) | Live URL + timestamp |
| A2 | Hero orb renders; Phase 1 snapshot is **read-only** (no write/mutate path in scope) | Live observation |
| A3 | No Autonomy **auto** behavior in this track (read-only surface only) | Live observation |
| A4 | `registerAutonomyRoutes` / Phase 1 route bindings intact | Live nav + route check |
| A5 | Sidebar brand → `/autonomy` | Live click |
| A6 | Oracle / right rail default-collapsed on `/autonomy` | Live observation |
| A7 | Design System DNA only — no identity redesign; Phone chrome **not** force-aligned onto desktop | Live spot-check vs Design System |
| A8 | Build / lint / typecheck green for touched packages (**excluding** quarantined dirty `server/routes.ts`) | CI or local command log + SHA |

### B. Phone smoke (this track only — device SoT; not a full pass)

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
2. **Build / lint / typecheck** green for the Autonomy P1 SHA under test (quarantined dirty `server/routes.ts` excluded from DoD).
3. **Handoff SHAs** recorded: branch name, commit SHA(s), what was restarted, known gaps, deferred items, quarantine confirmation.
4. Design System spot-check passed; Phone-align chrome verified absent on desktop.
5. **Design** has signed off (merge gate is QA **and** Design).
6. Phone section B either smoke-passed on lasarus **or** explicitly deferred with reason.
7. Phase 2 section C either passed, marked N/A (out of sprint), or failed with blockers listed.
8. QA posts an explicit verdict: **READY** or **NOT READY** — no silent merge recommendation.

**Hard rules:**
- No Eng merge without QA sign-off **and** Design sign-off.
- No merge recommendation without live pass + build/lint/typecheck + handoff SHAs.
- Dirty `server/routes.ts` stays quarantined — never required for Track A DoD.

---

## Sign-off (fill after live evidence)

| Item | Value |
|---|---|
| Autonomy P1 SHA | _pending_ |
| Live desktop host / ports | _pending_ |
| Build/lint/typecheck | _pending_ |
| Quarantine (`server/routes.ts`) | Confirmed out of DoD |
| Autonomy auto | Out of scope |
| Phone (lasarus) smoke | _pending / deferred_ |
| Phase 2 in sprint? | _EM go/no-go_ |
| Design sign-off | _pending_ |
| **QA verdict** | **NOT READY** — awaiting live evidence |
| Signed by | Astra QA |
| Date | 2026-09-16 |
