# Product review template

Copy into [`REVIEWS.md`](./REVIEWS.md). Product reviews **what** and **why**. They do not approve architecture, UI redesign, merge, or deploy.

Every review must include the sections below and end with a Product Decision block. Choose exactly one recommendation.

**Handoff rule:** name exactly one Next Responsible Role. Do not describe the engineering pipeline. Do not assign multiple departments. Chief of Staff coordinates any subsequent reviews.

Allowed next roles (choose one):

- Design Lead
- Programmer
- CTO
- Documentation Manager
- Engineering Manager
- Chief of Staff

---

# ASTRA-R# — short title

**Request:** One sentence. Link PR/issue if any.

## Summary

What this is, in operator terms.

## User Value

Who benefits and what trust or capability they gain. If value is low or harmful, say so.

## Scope

**In**
- …

## Acceptance Criteria

- …

## Non-Goals

What is explicitly out of scope for this work.

## Risks

- …

## Recommendation

Choose exactly one:

- 🟢 **APPROVE**
- 🟡 **APPROVE WITH CHANGES**
- 🔴 **REJECT**

Short rationale. Name the story IDs Engineering should pick up, or state that nothing should be built.

---

Product Decision  
Decision ID: ASTRA-PD-___  
Product Version: (from [`PRODUCT.md`](../PRODUCT.md))  
Priority: Critical | High | Medium | Low  
Status:  
Owner: Product Owner  
Next Responsible Role: (one role only)  
Dependencies:  
Target Sprint:  
One-line rationale:
