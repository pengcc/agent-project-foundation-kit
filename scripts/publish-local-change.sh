\
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/workflow-common.sh
source "$SCRIPT_DIR/lib/workflow-common.sh"

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
# - commit current local changes after one explicit publish confirmation
# - push with upstream tracking
# - create a GitHub PR with gh
# - optionally run a verified post-PR merge / refresh flow
#
# This script does NOT:
# - merge PRs automatically
# - force push
# - bypass branch protection or GitHub rules
# - reset a dirty working tree
# - silently commit without user confirmation
#
# Confirmation model:
# - Confirm when creating a feature branch from main/master/default branch.
# - Confirm once before commit + push + PR creation.
# - Confirm before post-PR verification / merge / refresh flow.
# - Confirm separately before backup + reset if local default branch diverged.
# - Require typed strong confirmation before any scripted merge.
#
# Usage:
#   bash scripts/publish-local-change.sh "Commit message"
#
# Optional environment variables:
#   DEFAULT_BRANCH=main
#   CHANGE_BRANCH_PREFIX=change
#
# ============================================================

CHANGE_BRANCH_PREFIX="${CHANGE_BRANCH_PREFIX:-change}"

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

confirm_publish_workflow() {
  local branch
  branch="$(current_branch)"

  printf "\n"
  warn "This will publish the current local change through the PR workflow."
  warn "Planned actions:"
  warn "  1. Commit current local changes if any"
  warn "  2. Push branch '$branch' to origin with upstream tracking"
  warn "  3. Create a PR into '$DEFAULT_BRANCH' when GitHub CLI is available"
  warn "  4. Stop before merge; PR review and merge remain manual unless explicitly authorized later"
  printf "\n"

  confirm "Continue with commit + push + PR creation?"
}

commit_uncommitted_changes_if_any() {
  local commit_message="$1"

  if ! has_uncommitted_changes; then
    info "No uncommitted changes to commit."
    return
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

  git push -u origin "$branch"
  ok "Pushed branch '$branch'."
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

  gh pr create --fill --base "$DEFAULT_BRANCH" --head "$branch" || warn "gh pr create failed. Create/update PR manually."
  ok "PR creation attempted."
  warn "No merge was performed. Review and merge the PR manually in GitHub, or use the post-PR flow with explicit strong confirmation."
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

  if ! confirm_publish_workflow; then
    die "Stopped before commit/push/PR."
  fi

  commit_uncommitted_changes_if_any "$commit_message"
  push_branch
  create_pr_if_possible
  maybe_post_pr_action

  ok "Done."
}

main "$@"
