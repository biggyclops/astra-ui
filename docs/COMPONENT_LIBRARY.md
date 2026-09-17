# Astra Component Library

| Field | Value |
|---|---|
| **Version** | 0.1.0 |
| **Status** | Outline — inventory incomplete |
| **Owner** | UI/UX Director (inventory) + Engineering (implementation) |
| **Maintained by** | Documentation Manager |
| **Last Reviewed** | 2026-09-16 |
| **Approved By** | — (outline only) |

**See also:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [MOTION_SYSTEM.md](./MOTION_SYSTEM.md) · [frontend-architecture.md](./frontend-architecture.md)

## Purpose

Single inventory of shared UI building blocks so desktop, Phone, and sister apps do not invent parallel components. Tokens and identity stay in Design System; this file catalogs reusable parts.

## Sections

### 1. Shape grammar (from Design System)
| Shape | Use |
|---|---|
| Circle | Core / orb |
| Capsule | Mode / HUD / CTA chips |
| ~22 pt rounded rect | Panels / cards |
| ~16 pt rounded rect | Chat bubbles / compact fields |
| Glass | Frosted panels over space |

### 2. Inventory
| Component | Platforms | Source | Notes |
|---|---|---|---|
| Orb / Core | Desktop, Phone | Design System + Phone tokens | Hero A uses Core logo |
| Brand chrome | Desktop | Design System | Core mark + ASTRA wordmark |
| Chat bubble | Desktop, Phone | Design System | 16 pt; cyan / purple roles |
| Panel / card | Desktop | Design System | 22 pt glass |
| Capsule chip | Desktop, Phone | Design System | Mode / HUD |
| Sidebar / nav | Desktop | frontend-architecture | Do not clone Phone nav |
| Settings rows | Desktop, Phone | TBD | Consistency pass in status |

### 3. Rules
1. New shared component → add a row before wide reuse
2. Do not redefine palette or type here
3. Platform chrome may differ; component DNA may not

### 4. Change control
- Design approves new shared DNA components
- Bump **Version** when inventory structure or grammar changes

## TODOs
- [ ] Catalog concrete React component paths (`client/src/components/…`)
- [ ] Catalog SwiftUI counterparts in AstraPhone
- [ ] Add screenshot refs under `docs/screenshots/` where helpful
- [ ] Design review pass → bump toward 1.0.0
