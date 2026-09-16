# AGENTS.md — Astra UI Guardrails (Codex)

## Absolute rules
- Do NOT print, log, or commit secrets (tokens, passwords). If you must reference them, use placeholders.
- Do NOT “fix” auth by disabling it. Fix config + consistency.
- Keep /api errors JSON. Only /api/voice/tts success returns audio/wav.
- Make small, reversible changes; add diagnostics before refactors.

## Workflow
- Before changing code: summarize root cause hypothesis in 3 bullets.
- After changes: show a diff summary + exact curl smoke tests that should pass.
- Update docs if env vars or headers change.

## Allowed commands
- rg, sed, cat, node, npm run check, npm run dev, npm run build
Forbidden unless asked:
- sudo, systemctl, firewall changes, broad rm/chmod.

## Design system
- Visual identity SoT: `docs/DESIGN_SYSTEM.md` (Jason-approved policy).
- Desktop chrome: Core mark + ASTRA wordmark — do **not** clone AstraPhone nav/chrome.
- Master index: `docs/ASTRA_MASTER.md`. Frontend map: `docs/frontend-architecture.md`.
- No identity redesign without explicit Jason approval. Ping Astra Design for UI consistency reviews.

## Target behavior
- /api/voice/* requires x-astra-ops-token == ASTRA_OPS_TOKEN (same logic as /api/ops/*).
- /api/voice/tts forwards to the configured voice service; server adds x-astra-voice-token only when ASTRA_VOICE_TOKEN is set.
- /api/voice/ping returns 200 JSON when ops auth passes.
