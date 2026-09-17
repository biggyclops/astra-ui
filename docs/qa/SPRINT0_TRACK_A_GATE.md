# Sprint 0 Track A — QA release gate

| Field | Value |
|---|---|
| **Track** | A (Jason-approved) |
| **Primary scope** | Autonomy UI Phase 1 — **read-only** Autonomy surface only |
| **PRs (merged)** | [#2](https://github.com/biggyclops/astra-ui/pull/2) Phase 1 · [#3](https://github.com/biggyclops/astra-ui/pull/3) Q-001 · [#4](https://github.com/biggyclops/astra-ui/pull/4) D-003 Preview/Local |
| **GitHub tip** | `main` @ `0207e05` (2026-09-17) |
| **Live** | Mini-Beast `:5173` — **bounce to `0207e05` not recorded by Docs** |
| **Owner (gate)** | Astra QA |
| **Merge gate** | **GitHub merge complete** for #2+#3+#4. Live READY and deploy remain separate. |
| **Updated** | 2026-09-17 (ASTRA-DOC-001 Docs sync from CoS audit + GitHub) |

**See also:** [ROADMAP.md](../ROADMAP.md) · [project_status.yaml](../project_status.yaml) · [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [handoffs/2026-09-16-d003-autonomy-honesty.md](../handoffs/2026-09-16-d003-autonomy-honesty.md)

---

## Docs sync note (not a QA verdict)

On 2026-09-16 QA recorded **READY (technical)** for live chrome + snapshot on **#2+#3** (`8e0a8a2` / `1135510`), with Jason’s D-003 ship-as-is call still open.

On 2026-09-17 Jason **merged** #4 (D-003 disable + Preview/Local) and stacked #3/#2 into `main`, then merged institutional docs (#1). That supersedes “merge waits on ship-as-is.” The approved path was **fix, not ship stubs**.

**Docs does not invent live READY for `0207e05`.** QA must re-pass the named live tip (include Preview/Local + Ask First / Auto not selectable) after Systems bounce. Design must still close D-003 on the merged SHA. CTO clear remains CTO-owned.

---

## Quarantine

- Unrelated dirty `server/routes.ts` — out of DoD (#3 only touches Phase 1 registration).
- Autonomy mutating APIs — out of scope (GET snapshot only).
- Phone full Design System pass — deferred (smoke only).

---

## Drift tickets

| ID | Severity | Note |
|---|---|---|
| **D-001** | Residual | Live DOM + snapshot API archived via Chronos AppleScript; PNG screen-capture still tooling-blocked |
| **D-002** | Soft | `AstraPhoneOrb` naming — Design soft risk |
| **D-003** | Honesty | **Impl merged** (PR #4). Jason required fix (not ship-as-is). **Design close on merged SHA — Design owner** |
| **Q-001** | **Cleared** | After Eng fix + service bounce: signed-in snapshot **200**; unauth **401** |

Design (historical): **APPROVE WITH TICKETS** (chrome PASS) prior to #4 merge.

---

## 1. Acceptance criteria (historical — 2026-09-16 live on pre-#4 tip)

| # | Criterion | Status | Evidence |
|---|---|---|---|
| A1 | `/autonomy` loads signed-in | **Pass** | Chronos Chrome `http://100.81.216.117:5173/autonomy` · operator **comeau** · no login plate (2026-09-16 ~11:02 ET) |
| A2 | Hero orb + read-only snapshot | **Pass** | Footer read-only snapshot · UI **not** “NO SNAPSHOT” · signed-in `GET /api/autonomy/snapshot` → **200** JSON (`orbState: offline`, `hadesReachable: false`, `hadesError: fetch failed` — **noted, not a Q-001 fail**) |
| A3 | No mutating Autonomy auto | **Pass** (pre-#4) | GET-only; stubs were visible then. **Post-#4 code:** stubs disabled + Preview/Local on `main` — **live re-verify required (QA)** |
| A4 | Routes intact | **Pass** | Live Autonomy page |
| A5 | Brand → `/autonomy` | **Pass** | `MYTHIC INTELLIGENCE` → `/autonomy` |
| A6 | Oracle collapsed | **Pass** | `astra-live-shell-oracle-collapsed` · `aria-expanded=false` |
| A7 | Design DNA / no Phone-align | **Pass** | Live + Design |
| A8 | Build/typecheck | **Pass** | `8e0a8a2` tsc/build/verify ok; #3 registration fix; #4 single-file Autonomy.tsx |

Phone B* deferred · Phase 2 N/A for this merge set.

---

## Sign-off

| Item | Value |
|---|---|
| Phase 1 SHA | `8e0a8a2` (in `main` lineage) |
| Q-001 fix SHA | `1135510` |
| D-003 SHA | `5720088` (PR #4) |
| GitHub tip | `0207e05` (`main`) |
| Unauth snapshot (historical) | **401** |
| Signed-in snapshot (historical) | **200** |
| Hades `:5050` | Offline / unreachable — **noted**, separate from Q-001 |
| Design | Historical APPROVE WITH TICKETS; **D-003 close on merged SHA — pending Design** |
| D-003 Jason call | **Superseded by merge of fix (#4)** — was “fix, not ship-as-is” |
| **QA verdict (2026-09-16)** | **READY (technical)** for #2+#3 live tip only |
| **QA live READY on `0207e05`** | **Not recorded — QA owner** |
| Signed by (historical) | Astra QA |
| Date (historical) | 2026-09-16 |
| Docs sync | ASTRA-DOC-001 — 2026-09-17 |
