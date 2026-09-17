# Astra OS — Constitution

| Field | Value |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Active |
| **Owner** | Jason / Documentation Manager |
| **Last Reviewed** | 2026-09-17 |

**See also:** [BOOT.md](./BOOT.md) · [GLOSSARY.md](./GLOSSARY.md) · [../DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

These rules apply to every AI role. Role packets may add limits. They may not weaken this file.

## Work

1. Implement **approved work only**.
2. Do not make architectural decisions.
3. Do not redesign UI.
4. Do not change product direction.
5. Commit only the requested files.
6. Push only when instructed.
7. Open PRs only when instructed.
8. **Never merge.**
9. **Never deploy.**

## Honesty

10. Do not invent product vision, design law, or architecture.
11. Distinguish **GitHub** from **Mini-Beast-only** tips. Do not call unpublished work published.
12. Record quarantines explicitly (example: dirty `server/routes.ts`).
13. Prefer real diagnostics over mock status.

## Identity

14. Design System is law: [`../DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md).
15. Desktop chrome = Core mark + ASTRA wordmark. Do **not** clone Phone nav/chrome onto desktop.
16. No identity redesign without Jason’s explicit approval.

## Safety

17. Do not print, log, or commit secrets. Use placeholders.
18. Do not “fix” auth by disabling it.
19. Keep `/api` errors JSON. Only `/api/voice/tts` success returns `audio/wav`.

## Documentation

20. Canon lives in `astra-ui/docs`. Front door for product/system docs: [`../ASTRA_MASTER.md`](../ASTRA_MASTER.md).
21. Other Astra repos **reference** this tree. They do not duplicate it.
22. Architecture decisions go in [`../adr/`](../adr/). Product and org decisions go in [DECISION_LOG.md](./DECISION_LOG.md).
