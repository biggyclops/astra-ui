# Product stories (implementation-ready)

| Field | Value |
|---|---|
| **Version** | 1.0.7 |
| **Status** | Approved for Engineering — Sprint 0 Track A + CoS + Mission Control (parked) |
| **Owner** | Product |
| **Last Reviewed** | 2026-09-18 |

**See also:** [PRODUCT.md](../PRODUCT.md) · [REVIEWS.md](./REVIEWS.md) · [DECISIONS.md](./DECISIONS.md) · [ROADMAP.md](../ROADMAP.md)

These stories are **what/why + acceptance**. They are not architecture, visual redesign, merge approval, or a release sign-off.

Acceptance criteria are the contract for whoever picks up the story. Product does not expand a story mid-flight.

**Product lock:** [ASTRA-PD-001](./DECISIONS.md) — Track A = S1 + S2. Do not merge ship-as-is. Product does not approve merge.  
**Handoff:** [ASTRA-PD-007](./DECISIONS.md) — ASTRA-S14 Mission Control approved and parked until Track A honesty.

| Order | ID | Priority | Vehicle | Product note |
|---|---|---|---|---|
| 1 | ASTRA-S1 | P0 | PRs #2 / #3 | Keep in merge set. Do not expand. |
| 2 | ASTRA-S2 | P0 | PR #4 | Required for Track A. Do not re-enable stubs. |
| 3 | ASTRA-S3 | P1 | parked | Wait for live Autonomy without operable stubs. |
| — | ASTRA-S4 | P2 | parked | Phase 2 cinematic shell. Not the CoS orchestrator. |
| OS-line | ASTRA-S12 | High | PR #9 | CoS recommendation engine (CLI). Do not displace S1/S2. |
| — | ASTRA-S13 | Medium | parked | CoS dashboard. After Track A honesty + S12. Not the snapshot/orb. |
| — | ASTRA-S14 | Medium | parked | Mission Control aggregator. After Track A honesty. Not a source of truth. |
| — | S5–S11 | parked / rejected | — | Do not staff. |

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

### ASTRA-S12 — Chief of Staff recommendation engine (v1)

**Requested as:** ASTRA-S4 — Chief of Staff Orchestrator  
**Product ID:** **ASTRA-S12** (ASTRA-S4 is already Phase 2 cinematic shell and stays parked)

**Story:** As Chief of Staff, I can run a local read-only recommender over Astra OS canon and get one next ticket and one next role, so routing is explicit and not invented in chat.

**Priority:** High — OS-line. Must not displace Track A (S1/S2).  
**Review:** ASTRA-R13 🟡  
**Depends on:** Astra OS BOOT sources in the local checkout. ASTRA-OS-002 packet is not a hard start gate; if `COS.md` is missing, the recommender must say so honestly.

**Summary**
v1 is a recommendation engine only. It reads local Astra OS state (BOOT order: Constitution, Master, roles, `project_status.yaml`, ROADMAP, latest handoff, Product decisions/stories, OS tickets). It prints the next active ticket, the next responsible role, and a short rationale. It does not invoke roles, merge, deploy, or write GitHub.

**User value**
CoS already exists as Product’s handoff target. Without a recommender, routing is tribal. A labeled recommendation is honest coordination. Fake dispatch of agents would be theater.

**Scope in**
- Local, read-only command or script over the checkout
- Output: next ticket ID, exactly one next role, rationale, unknowns
- Label: recommendation — not an approval, not a dispatch
- Honor parked/rejected Product decisions (S3 stays parked; S4 remains Phase 2 park)
- If state is incomplete, output unknown — do not invent tickets or roles

**Scope out / Non-goals**
- Invoking AI roles or cloud agents
- Merge, deploy, GitHub writes (and v1 needs no GitHub API)
- New Astra UI route, Autonomy controls, or fleet API
- Replacing Product, EM, Design, QA, CTO, or Jason approvals
- Unparking S3 or changing Track A scope
- Agent orchestration software
- Mixing this work into Autonomy PRs #2 / #3 / #4

