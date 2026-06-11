#!/usr/bin/env bash
set -euo pipefail

APPLY=0
TARGET_ARG=""
CONFIRM_TOKEN="INSTALL_WITH_BACKUP"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT=""
KIT_ROOT=""
TARGET_ROOT=""

MANIFEST_FILE=""
CONFLICT_FILE=""
BACKUP_ROOT=""

log_info() { printf '[INFO] %s\n' "$*"; }
log_warning() { printf '[WARNING] %s\n' "$*"; }
log_danger() { printf '[DANGER] %s\n' "$*"; }
log_blocked() { printf '[BLOCKED] %s\n' "$*" >&2; }

usage() {
  cat <<'EOF'
Usage:
  scripts/install-foundation-kit.sh --target /path/to/target-project [--apply]

Default mode is dry-run. No files are written unless --apply is provided.

Controlled boundary exception:
  source: current foundation-kit repo's kit/
  target: explicit --target project directory

The installer reads only from source kit/ and writes only inside target root.

Options:
  --target PATH   Required. Existing target project root.
  --apply         Apply the install plan. Without this, only prints a dry-run plan.
  -h, --help      Show this help.
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --target)
        if [[ $# -lt 2 ]]; then
          log_blocked "--target requires a path."
          exit 2
        fi
        TARGET_ARG="$2"
        shift 2
        ;;
      --apply)
        APPLY=1
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        log_blocked "Unknown argument: $1"
        usage
        exit 2
        ;;
    esac
  done

  if [[ -z "$TARGET_ARG" ]]; then
    log_blocked "--target is required."
    usage
    exit 2
  fi
}

canonical_existing_dir() {
  local path="$1"

  if [[ ! -d "$path" ]]; then
    return 1
  fi

  (cd "$path" && pwd -P)
}

canonical_existing_file() {
  local path="$1"

  if [[ ! -f "$path" ]]; then
    return 1
  fi

  local dir
  dir="$(cd "$(dirname "$path")" && pwd -P)"
  printf '%s/%s\n' "$dir" "$(basename "$path")"
}

nearest_existing_parent() {
  local path="$1"
  local parent
  parent="$(dirname "$path")"

  while [[ ! -e "$parent" ]]; do
    local next
    next="$(dirname "$parent")"
    if [[ "$next" == "$parent" ]]; then
      return 1
    fi
    parent="$next"
  done

  if [[ ! -d "$parent" ]]; then
    return 1
  fi

  canonical_existing_dir "$parent"
}

resolve_repo_root() {
  REPO_ROOT="$(canonical_existing_dir "$SCRIPT_DIR/..")"
  # Do not canonicalize KIT_ROOT here. Missing kit/ should be reported by check_source_kit
  # with a clear [BLOCKED] message instead of failing silently under set -e.
  KIT_ROOT="$REPO_ROOT/kit"
}

resolve_target_root() {
  # Do not call this until check_target has verified the target directory exists.
  TARGET_ROOT="$(canonical_existing_dir "$TARGET_ARG")"
}

make_temp_files() {
  # Internal runtime files stay inside this repo, never in system temp directories.
  local run_root="$REPO_ROOT/dev_locals/test-runs/install-foundation-kit/runtime"
  mkdir -p "$run_root"

  MANIFEST_FILE="$run_root/manifest.$$"
  CONFLICT_FILE="$run_root/conflicts.$$"

  : > "$MANIFEST_FILE"
  : > "$CONFLICT_FILE"

  trap 'rm -f "$MANIFEST_FILE" "$CONFLICT_FILE"' EXIT
}

