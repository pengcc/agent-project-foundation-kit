\
#!/usr/bin/env bash
set -euo pipefail

# Disable interactive pagers for script review output.
# Automation should not leave users stuck in less/(END).
export GIT_PAGER=cat
export PAGER=cat

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
# - After the user requests a post-merge refresh, verify the PR is actually merged before refreshing the default branch
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
# - The script can create a PR with gh, but it never merges.
# - If a theme package requires a post-apply script, answer "no" to commit, run the post-apply
#   script, review diff, then commit/push/PR manually.
# - After deleting or keeping the local zip, the script can ask whether to verify a merged PR.
#   It only switches back to DEFAULT_BRANCH and refreshes after gh confirms merged=true.
#
# ============================================================

THEME_ZIP_DIR="${THEME_ZIP_DIR:-dev_locals/theme-zips}"
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"
THEME_BRANCH_PREFIX="${THEME_BRANCH_PREFIX:-theme}"
DESTRUCTIVE_DROP_PERCENT="${DESTRUCTIVE_DROP_PERCENT:-30}"
DESTRUCTIVE_DROP_LINES="${DESTRUCTIVE_DROP_LINES:-50}"

RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
BLUE=$'\033[0;34m'
BOLD=$'\033[1m'
RESET=$'\033[0m'

info() { printf "%s[INFO]%s %s\n" "$BLUE" "$RESET" "$*"; }
ok() { printf "%s[OK]%s %s\n" "$GREEN" "$RESET" "$*"; }
warn() { printf "%s[WARNING]%s %s\n" "$YELLOW" "$RESET" "$*"; }
danger() { printf "%s[DANGER]%s %s\n" "$RED" "$RESET" "$*"; }
die() { danger "$*"; exit 1; }

confirm() {
  local prompt="$1"
  local answer
  read -r -p "$prompt [y/N] " answer
  [[ "$answer" == "y" || "$answer" == "Y" ]]
}

require_command() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || die "Required command not found: $cmd"
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

ensure_git_repo() {
  git rev-parse --show-toplevel >/dev/null 2>&1 || die "Not inside a git repository."
  cd "$(git rev-parse --show-toplevel)"
}

is_worktree_clean() {
  [[ -z "$(git status --porcelain)" ]]
}

require_clean_worktree() {
  if ! is_worktree_clean; then
    git --no-pager status --short
    die "Working tree is not clean. Commit, stash, or reset changes before applying a theme zip."
  fi
}

