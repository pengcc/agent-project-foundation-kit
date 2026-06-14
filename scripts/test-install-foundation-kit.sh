#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
INSTALLER="$REPO_ROOT/scripts/install-foundation-kit.sh"
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
  TEST_ROOT="$REPO_ROOT/dev_locals/test-runs/install-foundation-kit/$stamp-$$"
  mkdir -p "$TEST_ROOT"

  case "$TEST_ROOT" in
    "$REPO_ROOT"/dev_locals/test-runs/install-foundation-kit/*)
      ;;
    *)
      log_fail "Test root escaped repo boundary: $TEST_ROOT"
      ;;
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

new_target() {
  local name="$1"
  local target="$TEST_ROOT/$name"
  mkdir -p "$target"
  printf '%s\n' "$target"
}

run_installer() {
  "$INSTALLER" "$@"
}

assert_file_exists() {
  local path="$1"
  [[ -f "$path" ]] || log_fail "Expected file to exist: $path"
}

assert_dir_exists() {
  local path="$1"
  [[ -d "$path" ]] || log_fail "Expected directory to exist: $path"
}

assert_file_not_exists() {
  local path="$1"
  [[ ! -e "$path" ]] || log_fail "Expected path not to exist: $path"
}

assert_same_file() {
  local expected="$1"
  local actual="$2"
  cmp -s "$expected" "$actual" || log_fail "Files differ: expected=$expected actual=$actual"
}

assert_same_tree() {
  local expected="$1"
  local actual="$2"
  diff -qr "$expected" "$actual" >/dev/null ||
    log_fail "Directory trees differ: expected=$expected actual=$actual"
}

assert_contains() {
  local path="$1"
  local pattern="$2"
  grep -q -- "$pattern" "$path" || log_fail "Expected '$path' to contain pattern: $pattern"
}

assert_path_inside() {
  local base="$1"
  local path="$2"
  case "$path" in
    "$base"/*|"$base")
      ;;
    *)
      log_fail "Path escaped boundary. base=$base path=$path"
      ;;
  esac
}

pick_first_file() {
  local dir="$1"
  local result
  result="$(find "$dir" -type f | sort | head -n 1)"
  [[ -n "$result" ]] || log_fail "Expected at least one file under $dir"
  printf '%s\n' "$result"
}

relative_to() {
  local base="$1"
  local path="$2"
  printf '%s\n' "${path#$base/}"
}

test_requires_explicit_target() {
  if run_installer > "$TEST_ROOT/missing-target-arg.out" 2>&1; then
    log_fail "Installer succeeded without required --target"
  fi

  assert_contains "$TEST_ROOT/missing-target-arg.out" "--target is required"
  log_pass "missing --target blocks"
}

test_dry_run_does_not_write() {
  local target
  target="$(new_target dry-run)"
  run_installer --target "$target" > "$TEST_ROOT/dry-run.out"

  assert_file_not_exists "$target/AGENTS.md"
  assert_file_not_exists "$target/.codex"
  assert_contains "$TEST_ROOT/dry-run.out" "Dry-run only"
  assert_contains "$TEST_ROOT/dry-run.out" "Boundary: reads only inside source kit; writes only inside target root"

  log_pass "dry-run does not write files"
}

test_apply_fresh_install() {
  local target
  target="$(new_target fresh-install)"
  run_installer --target "$target" --apply > "$TEST_ROOT/fresh-install.out"

  assert_file_exists "$target/AGENTS.md"
  assert_file_exists "$target/.codex/project/project-guideline.md"
  assert_file_exists "$target/.codex/project/project-decisions.md"
  assert_file_exists "$target/.codex/project/lessons-learned.md"
  assert_dir_exists "$target/.codex/skills"
  assert_dir_exists "$target/.codex/prompts"
  assert_dir_exists "$target/.codex/rules"
  assert_dir_exists "$target/.codex/config"
  assert_dir_exists "$target/.codex/github-settings"
  assert_dir_exists "$target/.codex/scripts"
  assert_file_exists "$target/.codex/scripts/publish-changes.sh"
  assert_file_exists "$target/.codex/scripts/publish-changes.mjs"
  assert_file_exists "$target/.codex/scripts/lib/workflow-common.sh"
  assert_file_exists "$target/.codex/config/publish-changes-policy.yml"
  assert_file_exists "$target/.codex/config/publish-cli-theme.json"
  assert_file_not_exists "$target/package.json"

  log_pass "--apply fresh install creates expected structure"
}

test_install_mapping_dynamic_samples() {
  local target
  target="$(new_target mapping)"
  run_installer --target "$target" --apply > "$TEST_ROOT/mapping.out"

  assert_same_file "$REPO_ROOT/kit/project-templates/AGENTS.md" "$target/AGENTS.md"
  assert_same_file "$REPO_ROOT/kit/project-templates/project-guideline.md" "$target/.codex/project/project-guideline.md"
  assert_same_file "$REPO_ROOT/kit/project-templates/project-decisions.md" "$target/.codex/project/project-decisions.md"
  assert_same_file "$REPO_ROOT/kit/project-templates/lessons-learned.md" "$target/.codex/project/lessons-learned.md"

  local skill_file prompt_file rule_file config_file script_file
  skill_file="$(pick_first_file "$REPO_ROOT/kit/skills")"
  prompt_file="$(pick_first_file "$REPO_ROOT/kit/prompts")"
  rule_file="$(pick_first_file "$REPO_ROOT/kit/rules")"
  config_file="$(pick_first_file "$REPO_ROOT/kit/config")"
  script_file="$(pick_first_file "$REPO_ROOT/kit/scripts")"

  local skill_rel prompt_rel rule_rel config_rel script_rel
  skill_rel="$(relative_to "$REPO_ROOT/kit/skills" "$skill_file")"
  prompt_rel="$(relative_to "$REPO_ROOT/kit/prompts" "$prompt_file")"
  rule_rel="$(relative_to "$REPO_ROOT/kit/rules" "$rule_file")"
  config_rel="$(relative_to "$REPO_ROOT/kit/config" "$config_file")"
  script_rel="$(relative_to "$REPO_ROOT/kit/scripts" "$script_file")"

  assert_same_file "$skill_file" "$target/.codex/skills/$skill_rel"
  assert_same_file "$prompt_file" "$target/.codex/prompts/$prompt_rel"
  assert_same_file "$rule_file" "$target/.codex/rules/$rule_rel"
  assert_same_file "$config_file" "$target/.codex/config/$config_rel"
  assert_same_file "$script_file" "$target/.codex/scripts/$script_rel"
  assert_same_tree "$REPO_ROOT/kit/config" "$target/.codex/config"
  assert_same_tree "$REPO_ROOT/kit/github-settings" "$target/.codex/github-settings"
  assert_same_tree "$REPO_ROOT/kit/scripts" "$target/.codex/scripts"

  assert_file_not_exists "$target/scripts/install-foundation-kit.sh"
  assert_file_not_exists "$target/dev_locals"
  assert_file_not_exists "$target/package.json"

  log_pass "install mapping verifies real kit samples, complete settings/scripts trees, and exclusions"
}

test_conflict_detection() {
  local target
  target="$(new_target conflict-dry-run)"
  printf 'existing agent instructions\n' > "$target/AGENTS.md"

  run_installer --target "$target" > "$TEST_ROOT/conflict-dry-run.out"

  assert_contains "$TEST_ROOT/conflict-dry-run.out" "Conflict Report"
  assert_contains "$TEST_ROOT/conflict-dry-run.out" "Target file: AGENTS.md"
  assert_contains "$TEST_ROOT/conflict-dry-run.out" "DANGER"
  grep -q -- "existing agent instructions" "$target/AGENTS.md" || log_fail "Dry-run changed existing AGENTS.md"

  log_pass "existing file is detected as conflict without changing it"
}

test_installed_script_conflict_is_dangerous() {
  local target
  target="$(new_target script-conflict)"
  mkdir -p "$target/.codex/scripts"
  printf 'existing publish script\n' > "$target/.codex/scripts/publish-changes.sh"

  run_installer --target "$target" > "$TEST_ROOT/script-conflict.out"

  assert_contains "$TEST_ROOT/script-conflict.out" "Target file: .codex/scripts/publish-changes.sh"
  assert_contains "$TEST_ROOT/script-conflict.out" "DANGER"
  grep -q -- "existing publish script" "$target/.codex/scripts/publish-changes.sh" ||
    log_fail "Dry-run changed existing publish script"

  log_pass "existing installed workflow script is treated as a dangerous conflict"
}

test_apply_conflict_does_not_silently_overwrite() {
  local target
  target="$(new_target conflict-no-token)"
  printf 'existing agent instructions\n' > "$target/AGENTS.md"

  if run_installer --target "$target" --apply > "$TEST_ROOT/conflict-no-token.out" 2>&1 < /dev/null; then
    log_fail "--apply with conflict succeeded without confirmation"
  fi

  grep -q -- "existing agent instructions" "$target/AGENTS.md" || log_fail "Existing AGENTS.md was overwritten without confirmation"
  assert_contains "$TEST_ROOT/conflict-no-token.out" "No confirmation token provided"

  log_pass "--apply with conflict does not silently overwrite"
}

test_backup_and_replace() {
  local target
  target="$(new_target backup-replace)"
  printf 'existing agent instructions\n' > "$target/AGENTS.md"

  printf 'INSTALL_WITH_BACKUP\n' | run_installer --target "$target" --apply > "$TEST_ROOT/backup-replace.out"

  assert_same_file "$REPO_ROOT/kit/project-templates/AGENTS.md" "$target/AGENTS.md"

  local backup_file
  backup_file="$(find "$target/.codex/backups" -path "*/AGENTS.md" -type f | head -n 1)"
  [[ -n "$backup_file" ]] || log_fail "Expected AGENTS.md backup file"
  grep -q -- "existing agent instructions" "$backup_file" || log_fail "Backup file did not preserve original AGENTS.md"
  assert_path_inside "$target/.codex/backups" "$backup_file"

  log_pass "backup-before-replace works after confirmation"
}

