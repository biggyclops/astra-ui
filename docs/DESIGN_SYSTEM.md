# Astra Design System

**Status:** Canonical  
**Owner:** UI/UX Director (Astra Design)  
**Approved:** Jason Comeau — Astra Visual Identity Policy (2026-09-16)  
**Location (live Eng tree):** `docs/DESIGN_SYSTEM.md` on Mini-Beast `astra-ui`  
**Phone implementation reference:** box skill `match-mock-astra-visual-language/ASTRA_DESIGN_SYSTEM.md` (inspected Phone source tokens — not a license to clone Phone chrome onto desktop)

This is the single source of truth for Astra’s visual identity. All Astra applications stay faithful to this system. Platform chrome and navigation may differ; identity may not.

---

## 1. Visual identity policy

### Canonical source
The Astra Design System (`DESIGN_SYSTEM.md`) is the single source of truth for Astra’s visual identity.

### Astra UI (Desktop)
- Desktop-first AI operating environment
- Preferred chrome: **Core mark + ASTRA wordmark**
- Multi-panel cinematic workspace
- **Do not clone AstraPhone navigation or chrome**

### AstraPhone
- Mobile companion experience
- Touch-first interactions
- Uses the same design system while adapting to mobile conventions

### Shared design language
All Astra applications share:

- Core orb
- Core logo
- Cyan accent palette
- Space-inspired atmosphere
- Motion language
- Typography
- Component styling
- Shape grammar
- Glass surfaces

### Platform independence
Each platform may have different navigation, layouts, workflows, and interaction models while remaining faithful to the Astra Design System.

### Governance
| Role | Responsibility |
|---|---|
| Product | Approves identity |
| UI/UX Director | Maintains the design system |
| CTO | Reviews architecture impacts |
| Engineering Manager | Coordinates implementation |

**No identity redesign without explicit approval.**

---

## 2. Feel targets

Every interface should feel **cinematic, calm, intelligent, and premium**.

Prioritize **clarity, simplicity, consistency, and elegance** over visual complexity.

Improve user flows without changing product vision.

---

## 3. Shared tokens (cross-platform DNA)

### 3.1 Color
| Role | Token / value | Notes |
|---|---|---|
| Brand / energy | Cyan (interactive accent) | Primary interactive surfaces, HUD, focus rings |
| Space top | `#000000` | Space gradient start |
| Space mid | `#080E29` | Deep midnight |
| Space bottom | `#1F0A38` | Violet void |
| Electric highlight | `#73F2FF` | Typewriter / shimmer accents |
| User bubble | Purple @ ~28% | User messages only |
| Astra bubble (settled) | Cyan @ ~18% | Assistant messages |
| Error | Pink (not loud red banners) | Soft error language |
| Text primary | White | On dark space |
| Status online | Green | Constellation dots |
| Status degraded | Orange | Constellation dots |

Do not invent a second palette. Desktop and Phone share this DNA.

### 3.2 Typography
- **SF / SF Rounded / SF Mono only** (system stack)
- Web: `-apple-system`, `BlinkMacSystemFont`, `ui-sans-serif`, `ui-rounded`, `ui-monospace` as appropriate
- **No custom display font files** without explicit approval
- Prefer calm hierarchy over decorative type

### 3.3 Shape grammar
| Shape | Use |
|---|---|
| Circle | Core / orb |
| Capsule | Mode chips, HUD chips, CTA chips |
| ~22 pt rounded rect | Panels / cards |
| ~16 pt rounded rect | Chat bubbles / compact fields |
| Glass | Frosted / translucent panels over space |

### 3.4 Atmosphere
- Space-inspired background (black → `#080E29` → `#1F0A38`)
- Optional starfield / cinematic stage when the surface calls for it
- Glass panels over void — not flat light-mode chrome
- Preferred appearance is dark-on-space

### 3.5 Motion
- Continuous orbital / ambient motion where the product already uses it; idle is slower, not stopped
- Electric typewriter / reveal language for Astra replies when the surface supports it
- Respect `prefers-reduced-motion`
- Motion should feel machine-calm, not playful bounce spam

### 3.6 Logos / marks
| Mark | Use |
|---|---|
| Core logo (`AstraCoreLogo` / `astra-core-logo.png`) | Inside the orb / hero core |
| Desktop wordmark | **ASTRA** wordmark + Core mark in desktop chrome |
| Phone wordmark | `AstraPhoneLogoTransparent` in Phone chrome only |
| Do not | Invent new marks or transplant Phone nav/wordmark into desktop chrome |

---

## 4. Platform rules

### 4.1 Astra UI (desktop web)
- Chrome: Core mark + ASTRA wordmark
- Layout: multi-panel cinematic workspace (sidebar / stage / oracle or equivalent)
- Share DNA: orb, cyan, space, glass, motion, type, shape grammar
- **Rejected:** forcing AstraPhone navigation/chrome onto web (do not re-apply Phone-align without Jason’s explicit approval)
- Phase 2 cinematic shell (`cinematic-shell.css`) is atmosphere polish on preferred chrome — not a new identity

### 4.2 AstraPhone (iOS)
- Touch-first companion; Phone chrome and orbital HUD are appropriate here
- Implementation detail (orb rates, exact pt sizes, asset catalog names) lives in the Phone reference doc:
  - Skill path: `match-mock-astra-visual-language/ASTRA_DESIGN_SYSTEM.md`
- Sister apps (e.g. AstraScan) keep optical weight hierarchy with Phone marks; do not invent a parallel mark system

### 4.3 Widgets / other clients
- Miniaturize the HUD language (space gradient, cyan→white word, status dots, capsule CTAs)
- Copy Phone/desktop DNA — do not redesign

---

## 5. Review checklist (before ship)

- [ ] Uses shared cyan / space / glass language (no second palette)
- [ ] SF system type only (no custom display fonts)
- [ ] Shape grammar respected (circle / capsule / 22 panel / 16 bubble)
- [ ] Desktop chrome is Core mark + ASTRA wordmark (not Phone nav clone)
- [ ] Phone changes stay within Design System + Phone reference tokens
- [ ] Motion calm; reduced-motion respected
- [ ] Accessibility: contrast, hit targets, labels on icon-only controls
- [ ] Visual hierarchy clear; no decorative complexity for its own sake
- [ ] No identity redesign without Product approval

---

## 6. Related docs (Master pointers)

| Doc | Role |
|---|---|
| `docs/DESIGN_SYSTEM.md` | **This file** — visual identity SoT |
| `docs/ASTRA_MASTER.md` | Product/system index |
| `docs/frontend-architecture.md` | Desktop frontend map + chrome rules |
| `docs/project_status.yaml` | Lightweight status stub (EM owns formal roadmap) |
| `docs/PHASE2_SHELL.md` | Phase 2 cinematic shell notes |
| `docs/ARCHITECTURE_SETUP.md` | Runtime / network architecture |
| Box skill `ASTRA_DESIGN_SYSTEM.md` | Phone implementation token dump |

---

## 7. Change control

1. Product (Jason / Steve Jobs) approves identity changes.
2. UI/UX Director updates this file and notifies EM / Programmer / relevant client owners.
3. CTO reviews only when architecture forces client UX changes (BFF, auth, status ontology, etc.).
4. Engineering Manager coordinates implementation milestones.

**Do not** treat “match Phone into web” as standing approval after the Phone-align revert.
