#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
PUBLISHER="$REPO_ROOT/scripts/publish-local-change.sh"
TEST_ROOT=""
PASS_COUNT=0

KEEP_TEST_OUTPUT="${KEEP_TEST_OUTPUT:-0}"

log_pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf '[PASS] %s\n' "$*"
}

log_fail() {
  printf '[FAIL] %s\n' "$*" >&2
  exit 1
}

setup_test_root() {
  local stamp
  stamp="$(date '+%Y%m%d-%H%M%S')"
  TEST_ROOT="$REPO_ROOT/dev_locals/test-runs/publish-local-change/$stamp-$$"
  mkdir -p "$TEST_ROOT"

  case "$TEST_ROOT" in
    "$REPO_ROOT"/dev_locals/test-runs/publish-local-change/*) ;;
    *) log_fail "Test root escaped repo boundary: $TEST_ROOT" ;;
  esac
}

cleanup() {
  if [[ "$KEEP_TEST_OUTPUT" == "1" ]]; then
    printf '[INFO] Keeping test output: %s\n' "$TEST_ROOT"
    return
  fi

  if [[ -n "${TEST_ROOT:-}" && -d "$TEST_ROOT" ]]; then
    rm -rf "$TEST_ROOT"
  fi
}

trap cleanup EXIT

assert_contains() {
  local path="$1"
  local pattern="$2"
  grep -Fq -- "$pattern" "$path" || log_fail "Expected '$path' to contain: $pattern"
}

assert_not_contains() {
  local path="$1"
  local pattern="$2"
  if grep -Fq -- "$pattern" "$path"; then
    log_fail "Expected '$path' not to contain: $pattern"
  fi
}

create_fake_commands() {
  local bin_dir="$TEST_ROOT/fake-bin"
  mkdir -p "$bin_dir"

  cat > "$bin_dir/git" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

state="${PUBLISH_TEST_STATE:?}"
printf 'git %s\n' "$*" >> "$state/commands.log"

if [[ "${1:-}" == "--no-pager" ]]; then
  shift
fi

case "${1:-}" in
  rev-parse)
    case "${2:-}" in
      --show-toplevel) printf '%s\n' "$PUBLISH_TEST_REPO" ;;
      --abbrev-ref)
        if [[ "${3:-}" == "--symbolic-full-name" ]]; then
          branch="$(cat "$state/branch")"
          [[ -f "$state/pushed" || "$branch" == "main" ]] || exit 1
          printf 'origin/%s\n' "$branch"
        else
          cat "$state/branch"
        fi
        ;;
      --verify)
        [[ "${3:-}" == "origin/main" ]] || exit 1
        printf 'base-sha\n'
        ;;
      HEAD) printf 'test-head-sha\n' ;;
      *) exit 1 ;;
    esac
    ;;
  remote)
    [[ "${2:-}" == "get-url" && "${3:-}" == "origin" ]] || exit 1
    printf 'git@example.test:owner/repo.git\n'
    ;;
  status)
    if [[ -f "$state/clean" ]]; then
      exit 0
    fi
    if [[ "${2:-}" == "--porcelain" || "${2:-}" == "--short" ]]; then
      printf ' M tracked.txt\n?? new.txt\n'
    fi
    ;;
  diff)
    if [[ "$*" == *"--cached"* ]]; then
      if [[ -f "$state/staged" ]]; then
        if [[ "$*" == *"--stat"* ]]; then
          printf ' tracked.txt | 1 +\n new.txt | 1 +\n'
        else
          printf 'M\ttracked.txt\nA\tnew.txt\n'
        fi
      fi
    elif [[ "$*" == *"--stat"* ]]; then
      printf ' tracked.txt | 1 +\n'
    else
      printf 'M\ttracked.txt\n'
    fi
    ;;
  ls-files)
    printf 'new.txt\n'
    ;;
  log)
    if [[ "$*" == *".."* ]]; then
      if [[ ! -f "$state/pushed" && ! -f "$state/no-unpushed" ]]; then
        printf '1111111 test commit\n'
      fi
    else
      printf 'aaaaaaa existing commit\n'
    fi
    ;;
  switch)
    if [[ "${2:-}" == "-c" ]]; then
      printf '%s\n' "$3" > "$state/branch"
    else
      printf '%s\n' "$2" > "$state/branch"
    fi
    ;;
  add)
    touch "$state/staged"
    ;;
  commit)
    touch "$state/clean"
    ;;
  push)
    touch "$state/pushed"
    ;;
  fetch|pull|branch|reset)
    if [[ "${1:-}" == "branch" ]]; then
      printf '%s\n' "${2:-}" > "$state/backup-branch"
    elif [[ "${1:-}" == "reset" ]]; then
      touch "$state/reset"
    fi
    ;;
  merge-base)
    [[ ! -f "$state/diverged" ]]
    ;;
  *)
    printf 'Unsupported fake git command: %s\n' "$*" >&2
    exit 2
    ;;
esac
EOF

  cat > "$bin_dir/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

state="${PUBLISH_TEST_STATE:?}"
printf 'gh %s\n' "$*" >> "$state/commands.log"

case "${1:-} ${2:-}" in
  "auth status")
    exit 0
    ;;
  "repo view")
    printf 'owner/repo\n'
    ;;
  "pr view")
    if [[ "$*" == *"--web"* ]]; then
      exit 0
    fi
    [[ -f "$state/pr-exists" ]] || exit 1
    branch="$(cat "$state/branch")"
    base="main"
    draft="false"
    mergeable="MERGEABLE"
    merge_state="CLEAN"
    head_oid="test-head-sha"
    [[ -f "$state/wrong-base" ]] && base="develop"
    [[ -f "$state/draft" ]] && draft="true"
    [[ -f "$state/conflicting" ]] && mergeable="CONFLICTING"
    [[ -f "$state/unknown-merge" ]] && merge_state="UNKNOWN"
    [[ -f "$state/wrong-head" ]] && head_oid="different-head-sha"
    merged_at=""
    state_name="OPEN"
    if [[ -f "$state/merged" ]]; then
      merged_at="2026-06-12T12:00:00Z"
      state_name="MERGED"
    fi
    printf '42\037https://example.test/pr/42\037%s\037%s\037%s\037%s\037%s\037%s\037%s\037%s\037APPROVED\n' \
      "$state_name" "$base" "$branch" "$draft" "$mergeable" "$merge_state" "$head_oid" "$merged_at"
    ;;
  "pr create")
    touch "$state/pr-exists"
    printf 'https://example.test/pr/42\n'
    ;;
  "pr comment")
    ;;
  "pr checks")
    if [[ -f "$state/check-pending" ]]; then
      printf 'pending\n'
      exit 8
    fi
    if [[ -f "$state/check-fail" ]]; then
      printf 'fail\n'
      exit 1
    fi
    printf 'pass\n'
    ;;
  "pr merge")
    if [[ "$*" == *"--auto"* ]]; then
      touch "$state/auto-merge"
    else
      touch "$state/merged"
    fi
    ;;
  *)
    printf 'Unsupported fake gh command: %s\n' "$*" >&2
    exit 2
    ;;
esac
EOF

  chmod +x "$bin_dir/git" "$bin_dir/gh"
}

new_case() {
  local name="$1"
  local case_root="$TEST_ROOT/$name"
  mkdir -p "$case_root/repo/dev_locals" "$case_root/state"
  printf 'main\n' > "$case_root/state/branch"
  : > "$case_root/state/commands.log"
  printf '%s\n' "$case_root"
}

run_case() {
  local case_root="$1"
  local input="$2"
  local output="$3"

  printf '%s' "$input" | env \
    PATH="$TEST_ROOT/fake-bin:$PATH" \
    NO_COLOR=1 \
    PUBLISH_TEST_STATE="$case_root/state" \
    PUBLISH_TEST_REPO="$case_root/repo" \
    bash "$PUBLISHER" "Test Theme 16.1 change" > "$output" 2>&1
}

test_small_safe_preapproval() {
  local case_root output
  case_root="$(new_case small-safe)"
  output="$case_root/output.log"

  run_case "$case_root" $'SMALL_SAFE\nValidated shell behavior locally\n1\n' "$output"

  assert_contains "$output" "SMALL_SAFE accepted as explicit pre-approval."
  assert_contains "$output" "Manual pre-commit gates skipped"
  assert_contains "$case_root/state/commands.log" "git switch -c change/"
  assert_contains "$case_root/state/commands.log" "git add -A"
  assert_contains "$case_root/state/commands.log" "git push -u origin change/"
  assert_contains "$case_root/state/commands.log" "gh pr create"
  assert_not_contains "$case_root/state/commands.log" "git push -u origin main"
  assert_not_contains "$case_root/state/commands.log" "gh pr merge"

  log_pass "SMALL_SAFE is one typed pre-approval and still publishes through feature branch + PR"
}

test_normal_auto_merge() {
  local case_root output
  case_root="$(new_case normal-auto)"
  output="$case_root/output.log"

  run_case "$case_root" $'NORMAL\ny\ny\nRan deterministic workflow tests\n2\nI HAVE REVIEWED THE PR AND APPROVE SQUASH MERGE\n' "$output"

  assert_contains "$case_root/state/commands.log" "gh pr merge 42 --repo owner/repo --auto --squash --match-head-commit"
  assert_contains "$output" "Enabled squash auto-merge"
  assert_contains "$output" "Exiting without polling for merge completion"
  assert_not_contains "$case_root/state/commands.log" "git switch main"
  assert_not_contains "$case_root/state/commands.log" "git fetch origin main"
  assert_not_contains "$case_root/state/commands.log" "git pull --ff-only origin main"

  log_pass "normal mode supports reviewed squash auto-merge without premature main refresh"
}

test_significant_immediate_merge_and_refresh() {
  local case_root output
  case_root="$(new_case significant-immediate)"
  output="$case_root/output.log"

  run_case "$case_root" $'SIGNIFICANT\ny\nCHANGES_MATCH_APPROVED_PLAN\nRan full local and manual validation\nVALIDATION_CONFIRMED\n3\nI HAVE REVIEWED THE PR AND APPROVE SQUASH MERGE\nI APPROVE HIGH IMPACT MERGE\ny\n' "$output"

  assert_contains "$case_root/state/commands.log" "gh pr merge 42 --repo owner/repo --squash --match-head-commit"
  assert_contains "$case_root/state/commands.log" "git fetch origin main"
  assert_contains "$case_root/state/commands.log" "git switch main"
  assert_contains "$case_root/state/commands.log" "git pull --ff-only origin main"

  log_pass "significant mode requires typed approvals and refreshes only after verified merge"
}

test_diverged_main_requires_typed_reset() {
  local case_root output
  case_root="$(new_case diverged-reset)"
  output="$case_root/output.log"
  touch "$case_root/state/diverged"

  run_case "$case_root" $'NORMAL\ny\ny\nValidated reset recovery\n3\nI HAVE REVIEWED THE PR AND APPROVE SQUASH MERGE\ny\nRESET_MAIN_TO_ORIGIN\n' "$output"

  assert_contains "$output" "Backup branch created:"
  assert_contains "$case_root/state/commands.log" "git branch backup/main-before-reset-"
  assert_contains "$case_root/state/commands.log" "git reset --hard origin/main"
  [[ -f "$case_root/state/reset" ]] || log_fail "Expected typed reset approval to run git reset"

  log_pass "diverged main creates a backup and requires RESET_MAIN_TO_ORIGIN before hard reset"
}

test_diverged_main_wrong_token_preserves_backup() {
  local case_root output
  case_root="$(new_case diverged-reset-blocked)"
  output="$case_root/output.log"
  touch "$case_root/state/diverged"

  if run_case "$case_root" $'NORMAL\ny\ny\nValidated reset refusal\n3\nI HAVE REVIEWED THE PR AND APPROVE SQUASH MERGE\ny\nWRONG_TOKEN\n' "$output"; then
    log_fail "Wrong reset token unexpectedly completed the refresh flow"
  fi

  assert_contains "$output" "Skipped reset. Local 'main' may still be diverged."
  assert_contains "$output" "Backup branch preserved:"
  assert_contains "$case_root/state/commands.log" "git branch backup/main-before-reset-"
  assert_not_contains "$case_root/state/commands.log" "git reset --hard origin/main"
  [[ ! -f "$case_root/state/reset" ]] || log_fail "Wrong reset token unexpectedly ran git reset"

  log_pass "wrong reset token blocks hard reset and preserves the backup branch"
}

test_significant_plan_token_blocks() {
  local case_root output
  case_root="$(new_case significant-block)"
  output="$case_root/output.log"

  if run_case "$case_root" $'SIGNIFICANT\ny\nWRONG_TOKEN\n' "$output"; then
    log_fail "Significant workflow succeeded with wrong plan confirmation token"
  fi

  assert_contains "$output" "high-impact plan consistency was not confirmed"
  assert_not_contains "$case_root/state/commands.log" "git commit"
  assert_not_contains "$case_root/state/commands.log" "git push"

  log_pass "significant mode blocks before commit when typed plan confirmation fails"
}

test_existing_pr_gets_publish_record() {
  local case_root output
  case_root="$(new_case existing-pr)"
  output="$case_root/output.log"
  touch "$case_root/state/pr-exists"

  run_case "$case_root" $'NORMAL\ny\ny\nValidated existing PR update\n1\n' "$output"

  assert_contains "$case_root/state/commands.log" "gh pr comment 42"
  assert_not_contains "$case_root/state/commands.log" "gh pr create"
  assert_contains "$output" "Updated existing PR #42 with the publish record."

  log_pass "existing PR receives a validation/classification publish record"
}

test_pending_checks_require_auto_merge() {
  local case_root output
  case_root="$(new_case pending-immediate)"
  output="$case_root/output.log"
  touch "$case_root/state/check-pending"

  if run_case "$case_root" $'NORMAL\ny\ny\nValidated pending check handling\n3\n' "$output"; then
    log_fail "Immediate merge succeeded while required checks were pending"
  fi

  assert_contains "$output" "Required checks are pending."
  assert_not_contains "$case_root/state/commands.log" "gh pr merge"

  log_pass "pending required checks block immediate merge and direct users to auto-merge"
}

test_merge_state_guards() {
  local condition expected case_root output

  for condition in wrong-base draft conflicting wrong-head unknown-merge; do
    case_root="$(new_case "guard-$condition")"
    output="$case_root/output.log"
    touch "$case_root/state/$condition"

    case "$condition" in
      wrong-base) expected="targets 'develop', not 'main'" ;;
      draft) expected="is a draft" ;;
      conflicting) expected="has merge conflicts" ;;
      wrong-head) expected="PR head commit does not match local HEAD" ;;
      unknown-merge) expected="has not resolved PR merge readiness" ;;
    esac

    if run_case "$case_root" $'NORMAL\ny\ny\nValidated PR guard behavior\n2\n' "$output"; then
      log_fail "Merge flow succeeded for guarded condition: $condition"
    fi

    assert_contains "$output" "$expected"
    assert_not_contains "$case_root/state/commands.log" "gh pr merge"
  done

  log_pass "base, draft, conflict, head, and unknown merge-state guards block merge commands"
}

test_no_changes_is_noop() {
  local case_root output
  case_root="$(new_case no-op)"
  output="$case_root/output.log"
  touch "$case_root/state/clean" "$case_root/state/no-unpushed"

  run_case "$case_root" $'NORMAL\n' "$output"

  assert_contains "$output" "Nothing to publish."
  assert_not_contains "$case_root/state/commands.log" "git switch -c"
  assert_not_contains "$case_root/state/commands.log" "git push"
  assert_not_contains "$case_root/state/commands.log" "gh pr"

  log_pass "clean branch without unpushed commits exits without branch, push, or PR actions"
}

test_artifacts_inside_repo() {
  case "$TEST_ROOT" in
    "$REPO_ROOT"/dev_locals/test-runs/publish-local-change/*) ;;
    *) log_fail "Test artifacts escaped repository: $TEST_ROOT" ;;
  esac

  log_pass "test artifacts stay under dev_locals/test-runs"
}

test_workflow_temp_helpers_stay_inside_repo() {
  local temp_file temp_dir temp_root
  # shellcheck source=scripts/lib/workflow-common.sh
  source "$REPO_ROOT/scripts/lib/workflow-common.sh"

  temp_root="$REPO_ROOT/dev_locals/workflow-tmp"
  temp_file="$(make_workflow_temp_file "publish-test")"
  temp_dir="$(make_workflow_temp_dir "publish-test")"

  case "$temp_file" in
    "$temp_root"/*) ;;
    *) log_fail "Workflow temp file escaped repository: $temp_file" ;;
  esac
  case "$temp_dir" in
    "$temp_root"/*) ;;
    *) log_fail "Workflow temp directory escaped repository: $temp_dir" ;;
  esac

  rm -f "$temp_file"
  rmdir "$temp_dir"
  rmdir "$temp_root" 2>/dev/null || true

  log_pass "shared workflow temp helpers stay under dev_locals/workflow-tmp"
}

main() {
  setup_test_root
  create_fake_commands

  bash -n "$PUBLISHER" "$REPO_ROOT/scripts/lib/workflow-common.sh"
  log_pass "publish workflow shell syntax is valid"

  test_small_safe_preapproval
  test_normal_auto_merge
  test_significant_immediate_merge_and_refresh
  test_diverged_main_requires_typed_reset
  test_diverged_main_wrong_token_preserves_backup
  test_significant_plan_token_blocks
  test_existing_pr_gets_publish_record
  test_pending_checks_require_auto_merge
  test_merge_state_guards
  test_no_changes_is_noop
  test_artifacts_inside_repo
  test_workflow_temp_helpers_stay_inside_repo

  printf '\n[PASS] All publish workflow tests passed (%s checks).\n' "$PASS_COUNT"
}

main "$@"
