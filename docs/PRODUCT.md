# Astra Product

| Field | Value |
|---|---|
| **Version** | 1.0.1 |
| **Status** | Approved — Product Owner canon |
| **Owner** | Product (Astra Product Owner / Jason) |
| **Maintained by** | Documentation Manager |
| **Last Reviewed** | 2026-09-16 |
| **Approved By** | Astra Product Owner |

**See also:** [ASTRA_MASTER.md](./ASTRA_MASTER.md) · [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [ROADMAP.md](./ROADMAP.md) · [product/REVIEWS.md](./product/REVIEWS.md) · [product/STORIES.md](./product/STORIES.md) · [product/DECISIONS.md](./product/DECISIONS.md) · [DOCUMENTATION_ARCHITECTURE.md](./DOCUMENTATION_ARCHITECTURE.md)

## Purpose

Define what Astra is for, who it serves, and what success looks like — without requiring old chat history.

Engineering Manager sequences *when*. Product decides *what* and *why*.

## 1. Product definition

**North star:** Astra is the calm, honest operator environment for a private fleet of AI, compute, media, and edge systems — one place to see what is real, and to act only when action is real.

Astra is not a demo, a theme pack, or a public SaaS. It is a private control plane. If a control cannot execute, it must not look executable. If a subsystem is prototype, it must say so. If a host is unreachable, the operator must see that before any theatrical “working” state.

### Multi-surface operating environment

| Surface | Role |
|---|---|
| **Astra UI (desktop)** | Primary operator control plane. Chrome is Core mark + ASTRA wordmark. |
| **AstraPhone** | Mobile companion against the same fleet API. Phone chrome is allowed on Phone only. |
| **Fleet / API** | Shared backend. Product consumes contracts; CTO owns architecture impacts. |

## 2. Audience

| Audience | Need |
|---|---|
| Operator (Jason) | A calm control plane for nodes, media, jobs, chat, and autonomy. Trust that what is on screen is true. |
| Eng / AI agents | Clear product boundaries so they do not invent vision, chrome, or fake capabilities. |
| Design | Identity law is already approved. Product does not redesign UI; Product rejects identity drift. |
| Future users | Out of scope until the private operator environment is honest and reliable. |

## 3. Surfaces in scope

| Surface | Role | Product rule |
|---|---|---|
| Nodes | Live fleet observability | Must distinguish reachability vs service health. Real diagnostics only. |
| Media | Browse and stream NAS/Hermes | Live. Keep working. No Drive-clone expansion. |
| Autonomy | Operator view of Hades / fleet intent | **Phase 1 = read-only snapshot.** No Auto. No mutating APIs. False affordances are a ship-blocker. |
| Chat | Console + structured cards | Prototype until a real assistant path exists. Must not imply production intelligence. |
| Jobs | Workload list / create | Prototype in-memory queue. Must not imply a distributed scheduler. |
| Settings | Operator configuration | Keep. No identity redesign. |
| AstraPhone | Companion | Secondary. Smoke only until desktop honesty ships. |

## 4. Outcomes & success metrics

A release is successful when the operator can trust the screen.

| Outcome | Measure |
|---|---|
| **Honesty** | No enabled control on a shipped surface unless the matching API exists and is intended. Prototype surfaces are labeled. |
| **Time-to-truth** | From `/nodes`, the operator can tell online / degraded / unreachable without guessing. |
| **Autonomy Phase 1 done** | Signed-in `/autonomy` shows live snapshot *or* an honest degraded state. Ask First is display-only. Auto cannot be selected. Stubs are disabled and labeled Preview/Local, or removed. |
| **Non-theater** | Chat and Jobs never present as production guarantees. |
| **Companion, not clone** | Desktop chrome stays Core mark + ASTRA wordmark. Phone does not dictate desktop nav. |

## 5. Priority ranking (Product)

Highest first. EM may sequence delivery; Product will not accept work above a higher item that is still dishonest.

| Rank | Theme | Why |
|---|---|---|
| **P0** | Autonomy honesty (Track A) | A control plane that lies is worse than an incomplete one. Ship Phase 1 read-only + D-003 before anything else. |
| **P0** | Protect live Nodes + Media | These already create operator value. Do not regress them for chrome or new surfaces. |
| **P1** | Honest prototype labeling on Chat and Jobs | Same honesty law as Autonomy. Do not let prototype queues look like a fleet scheduler. |
| **P2** | Phase 2 cinematic shell | Atmosphere only, after Track A. No new product surface. Park if restart/QA is not green. |
| **P3** | AstraPhone smoke / companion reliability | Secondary. Full HUD/Settings consistency is not Sprint 0. |
| **P4** | Real assistant (Chat depth) | Only after honesty. Requires a real backend path, not UI fiction. |
| **P5** | Real job dispatch | Only after Chat/assistant or an explicit GPU/CV worker contract. Prototype stays prototype. |
| **P6** | Robotics as a node class | Telemetry first. Control (motors/servos) is later and gated. |

## 6. Non-goals

- Public multi-tenant SaaS
- Identity redesign without Jason’s explicit approval
- Cloning AstraPhone nav/chrome onto desktop
- Autonomy **Auto**, command execution, or job dispatch from `/autonomy`
- Treating prototype Jobs or Chat depth as production
- Shared Drive / Chronos-stash file manager UI (parked — see reviews)
- Motor, servo, or camera **control** before honest robot telemetry exists
- Scope that exists to look busy rather than to tell the truth

## 7. Current milestone — Sprint 0 Track A

**Product “done” for this milestone (not EM’s engineering checklist):**

1. Operator can open signed-in `/autonomy` and see a live snapshot **or** an honest degraded state (including Hades unreachable).
2. No Autonomy control appears operable unless it actually works.
3. Ask First is the displayed policy; Auto cannot be selected.
4. `GET /api/autonomy/snapshot` is the only Autonomy API used by the page.
5. Design + QA sign-off. Product does not approve merge or deploy.

**Vehicles:** ASTRA-S1 → PRs #2 / #3 (snapshot). ASTRA-S2 → PR #4 (D-003 disable + Preview/Local). Track A is **not** product-complete on #2+#3 alone.

**Out of this milestone:** Phase 2 shell merge, Phone HUD pass, Shared Drive, Autonomy Auto, robotics control, production jobs, ship-as-is with visible stubs.

Signed decision: [ASTRA-PD-001](./product/DECISIONS.md).

### Sprint NOW (Product)

| Order | ID | What | Why now |
|---|---|---|---|
| 1 | ASTRA-S1 | Read-only Autonomy snapshot | Live instrument; already in #2/#3 |
| 2 | ASTRA-S2 | D-003 honesty | Ship-blocker; already in #4 |
| 3 | ASTRA-S3 | Jobs/Chat prototype labels | P1 after S2 is in the proposed merge set |

Do not staff S4–S11. Do not start new surfaces. Default for unreviewed ideas: **reject until reviewed**.

## 8. Change control

- Product vision changes require explicit Product / Jason approval.
- Docs Manager records approved text; does not invent it.
- Bump **Version** on material guidance changes.
- EM owns ROADMAP sequencing and `project_status.yaml`.
- CTO owns architecture. Design owns visual identity. QA owns release readiness. Product does not override those roles.
- New feature work needs a Product review in `docs/product/REVIEWS.md` before Engineering expands scope. Record signed locks in `docs/product/DECISIONS.md`.

## Verdict log (in-flight)

| Idea | Verdict | Detail |
|---|---|---|
| Autonomy Phase 1 read-only snapshot | 🟡 APPROVE WITH CHANGES | Keep GET-only. D-003 must land before Product considers the story complete. |
| D-003 disable + Preview/Local | 🟢 APPROVE | Honesty over theater. Preferred over removal for now; Design may polish later. |
| Ship Autonomy P1 with visible stubs | 🔴 REJECT | Ship-as-is is not a Product option. Track A is incomplete until D-003 (ASTRA-S2 / PR #4). |
| Phase 2 cinematic shell | 🟡 APPROVE WITH CHANGES | Park until Track A. Atmosphere only. No new surface. |
| Shared Drive UI (Chronos stash) | 🔴 REJECT | Out of north star. Media already covers operator storage. Park indefinitely. |
| Autonomy Auto / mutating commands | 🔴 REJECT | Not this phase. Requires a new Product + CTO approval later. |
| Phone chrome on desktop | 🔴 REJECT | Identity law. Not negotiable. |
| Robotics motor/servo control | 🔴 REJECT | Telemetry-first later. Control is not a Sprint 0 or Phase 1 story. |
