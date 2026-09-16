# Product reviews

| Field | Value |
|---|---|
| **Version** | 1.0.1 |
| **Status** | Approved — Product Owner |
| **Owner** | Product |
| **Last Reviewed** | 2026-09-16 |

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

Fix D-003 (ASTRA-S2 / PR #4). Do not accept stubs. Product does not approve merge.

---

Product Decision  
Decision ID: ASTRA-PD-001  
Product Version: 1.0.1  
Priority: Critical  
Status: Active — ship-as-is rejected  
Owner: Product Owner  
Next Responsible Role: Programmer (PR #4) → Design → QA → EM  
Dependencies: ASTRA-S1, ASTRA-S2, PRs #2 #3 #4  
Target Sprint: Sprint 0 Track A  
One-line rationale: A control plane that lies is worse than an incomplete one.
