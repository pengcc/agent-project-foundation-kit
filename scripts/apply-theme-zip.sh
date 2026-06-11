#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/workflow-common.sh
source "$SCRIPT_DIR/lib/workflow-common.sh"

# ============================================================
# apply-theme-zip.sh
# ============================================================
#
# Safely apply a foundation-kit theme zip.
#
# Goals:
# - Prefer feature branch + PR review workflow
# - Detect destructive-looking overwrites before applying
# - Prevent accidental large content loss
# - Show incoming files, line counts, local line counts, git status, diff stat
# - Optionally commit, push, and create PR
# - Never merge by default
# - Optionally run a verified post-PR merge / refresh flow
#
# Usage:
#   bash scripts/apply-theme-zip.sh <zip-path-or-file-name> "Commit message"
#
# Examples:
#   bash scripts/apply-theme-zip.sh agent-theme9.zip "Add agent roles"
#   THEME_ZIP_DIR=dev_locals/theme-zips bash scripts/apply-theme-zip.sh agent-theme9.zip "Add agent roles"
#
# Config:
#   THEME_ZIP_DIR=dev_locals/theme-zips
#   DEFAULT_BRANCH=main
#   THEME_BRANCH_PREFIX=theme
#   DESTRUCTIVE_DROP_PERCENT=30
#   DESTRUCTIVE_DROP_LINES=50
#
# Notes:
# - If the current branch is main/master/default branch, the script asks to create a feature branch.
# - If an incoming file overwrites an existing file and line count drops significantly,
#   the script marks it as DANGER and requires typing APPLY_DESTRUCTIVE to continue.
# - The script can create a PR with gh, but it never merges by default.
# - If a theme package requires a post-apply script, answer "no" to commit, run the post-apply
#   script, review diff, then commit/push/PR manually.
#
# ============================================================

THEME_ZIP_DIR="${THEME_ZIP_DIR:-dev_locals/theme-zips}"
THEME_BRANCH_PREFIX="${THEME_BRANCH_PREFIX:-theme}"
DESTRUCTIVE_DROP_PERCENT="${DESTRUCTIVE_DROP_PERCENT:-30}"
DESTRUCTIVE_DROP_LINES="${DESTRUCTIVE_DROP_LINES:-50}"
APPLY_THEME_TMP_DIR=""

cleanup_apply_theme_tmp_dir() {
  if [[ -n "${APPLY_THEME_TMP_DIR:-}" && -d "$APPLY_THEME_TMP_DIR" ]]; then
    rm -rf "$APPLY_THEME_TMP_DIR"
  fi
}

line_count() {
  local file="$1"
  if [[ -f "$file" ]]; then
    awk 'END { print NR }' "$file"
  else
    printf "0"
  fi
}

resolve_zip() {
  local input="$1"

  if [[ -f "$input" ]]; then
    printf "%s" "$input"
    return
  fi

  if [[ -f "$THEME_ZIP_DIR/$input" ]]; then
    printf "%s" "$THEME_ZIP_DIR/$input"
    return
  fi

  die "Zip not found: '$input' or '$THEME_ZIP_DIR/$input'"
}

safe_branch_name() {
  local zip_path="$1"
  local stem timestamp
  stem="$(basename "$zip_path" .zip)"
  stem="$(printf "%s" "$stem" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9._-]+/-/g; s/^-+//; s/-+$//')"
  timestamp="$(date +%Y%m%d-%H%M%S)"
  printf "%s/%s-%s" "$THEME_BRANCH_PREFIX" "$stem" "$timestamp"
}

require_clean_worktree() {
  if ! is_worktree_clean; then
    git --no-pager status --short
    die "Working tree is not clean. Commit, stash, or reset changes before applying a theme zip."
  fi
}

ensure_feature_branch() {
  local zip_path="$1"
  local branch target_branch

  branch="$(current_branch)"

  if [[ "$branch" == "$DEFAULT_BRANCH" || "$branch" == "main" || "$branch" == "master" ]]; then
    target_branch="$(safe_branch_name "$zip_path")"

    warn "Current branch is '$branch'."
    warn "Theme updates should be applied on a feature branch and reviewed via PR."
    info "Suggested branch: $target_branch"

    if confirm "Create and switch to this feature branch now?"; then
      git switch -c "$target_branch"
      ok "Switched to $target_branch"
    else
      die "Stopped before applying zip on '$branch'."
    fi
  else
    info "Current branch: $branch"
  fi
}

extract_zip() {
  local zip_path="$1"
  local tmp_dir="$2"

  unzip -q "$zip_path" -d "$tmp_dir"

  if [[ -z "$(find "$tmp_dir" -type f -print -quit)" ]]; then
    die "Zip contains no files."
  fi
}

show_zip_contents() {
  local zip_path="$1"
  info "Zip contents:"
  unzip -l "$zip_path"
}

show_incoming_line_counts() {
  local tmp_dir="$1"

  info "Incoming file line counts:"
  while IFS= read -r -d '' file; do
    local rel
    rel="${file#$tmp_dir/}"
    printf "%5s %s\n" "$(line_count "$file")" "$rel"
  done < <(find "$tmp_dir" -type f -print0 | sort -z)
}