**Acceptance criteria**
1. Running v1 against the local repo prints **one** next ticket ID and **one** next responsible role (or explicit unknown).
2. Output is labeled a **recommendation**, not an approval or a job dispatch.
3. v1 reads local canon only (BOOT sources + Product stories/decisions + OS tickets). It does not call role agents.
4. v1 does not merge, deploy, push, open/close PRs, or otherwise modify GitHub.
5. Parked and rejected Product IDs are never recommended as Active.
6. ASTRA-S4 is never used as the CoS orchestrator ID.
7. No new operator surface: not a `/cos` page, not an enabled Autonomy control.
8. Track A files (`Autonomy.tsx`, snapshot API) are untouched.
9. Desktop chrome and identity law are untouched.

**Done when:** a local run produces a recommendation from real canon files without GitHub mutation or role invocation. Product does not merge.

---

### ASTRA-S13 — Chief of Staff Dashboard (read-only)

**Story:** As the operator, I can see a labeled, read-only engineering-process panel that shows the current ASTRA-S12 recommendation, so I know the next ticket and next role without mistaking it for fleet Autonomy control.

**Priority:** Medium — parked until Track A honesty is live (S1+S2) and ASTRA-S12 output exists in the checkout.  
**Review:** ASTRA-R14 🟡  
**Depends on:** ASTRA-S12 (`scripts/cos-recommend.ts` / `npm run cos:recommend`); ASTRA-S2 live (no operable Autonomy stubs)

**Summary**
A read-only panel on `/autonomy` that **displays S12 output**. It is engineering-process state, not Hades/fleet snapshot. It must not drive the orb, change Ask First, or look like dispatch.

**User value**
The operator already has one instrument for fleet intent (snapshot). A CoS panel is valuable only if it is obviously a recommendation feed. Mixing sprint/GitHub chrome into the orb would teach the operator that Autonomy is a project tracker and that recommendations are commands.

**Scope in**
- Read-only panel on `/autonomy`, visually separate from the Phase 1 orb/snapshot
- Consume **only** ASTRA-S12 output (KIND, NEXT_TICKET, NEXT_ROLE, RATIONALE, UNKNOWNS, SOURCES, NOT approval/dispatch)
- Map requested fields honestly:
  - Current sprint — from S12/canon if present, else **unknown**
  - Current ticket — S12 `NEXT_TICKET` labeled as **recommendation**, not in-flight fact
  - Current owner / next responsible role — S12 `NEXT_ROLE` (one role)
  - Current blockers — only if present in S12 output; else **unknown**
  - Sprint progress / recent activity / repository status — **unknown** unless S12 already emits them (no GitHub API)
- Label: read-only recommendation. Not an approval. Not a dispatch.

**Scope out / Non-goals**
- Invoking AI roles or dispatching work
- Merge, deploy, GitHub read/write APIs
- Changing Autonomy policy (Ask First, Auto, snapshot)
- Driving orb copy from CoS data
- New mutating Autonomy endpoints
- Robotics control
- Unparking S3 or replacing S4
- Mixing into Track A PRs #2 / #3 / #4
- Expanding S12 to invent GitHub “repo status”

**Acceptance criteria**
1. Staffing starts only after live `/autonomy` has no operable stubs (S2) and S12 can be run locally.
2. Panel is labeled **recommendation / read-only engineering process**. It is not the fleet snapshot.
3. Orb, Ask First, and snapshot fields still come only from `GET /api/autonomy/snapshot`.
4. Displayed ticket and role match a local S12 run, or show **unknown**.
5. Fields S12 does not emit show **unknown** — no invented progress % or GitHub status.
6. No control on the panel is operable (no run, assign, merge, deploy, approve).
7. Clicking the panel does not change orb copy or Autonomy policy.
8. No GitHub API. No role invocation. No robot control.
9. Desktop chrome stays Core mark + ASTRA wordmark.
10. Track A snapshot path and D-003 honesty are unchanged.