ensure_feature_branch() {
  local zip_path="$1"
  local current_branch target_branch

  current_branch="$(git rev-parse --abbrev-ref HEAD)"

  if [[ "$current_branch" == "$DEFAULT_BRANCH" || "$current_branch" == "main" || "$current_branch" == "master" ]]; then
    target_branch="$(safe_branch_name "$zip_path")"

    warn "Current branch is '$current_branch'."
    warn "Theme updates should be applied on a feature branch and reviewed via PR."
    info "Suggested branch: $target_branch"

    if confirm "Create and switch to this feature branch now?"; then
      git switch -c "$target_branch"
      ok "Switched to $target_branch"
    else
      die "Stopped before applying zip on '$current_branch'."
    fi
  else
    info "Current branch: $current_branch"
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
  local current_branch

  if ! confirm "Commit these changes now?"; then
    warn "Changes left uncommitted for manual review."
    warn "If this package has a post-apply script, run it before committing."
    return
  fi

  git add .
  git commit -m "$commit_message"
  ok "Committed changes."

  current_branch="$(git rev-parse --abbrev-ref HEAD)"

  if confirm "Push branch '$current_branch' to origin?"; then
    git push -u origin "$current_branch"
    ok "Pushed branch."

    if command -v gh >/dev/null 2>&1; then
      if gh auth status >/dev/null 2>&1; then
        if confirm "Create PR for '$current_branch'?"; then
          gh pr create --fill --base "$DEFAULT_BRANCH" --head "$current_branch" || warn "gh pr create failed. Create/update PR manually."
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

verify_merged_pr_for_default_branch() {
  local pr_number pr_info state merged base_ref url

  if ! command -v gh >/dev/null 2>&1; then
    warn "GitHub CLI not found. Cannot verify PR merge status."
    return 1
  fi

  if ! gh auth status >/dev/null 2>&1; then
    warn "GitHub CLI is installed but not authenticated. Cannot verify PR merge status."
    return 1
  fi

  read -r -p "Enter merged PR number to verify before refreshing '$DEFAULT_BRANCH' (empty to skip): " pr_number

  if [[ -z "$pr_number" ]]; then
    warn "Skipped default branch refresh because no PR number was provided."
    return 1
  fi

  pr_number="${pr_number#\#}"
  pr_number="$(printf "%s" "$pr_number" | tr -d '[:space:]')"

  if ! [[ "$pr_number" =~ ^[0-9]+$ ]]; then
    warn "Invalid PR number. Use a number like '9' or '#9'."
    return 1
  fi

  if ! pr_info="$(gh pr view "$pr_number" --json state,merged,baseRefName,url --jq '[.state, (.merged|tostring), .baseRefName, .url] | @tsv' 2>/dev/null)"; then
    warn "Could not read PR #$pr_number with gh."
    return 1
  fi

  IFS=$'\t' read -r state merged base_ref url <<< "$pr_info"

  if [[ "$merged" != "true" ]]; then
    warn "PR #$pr_number is not merged. State: $state. Skipping default branch refresh."
    warn "PR URL: $url"
    return 1
  fi

  if [[ "$base_ref" != "$DEFAULT_BRANCH" ]]; then
    warn "PR #$pr_number is merged, but its base branch is '$base_ref', not '$DEFAULT_BRANCH'."
    warn "Skipping default branch refresh."
    warn "PR URL: $url"
    return 1
  fi

  ok "Verified PR #$pr_number is merged into '$DEFAULT_BRANCH'."
  info "PR URL: $url"
  return 0
}

maybe_refresh_default_branch_after_merge() {
  local backup_branch

  printf "\n"
  info "Post-merge refresh check."

  if ! confirm "Verify a merged PR and refresh '$DEFAULT_BRANCH'?"; then
    warn "Skipped default branch refresh."
    warn "When the PR is merged, run:"
    warn "  git switch $DEFAULT_BRANCH && git fetch origin $DEFAULT_BRANCH && git pull --ff-only origin $DEFAULT_BRANCH"
    return
  fi

  if ! verify_merged_pr_for_default_branch; then
    warn "Default branch refresh was not performed."
    return
  fi

  if ! is_worktree_clean; then
    warn "Working tree is not clean. Cannot switch branches safely."
    git --no-pager status --short
    warn "Commit, stash, or reset changes, then refresh '$DEFAULT_BRANCH' manually."
    return
  fi

  info "Fetching latest '$DEFAULT_BRANCH' from origin..."
  git fetch origin "$DEFAULT_BRANCH"

  info "Switching to '$DEFAULT_BRANCH'..."
  git switch "$DEFAULT_BRANCH"

  if git merge-base --is-ancestor HEAD "origin/$DEFAULT_BRANCH"; then
    info "Refreshing '$DEFAULT_BRANCH' with fast-forward only..."
    git pull --ff-only origin "$DEFAULT_BRANCH"
    ok "Refreshed '$DEFAULT_BRANCH'."
  else
    warn "Local '$DEFAULT_BRANCH' cannot be fast-forwarded to 'origin/$DEFAULT_BRANCH'."
    warn "This can happen if a local direct-push commit was rejected, then the same change was merged through PR."

    backup_branch="backup/${DEFAULT_BRANCH}-before-reset-$(date +%Y%m%d-%H%M%S)"

    warn "A backup branch will be created before any reset:"
    warn "  $backup_branch"

    if confirm "Create backup branch and reset local '$DEFAULT_BRANCH' to 'origin/$DEFAULT_BRANCH'?"; then
      git branch "$backup_branch"
      git reset --hard "origin/$DEFAULT_BRANCH"
      ok "Reset local '$DEFAULT_BRANCH' to 'origin/$DEFAULT_BRANCH'."
      ok "Backup branch created: $backup_branch"
    else
      warn "Skipped reset. Local '$DEFAULT_BRANCH' may still be diverged."
      warn "Manual recovery:"
      warn "  git branch $backup_branch"
      warn "  git reset --hard origin/$DEFAULT_BRANCH"
      return
    fi
  fi

  ok "Current branch: $(git rev-parse --abbrev-ref HEAD)"
  git --no-pager status --short
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
  trap 'rm -rf "$tmp_dir"' EXIT

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
  maybe_refresh_default_branch_after_merge

  ok "Done."
}

main "$@"
