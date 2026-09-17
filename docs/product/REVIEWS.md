# Product reviews

| Field | Value |
|---|---|
| **Version** | 1.0.4 |
| **Status** | Approved — Product Owner |
| **Owner** | Product |
| **Last Reviewed** | 2026-09-17 |

**See also:** [PRODUCT.md](../PRODUCT.md) · [STORIES.md](./STORIES.md) · [DECISIONS.md](./DECISIONS.md) · [TEMPLATE.md](./TEMPLATE.md) · [ROADMAP.md](../ROADMAP.md)

Product reviews **what** and **why**. They do not approve architecture, UI redesign, merge, or deploy.

---

# ASTRA-R1 — Autonomy Phase 1 (read-only snapshot)

**Request:** Ship `/autonomy` as a live operator surface bound to `GET /api/autonomy/snapshot` (PRs #2 / #3).

## Summary

Autonomy is the next operator surface after Nodes. Phase 1 should show whether Hades/the fleet intent path is reachable and what the orb/state snapshot says. It must not pretend to command the fleet.

## User Value

The operator needs one honest place to see Autonomy state without opening logs or guessing. A read-only snapshot turns a designed page into a real instrument.

## Scope

**In**
- Signed-in `/autonomy`
- `GET /api/autonomy/snapshot` as the only Autonomy API
- Hero orb copy driven by snapshot (or honest degraded/offline)
- Ask First as displayed policy

**Out**
- Auto mode
- Pause/Resume, command composer, Approve/Not Now as live controls
- Job dispatch
- Desktop chrome redesign / Phone nav clone
- Unrelated `server/routes.ts` changes

## Acceptance Criteria

- Signed-in operator can open `/autonomy` and is not stuck on a login plate.
- Snapshot returns **200** JSON when authenticated; unauthenticated is **401**.
- UI shows live snapshot fields **or** an honest degraded state (Hades down is allowed and must not be dressed as “working”).
- Footer (or equivalent) communicates read-only snapshot.
- No mutating Autonomy endpoint is called from the page.
- Desktop chrome remains Core mark + ASTRA wordmark.

## Risks

- Stale live process / path-strip (Q-001) makes the UI look broken when Eng is fine locally.
- Stub controls (D-003) teach the operator that Astra lies.
- Hades `:5050` offline is a fleet fact, not a product fail, unless the UI hides it.

## Recommendation

🟡 **APPROVE WITH CHANGES**

Approve the read-only snapshot. Do not treat the story as complete until D-003 honesty lands (see ASTRA-R2). Product does not approve merge.

---

# ASTRA-R2 — D-003 Autonomy honesty (disable + Preview/Local)

**Request:** Disable stub Pause/Resume, command composer, chips, capability cards, Approve/Not Now, and mode chips; label Preview/Local (PR #4).

## Summary

Visible stubs that do nothing violate the north star. Honesty is the product. Disable + label keeps the future layout without teaching false control.

## User Value

The operator can trust `/autonomy`. Preview/Local tells them what is design, not live. That trust is the whole Phase 1 value.

## Scope

**In**
- Disable the listed stub controls
- Preview/Local labeling
- Orb copy from snapshot only
- Ask First displayed; Auto not selectable

**Out**
- Removing the layout wholesale (Design may revisit later)
- Mutating APIs
- Chrome redesign
- `server/routes.ts` edits

## Acceptance Criteria

- Listed controls are not operable.
- Clicking them does not change orb copy or invent live control.
- Preview/Local (or equivalent honest label) is visible on those controls.
- Ask First is shown; Auto cannot be selected.
- Snapshot remains the only Autonomy API.
- Q-001 public path `/api/autonomy/snapshot` is unchanged.

## Risks

- Design may still prefer removal after visual QA — that is a polish ticket, not a new product surface.
- Empty advisor/history may hide Approve until Hades returns suggestions; disabled styling must still apply if they appear.

## Recommendation

🟢 **APPROVE**

This is the Product-correct variant. Residual visual polish is Design’s, not a reason to re-enable stubs.

---

# ASTRA-R3 — Phase 2 cinematic shell

**Request:** Atmosphere CSS / cinematic shell (`feature/phase2-shell`, remote `feature/astra-cinematic-shell`).

## Summary

Atmosphere can wait. Honesty cannot. A prettier shell on a lying Autonomy page is the wrong order.

## User Value

Calm motion and glass help the operator stay in the environment — after the environment is true.

## Scope

**In (later)**
- Frontend atmosphere only
- `prefers-reduced-motion`
- No new routes or product surfaces

**Out**
- Merge or restart before Track A
- Phone-align chrome
- Backend, auth, or Autonomy Auto
- New operator workflows

## Acceptance Criteria

- Track A (R1+R2) is accepted by Design + QA before this is unparked.
- No new product surface or fake control is introduced.
- Desktop identity law holds.

## Risks

- Local-only tips get treated as shipped.
- Shell work crowds out honesty fixes.

## Recommendation

🟡 **APPROVE WITH CHANGES**

Park until Sprint 0 Track A. Then atmosphere-only. If Systems cannot restart/QA, remain parked.

---

# ASTRA-R4 — Shared Drive UI (Chronos stash)

**Request:** Product decision on a Shared Drive / file-manager UI from Chronos stash.

## Summary

Astra already has Media for NAS/Hermes. A Drive clone is a different product: generic file management, not operator control.

## User Value

Low for the operator north star. It competes with Media and delays honesty, Nodes, and real assistant work.

## Scope

**Rejected entire surface.** Do not staff, design, or prototype in Sprint 0–1.

## Acceptance Criteria

N/A — not building.

## Risks

- Stash work gets revived as “almost done.”
- File-manager scope explodes (sharing, permissions, sync).

## Recommendation

🔴 **REJECT**

Park indefinitely. Revisit only if Media cannot cover a concrete operator job (not “it would be nice”).

---

# ASTRA-R5 — Autonomy Auto / command execution

**Request:** Enable Auto, Pause/Resume, command composer, or Approve as live fleet control.

## Summary

Control without a proven, permissioned, logged command path is unsafe and dishonest.

## User Value

Real remote control is valuable later. Fake control is harmful now.

## Scope

**Rejected for Phase 1 and Sprint 0.** A future proposal needs Product + CTO together, with safety/permissions as first-class acceptance.

## Acceptance Criteria

N/A for this phase.

## Risks

- Re-enabling stubs “just for demo.”
- Dispatching jobs from Autonomy without a scheduler contract.

## Recommendation

🔴 **REJECT**

Bring a new story when snapshot honesty is live *and* CTO has a command contract. Until then, no Auto.

---

# ASTRA-R6 — Phone chrome on desktop / identity redesign

**Request:** Align desktop nav/chrome with AstraPhone, or otherwise redesign identity.

## Summary

Identity is already Jason-approved law. Desktop is Core mark + ASTRA wordmark. Phone chrome stays on Phone.

## User Value

None. Drift destroys the brand the operator already has.

## Scope

Rejected.

## Acceptance Criteria

N/A.

## Risks

- Agents “helpfully” clone Phone HUD onto web.

## Recommendation

🔴 **REJECT**

Not negotiable. Design System is law.

---

# ASTRA-R7 — Robotics motor / servo / camera control

**Request:** Operator controls for motors, servos, cameras as a first robotics slice.

## Summary

Astra should eventually treat robots as nodes. The first honest slice is telemetry (reachability, battery, faults), not actuation.

## User Value

Control without health is how hardware gets hurt. Observability first matches Nodes and Autonomy Phase 1.

## Scope

**Rejected now.** Future: robot *status* as a node class. Control is a later gated story.

## Acceptance Criteria

N/A for this phase.

## Risks

- Cyberus-style control copied into Astra UI without fleet contracts.

## Recommendation

🔴 **REJECT**

File telemetry-only stories after Track A and Chat/Jobs honesty. Not Sprint 0.

---

# ASTRA-R8 — Production job scheduler

**Request:** Treat Jobs as a real distributed scheduler (GPU, Comfy, robot dispatch).

## Summary

Jobs is an in-memory prototype. Shipping it as production would violate honesty.

## User Value

Real dispatch is a later milestone. Today’s value is a labeled prototype so the UI model can be exercised.

## Scope

Keep prototype. Add honest labeling (see STORIES ASTRA-S3). Do not build a scheduler in Track A.

## Acceptance Criteria

If the page remains visible: it is labeled prototype/local, and no copy claims fleet dispatch.

## Risks

- Node names and job types look live.

## Recommendation

🔴 **REJECT** as a production feature.

🟡 **APPROVE WITH CHANGES** as a labeled prototype only (ASTRA-S3).

---

# ASTRA-R9 — Ship Autonomy Phase 1 with visible stubs

**Request:** Treat PRs #2 / #3 as product-complete and merge Track A while Pause/Resume, command composer, chips, capability cards, Approve/Not Now, or Auto still look operable (D-003 open). QA technical READY does not close this.

## Summary

Snapshot honesty without control honesty is still theater. Visible stubs that do nothing violate the north star. Jason’s release gate already requires D-003 resolved — not ship-as-is. Product agrees and will not call Track A done until S2 lands.

## User Value

Negative. Shipping stubs spends operator trust for a demo that is not real control.

## Scope

**Rejected entire ship-as-is path.** Keep #2/#3. Require #4 (or equivalent S2) in the same proposed merge set. Do not re-enable stubs for screenshots or walkthroughs.

## Acceptance Criteria

N/A — not shipping this variant.

Track A acceptance remains S1 + S2 (see ASTRA-R1, ASTRA-R2, ASTRA-PD-001).

## Risks

- QA READY on snapshot is misread as Product-complete.
- Demo pressure reopens Auto or live Pause/Resume.
- Phase 2 shell is unparked to “make stubs look finished.”

## Recommendation

🔴 **REJECT**

Fix D-003 (ASTRA-S2 / PR #4). Do not accept stubs. Product does not approve merge. Scope lock: [ASTRA-PD-001](./DECISIONS.md).

---

# ASTRA-R10 — Product Owner charter applied to Sprint 0 Track A

**Request:** Operate as Product Owner. Confirm what is built now, why, and who is the single next owner. PRs: [#2](https://github.com/biggyclops/astra-ui/pull/2) snapshot, [#3](https://github.com/biggyclops/astra-ui/pull/3) Q-001, [#4](https://github.com/biggyclops/astra-ui/pull/4) D-003.

## Summary

Astra's current product job is honesty, not atmosphere and not remote control. Track A is the live `/autonomy` instrument: a GET-only snapshot **or** an honest degraded state, with no control that looks operable unless it works. PRs #2 and #3 cover the snapshot. PR #4 is the approved D-003 honesty variant. Shipping Phase 1 with visible stubs is rejected. Product work on *what* and *why* for this milestone is complete. Remaining department reviews are not Product's to sequence.

## User Value

The operator (Jason) needs to trust the screen. A control plane that displays Pause, Resume, Approve, or Auto as if they work teaches the operator that Astra lies. That trust is the whole Phase 1 value. Expanding into Jobs/Chat labels, cinematic shell, Phone HUD, or new surfaces while live Autonomy still shows stubs spends that trust.

## Scope

**In**
- ASTRA-S1 — read-only snapshot (`GET /api/autonomy/snapshot` only) via PRs #2 / #3
- ASTRA-S2 — disable stub controls and label Preview/Local via PR #4
- Keep Nodes and Media as live surfaces (no regression, no Drive-clone)
- Ask First displayed; Auto not selectable

## Acceptance Criteria

- Signed-in operator opens `/autonomy` and is not stuck on a login plate.
- Authenticated `GET /api/autonomy/snapshot` returns **200** JSON; unauthenticated returns **401**.
- UI shows live snapshot fields **or** an honest degraded/unreachable state.
- Pause/Resume, command field + Send + chips, capability cards, Approve/Not Now, and mode chips are not operable and are labeled Preview/Local (or Design-approved equivalent).
- Ask First is displayed; Auto cannot be selected.
- The page calls no mutating Autonomy API.
- Desktop chrome remains Core mark + ASTRA wordmark.
- No new product surface is staffed while those criteria are unmet on the live operator path.

## Non-Goals

- Merge or deploy (not a Product decision)
- Architecture review, UI redesign, or implementation-quality review
- Autonomy Auto, live Pause/Resume, command composer, or job dispatch from `/autonomy`
- Phase 2 cinematic shell merge or restart
- Shared Drive / Chronos file-manager UI
- Phone chrome on desktop
- Robotics motor/servo/camera **control**
- Production Jobs scheduler or real Chat assistant path
- ASTRA-S3 Jobs/Chat prototype labels (P1 — parked until live stubs are gone)
- Coordinating Design, QA, CTO, or EM after this handoff

## Risks

- QA technical READY on #2+#3 is misread as Product-complete while live stubs remain.
- Programmer starts S3, Phase 2, or Phone work while `/autonomy` still lies.
- Product is asked to approve merge or to run the Design → QA → EM pipeline.
- Ship-as-is pressure reopens Auto or live Pause/Resume for a demo.

## Recommendation

🟡 **APPROVE WITH CHANGES**

Keep the Track A lock: S1 + S2 only. Do not staff S3 or later while live Autonomy still shows operable stubs. Product names one next owner and stops.

---

# ASTRA-R11 — Unpark ASTRA-S3 after ASTRA-OS-001

**Request:** ASTRA-OS-001 is complete (PR [#6](https://github.com/biggyclops/astra-ui/pull/6) merged to `docs/canon-v1`). Move ASTRA-S3 (Jobs/Chat prototype labels) from Parked to Active.

## Summary

ASTRA-OS-001 is the agent operating layer: `docs/astra-os/` so AI roles boot from the repo. It is documentation-only. It does not change the operator UI, and it does not make `/autonomy` honest.

ASTRA-S3 is P1 honesty labeling on Jobs and Chat. Product parked it until live `/autonomy` no longer shows operable stubs. That gate is unchanged.

## User Value

Jobs and Chat still need honest prototype labels — later. Unparking them now would put P1 work ahead of a P0 surface that still lies. Completing an agent-docs ticket does not give the operator a truer control plane.

## Scope

**In**
- Confirm ASTRA-OS-001 complete does not unpark ASTRA-S3
- Keep ASTRA-S3 parked
- Keep Track A NOW as ASTRA-S1 + ASTRA-S2 only

## Acceptance Criteria

- ASTRA-S3 remains Parked, not Active.
- No Jobs/Chat labeling work is staffed under this decision.
- Unpark condition stays: live `/autonomy` no longer shows operable stubs (ASTRA-S2 / D-003 on the live operator path).
- ASTRA-OS-001 is not treated as a Product unpark for S3, S4–S11, or new surfaces.

## Non-Goals

- Merge or deploy of PRs #2, #3, or #4
- Changing ASTRA-S3 acceptance criteria
- Building a real scheduler or assistant
- Phase 2 shell, Phone HUD, Shared Drive, Auto, or robotics control
- Architecture, UI redesign, or implementation-quality review
- Sequencing Design, QA, CTO, or EM after this handoff

## Risks

- OS-001 “complete” is misread as Track A complete.
- S3 starts while live Pause/Resume/Approve/Auto still look operable.
- PR #4 (D-003) is still open and was not bounced live; treating a stacked tip as live honesty.

## Recommendation

🔴 **REJECT**

Do not move ASTRA-S3 to Active. It remains parked until live Autonomy honesty lands. ASTRA-OS-001 is the wrong gate.

---

Product Decision  
Decision ID: ASTRA-PD-003  
Product Version: 1.0.3  
Priority: High  
Status: Active — ASTRA-S3 remains parked  
Owner: Product Owner  
Next Responsible Role: Chief of Staff  
Dependencies: ASTRA-PD-001; ASTRA-PD-002; ASTRA-S3; ASTRA-OS-001 (PR #6); PR #4 (D-003 still open)  
Target Sprint: Sprint 0 Track A  
One-line rationale: OS-001 is agent docs, not live Autonomy honesty — S3 stays parked until operable stubs are gone.

---

# ASTRA-R12 — ASTRA-OS-002 Chief of Staff role

**Request:** Create documentation ticket ASTRA-OS-002: add an official Chief of Staff AI role to Astra OS (`docs/astra-os/roles/COS.md`, plus ROLES.md, BOOT.md, and Master if required). Docs only.

## Summary

Product already hands work to Chief of Staff. Astra OS has no CoS packet, so agents cannot boot that role. This ticket adds the role as documentation only.

## User Value

Operators and agents get one named coordinator for routing and dependencies, without Product running a department pipeline or CoS taking Product, EM, Design, QA, or CTO authority.

## Scope

**In**
- `docs/astra-os/tickets/ASTRA-OS-002.md` (this ticket)
- `docs/astra-os/roles/COS.md`
- Updates to `ROLES.md`, `BOOT.md`, and `ASTRA_MASTER.md` role map as required to name the role

## Acceptance Criteria

- CoS packet exists in the same shape as other OS roles.
- May: coordinate after first handoff; route to exactly one next role; track dependencies.
- Must not: product vision/scope/identity; replace EM/Design/QA/CTO; implement; expand parked Product work; merge; deploy.
- `ROLES.md` lists Chief of Staff and no longer says “No new roles.”
- `BOOT.md` names `COS.md`.
- Master role map includes CoS without dropping existing rows.
- No code, UI, or architecture files.

## Non-Goals

- Product code, UI, APIs, or architecture
- Redesigning WORKFLOW.md or GATES.md
- Unparking ASTRA-S3
- Merge or deploy
- Agent orchestration software

## Risks

- CoS absorbs Product or EM.
- “No new roles” stays in ROLES.md and agents refuse CoS.
- Ticket is used to change delivery workflow, not just document the role.

## Recommendation

🟡 **APPROVE WITH CHANGES**

Approve the docs-only CoS packet with the authority limits above. Ticket: [ASTRA-OS-002](../astra-os/tickets/ASTRA-OS-002.md).

---

Product Decision  
Decision ID: ASTRA-PD-004  
Product Version: 1.0.4  
Priority: High  
Status: Active — ASTRA-OS-002 approved  
Owner: Product Owner  
Next Responsible Role: Documentation Manager  
Dependencies: ASTRA-OS-001; ASTRA-PD-002; ticket ASTRA-OS-002  
Target Sprint: Sprint 0 Track A  
One-line rationale: CoS is already Product’s handoff target — give it an OS packet, not Product or EM authority.
