#!/usr/bin/env bash
set -euo pipefail

# Astra Development Gate v1
# Reusable local verification workflow for Grok and Codex agents.
# Does NOT commit, push, merge, reset, clean, or deploy.

EXPECTED_REMOTE="https://github.com/biggyclops/astra-ui.git"

# Derive repository root from the script location when possible,
# otherwise fall back to the current working directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -d "$SCRIPT_DIR/../.git" || -f "$SCRIPT_DIR/../.git" ]]; then
  REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  REPO_ROOT="$(pwd)"
fi

# Explicitly enter the validated repository root before any Git or npm commands
if [[ -d "$REPO_ROOT/.git" || -f "$REPO_ROOT/.git" ]]; then
  cd "$REPO_ROOT" || { echo "FAIL: Cannot cd to validated REPO_ROOT"; exit 1; }
else
  echo "FAIL: Validated REPO_ROOT does not contain a git repository"
  exit 1
fi

echo "=== Astra Development Gate v1 ==="
echo "Timestamp: $(date -Iseconds)"
echo

# 1. Repository and directory confirmation
if [[ ! -e .git ]]; then
  echo "FAIL: Not inside a git repository or worktree"
  exit 1
fi

REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
# Accept both with and without .git suffix
if [[ "$REMOTE_URL" != "$EXPECTED_REMOTE" && "$REMOTE_URL" != "${EXPECTED_REMOTE%.git}" ]]; then
  echo "FAIL: Unexpected remote: $REMOTE_URL"
  exit 1
fi

echo "Repository: $REPO_ROOT"
echo "Remote: $REMOTE_URL"
echo

# 2. Branch and upstream
BRANCH=$(git rev-parse --abbrev-ref HEAD)
UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "none")
echo "Branch: $BRANCH"
echo "Upstream: $UPSTREAM"
echo

# 3. Uncommitted changes check (non-destructive)
UNTRACKED=$(git ls-files --others --exclude-standard)
MODIFIED_TRACKED=$(git diff --name-only)
STAGED=$(git diff --cached --name-only)

if [[ -n "$UNTRACKED" || -n "$MODIFIED_TRACKED" || -n "$STAGED" ]]; then
  echo "Working tree status:"
  [[ -n "$UNTRACKED" ]] && echo "  Untracked files present"
  [[ -n "$MODIFIED_TRACKED" ]] && echo "  Modified tracked files present"
  [[ -n "$STAGED" ]] && echo "  Staged changes present"
  git status --short
else
  echo "Working tree: clean"
fi
echo

# 4. Type check and build
echo "Running npm run check..."
if npm run check; then
  CHECK_EXIT=0
  echo "check: PASS (exit 0)"
else
  CHECK_EXIT=$?
  echo "check: FAIL (exit $CHECK_EXIT)"
fi
echo

echo "Running npm run build..."
if npm run build; then
  BUILD_EXIT=0
  echo "build: PASS (exit 0)"
else
  BUILD_EXIT=$?
  echo "build: FAIL (exit $BUILD_EXIT)"
fi
echo

# 5. Git diff inspection
MODIFIED=$(git diff --name-only HEAD)
if [[ -n "$MODIFIED" ]]; then
  echo "Modified files:"
  echo "$MODIFIED"
else
  echo "No modified files relative to HEAD"
fi
echo

# 6. Scope check (placeholder for task-specific rules)
echo "Scope verification: manual review required by agent"
echo

# 7. Structured report
COMMIT=$(git rev-parse HEAD)
echo "=== Development Gate Report ==="
echo "branch: $BRANCH"
echo "commit: $COMMIT"
echo "upstream: $UPSTREAM"
echo "check_exit: $CHECK_EXIT"
echo "build_exit: $BUILD_EXIT"
echo "modified_files:"
echo "$MODIFIED" | sed 's/^/  - /'
echo "unresolved_issues: see above warnings"
echo

if [[ $CHECK_EXIT -ne 0 || $BUILD_EXIT -ne 0 ]]; then
  echo "Gate FAILED"
  exit 1
fi

echo "Gate PASSED"
exit 0