assert_relative_path_safe() {
  local rel="$1"
  local label="$2"

  if [[ -z "$rel" ]]; then
    log_blocked "$label path is empty."
    exit 1
  fi

  if [[ "$rel" == /* ]]; then
    log_blocked "$label path must be relative, got: $rel"
    exit 1
  fi

  case "$rel" in
    *"/../"*|"../"*|*".."|".")
      log_blocked "$label path escapes boundary: $rel"
      exit 1
      ;;
  esac
}

assert_inside_dir() {
  local base="$1"
  local path="$2"
  local label="$3"

  case "$path" in
    "$base"/*|"$base")
      return 0
      ;;
    *)
      log_blocked "$label is outside allowed boundary."
      log_blocked "Allowed boundary: $base"
      log_blocked "Actual path: $path"
      exit 1
      ;;
  esac
}

validate_target_path_for_plan() {
  local dst_rel="$1"
  assert_relative_path_safe "$dst_rel" "target"
  local target_path="$TARGET_ROOT/$dst_rel"

  local existing_parent
  existing_parent="$(nearest_existing_parent "$target_path")"
  assert_inside_dir "$TARGET_ROOT" "$existing_parent" "target parent"

  # Dry-run / validation must be side-effect free.
  # Do not create target directories or files here.
  printf '%s\n' "$target_path"
}

prepare_target_path_for_write() {
  local dst_rel="$1"
  assert_relative_path_safe "$dst_rel" "target"
  local target_path="$TARGET_ROOT/$dst_rel"

  local existing_parent
  existing_parent="$(nearest_existing_parent "$target_path")"
  assert_inside_dir "$TARGET_ROOT" "$existing_parent" "target parent"

  # Directory creation is allowed only in apply/write mode.
  mkdir -p "$(dirname "$target_path")"

  local final_parent
  final_parent="$(canonical_existing_dir "$(dirname "$target_path")")"
  assert_inside_dir "$TARGET_ROOT" "$final_parent" "target parent after mkdir"

  if [[ -L "$target_path" ]]; then
    log_blocked "Refusing to write through symlink target: $target_path"
    exit 1
  fi

  printf '%s/%s\n' "$final_parent" "$(basename "$target_path")"
}

check_source_kit() {
  if [[ ! -d "$KIT_ROOT" ]]; then
    log_blocked "Install source not found: $KIT_ROOT"
    log_blocked "Run this script from the foundation-kit repository."
    exit 1
  fi

  KIT_ROOT="$(canonical_existing_dir "$KIT_ROOT")"

  local required=(
    "$KIT_ROOT/project-templates/AGENTS.md"
    "$KIT_ROOT/project-templates/project-guideline.md"
    "$KIT_ROOT/project-templates/project-decisions.md"
    "$KIT_ROOT/project-templates/lessons-learned.md"
    "$KIT_ROOT/skills"
    "$KIT_ROOT/prompts"
    "$KIT_ROOT/rules"
  )

  local missing=0
  local item
  for item in "${required[@]}"; do
    if [[ ! -e "$item" ]]; then
      log_blocked "Required kit source is missing: $item"
      missing=1
    fi
  done

  if [[ "$missing" -ne 0 ]]; then
    exit 1
  fi
}

check_target() {
  if [[ ! -d "$TARGET_ARG" ]]; then
    log_blocked "Target directory must already exist: $TARGET_ARG"
    exit 1
  fi

  resolve_target_root

  if [[ "$TARGET_ROOT" == "$REPO_ROOT" ]]; then
    log_blocked "Refusing to install into the foundation-kit repository itself."
    log_blocked "Choose an explicit downstream target project directory."
    exit 1
  fi
}

check_git_status() {
  if git -C "$TARGET_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if [[ -n "$(git -C "$TARGET_ROOT" status --short 2>/dev/null)" ]]; then
      log_warning "Target Git working tree is not clean."
      log_warning "Installer changes may mix with existing local changes. For new projects this may be acceptable; otherwise commit or stash first."
    else
      log_info "Target Git working tree is clean."
    fi
  else
    log_warning "Target is not a Git repository. This is allowed for a fresh project, but rollback is easier with Git."
  fi
}

add_mapping() {
  local src="$1"
  local dst="$2"
  assert_relative_path_safe "$dst" "manifest target"

  local src_real
  src_real="$(canonical_existing_file "$src")"
  assert_inside_dir "$KIT_ROOT" "$src_real" "source file"

  printf '%s\t%s\n' "$src_real" "$dst" >> "$MANIFEST_FILE"
}

add_tree_mappings() {
  local src_dir="$1"
  local dst_dir="$2"

  if [[ ! -d "$src_dir" ]]; then
    log_blocked "Required source directory missing: $src_dir"
    exit 1
  fi

  local src_dir_real
  src_dir_real="$(canonical_existing_dir "$src_dir")"
  assert_inside_dir "$KIT_ROOT" "$src_dir_real" "source directory"

  while IFS= read -r file; do
    local rel="${file#$src_dir/}"
    assert_relative_path_safe "$rel" "source relative"
    add_mapping "$file" "$dst_dir/$rel"
  done < <(find "$src_dir" -type f | sort)
}

build_install_manifest() {
  : > "$MANIFEST_FILE"

  add_mapping "$KIT_ROOT/project-templates/AGENTS.md" "AGENTS.md"
  add_mapping "$KIT_ROOT/project-templates/project-guideline.md" ".codex/project/project-guideline.md"
  add_mapping "$KIT_ROOT/project-templates/project-decisions.md" ".codex/project/project-decisions.md"
  add_mapping "$KIT_ROOT/project-templates/lessons-learned.md" ".codex/project/lessons-learned.md"

  add_tree_mappings "$KIT_ROOT/skills" ".codex/skills"
  add_tree_mappings "$KIT_ROOT/prompts" ".codex/prompts"
  add_tree_mappings "$KIT_ROOT/rules" ".codex/rules"
}

validate_manifest_boundaries() {
  while IFS=$'\t' read -r src dst; do
    local src_real
    src_real="$(canonical_existing_file "$src")"
    assert_inside_dir "$KIT_ROOT" "$src_real" "source file"
    assert_relative_path_safe "$dst" "target"
    validate_target_path_for_plan "$dst" >/dev/null
  done < "$MANIFEST_FILE"
}

risk_for_target() {
  local dst="$1"
  case "$dst" in
    AGENTS.md|.codex/project/*|.codex/skills/*|.codex/prompts/*|.codex/rules/*)
      printf 'DANGER'
      ;;
    *)
      printf 'WARNING'
      ;;
  esac
}

scan_target_conflicts() {
  : > "$CONFLICT_FILE"

  while IFS=$'\t' read -r src dst; do
    local target_path="$TARGET_ROOT/$dst"
    if [[ -e "$target_path" || -L "$target_path" ]]; then
      if [[ -L "$target_path" ]]; then
        log_blocked "Refusing existing symlink target path: $target_path"
        exit 1
      fi

      local target_real_parent
      target_real_parent="$(canonical_existing_dir "$(dirname "$target_path")")"
      assert_inside_dir "$TARGET_ROOT" "$target_real_parent" "existing target parent"

      local risk
      risk="$(risk_for_target "$dst")"
      printf '%s\t%s\t%s\n' "$src" "$dst" "$risk" >> "$CONFLICT_FILE"
    fi
  done < "$MANIFEST_FILE"
}

manifest_count() {
  wc -l < "$MANIFEST_FILE" | tr -d ' '
}

conflict_count() {
  wc -l < "$CONFLICT_FILE" | tr -d ' '
}

print_install_plan() {
  local total conflicts new_files
  total="$(manifest_count)"
  conflicts="$(conflict_count)"
  new_files=$((total - conflicts))

  log_info "Source repo root: $REPO_ROOT"
  log_info "Source kit: $KIT_ROOT"
  log_info "Target root: $TARGET_ROOT"
  log_info "Boundary: reads only inside source kit; writes only inside target root."
  log_info "Mode: $([[ "$APPLY" -eq 1 ]] && printf 'apply' || printf 'dry-run')"
  log_info "Install plan: $new_files new file(s), $conflicts conflict(s), $total total mapped file(s)."

  if [[ "$APPLY" -eq 0 ]]; then
    log_info "Dry-run only. Re-run with --apply to write files."
  fi
}

show_diff_if_possible() {
  local src="$1"
  local target="$2"

  if command -v diff >/dev/null 2>&1; then
    log_info "Diff preview:"
    diff -u "$target" "$src" || true
  else
    log_warning "diff command not available; skipping diff preview."
  fi
}

print_conflict_report() {
  if [[ ! -s "$CONFLICT_FILE" ]]; then
    return
  fi

  log_danger "Conflict Report: existing target files were found."
  log_danger "Theme 12 does not automatically merge or silently overwrite existing files."

  while IFS=$'\t' read -r src dst risk; do
    local target_path="$TARGET_ROOT/$dst"
    printf '\n'
    printf '[%s] Target file: %s\n' "$risk" "$dst"
    printf '[%s] Source file from kit/: %s\n' "$risk" "${src#$KIT_ROOT/}"
    printf '[%s] Existing target file status: exists\n' "$risk"
    printf '[%s] Why this is risky: replacing this file may discard project-specific instructions, memory, skills, prompts, or rules.\n' "$risk"
    printf '[%s] Recommended action: inspect the diff; for fresh or early-stage projects, backup-and-replace may be acceptable.\n' "$risk"
    printf '[%s] Available actions: skip, diff-only, backup-and-replace, abort\n' "$risk"

    show_diff_if_possible "$src" "$target_path"
  done < "$CONFLICT_FILE"
}

create_backup_root() {
  local stamp
  stamp="$(date '+%Y%m%d-%H%M%S')"
  BACKUP_ROOT="$TARGET_ROOT/.codex/backups/install-$stamp"
  validate_target_path_for_plan ".codex/backups/install-$stamp/.keep" >/dev/null
}

require_apply_confirmation() {
  if [[ ! -s "$CONFLICT_FILE" ]]; then
    return
  fi

  create_backup_root

  printf '\n'
  log_danger "Applying with conflicts will backup existing files first, then replace them."
  log_danger "Backup directory: $BACKUP_ROOT"
  log_danger "Type $CONFIRM_TOKEN to continue, or anything else to abort."

  local token=""
  if ! read -r token; then
    log_blocked "No confirmation token provided. Aborting without changes."
    exit 1
  fi

  if [[ "$token" != "$CONFIRM_TOKEN" ]]; then
    log_blocked "Confirmation token did not match. Aborting without changes."
    exit 1
  fi

  log_info "Confirmation accepted. Existing files will be backed up before replacement."
}

backup_existing_file() {
  local dst="$1"
  local target_path="$TARGET_ROOT/$dst"

  if [[ ! -e "$target_path" ]]; then
    return
  fi

  if [[ -L "$target_path" ]]; then
    log_blocked "Refusing to backup symlink target path: $target_path"
    exit 1
  fi

  if [[ -z "$BACKUP_ROOT" ]]; then
    create_backup_root
  fi

  local backup_rel=".codex/backups/$(basename "$BACKUP_ROOT")/$dst"
  local backup_path
  backup_path="$(prepare_target_path_for_write "$backup_rel")"

  mkdir -p "$(dirname "$backup_path")"
  cp -p "$target_path" "$backup_path"
}

install_file() {
  local src="$1"
  local dst="$2"

  local src_real
  src_real="$(canonical_existing_file "$src")"
  assert_inside_dir "$KIT_ROOT" "$src_real" "source file"

  local target_path
  target_path="$(prepare_target_path_for_write "$dst")"

  if [[ -e "$target_path" ]]; then
    backup_existing_file "$dst"
  fi

  cp -p "$src_real" "$target_path"
}

apply_install() {
  local installed=0
  local replaced=0

  while IFS=$'\t' read -r src dst; do
    if [[ -e "$TARGET_ROOT/$dst" ]]; then
      replaced=$((replaced + 1))
    else
      installed=$((installed + 1))
    fi

    install_file "$src" "$dst"
  done < "$MANIFEST_FILE"

  log_info "Install Summary:"
  log_info "Installed new file(s): $installed"
  log_info "Replaced file(s): $replaced"

  if [[ "$replaced" -gt 0 ]]; then
    log_info "Backups created under: $BACKUP_ROOT"
  fi
}

main() {
  parse_args "$@"
  resolve_repo_root
  check_source_kit
  check_target
  make_temp_files
  check_git_status
  build_install_manifest
  validate_manifest_boundaries
  scan_target_conflicts
  print_install_plan
  print_conflict_report

  if [[ "$APPLY" -eq 0 ]]; then
    return
  fi

  require_apply_confirmation
  apply_install
}

main "$@"
