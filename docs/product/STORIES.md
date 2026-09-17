# Product stories (implementation-ready)

| Field | Value |
|---|---|
| **Version** | 1.0.3 |
| **Status** | Approved for Engineering — Sprint 0 Track A + immediate honesty |
| **Owner** | Product |
| **Last Reviewed** | 2026-09-17 |

**See also:** [PRODUCT.md](../PRODUCT.md) · [REVIEWS.md](./REVIEWS.md) · [DECISIONS.md](./DECISIONS.md) · [ROADMAP.md](../ROADMAP.md)

These stories are **what/why + acceptance**. They are not architecture, visual redesign, merge approval, or a release sign-off.

Acceptance criteria are the contract for whoever picks up the story. Product does not expand a story mid-flight.

**Product lock:** [ASTRA-PD-001](./DECISIONS.md) — Track A = S1 + S2. Do not merge ship-as-is. Product does not approve merge.  
**Handoff:** [ASTRA-PD-003](./DECISIONS.md) — S3 remains parked. Next owner is Chief of Staff.

| Order | ID | Priority | Vehicle | Product note |
|---|---|---|---|---|
| 1 | ASTRA-S1 | P0 | PRs #2 / #3 | Keep in merge set. Do not expand. |
| 2 | ASTRA-S2 | P0 | PR #4 | Required for Track A. Do not re-enable stubs. |
| 3 | ASTRA-S3 | P1 | parked | ASTRA-OS-001 does not unpark this. Wait for live Autonomy without operable stubs. |
| — | S4–S11 | parked / rejected | — | Do not staff. |

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

**Done when:** signed-in and unauthenticated snapshot checks can be repeated on the live or agreed environment. Product does not merge.

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

**Done when:** listed controls are not operable, are labeled Preview/Local (or equivalent), and clicking them does not invent live control. Product does not merge.

---

### ASTRA-S3 — Prototype honesty on Jobs and Chat

**Story:** As the operator, I can tell that Jobs and Chat are prototypes, so I do not trust them as a fleet scheduler or production assistant.

**Priority:** P1 — remains parked. ASTRA-OS-001 (agent docs, PR #6) is not the unpark gate. Do not staff while live `/autonomy` still shows operable stubs.  
**Review:** ASTRA-R8 🟡 (Jobs as prototype only) · ASTRA-R11 🔴 (do not unpark)

**Scope in**
- Honest labeling on `/jobs` and Chat (`/`)
- Local-only / prototype copy where the UI implies live GPU, Comfy, robot dispatch, or production assistant intelligence
- Keep existing local prototype behavior

**Scope out**
- Building a real scheduler or worker contract
- Building a real LLM/tool path
- New job types, new nodes in the job picker, new assistant backends
- Visual redesign, chrome changes, Phase 2 shell

**Acceptance criteria**
1. `/jobs` states it is a **prototype / local** workflow, not a distributed fleet scheduler.
2. Job create copy does not claim live Comfy/GPU/robot dispatch.
3. Chat (`/`) does not claim live Autonomy command or production assistant guarantees it does not have.
4. No new enabled control is added that lacks a real, intended API.
5. Existing Media and Nodes behavior is unchanged.
6. Desktop chrome stays Core mark + ASTRA wordmark.

**Done when:** the prototype labels are visible on `/jobs` and Chat without a hidden wiki. Keep the change small.

---

## Next — only after Track A

### ASTRA-S4 — Park Phase 2 cinematic shell until Track A

**Story:** As Product, I want cinematic shell work parked so honesty ships first.

**Priority:** P2  
**Review:** ASTRA-R3 🟡  
**Product note:** Parked. No new shell scope until Track A honesty is live.

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

## Handoff

Stories are the Product contract: what, why, and acceptance. The active signed decision names exactly one next responsible role. Product does not sequence Design, QA, CTO, or EM after that handoff.

If a request is not on this list, stop. Default is **reject until reviewed**.