scan_destructive_changes() {
  local tmp_dir="$1"
  local danger_count=0
  local overwrite_count=0
  local new_count=0
  local file rel old_lines new_lines drop_lines drop_percent

  info "Scanning incoming files for destructive-looking overwrites..."

  while IFS= read -r -d '' file; do
    rel="${file#$tmp_dir/}"

    if [[ -f "$rel" ]]; then
      overwrite_count=$((overwrite_count + 1))
      old_lines="$(line_count "$rel")"
      new_lines="$(line_count "$file")"
      drop_lines=$((old_lines - new_lines))

      if (( old_lines > 0 && drop_lines > 0 )); then
        drop_percent=$((drop_lines * 100 / old_lines))

        if (( drop_percent >= DESTRUCTIVE_DROP_PERCENT || drop_lines >= DESTRUCTIVE_DROP_LINES )); then
          danger "Potential destructive overwrite: $rel"
          printf "         old lines: %s\n" "$old_lines"
          printf "         new lines: %s\n" "$new_lines"
          printf "         dropped:   %s lines (%s%%)\n" "$drop_lines" "$drop_percent"
          danger_count=$((danger_count + 1))
        fi
      fi
    else
      new_count=$((new_count + 1))
    fi
  done < <(find "$tmp_dir" -type f -print0 | sort -z)

  info "Incoming files: $((overwrite_count + new_count)) total, $overwrite_count overwrite(s), $new_count new file(s)."

  if (( danger_count > 0 )); then
    danger "Detected $danger_count high-risk line-count drop(s)."
    danger "This may indicate accidental full-file replacement or content loss."
    printf "\n"
    printf "To continue, type %sAPPLY_DESTRUCTIVE%s exactly. Anything else stops: " "$BOLD" "$RESET"

    local answer
    read -r answer

    if [[ "$answer" != "APPLY_DESTRUCTIVE" ]]; then
      die "Stopped before applying destructive-looking changes."
    fi
  else
    ok "No high-risk line-count drops detected."
  fi
}

copy_files() {
  local tmp_dir="$1"

  info "Applying files..."
  while IFS= read -r -d '' file; do
    local rel
    rel="${file#$tmp_dir/}"
    mkdir -p "$(dirname "$rel")"
    cp "$file" "$rel"
  done < <(find "$tmp_dir" -type f -print0 | sort -z)

  ok "Files applied."
}

show_changed_line_counts() {
  local tmp_dir="$1"

  info "Local line counts after apply:"
  while IFS= read -r -d '' file; do
    local rel
    rel="${file#$tmp_dir/}"

    if [[ -f "$rel" ]]; then
      printf "%5s %s\n" "$(line_count "$rel")" "$rel"
    fi
  done < <(find "$tmp_dir" -type f -print0 | sort -z)
}

show_review_info() {
  info "Git status:"
  git --no-pager status --short

  info "Diff stat:"
  git --no-pager diff --stat || true

  printf "\n"
  warn "Review the diff carefully before committing."
  warn "Large deletions, unexpected line-count drops, or full-file rewrites should be treated as high risk."
  printf "\n"
}

maybe_commit_push_pr() {
  local commit_message="$1"
  local branch

  if ! confirm "Commit these changes now?"; then
    warn "Changes left uncommitted for manual review."
    warn "If this package has a post-apply script, run it before committing."
    return
  fi

  git add .
  git commit -m "$commit_message"
  ok "Committed changes."

  branch="$(current_branch)"

  if confirm "Push branch '$branch' to origin?"; then
    git push -u origin "$branch"
    ok "Pushed branch."

    if command -v gh >/dev/null 2>&1; then
      if gh auth status >/dev/null 2>&1; then
        if confirm "Create PR for '$branch'?"; then
          gh pr create --fill --base "$DEFAULT_BRANCH" --head "$branch" || warn "gh pr create failed. Create/update PR manually."
          ok "PR creation attempted."
          warn "No merge was performed. Review the PR diff and merge manually, or use publish-current-branch with explicit merge/auto-merge authorization."
        fi
      else
        warn "GitHub CLI is installed but not authenticated. Create PR manually."
      fi
    else
      warn "GitHub CLI not found. Create PR manually."
    fi
  else
    warn "Branch not pushed. Push manually when ready."
  fi
}

maybe_delete_zip() {
  local zip_path="$1"

  if confirm "Delete local zip '$zip_path'?"; then
    rm -f "$zip_path"
    ok "Deleted zip."
  fi
}

main() {
  if [[ $# -lt 2 ]]; then
    die "Usage: bash scripts/apply-theme-zip.sh <zip-path-or-file-name> \"Commit message\""
  fi

  local zip_input="$1"
  local commit_message="$2"
  local zip_path tmp_dir

  require_command unzip
  require_command git

  ensure_git_repo
  require_clean_worktree

  zip_path="$(resolve_zip "$zip_input")"

  ensure_feature_branch "$zip_path"

  tmp_dir="$(mktemp -d)"
  APPLY_THEME_TMP_DIR="$tmp_dir"
  trap cleanup_apply_theme_tmp_dir EXIT

  show_zip_contents "$zip_path"
  extract_zip "$zip_path" "$tmp_dir"
  show_incoming_line_counts "$tmp_dir"
  scan_destructive_changes "$tmp_dir"

  if ! confirm "Apply this theme zip now?"; then
    die "Stopped before apply."
  fi

  copy_files "$tmp_dir"
  show_changed_line_counts "$tmp_dir"
  show_review_info
  maybe_commit_push_pr "$commit_message"
  maybe_delete_zip "$zip_path"
  maybe_post_pr_action

  ok "Done."
}

main "$@"