test_missing_kit_source_blocks() {
  local fake_repo fake_script target
  fake_repo="$TEST_ROOT/fake-foundation-repo"
  mkdir -p "$fake_repo/scripts"
  fake_script="$fake_repo/scripts/install-foundation-kit.sh"
  cp "$INSTALLER" "$fake_script"
  chmod +x "$fake_script"
  target="$(new_target missing-kit-target)"

  if "$fake_script" --target "$target" > "$TEST_ROOT/missing-kit.out" 2>&1; then
    log_fail "Installer succeeded even though kit source was missing"
  fi

  assert_contains "$TEST_ROOT/missing-kit.out" "Install source not found"

  log_pass "missing kit source blocks safely"
}

test_missing_target_blocks() {
  local missing_target
  missing_target="$TEST_ROOT/does-not-exist"

  if run_installer --target "$missing_target" > "$TEST_ROOT/missing-target.out" 2>&1; then
    log_fail "Installer succeeded with missing target"
  fi

  assert_contains "$TEST_ROOT/missing-target.out" "Target directory must already exist"
  assert_file_not_exists "$missing_target"

  log_pass "missing target blocks and does not create target"
}

test_target_equals_repo_root_blocks() {
  if run_installer --target "$REPO_ROOT" > "$TEST_ROOT/repo-root-target.out" 2>&1; then
    log_fail "Installer allowed target == repo root"
  fi

  assert_contains "$TEST_ROOT/repo-root-target.out" "Refusing to install into the foundation-kit repository itself"

  log_pass "target == repo root blocks"
}

