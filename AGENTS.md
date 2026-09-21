# AGENTS.md

Read [`docs/astra-os/BOOT.md`](docs/astra-os/BOOT.md) first.

That file is the single entry point for every AI agent.

## Development Workflow (Grok + Codex)

### Repository Safety
- Work exclusively in the assigned worktree (`astra-ui-main-clean`).
- Never modify `/home/comea/astra-ui/astra-ui`.
- Never run destructive Git commands (reset, clean, force push) without explicit human approval.

### Task Scope
- Follow only the named ticket or approved automation phase.
- Do not invent or expand scope.
- Stop and report if an operation would touch production services or unauthorized files.

### Verification Requirements
- Run the Development Gate (`scripts/dev-gate.sh`) before every commit.
- All of the following must pass:
  - `npm run check`
  - `npm run build`
  - Accurate working-tree status report
- Exit code must be zero for a successful gate.

### Commit & Pull Request
- Commit only files within the approved task scope.
- Push the feature branch.
- Create or update a pull request targeting `main`.
- Include the Development Gate report in the PR description.

### Human Approval
- No automatic merges or deployments.
- All merges require explicit human (CTO/EM) approval.
- Branch protection rules must enforce passing CI before merge.

### Failure Handling
- Agents may investigate ordinary test failures up to three attempts.
- Never disable tests or weaken security to obtain a passing result.
- Report persistent failures to the CTO with the gate output.

### Reporting
- Always produce the structured gate report (branch, commit, check/build status, modified files).
- Upload the Markdown report as a PR artifact when running in GitHub Actions.
