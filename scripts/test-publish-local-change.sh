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
    if [[ "$*" == *"--format=%s"* ]]; then
      printf 'Existing unpushed commit\n'
    elif [[ "$*" == *".."* ]]; then
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
    if [[ -f "$state/diverged" && "${3:-}" == "HEAD" ]]; then
      exit 1
    fi
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
    if [[ -f "$state/gh-unauthenticated" ]]; then
      exit 1
    fi
    exit 0
    ;;
  "repo view")
    printf 'owner/repo\n'
    ;;
  "pr list")
    if [[ "$*" == *"--head"* ]]; then
      if [[ -f "$state/pr-exists" ]]; then
        printf '42\n'
      fi
    elif [[ -f "$state/repo-open-prs" || -f "$state/pr-exists" ]]; then
      printf '#42 | Existing work | prerequisite-branch -> main | https://example.test/pr/42\n'
    fi
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
    printf '42\037https://example.test/pr/42\037%s\037%s\037%s\037%s\037%s\037%s\037%s\037%s\037APPROVED\037Existing PR title\n' \
      "$state_name" "$base" "$branch" "$draft" "$mergeable" "$merge_state" "$head_oid" "$merged_at"
    ;;
  "pr create")
    touch "$state/pr-exists"
    printf 'https://example.test/pr/42\n'
    ;;
  "pr comment")
    ;;
  "pr checks")
    if [[ -f "$state/check-error" ]]; then
      printf 'HTTP 403: Resource not accessible by integration\n' >&2
      exit 1
    fi
    if [[ -f "$state/no-checks" ]]; then
      printf "no required checks reported on the 'main' branch\n" >&2
      exit 1
    fi
    if [[ -f "$state/check-pending" ]]; then
      printf 'pending|IN_PROGRESS\n'
      exit 8
    fi
    if [[ -f "$state/check-fail" ]]; then
      printf 'fail|FAILURE\n'
      exit 1
    fi
    printf 'pass|SUCCESS\n'
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

run_case_without_message() {
  local case_root="$1"
  local input="$2"
  local output="$3"

  printf '%s' "$input" | env \
    PATH="$TEST_ROOT/fake-bin:$PATH" \
    NO_COLOR=1 \
    PUBLISH_TEST_STATE="$case_root/state" \
    PUBLISH_TEST_REPO="$case_root/repo" \
    bash "$PUBLISHER" > "$output" 2>&1
}

test_prompted_commit_message() {
  local case_root output
  case_root="$(new_case prompted-message)"
  output="$case_root/output.log"

  run_case_without_message "$case_root" $'Prompted commit message\nSMALL_SAFE\n1\n' "$output"

  assert_contains "$output" "Enter commit message:"
  assert_contains "$case_root/state/commands.log" "git commit -m Prompted commit message"
  assert_contains "$case_root/state/commands.log" "gh pr create"

  log_pass "omitted commit message prompts and uses the entered message"
}

test_empty_prompted_commit_message_blocks() {
  local case_root output
  case_root="$(new_case empty-prompted-message)"
  output="$case_root/output.log"

  if run_case_without_message "$case_root" $'   \n' "$output"; then
    log_fail "Whitespace-only prompted commit message unexpectedly succeeded"
  fi

  assert_contains "$output" "Commit message must not be empty."
  assert_not_contains "$case_root/state/commands.log" "git commit"
  assert_not_contains "$case_root/state/commands.log" "git push"
  assert_not_contains "$case_root/state/commands.log" "gh pr create"
  assert_not_contains "$case_root/state/commands.log" "gh pr merge"

  log_pass "empty or whitespace-only prompted commit message is rejected"
}

test_quoted_commit_message_argument() {
  local case_root output
  case_root="$(new_case quoted-message)"
  output="$case_root/output.log"

  run_case "$case_root" $'SMALL_SAFE\n1\n' "$output"

  assert_not_contains "$output" "Enter commit message:"
  assert_contains "$case_root/state/commands.log" "git commit -m Test Theme 16.1 change"

  log_pass "existing quoted commit message argument remains supported"
}

