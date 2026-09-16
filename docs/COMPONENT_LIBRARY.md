# Astra Component Library

**Status:** Scaffold (2026-09-16)  
**Owner:** UI/UX Director (inventory) + Engineering (implementation); maintained by Documentation Manager  
**See also:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [MOTION_SYSTEM.md](./MOTION_SYSTEM.md) · [frontend-architecture.md](./frontend-architecture.md)

## Purpose

Single inventory of shared UI building blocks so desktop, Phone, and sister apps do not invent parallel components.

## Shape grammar (from Design System)

| Shape | Use |
|---|---|
| Circle | Core / orb |
| Capsule | Mode / HUD / CTA chips |
| ~22 pt rounded rect | Panels / cards |
| ~16 pt rounded rect | Chat bubbles / compact fields |
| Glass | Frosted panels over space |

## Inventory (to be completed)

| Component | Platforms | Source of truth | Notes |
|---|---|---|---|
| Orb / Core | Desktop, Phone | Design System + Phone token ref | Hero A uses Core logo |
| Brand chrome | Desktop | Design System | Core mark + ASTRA wordmark |
| Chat bubble | Desktop, Phone | Design System | 16 pt; cyan / purple roles |
| Panel / card | Desktop | Design System | 22 pt glass |
| Capsule chip | Desktop, Phone | Design System | Mode / HUD |
| Sidebar / nav | Desktop | frontend-architecture | Do not clone Phone nav |
| Settings rows | Desktop, Phone | TBD | Consistency pass listed in status |

## Rules

1. New shared component → add a row here before wide reuse.  
2. Tokens and identity come from Design System — this file does not redefine palette or type.  
3. Platform chrome may differ; component DNA may not.

## Backlog

- Catalog concrete React / SwiftUI component paths  
- Screenshot references under `docs/screenshots/` where helpful  