**Done when:** the operator can tell snapshot (fleet) from CoS recommendation (process) on `/autonomy` without a wiki. Product does not merge.

---

### ASTRA-S14 — Mission Control Foundation (read-only aggregator)

**Story:** As the operator, I can view a read-only aggregate of what Astra already reports (nodes, services, health, storage), with timestamps and honest degraded/unknown states, so I have one roll-up without replacing the existing operator sources of truth.

**Priority:** Medium — parked until Track A honesty is live (S1+S2; same gate as S3 / S13).  
**Review:** ASTRA-R15 🟢  
**Decision:** [ASTRA-PD-007](./DECISIONS.md)  
**Depends on:** ASTRA-S1; ASTRA-S2 live (no operable Autonomy stubs)

**Summary**
Mission Control v1 is a **read-only aggregator**. It is not the single source of truth, not a control plane, not a policy editor, and not an Autonomy replacement. Operator truths remain Nodes, Media / Hermes, and `GET /api/autonomy/snapshot`. Mission Control may only aggregate those existing reads.

**User value**
Provide a single timestamped roll-up of existing system status while preserving Astra’s honesty rules.

**Scope in (v1)**
- Aggregate only information already available from existing GET endpoints
- Nodes, services, health, storage only
- Existing APIs only (for example `GET /api/status`, `GET /api/nodes`, existing Media / Hermes health, and read-only consume of `GET /api/autonomy/snapshot`)
- Every payload: timestamp, reachability, and health — reachability and health are separate
- Unavailable data: **Unknown** or **Degraded** — never invent values
- Policy display-only: Ask First and signed Product locks — not Auto, not editable

**Scope out / Non-goals**
- Becoming the single source of truth
- Replacing Nodes, Media, or Autonomy
- Changing the orb or `GET /api/autonomy/snapshot`
- Operator controls, a `/mission-control` page, or redesigning `/autonomy`
- Jobs or GPUs in v1
- Invoking AI roles, robot control, GitHub, scheduler, merge, or deploy
- Unparking or replacing ASTRA-S13
- Displacing Track A (S1 / S2)

**Honesty rules**
- Aggregate existing data only
- Never invent GPU, storage, health, or job information
- Unknown means Unknown; Degraded means Degraded
- Every payload includes a timestamp and separates reachability from health
- Policy is read-only
- Jobs remain prototype/local when they eventually exist
- Autonomy remains unchanged

**Acceptance criteria**
1. Begins only after S1 + S2 honesty are live.
2. Mission Control is described as an aggregator, never a source of truth.
3. Uses only existing GET APIs.
4. Reports only nodes, services, health, and storage.
5. Unknown or failed reads display Unknown or Degraded.
6. Every payload contains timestamp, reachability, and health.
7. Policy is display-only.
8. Jobs are not part of v1.
9. GPUs are not part of v1.
10. No operator UI changes.
11. Autonomy snapshot remains unchanged.
12. No AI, GitHub, robots, scheduler, merge, or deploy.

**Done when:** a read-only aggregate of existing live GET data is available without inventing values and without changing Autonomy. Product does not merge.

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
- Agent orchestration that invokes roles, merges, or deploys
- Reusing ASTRA-S4 for anything other than Phase 2 shell park
- A CoS dashboard that dispatches work, talks to GitHub, or drives the Autonomy orb
- Mission Control as a single source of truth, control plane, or Autonomy replacement
- Mission Control v1 jobs or GPUs without a later Product review

---

## Handoff

Stories are the Product contract: what, why, and acceptance. The active signed decision names exactly one next responsible role. Product does not sequence Design, QA, CTO, or EM after that handoff.

If a request is not on this list, stop. Default is **reject until reviewed**.