test_small_safe_preapproval() {
  local case_root output
  case_root="$(new_case small-safe)"
  output="$case_root/output.log"

  run_case "$case_root" $'SMALL_SAFE\n1\n' "$output"

  assert_contains "$output" "SMALL_SAFE accepted as explicit pre-approval."
  assert_contains "$output" "Manual pre-commit gates skipped"
  assert_contains "$output" "validation prompt skipped because the user typed SMALL_SAFE"
  assert_not_contains "$output" "Describe the validation completed"
  assert_contains "$case_root/state/commands.log" "SMALL_SAFE_PREAPPROVED - validation prompt skipped by explicit small-safe pre-approval."
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

  run_case "$case_root" $'NORMAL\ny\ny\nCHECK_PASSED\n2\nI HAVE REVIEWED THE PR AND APPROVE SQUASH MERGE\n' "$output"

  assert_contains "$case_root/state/commands.log" "gh pr merge 42 --repo owner/repo --auto --squash --match-head-commit"
  assert_contains "$output" "Enabled squash auto-merge"
  assert_contains "$output" "Exiting without polling for merge completion"
  assert_not_contains "$case_root/state/commands.log" "git switch main"
  assert_not_contains "$case_root/state/commands.log" "git pull --ff-only origin main"

  log_pass "normal mode supports reviewed squash auto-merge without premature main refresh"
}

test_significant_immediate_merge_and_refresh() {
  local case_root output
  case_root="$(new_case significant-immediate)"
  output="$case_root/output.log"

  run_case "$case_root" $'SIGNIFICANT\ny\ny\nMANUAL_TESTED\n3\nI HAVE REVIEWED THE PR AND APPROVE SQUASH MERGE\nI APPROVE HIGH IMPACT MERGE\ny\n' "$output"

  assert_contains "$case_root/state/commands.log" "gh pr merge 42 --repo owner/repo --squash --match-head-commit"
  assert_contains "$case_root/state/commands.log" "git fetch origin main"
  assert_contains "$case_root/state/commands.log" "git switch main"
  assert_contains "$case_root/state/commands.log" "git pull --ff-only origin main"

  log_pass "significant mode uses structured validation and refreshes only after verified merge"
}

test_diverged_main_requires_typed_reset() {
  local case_root output
  case_root="$(new_case diverged-reset)"
  output="$case_root/output.log"
  touch "$case_root/state/diverged"

  run_case "$case_root" $'NORMAL\ny\ny\nCHECK_PASSED\n3\nI HAVE REVIEWED THE PR AND APPROVE SQUASH MERGE\ny\nRESET_MAIN_TO_ORIGIN\n' "$output"

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

  if run_case "$case_root" $'NORMAL\ny\ny\nCHECK_PASSED\n3\nI HAVE REVIEWED THE PR AND APPROVE SQUASH MERGE\ny\nWRONG_TOKEN\n' "$output"; then
    log_fail "Wrong reset token unexpectedly completed the refresh flow"
  fi

  assert_contains "$output" "Skipped reset. Local 'main' may still be diverged."
  assert_contains "$output" "Backup branch preserved:"
  assert_contains "$case_root/state/commands.log" "git branch backup/main-before-reset-"
  assert_not_contains "$case_root/state/commands.log" "git reset --hard origin/main"
  [[ ! -f "$case_root/state/reset" ]] || log_fail "Wrong reset token unexpectedly ran git reset"

  log_pass "wrong reset token blocks hard reset and preserves the backup branch"
}

test_significant_plan_confirmation_blocks() {
  local case_root output
  case_root="$(new_case significant-block)"
  output="$case_root/output.log"

  if run_case "$case_root" $'SIGNIFICANT\ny\nn\n' "$output"; then
    log_fail "Significant workflow succeeded without plan confirmation"
  fi

  assert_contains "$output" "high-impact plan consistency was not confirmed"
  assert_not_contains "$case_root/state/commands.log" "git commit"
  assert_not_contains "$case_root/state/commands.log" "git push"

  log_pass "significant mode blocks before commit when plan confirmation fails"
}

test_existing_pr_gets_publish_record() {
  local case_root output
  case_root="$(new_case existing-pr)"
  output="$case_root/output.log"
  touch "$case_root/state/pr-exists"
  printf 'existing-feature\n' > "$case_root/state/branch"

  run_case "$case_root" $'y\nNORMAL\ny\nCHECK_PASSED\n1\n' "$output"

  assert_contains "$case_root/state/commands.log" "gh pr comment 42"
  assert_not_contains "$case_root/state/commands.log" "gh pr create"
  assert_contains "$output" "Current branch already has an open pull request."
  assert_contains "$output" "Title: Existing PR title"
  assert_contains "$output" "Updated existing PR #42 with the publish record."

  log_pass "existing PR receives a validation/classification publish record"
}

