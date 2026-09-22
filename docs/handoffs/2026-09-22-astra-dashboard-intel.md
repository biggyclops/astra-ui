# Handoff: 2026-09-22 — Astra dashboard zip → `/intel`

**Author:** Programmer  
**Branch / commit:** `cursor/astra-dashboard-intel-8d9b` @ `59ef6de`  
**Surfaces touched:** `/intel` (new), Sidebar Intel entry, App router

## Goal

Port the uploaded `astra-dashboard` zip into Astra UI as a static, read-only `/intel` prototype.

## Done

- Added full-bleed `/intel` page from the zip composition (left nav + rails + graph + command bar)
- Applied Design System constraints: Core mark + ASTRA wordmark, SF stack, ~22px panels, space atmosphere
- Honesty labels: PROTOTYPE / EXAMPLE DATA / Preview / Read only; no live telemetry claims
- Unavailable zip nav items disabled; Home / Autonomy / Settings link to real routes
- Sidebar gains Intel entry for other pages; Home (`/`) unchanged
- `npm run check` and `npm run build` PASS

## Not done / blockers

- `scripts/dev-gate.sh` hard-fails on this executor (`REPO_ROOT` must be `/home/comea/astra-ui/astra-ui-main-clean`)
- Aikido scan requires interactive sign-in (MCP login)
- Overlaps conceptually with open draft PR #20 (`feat/intel-dashboard-prototype`) — owners should pick one composition
- Graph remains a static placeholder, not a live knowledge graph

## How to verify

```bash
npm run check
npm run build
npm run dev
# open http://localhost:5000/intel
```

## Next actions

1. Design / Product verdict on zip-faithful left-nav composition vs PR #20 header-only shell
2. Do not merge. Do not deploy.
