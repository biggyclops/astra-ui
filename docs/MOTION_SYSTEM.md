# Astra Motion System

| Field | Value |
|---|---|
| **Version** | 0.1.0 |
| **Status** | Outline |
| **Owner** | UI/UX Director |
| **Maintained by** | Documentation Manager |
| **Last Reviewed** | 2026-09-16 |
| **Approved By** | — (outline only) |

**Status:** Scaffold (2026-09-16)  
**Owner:** UI/UX Director; maintained by Documentation Manager  
**See also:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) · Phone token reference (`ASTRA_DESIGN_SYSTEM.md` beside visual-language skill)

## Purpose

Detail motion language so implementations stay calm, cinematic, and consistent. **Identity tokens remain in Design System**; this file owns timing, easing, and motion recipes.

## Principles (from Design System)

- Machine-calm motion — not playful bounce spam  
- Continuous orbital / ambient motion where the product already uses it; idle is slower, not stopped  
- Electric typewriter / reveal for Astra replies when the surface supports it  
- Respect `prefers-reduced-motion` (reduce or replace continuous motion)

## Recipes (to be completed)

| Recipe | Where used | Spec |
|---|---|---|
| Orbital core | Autonomy / Phone orb | Rates from Phone token ref / `OrbitalCoreView` |
| Typewriter reveal | Astra chat replies | Timing TBD — match Design |
| Atmosphere drift | Phase 2 cinematic shell | CSS-only; identity unchanged |
| Panel enter/exit | Desktop panels | TBD |
| Reduced motion | All | Disable continuous orbits; instant or crossfade |

## Change control

Motion that changes perceived identity (new flourish language, new bounce style) needs Design + Product approval. Atmosphere-only polish does not.