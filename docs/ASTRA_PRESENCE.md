# AstraPresence Architecture

## Purpose

AstraPresence is the shared visual shell used by the login surface and the authenticated dashboard. It is intentionally environmental: the telemetry and workspace content must stay primary, while the presence layer provides restrained context and motion.

## Architectural Overview

```
Live telemetry sources
  -> gateway adapters / hook adapters
  -> useAstraPresenceSource() / useOperationalTelemetrySource()
  -> shared presence store
  -> useAstraPresence()
  -> AstraPresence / dashboard surfaces
```

The presence store is intentionally small. It merges state from multiple operational sources and exposes a single rendering contract to the UI.

## Rendering Surfaces

- `variant="login"` renders the login artwork and uses the login motion profile.
- `variant="dashboard"` renders the dashboard artwork and is mounted as a pointer-events-free background layer.

## Asset Mapping

- Login artwork: `/assets/astra/newlogin.jpg`
- Dashboard artwork: `/assets/astra/dash.png`

## Telemetry Inputs

AstraPresence now accepts both simple boolean signals and richer operational signal objects.

Supported signal families:

- GPU activity
- Voice recording state
- Robotics heartbeat
- Security alerts
- Hermes transfer activity

The dedicated hooks live in `client/src/hooks/astra-telemetry.ts` and are thin adapters over the shared presence publication path.

Telemetry integration should follow this pattern:

- Normalize raw gateway payloads into signal objects at the edge.
- Publish them through the adapter hooks.
- Keep `AstraPresence` focused on rendering and state blending only.
- Avoid embedding transport, polling, or websocket logic in the visual components.

The adapter layer in `client/src/hooks/astra-telemetry-adapters.ts` is the preferred place to translate:

- Astra Gateway payloads
- GPU stats
- voice subsystem events
- robotics telemetry
- Hermes transfer updates
- node health snapshots

## Performance Principles

- Prefer route-level code splitting for heavy dashboard pages.
- Keep the login surface isolated from dashboard-only bundles.
- Use shared motion timing constants instead of scattered magic numbers.
- Preserve `prefers-reduced-motion` and low-power behavior.
- Keep overlays non-interactive on the dashboard.
- Pause nonessential motion when the tab is hidden.
- Prefer fewer particles and lower-DPR rendering on mobile or low-power devices.
- Keep background work cancellable and restartable after visibility changes.

## State Flow

```
gateway / node / voice / robotics / transfer signals
  -> adapter hook
  -> presence publication
  -> merged presence state
  -> computed intensity + theme
  -> motion + overlay rendering
```

When multiple sources are active, the most restrictive motion preference should win.

## Accessibility Strategy

- Honor `prefers-reduced-motion`.
- Treat low-power/mobile as a separate throttling path, not just a layout breakpoint.
- Keep login controls visually dominant and interactive first.
- Avoid pointer-event blocking overlays on the dashboard.
- Preserve readable contrast in both the login and dashboard treatments.

## Animation Restraint Philosophy

- Astra should frame operations, not compete with them.
- Idle motion should be subtle enough to disappear into the background.
- State changes should feel calm and intentional.
- Lowering motion is preferable to adding new effects.
- Any future animation work should first ask whether the telemetry itself can communicate the state more directly.

## Maintenance Notes

- The visual balance should not be increased.
- New operational signals should be added through the telemetry hooks rather than directly inside UI components.
- If a new signal changes motion intensity, it should degrade gracefully in reduced-motion and mobile contexts.