test_target_symlink_escape_blocks() {
  local target outside
  target="$(new_target symlink-escape)"
  outside="$TEST_ROOT/outside-target"
  mkdir -p "$outside"
  mkdir -p "$target/.codex"
  ln -s "$outside" "$target/.codex/skills"

  if run_installer --target "$target" --apply > "$TEST_ROOT/symlink-escape.out" 2>&1; then
    log_fail "Installer allowed target directory symlink escape"
  fi

  assert_contains "$TEST_ROOT/symlink-escape.out" "outside allowed boundary"

  log_pass "target directory symlink escape blocks"
}

test_existing_target_file_symlink_blocks() {
  local target outside
  target="$(new_target file-symlink)"
  outside="$TEST_ROOT/outside-file-target"
  mkdir -p "$outside"
  printf 'outside file\n' > "$outside/AGENTS.md"
  ln -s "$outside/AGENTS.md" "$target/AGENTS.md"

  if run_installer --target "$target" > "$TEST_ROOT/file-symlink.out" 2>&1; then
    log_fail "Installer allowed existing target file symlink"
  fi

  assert_contains "$TEST_ROOT/file-symlink.out" "Refusing existing symlink target path"

  log_pass "existing target file symlink blocks"
}

test_artifacts_inside_repo() {
  assert_path_inside "$REPO_ROOT/dev_locals/test-runs/install-foundation-kit" "$TEST_ROOT"
  log_pass "test artifacts stay under dev_locals/test-runs"
}

main() {
  setup_test_root

  if [[ ! -x "$INSTALLER" ]]; then
    log_fail "Installer is not executable: $INSTALLER"
  fi

  bash -n "$INSTALLER"
  log_pass "installer shell syntax is valid"

  test_requires_explicit_target
  test_dry_run_does_not_write
  test_apply_fresh_install
  test_install_mapping_dynamic_samples
  test_conflict_detection
  test_installed_script_conflict_is_dangerous
  test_apply_conflict_does_not_silently_overwrite
  test_backup_and_replace
  test_missing_kit_source_blocks
  test_missing_target_blocks
  test_target_equals_repo_root_blocks
  test_target_symlink_escape_blocks
  test_existing_target_file_symlink_blocks
  test_artifacts_inside_repo

  printf '\n[PASS] All installer tests passed (%s checks).\n' "$PASS_COUNT"
}

main "$@"
