# Product stories (implementation-ready)

| Field | Value |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Approved for Engineering — Sprint 0 Track A + immediate honesty |
| **Owner** | Product |
| **Last Reviewed** | 2026-09-16 |

**See also:** [PRODUCT.md](../PRODUCT.md) · [REVIEWS.md](./REVIEWS.md) · [ROADMAP.md](../ROADMAP.md)

These stories are **what/why + acceptance**. They are not architecture, visual redesign, merge approval, or a release sign-off.

Programmer implements. Design reviews UI consistency. QA gates. EM sequences. CTO owns contracts. Product does not expand a story mid-flight.

---

## Now — Sprint 0 Track A

### ASTRA-S1 — Autonomy Phase 1 read-only snapshot

**Story:** As the operator, I can open `/autonomy` signed-in and see a live Autonomy snapshot so I know whether the fleet intent path is reachable.

**Priority:** P0  
**Review:** ASTRA-R1 🟡  
**Depends on:** PRs #2 / #3 (Q-001 path)  
**Not this story:** Auto, commands, deploy, chrome redesign

**Acceptance criteria**
1. Signed-in `GET /api/autonomy/snapshot` returns **200** JSON with the documented snapshot fields (at minimum orb/state and Hades reachability).
2. Unauthenticated request returns **401**.
3. `/autonomy` renders from that snapshot; if Hades is down, the UI shows offline/unreachable rather than a fake “working” state.
4. The page does not call any mutating Autonomy API.
5. Desktop chrome stays Core mark + ASTRA wordmark (no Phone nav clone).
6. Unrelated `server/routes.ts` edits stay quarantined.

**Done when:** QA can repeat the signed-in/unauth checks on the live or agreed environment. Product does not merge.

---

### ASTRA-S2 — D-003 false affordances removed from use

**Story:** As the operator, I never mistake Preview Autonomy controls for live fleet control.

**Priority:** P0  
**Review:** ASTRA-R2 🟢  
**Depends on:** ASTRA-S1  
**Implementation already proposed:** PR #4 (`disable + Preview/Local`)

**Acceptance criteria**
1. Pause/Resume, command field + Send + chips, capability cards, Approve/Not Now, and mode chips are **not operable**.
2. Those controls are labeled **Preview/Local** (or Design-approved equivalent honesty copy).
3. Clicking them does not change orb copy or local state that looks like control.
4. Ask First is the displayed mode; Auto cannot be selected.
5. Orb/idle/working copy comes only from `GET /api/autonomy/snapshot`.
6. Footer (or equivalent) still indicates read-only snapshot.

**Out of scope:** Removing the layout; renaming `AstraPhoneOrb` (D-002 — Design soft); Mini-Beast deploy.

**Done when:** Design confirms D-003 closed or files only polish (not re-enable). QA re-passes the honesty checklist.

---

### ASTRA-S3 — Prototype honesty on Jobs and Chat

**Story:** As the operator, I can tell that Jobs and Chat are prototypes, so I do not trust them as a fleet scheduler or production assistant.

**Priority:** P1 — do not start until S1+S2 are in review, not blocked on them for *design*, but **do not merge Track A extras before S2**.  
**Review:** ASTRA-R8 🟡 (Jobs as prototype only)

**Scope in**
- Honest labeling on Jobs and Chat surfaces (copy + disabled or clearly local-only behaviors where they imply live dispatch/intelligence they do not have)
- No new job types, no new assistant backend

**Scope out**
- Building a real scheduler
- Building a real LLM/tool path
- Visual redesign

**Acceptance criteria**
1. Jobs page states it is a **prototype / local** workflow, not a distributed scheduler.
2. Chat does not claim live Autonomy command or production assistant guarantees it does not have.
3. No new enabled control is added that lacks a real API.
4. Existing Media and Nodes behavior is unchanged.

**Done when:** QA can see the labels without a hidden wiki. Keep the change small.

---

## Next — only after Track A

### ASTRA-S4 — Park Phase 2 cinematic shell until Track A

**Story:** As Product, I want cinematic shell work parked so honesty ships first.

**Priority:** P2  
**Review:** ASTRA-R3 🟡  
**Engineering action:** No merge, no restart, no new shell scope until EM unparks after S1+S2.

**Acceptance criteria**
1. `feature/phase2-shell` / `feature/astra-cinematic-shell` stay unmerged.
2. If unparked later: atmosphere CSS only; no new product surface; identity law holds.

---

### ASTRA-S5 — AstraPhone companion smoke (secondary)

**Story:** As the operator, I can wake/use Phone against the live API without a full HUD redesign.

**Priority:** P3  
**Scope:** Smoke the current Phone against live API.  
**Out:** HUD/Settings Design System pass, HTTPS/Keychain, on-device wake model.

**Acceptance criteria**
1. Smoke note recorded (pass/fail) against current Phone version.
2. Failures are tickets, not a desktop chrome rewrite.
3. No Phone nav cloned onto desktop as a “fix.”

---

## Later — not staffed

| ID | Story | Priority | Product gate |
|---|---|---|---|
| ASTRA-S6 | Real assistant path for Chat (tools, nodes, media cards against live APIs) | P4 | New review required. No UI fiction. |
| ASTRA-S7 | Real job dispatch to a named worker contract | P5 | Requires CTO contract. Prototype label stays until then. |
| ASTRA-S8 | Robot/edge **telemetry** as a node class (battery, faults, reachability) | P6 | Observability only. |
| ASTRA-S9 | Robot **control** (motors/servos/cameras) | — | 🔴 Rejected until S8 exists and Product + CTO re-approve. |
| ASTRA-S10 | Shared Drive UI | — | 🔴 Rejected. See ASTRA-R4. |
| ASTRA-S11 | Autonomy Auto / mutating commands | — | 🔴 Rejected. See ASTRA-R5. |

---

## Explicitly do not build

- Shared Drive / Chronos file-manager UI
- Autonomy Auto
- Phone chrome on desktop
- Robotics actuation
- Production Jobs scheduler theater
- Any enabled control without a real, intended API

---

## Handoff to Engineering

When picking up a Now story, Programmer should:

1. Treat acceptance criteria as the contract.
2. Keep diffs inside the listed scope.
3. Open a PR; do not merge; do not deploy.
4. Ping Design for UI consistency and QA for the gate — not Product for architecture or pixels.
5. If a request is not on this list, stop and ask Product. Default is **reject until reviewed**.
