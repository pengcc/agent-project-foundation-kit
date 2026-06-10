#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# publish-local-change.sh
# ============================================================
#
# Publish small local changes through a safe feature-branch + PR workflow.
#
# Use this script when:
# - You changed one or a few files locally.
# - A theme zip would be unnecessary overhead.
# - The default branch is protected and direct push is not allowed.
#
# This script can:
# - create/switch to a feature branch when currently on main/master/default branch
# - show status and diff stat without pager
# - commit current local changes after explicit confirmation
# - push with upstream tracking
# - create a GitHub PR with gh
# - optionally refresh the local default branch after the user confirms the PR was merged
#
# This script does NOT:
# - merge PRs automatically
# - force push
# - bypass branch protection or GitHub rules
# - reset a dirty working tree
# - silently commit without user confirmation
#
# Usage:
#   bash scripts/publish-local-change.sh "Commit message"
#
# Optional environment variables:
#   DEFAULT_BRANCH=main
#   CHANGE_BRANCH_PREFIX=change
#
# ============================================================

export GIT_PAGER=cat
export PAGER=cat

DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"
CHANGE_BRANCH_PREFIX="${CHANGE_BRANCH_PREFIX:-change}"

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

ensure_git_repo() {
  git rev-parse --show-toplevel >/dev/null 2>&1 || die "Not inside a git repository."
  cd "$(git rev-parse --show-toplevel)"
}

is_worktree_clean() {
  [[ -z "$(git status --porcelain)" ]]
}

current_branch() {
  git rev-parse --abbrev-ref HEAD
}

safe_branch_name_from_message() {
  local message="$1"
  local stem timestamp
  stem="$(printf "%s" "$message" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9._-]+/-/g; s/^-+//; s/-+$//')"
  if [[ -z "$stem" ]]; then
    stem="local-change"
  fi
  # Keep branch names readable.
  stem="$(printf "%.48s" "$stem" | sed -E 's/-+$//')"
  timestamp="$(date +%Y%m%d-%H%M%S)"
  printf "%s/%s-%s" "$CHANGE_BRANCH_PREFIX" "$stem" "$timestamp"
}

ensure_not_detached_head() {
  if [[ "$(current_branch)" == "HEAD" ]]; then
    die "Detached HEAD is not supported. Switch to a branch first."
  fi
}

show_review_info() {
  info "Git status:"
  git --no-pager status --short

  info "Diff stat:"
  git --no-pager diff --stat || true

  info "Recent commits:"
  git --no-pager log --oneline --decorate -5
}

has_uncommitted_changes() {
  [[ -n "$(git status --porcelain)" ]]
}

branch_has_unpushed_commits() {
  local branch upstream
  branch="$(current_branch)"

  if ! upstream="$(git rev-parse --abbrev-ref --symbolic-full-name "${branch}@{upstream}" 2>/dev/null)"; then
    # No upstream: if branch has commits, it likely needs push -u.
    return 0
  fi

  [[ -n "$(git log --oneline "$upstream..$branch" 2>/dev/null)" ]]
}

ensure_feature_branch() {
  local commit_message="$1"
  local branch target_branch

  branch="$(current_branch)"

  if [[ "$branch" == "$DEFAULT_BRANCH" || "$branch" == "main" || "$branch" == "master" ]]; then
    target_branch="$(safe_branch_name_from_message "$commit_message")"

    warn "Current branch is '$branch'."
    warn "Direct push to the default branch may be blocked by repository rules."
    info "Suggested feature branch: $target_branch"

    if confirm "Create and switch to this feature branch now?"; then
      git switch -c "$target_branch"
      ok "Switched to $target_branch"
    else
      die "Stopped before committing/publishing changes on '$branch'."
    fi
  else
    info "Using current feature branch: $branch"
  fi
}

commit_uncommitted_changes_if_any() {
  local commit_message="$1"

  if ! has_uncommitted_changes; then
    info "No uncommitted changes to commit."
    return
  fi

  printf "\n"
  warn "This will commit the current local changes."
  warn "Review the files above before confirming."
  printf "\n"

  if ! confirm "Commit current local changes with message: '$commit_message'?"; then
    die "Stopped before commit."
  fi

  git add -A
  git commit -m "$commit_message"
  ok "Committed local changes."
}

push_branch() {
  local branch
  branch="$(current_branch)"

  if ! branch_has_unpushed_commits; then
    info "No unpushed commits detected for '$branch'."
    return
  fi

  if confirm "Push branch '$branch' to origin with upstream tracking?"; then
    git push -u origin "$branch"
    ok "Pushed branch '$branch'."
  else
    die "Stopped before push."
  fi
}

create_pr_if_possible() {
  local branch
  branch="$(current_branch)"

  if ! command -v gh >/dev/null 2>&1; then
    warn "GitHub CLI not found. Create PR manually."
    warn "Suggested command after installing/authenticating gh:"
    warn "  gh pr create --fill --base $DEFAULT_BRANCH --head $branch"
    return
  fi

  if ! gh auth status >/dev/null 2>&1; then
    warn "GitHub CLI is installed but not authenticated. Create PR manually."
    warn "Suggested command:"
    warn "  gh pr create --fill --base $DEFAULT_BRANCH --head $branch"
    return
  fi

  if confirm "Create PR for '$branch' into '$DEFAULT_BRANCH'?"; then
    gh pr create --fill --base "$DEFAULT_BRANCH" --head "$branch" || warn "gh pr create failed. Create/update PR manually."
    ok "PR creation attempted."
    warn "No merge was performed. Review and merge the PR manually in GitHub."
  else
    warn "Skipped PR creation."
  fi
}

refresh_default_branch_after_merge() {
  local branch backup_branch
  branch="$(current_branch)"

  printf "\n"
  info "Post-merge refresh check."

  if ! confirm "Has the PR/branch been merged into '$DEFAULT_BRANCH' and should I switch back and refresh '$DEFAULT_BRANCH'?"; then
    warn "Skipped default branch refresh."
    warn "After the PR is merged, run:"
    warn "  git switch $DEFAULT_BRANCH && git fetch origin $DEFAULT_BRANCH && git pull --ff-only origin $DEFAULT_BRANCH"
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

  ok "Current branch: $(current_branch)"
  git --no-pager status --short
}

main() {
  if [[ $# -lt 1 ]]; then
    die "Usage: bash scripts/publish-local-change.sh \"Commit message\""
  fi

  local commit_message="$1"

  require_command git
  ensure_git_repo
  ensure_not_detached_head

  show_review_info

  if ! has_uncommitted_changes && ! branch_has_unpushed_commits; then
    ok "No local changes or unpushed commits detected. Nothing to publish."
    return
  fi

  ensure_feature_branch "$commit_message"

  show_review_info
  commit_uncommitted_changes_if_any "$commit_message"
  push_branch
  create_pr_if_possible
  refresh_default_branch_after_merge

  ok "Done."
}

main "$@"
