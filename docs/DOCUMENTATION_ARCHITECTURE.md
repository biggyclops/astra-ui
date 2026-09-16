# Astra Documentation Architecture

**Status:** Approved v1 (2026-09-16)  
**Owner:** Documentation Manager (Astra Docs)  
**Approved by:** Jason Comeau  
**Location:** `docs/` in the core platform repository (`astra-ui`)

## Decision

The **`docs/` directory inside `astra-ui`** is the single source of truth for Astra’s institutional documentation.

A dedicated `astra-docs` repository is **deferred** until the set is large enough or intended for public consumption.

## Canonical documents (owned here)

| Document | Role |
|---|---|
| [`ASTRA_MASTER.md`](./ASTRA_MASTER.md) | Sole entry index / doc map |
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Visual identity (Design content; Docs publication) |
| [`PRODUCT.md`](./PRODUCT.md) | Product definition (Product-approved) |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Platform / systems architecture |
| [`ROADMAP.md`](./ROADMAP.md) | Roadmap narrative (EM milestones) |
| [`COMPONENT_LIBRARY.md`](./COMPONENT_LIBRARY.md) | Shared UI component inventory |
| [`MOTION_SYSTEM.md`](./MOTION_SYSTEM.md) | Motion language (pairs with Design System) |
| [`project_status.yaml`](./project_status.yaml) | Machine-readable progress stub |
| `adr/` | Architecture Decision Records |
| `handoffs/` | Session handoff records |
| `templates/` | Shared templates |
| `releases/` | Milestone / release notes |

Related Eng-local runbooks (`ARCHITECTURE_SETUP.md`, `CHAT_PIPELINE.md`, `HERMES_MOUNT.md`, etc.) stay in `docs/` but are **repo operational docs**, not product-vision canon. They are listed from Master as references.

## Repository ownership

| Layer | Responsibility |
|---|---|
| **astra-ui `docs/`** | Authoritative institutional set (this architecture) |
| **Other Astra repos** (`AstraPhone`, `astra-infra`, `astra-assistant`, …) | **Reference** Master / relevant canon docs — **do not duplicate** |
| **Chronos `~/Documents/astra-design-bible/`** | Optional working mirror / pointer only; must not diverge silently |
| **Content owners** | Design (visual identity content), Product (identity + product vision approval), CTO (architecture impacts), EM (roadmap milestones), Docs Manager (structure, sync, currency, cross-refs) |

## Mirror vs local

- **Do not** copy full canon files into other repositories.
- **Do** link from each Eng README to [`ASTRA_MASTER.md`](./ASTRA_MASTER.md).
- Optional thin pointer file in other repos (`docs/FROM_CANON.md`, ≤30 lines): repo purpose, link to Master, current docs commit/tag, list of local-only docs.

## Synchronization

1. **Write path:** edit on Mini-Beast `astra-ui` working tree (or PR into `astra-ui`), under `docs/`.
2. **GitHub `biggyclops/astra-ui`:** push docs commits when approved; GitHub is the durable remote; Mini-Beast is the live Eng checkout.
3. **Other repos:** pull latest via link; no auto-duplicate CI in v1.
4. **Conflict rule:** after reconcile, `astra-ui` remote `main` / agreed docs branch wins over ad-hoc copies (including Chronos bible).

## Directory structure

```text
docs/
  DOCUMENTATION_ARCHITECTURE.md   # this file
  ASTRA_MASTER.md
  DESIGN_SYSTEM.md
  PRODUCT.md
  ARCHITECTURE.md
  ROADMAP.md
  COMPONENT_LIBRARY.md
  MOTION_SYSTEM.md
  frontend-architecture.md
  project_status.yaml
  adr/
    TEMPLATE.md
    README.md
  handoffs/
    TEMPLATE.md
    README.md
  templates/
    README.md
  releases/
    TEMPLATE.md
    README.md
  # Eng-local runbooks (references, not product vision):
  ARCHITECTURE_SETUP.md
  CHAT_PIPELINE.md
  HERMES_MOUNT.md
  …
```

## Cross-linking

- One front door: `ASTRA_MASTER.md`.
- Every canon doc carries Status, Owner, Last-updated, and See also.
- Eng READMEs point at Master, not deep fragile paths alone.
- Role map for ownership lives in Master.

## Versioning

- Git history on `astra-ui` is the audit trail for docs.
- Prefer docs-only commits with clear messages (`docs: …`).
- Optional tags: `docs-YYYY.MM.DD` when a milestone summary ships.
- `project_status.yaml` tracks engineering progress; it is not the docs version number.
- Identity or architecture claim changes require Product / CTO approval before merge to the agreed line.

## Discovery (engineers & agents)

1. Open `docs/ASTRA_MASTER.md` in `astra-ui`.
2. Follow Master’s doc map.
3. Other repos’ READMEs → Master.
4. Documentation Manager + Design treat this tree as authoritative.

## Explicit non-goals (v1)

- Dedicated public `astra-docs` repo (revisit later).
- Full-file mirrors into Phone / infra / assistant.
- Changing product vision or visual identity content without approval.