test_clean_existing_pr_continues_without_commit_or_push() {
  local case_root output
  case_root="$(new_case clean-existing-pr)"
  output="$case_root/output.log"
  touch "$case_root/state/clean" "$case_root/state/no-unpushed" "$case_root/state/pr-exists"
  printf 'existing-feature\n' > "$case_root/state/branch"

  run_case_without_message "$case_root" $'y\nNORMAL\ny\nCHECK_PASSED\n1\n' "$output"

  assert_not_contains "$output" "Enter commit message:"
  assert_contains "$output" "Using existing PR title: Existing PR title"
  assert_contains "$case_root/state/commands.log" "gh pr comment 42"
  assert_not_contains "$case_root/state/commands.log" "git commit"
  assert_not_contains "$case_root/state/commands.log" "git push -u"

  log_pass "clean branch with an existing PR continues without commit or push"
}

test_pending_checks_require_auto_merge() {
  local case_root output
  case_root="$(new_case pending-immediate)"
  output="$case_root/output.log"
  touch "$case_root/state/check-pending"

  if run_case "$case_root" $'NORMAL\ny\ny\nCHECK_PASSED\n3\n' "$output"; then
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

    if run_case "$case_root" $'NORMAL\ny\ny\nCHECK_PASSED\n2\n' "$output"; then
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

  run_case_without_message "$case_root" '' "$output"

  assert_contains "$output" "Nothing to publish."
  assert_not_contains "$output" "Enter commit message:"
  assert_not_contains "$case_root/state/commands.log" "git switch -c"
  assert_not_contains "$case_root/state/commands.log" "git push"
  assert_not_contains "$case_root/state/commands.log" "gh pr create"
  assert_not_contains "$case_root/state/commands.log" "gh pr merge"

  log_pass "clean branch without unpushed commits exits without branch, push, or PR actions"
}

test_unpushed_commit_skips_commit_message_prompt() {
  local case_root output
  case_root="$(new_case unpushed-no-message)"
  output="$case_root/output.log"
  touch "$case_root/state/clean"
  printf 'existing-feature\n' > "$case_root/state/branch"

  run_case_without_message "$case_root" $'NORMAL\ny\nCHECK_PASSED\n1\n' "$output"

  assert_not_contains "$output" "Enter commit message:"
  assert_contains "$output" "Using latest commit subject as PR title: Existing unpushed commit"
  assert_not_contains "$case_root/state/commands.log" "git commit"
  assert_contains "$case_root/state/commands.log" "gh pr create"
  assert_contains "$case_root/state/commands.log" "--title Existing unpushed commit"

  log_pass "unpushed commits use the latest commit subject without prompting for a commit message"
}

test_repository_open_pr_warning_requires_confirmation() {
  local case_root output
  case_root="$(new_case repository-open-prs)"
  output="$case_root/output.log"
  touch "$case_root/state/repo-open-prs"

  run_case "$case_root" $'y\nSMALL_SAFE\n1\n' "$output"

  assert_contains "$output" "Open pull requests already exist in this repository:"
  assert_contains "$output" "#42 | Existing work | prerequisite-branch -> main | https://example.test/pr/42"
  assert_contains "$output" "Confirm whether any listed PR is prerequisite work"
  assert_contains "$case_root/state/commands.log" "gh pr create"

  log_pass "repository-level open PRs are listed and require confirmation before continuing"
}

test_unauthenticated_gh_requires_confirmation() {
  local case_root output
  case_root="$(new_case unauthenticated-gh)"
  output="$case_root/output.log"
  touch "$case_root/state/clean" "$case_root/state/no-unpushed" "$case_root/state/gh-unauthenticated"

  if run_case_without_message "$case_root" $'n\n' "$output"; then
    log_fail "Unauthenticated GitHub preflight unexpectedly continued without confirmation"
  fi

  assert_contains "$output" "GitHub CLI is not authenticated"
  assert_contains "$output" "Stopped during GitHub preflight."
  assert_not_contains "$case_root/state/commands.log" "gh pr create"

  log_pass "unauthenticated GitHub CLI requires explicit confirmation to continue"
}

test_normal_validation_choice() {
  local case_root output
  case_root="$(new_case normal-validation)"
  output="$case_root/output.log"

  run_case "$case_root" $'NORMAL\ny\ny\nDOC_REVIEWED\n1\n' "$output"

  assert_contains "$output" "Type a validation code:"
  assert_contains "$case_root/state/commands.log" "DOC_REVIEWED - documentation/text-only change reviewed manually."

  log_pass "normal mode records a structured validation choice"
}

