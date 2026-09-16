# Product decisions

| Field | Value |
|---|---|
| **Version** | 1.0.1 |
| **Status** | Active — Product Owner signed decisions |
| **Owner** | Product Owner |
| **Last Reviewed** | 2026-09-16 |

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
Next Responsible Role: Programmer (S2 already in PR #4) → Design (close D-003 or polish-only) → QA (honesty re-gate) → EM (release recommendation only)  
Dependencies: PR #2, PR #3, PR #4; Design D-003; QA honesty checklist; Jason release gate; CTO architecture clear (Jason-owned, not Product)  
Target Sprint: Sprint 0 Track A  
One-line rationale: Honesty before atmosphere — snapshot is real, stubs must not look like control, and Product will not call Track A done until both are true.

---

## Decision index

| ID | Subject | Rec | Priority | Status |
|---|---|---|---|---|
| ASTRA-PD-001 | Sprint 0 Track A scope lock (S1+S2; no ship-as-is) | 🟡 | Critical | Active |
| ASTRA-R4 / S10 | Shared Drive UI | 🔴 | — | Rejected |
| ASTRA-R5 / S11 | Autonomy Auto / mutating commands | 🔴 | — | Rejected |
| ASTRA-R6 | Phone chrome on desktop | 🔴 | — | Rejected |
| ASTRA-R7 / S9 | Robotics actuation | 🔴 | — | Rejected |
| ASTRA-R3 / S4 | Phase 2 cinematic shell | 🟡 | P2 | Parked until Track A |
| ASTRA-R8 / S3 | Jobs/Chat as labeled prototypes | 🟡 | P1 | After S2 |
