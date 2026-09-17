# Product decisions

| Field | Value |
|---|---|
| **Version** | 1.0.4 |
| **Status** | Active — Product Owner signed decisions |
| **Owner** | Product Owner |
| **Last Reviewed** | 2026-09-17 |

**See also:** [PRODUCT.md](../PRODUCT.md) · [REVIEWS.md](./REVIEWS.md) · [STORIES.md](./STORIES.md)

These are Product scope locks. They are not merge, deploy, architecture, or design-pixel approvals.

---

## ASTRA-PD-001 — Sprint 0 Track A scope lock

**Reviews:** ASTRA-R1 🟡 · ASTRA-R2 🟢 · ASTRA-R9 🔴  
**Stories:** ASTRA-S1, ASTRA-S2 (now) · ASTRA-S3 (P1 after S2)

# Summary

Astra’s current milestone is honesty, not atmosphere and not remote control. Track A is product-complete only when signed-in `/autonomy` shows a live GET-only snapshot **or** an honest degraded state **and** no Autonomy control looks operable unless it works. PRs #2 and #3 cover the snapshot path. PR #4 is the approved D-003 honesty variant. Shipping Phase 1 with visible stubs is not a Product option.

# User Value

The operator (Jason) needs one place to see whether the fleet intent path is real. Trust is the product. A control plane that displays Pause, Resume, Approve, or Auto as if they work teaches the operator that Astra lies. That is worse than an incomplete page.

# Scope