test_significant_rejects_not_run() {
  local case_root output
  case_root="$(new_case significant-not-run)"
  output="$case_root/output.log"

  if run_case "$case_root" $'SIGNIFICANT\ny\ny\nNOT_RUN\n' "$output"; then
    log_fail "Significant workflow unexpectedly accepted NOT_RUN"
  fi

  assert_contains "$output" "SIGNIFICANT updates require CHECK_PASSED, MANUAL_REVIEWED, or MANUAL_TESTED."
  assert_not_contains "$case_root/state/commands.log" "git push"

  log_pass "significant mode rejects NOT_RUN validation"
}

test_no_required_checks_allows_immediate_merge() {
  local case_root output
  case_root="$(new_case no-required-checks)"
  output="$case_root/output.log"
  touch "$case_root/state/no-checks"

  run_case "$case_root" $'NORMAL\ny\ny\nCHECK_PASSED\n3\nI HAVE REVIEWED THE PR AND APPROVE SQUASH MERGE\nn\n' "$output"

  assert_contains "$output" "Required check state: none reported"
  assert_contains "$case_root/state/commands.log" "gh pr merge 42 --repo owner/repo --squash"

  log_pass "no required checks reported allows immediate merge"
}

test_pending_checks_allow_auto_merge() {
  local case_root output
  case_root="$(new_case pending-auto)"
  output="$case_root/output.log"
  touch "$case_root/state/check-pending"

  run_case "$case_root" $'NORMAL\ny\ny\nCHECK_PASSED\n2\nI HAVE REVIEWED THE PR AND APPROVE SQUASH MERGE\n' "$output"

  assert_contains "$output" "auto-merge may wait for them to complete"
  assert_contains "$case_root/state/commands.log" "gh pr merge 42 --repo owner/repo --auto --squash"

  log_pass "pending required checks allow auto-merge"
}

test_failing_checks_block_merge() {
  local case_root output
  case_root="$(new_case failing-checks)"
  output="$case_root/output.log"
  touch "$case_root/state/check-fail"

  if run_case "$case_root" $'NORMAL\ny\ny\nCHECK_PASSED\n2\n' "$output"; then
    log_fail "Merge workflow unexpectedly continued with failing required checks"
  fi

  assert_contains "$output" "Required checks are failing: fail|FAILURE"
  assert_not_contains "$case_root/state/commands.log" "gh pr merge"

  log_pass "failing required checks block merge"
}

test_gh_check_error_prints_stderr_and_blocks_merge() {
  local case_root output
  case_root="$(new_case check-cli-error)"
  output="$case_root/output.log"
  touch "$case_root/state/check-error"

  if run_case "$case_root" $'NORMAL\ny\ny\nCHECK_PASSED\n3\n' "$output"; then
    log_fail "Merge workflow unexpectedly continued after gh checks error"
  fi

  assert_contains "$output" "[ERROR] Could not verify required checks with GitHub CLI."
  assert_contains "$output" "HTTP 403: Resource not accessible by integration"
  assert_not_contains "$case_root/state/commands.log" "gh pr merge"

  log_pass "GitHub CLI check errors preserve stderr and block merge"
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
  test_prompted_commit_message
  test_empty_prompted_commit_message_blocks
  test_quoted_commit_message_argument
  test_normal_auto_merge
  test_significant_immediate_merge_and_refresh
  test_diverged_main_requires_typed_reset
  test_diverged_main_wrong_token_preserves_backup
  test_significant_plan_confirmation_blocks
  test_existing_pr_gets_publish_record
  test_clean_existing_pr_continues_without_commit_or_push
  test_unpushed_commit_skips_commit_message_prompt
  test_repository_open_pr_warning_requires_confirmation
  test_unauthenticated_gh_requires_confirmation
  test_normal_validation_choice
  test_significant_rejects_not_run
  test_no_required_checks_allows_immediate_merge
  test_pending_checks_require_auto_merge
  test_pending_checks_allow_auto_merge
  test_failing_checks_block_merge
  test_gh_check_error_prints_stderr_and_blocks_merge
  test_merge_state_guards
  test_no_changes_is_noop
  test_artifacts_inside_repo
  test_workflow_temp_helpers_stay_inside_repo

  printf '\n[PASS] All publish workflow tests passed (%s checks).\n' "$PASS_COUNT"
}

main "$@"
