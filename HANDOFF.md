# Astra Handoff

## Summary
The Astra frontend has been restructured into a production-oriented shell prototype for Talos. The UI now centers on a cinematic three-panel layout with a living atmosphere layer, a subtle presence layer, and fake streaming conversation content.

## What Changed
- Replaced the previous app entry with a direct Astra shell composition.
- Added modular folders for app, components, layouts, systems, stores, hooks, services, styles, assets, types, and config.
- Introduced a calm cyan/red visual language with translucent panels and atmospheric motion.
- Added placeholder engines for conversation, context, telemetry, atmosphere, and presence.
- Documented the architecture and project status.

## Files To Review First
- `client/src/layouts/AstraShell.tsx`
- `client/src/components/AstraConversationPanel.tsx`
- `client/src/components/AstraAtmosphere.tsx`
- `client/src/styles/astra.css`
- `client/src/config/astra.ts`

## Constraints
- No backend logic was added.
- No auth flow was added.
- No telemetry API integration was added.
- The shell remains desktop-first and visually restrained.