**In (now)**
- ASTRA-S1 — read-only snapshot (`GET /api/autonomy/snapshot` only)
- ASTRA-S2 — disable stub controls and label Preview/Local (PR #4)

**Out (this sprint)**
- Merge or deploy (EM / Jason / Design / QA)
- Autonomy Auto, Pause/Resume as live control, command composer, job dispatch from `/autonomy`
- Phase 2 cinematic shell merge or restart
- Shared Drive / Chronos file-manager UI
- Phone chrome on desktop
- Robotics motor/servo/camera control
- Production Jobs scheduler
- Unrelated `server/routes.ts` edits

# Acceptance Criteria

1. Signed-in operator opens `/autonomy` and is not stuck on a login plate.
2. Authenticated `GET /api/autonomy/snapshot` returns **200** JSON; unauthenticated returns **401**.
3. UI shows live snapshot fields **or** an honest degraded/unreachable state (Hades down is a fleet fact, not a fake “working” orb).
4. The page calls no mutating Autonomy API.
5. Pause/Resume, command field + Send + chips, capability cards, Approve/Not Now, and mode chips are not operable and are labeled Preview/Local (or Design-approved equivalent).
6. Ask First is displayed; Auto cannot be selected.
7. Desktop chrome remains Core mark + ASTRA wordmark.
8. Dirty `server/routes.ts` stays quarantined.

# Risks

- Treating QA technical READY on #2+#3 as Product-complete while D-003 is open.
- Re-enabling stubs “for demo.”
- Unparking Phase 2 shell before Track A honesty lands.
- Expanding Chat/Jobs into a scheduler or assistant while Autonomy still lies.

# Recommendation

🟡 **APPROVE WITH CHANGES**

Approve the read-only snapshot **plus** D-003 honesty as one Track A product slice. Do not treat #2+#3 as shippable without #4. Product does not approve merge or deploy.

---

Product Decision  
Decision ID: ASTRA-PD-001  
Product Version: 1.0.1  
Priority: Critical  
Status: Active — Track A incomplete until S2 is in the proposed merge set  
Owner: Product Owner  
Next Responsible Role: Chief of Staff  
Dependencies: PR #2, PR #3, PR #4  
Target Sprint: Sprint 0 Track A  
One-line rationale: Honesty before atmosphere — snapshot is real, stubs must not look like control, and Product will not call Track A done until both are true.

Handoff note (1.0.2): ASTRA-PD-001 remains the scope lock. The single next role and operating rule are signed in **ASTRA-PD-002**. Do not read this decision as a Design → QA → EM pipeline.

---

## ASTRA-PD-002 — Product Owner handoff lock (one next role)

**Reviews:** ASTRA-R10 🟡  
**Supersedes handoff of:** ASTRA-PD-001 (scope lock unchanged)

# Summary

Product has decided what Sprint 0 Track A is: ASTRA-S1 + ASTRA-S2. Ship-as-is with visible stubs is rejected. PR #4 already carries the approved D-003 variant. Product will not staff S3 or later while live `/autonomy` still shows operable stubs. Product will not sequence Design, QA, CTO, or EM. Chief of Staff owns subsequent coordination.

# User Value

The operator needs an honest Autonomy surface before any new product work. Protecting that order is the remaining Product value. Running a multi-department pipeline from Product delays that honesty and blurs ownership.

# Scope

**In (now)**
- Keep ASTRA-PD-001 scope lock (S1 + S2)
- Treat PR #4 as the Product-approved honesty vehicle
- Park S3 until live stubs are gone

**Out (this decision)**
- Merge or deploy
- Architecture, UI redesign, implementation-quality, or release approval
- Staffing S3–S11
- Product coordinating Design, QA, CTO, or EM

# Acceptance Criteria

1. Track A product scope remains S1 + S2 only.
2. No Product document names more than one next responsible role.
3. S3 stays unstaffed while live Autonomy shows operable stubs.
4. Product does not approve merge or deploy.

# Risks

- CoS is treated as Product continuing to run the pipeline.
- S3 or Phase 2 starts while stubs remain live.
- #2+#3 merge without #4 because QA was technically READY.

# Recommendation

🟡 **APPROVE WITH CHANGES**

Keep the S1+S2 lock. Change only the operating model: one next role, then Product stops.

---

Product Decision  
Decision ID: ASTRA-PD-002  
Product Version: 1.0.2  
Priority: Critical  
Status: Active — Track A locked; Product handoff complete  
Owner: Product Owner  
Next Responsible Role: Chief of Staff  
Dependencies: ASTRA-PD-001; ASTRA-S1; ASTRA-S2; PRs #2, #3, #4  
Target Sprint: Sprint 0 Track A  
One-line rationale: Honesty before atmosphere — S1+S2 are the only NOW work, and Product hands Track A to Chief of Staff rather than running the pipeline.

---

## ASTRA-PD-003 — ASTRA-S3 remains parked after ASTRA-OS-001

**Reviews:** ASTRA-R11 🔴  
**Does not change:** ASTRA-PD-001 scope lock · ASTRA-PD-002 one-handoff rule

# Summary

ASTRA-OS-001 is complete (PR #6 merged to `docs/canon-v1`). That ticket is the agent operating layer. It is not live Autonomy honesty. ASTRA-S3 stays Parked. The unpark gate remains: live `/autonomy` no longer shows operable stubs.

# User Value

The operator still cannot trust `/autonomy` while stub controls look live. Jobs/Chat labels are real P1 work, but they are not more valuable than finishing P0 honesty. Staffing S3 now would treat docs-process completion as product honesty.

# Scope

**In (now)**
- Record that ASTRA-OS-001 does not unpark ASTRA-S3
- Keep ASTRA-S3 Parked
- Keep NOW as ASTRA-S1 + ASTRA-S2

**Out (this decision)**
- Activating ASTRA-S3
- Merge or deploy of PRs #2 / #3 / #4
- Changing S3 story acceptance
- S4–S11 or new surfaces

# Acceptance Criteria

1. ASTRA-S3 status remains Parked.
2. Product documents do not list S3 as Active or NOW staffed work.
3. Unpark requires live `/autonomy` without operable stubs, not OS-001 completion.
4. Product does not approve merge or deploy.

# Risks

- CoS or Programmer staffs S3 because “the last ticket finished.”
- PR #4 remaining open is ignored.
- OS-001 is used to justify Phase 2 or Phone work.

# Recommendation

🔴 **REJECT**

Do not activate ASTRA-S3.

---

Product Decision  
Decision ID: ASTRA-PD-003  
Product Version: 1.0.3  
Priority: High  
Status: Active — ASTRA-S3 remains parked  
Owner: Product Owner  
Next Responsible Role: Chief of Staff  
Dependencies: ASTRA-PD-001; ASTRA-PD-002; ASTRA-S3; ASTRA-OS-001 (PR #6); PR #4  
Target Sprint: Sprint 0 Track A  
One-line rationale: OS-001 is agent docs, not live Autonomy honesty — S3 stays parked until operable stubs are gone.

---

## ASTRA-PD-004 — ASTRA-OS-002 Chief of Staff role packet

**Reviews:** ASTRA-R12 🟡  
**Ticket:** [ASTRA-OS-002](../astra-os/tickets/ASTRA-OS-002.md)

# Summary

Approve a documentation-only Chief of Staff role in Astra OS. Product already hands to CoS. The OS must name that role. CoS coordinates routing and dependencies. CoS does not take Product, EM, Design, QA, or CTO authority.

# User Value

Agents can boot CoS from the repo. The operator gets one coordinator after Product’s first handoff, without a second product owner.

# Scope

**In**
- `docs/astra-os/roles/COS.md`
- `ROLES.md`, `BOOT.md`, Master role map as required
- Ticket ASTRA-OS-002

**Out**
- Code, UI, architecture
- Workflow/gate redesign
- Unparking ASTRA-S3
- Merge or deploy

# Acceptance Criteria

1. CoS packet matches existing role shape.
2. May/Must not match ASTRA-OS-002.
3. BOOT and ROLES name the role.
4. Master role map includes CoS.
5. No product/UI/API/architecture files.

# Risks

- CoS replaces Product or EM.
- Scope creeps into WORKFLOW.md redesign.

# Recommendation

🟡 **APPROVE WITH CHANGES**

Docs-only. Authority limits are required, not optional.

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

---

## Decision index

| ID | Subject | Rec | Priority | Status |
|---|---|---|---|---|
| ASTRA-PD-001 | Sprint 0 Track A scope lock (S1+S2; no ship-as-is) | 🟡 | Critical | Active |
| ASTRA-PD-002 | Product Owner handoff lock (one next role: Chief of Staff) | 🟡 | Critical | Active |
| ASTRA-PD-003 | ASTRA-S3 remains parked after ASTRA-OS-001 | 🔴 | High | Active |
| ASTRA-PD-004 | ASTRA-OS-002 Chief of Staff role packet | 🟡 | High | Active |
| ASTRA-R4 / S10 | Shared Drive UI | 🔴 | — | Rejected |
| ASTRA-R5 / S11 | Autonomy Auto / mutating commands | 🔴 | — | Rejected |
| ASTRA-R6 | Phone chrome on desktop | 🔴 | — | Rejected |
| ASTRA-R7 / S9 | Robotics actuation | 🔴 | — | Rejected |
| ASTRA-R3 / S4 | Phase 2 cinematic shell | 🟡 | P2 | Parked until Track A |
| ASTRA-R8 / S3 | Jobs/Chat as labeled prototypes | 🟡 | P1 | Parked — OS-001 does not unpark |
