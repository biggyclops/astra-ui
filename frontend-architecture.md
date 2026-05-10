# Frontend Architecture

## Directory Layout
- `client/src/app` - top-level Astra application composition
- `client/src/components` - presentational shell parts and panel primitives
- `client/src/layouts` - the desktop shell layout
- `client/src/systems` - placeholder engines for atmosphere, conversation, context, telemetry, and presence
- `client/src/stores` - Zustand state for shell selection and future orchestration
- `client/src/hooks` - live UI hooks for stream playback and presence
- `client/src/services` - small data and streaming utilities
- `client/src/styles` - Astra-specific design tokens and utilities
- `client/src/assets` - local static assets and future visual references
- `client/src/types` - domain types for shell data
- `client/src/config` - static shell copy, panels, and prototype data

## Runtime Flow
1. `main.tsx` loads global styles and mounts the app.
2. `App.tsx` forwards directly into `AstraApp`.
3. `AstraShell` composes background, presence, sidebar, conversation, and context layers.
4. `useAstraConversationStream` simulates live message streaming in the center panel.
5. `useAstraPresence` and the context engine feed the right-hand signal panels.

## Implementation Notes
- Framer Motion is used for panel entry, hover lift, and atmospheric drift.
- Tailwind handles layout and utility composition, while `client/src/styles/astra.css` owns the cinematic token layer.
- Zustand currently stores shell selection state and can expand into richer UI orchestration later.
- The systems are intentionally lightweight placeholders so the architecture can evolve without binding to backend behavior yet.
