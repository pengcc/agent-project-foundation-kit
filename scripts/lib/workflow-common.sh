\
#!/usr/bin/env bash

# Shared helpers for repository workflow scripts.
# This file is intended to be sourced, not executed directly.

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  printf "This file is intended to be sourced, not executed directly.\n" >&2
  exit 1
fi

# Disable interactive pagers for script review output.
# Automation should not leave users stuck in less/(END).
export GIT_PAGER="${GIT_PAGER:-cat}"
export PAGER="${PAGER:-cat}"

DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"
REPO_FULL_NAME="${REPO_FULL_NAME:-}"

RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
BLUE=$'\033[0;34m'
BOLD=$'\033[1m'
RESET=$'\033[0m'

info() { printf "%s[INFO]%s %s\n" "$BLUE" "$RESET" "$*" >&2; }
ok() { printf "%s[OK]%s %s\n" "$GREEN" "$RESET" "$*" >&2; }
warn() { printf "%s[WARNING]%s %s\n" "$YELLOW" "$RESET" "$*" >&2; }
danger() { printf "%s[DANGER]%s %s\n" "$RED" "$RESET" "$*" >&2; }
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

detect_repo_full_name() {
  gh repo view --json nameWithOwner --jq '.nameWithOwner'
}

ensure_repo_full_name() {
  if [[ -n "$REPO_FULL_NAME" ]]; then
    return 0
  fi

  if ! REPO_FULL_NAME="$(detect_repo_full_name 2>/dev/null)"; then
    warn "Could not determine GitHub repository name with gh."
    warn "Set REPO_FULL_NAME=owner/repo and retry if PR lookup fails."
    return 1
  fi

  export REPO_FULL_NAME
}

normalize_pr_input() {
  local input="$1"

  input="$(printf "%s" "$input" | tr -d '[:space:]')"

  if [[ "$input" =~ /pull/([0-9]+) ]]; then
    printf "%s" "${BASH_REMATCH[1]}"
    return 0
  fi

  input="${input#\#}"

  if [[ "$input" =~ ^[0-9]+$ ]]; then
    printf "%s" "$input"
    return 0
  fi

  return 1
}

ensure_gh_ready() {
  if ! command -v gh >/dev/null 2>&1; then
    warn "GitHub CLI not found. Cannot verify or merge PR."
    return 1
  fi

  if ! gh auth status >/dev/null 2>&1; then
    warn "GitHub CLI is installed but not authenticated. Cannot verify or merge PR."
    return 1
  fi

  ensure_repo_full_name
}

read_pr_info() {
  local pr_ref="${1:-}"

  # GitHub CLI `gh pr view --json` supports `mergedAt`, not `merged`.
  # `mergedAt` is non-empty only after a PR has been merged.
  if [[ -n "$pr_ref" ]]; then
    gh pr view "$pr_ref" \
      --repo "$REPO_FULL_NAME" \
      --json number,state,closed,mergedAt,baseRefName,url,title,mergeable \
      --jq '[.number, .state, (.closed|tostring), (.mergedAt // ""), .baseRefName, .url, .title, (.mergeable // "UNKNOWN")] | @tsv'
  else
    gh pr view \
      --repo "$REPO_FULL_NAME" \
      --json number,state,closed,mergedAt,baseRefName,url,title,mergeable \
      --jq '[.number, .state, (.closed|tostring), (.mergedAt // ""), .baseRefName, .url, .title, (.mergeable // "UNKNOWN")] | @tsv'
  fi
}

show_pr_info() {
  local number="$1"
  local state="$2"
  local closed="$3"
  local merged_at="$4"
  local base_ref="$5"
  local url="$6"
  local title="$7"
  local mergeable="$8"
  local merged="false"

  if [[ -n "$merged_at" ]]; then
    merged="true"
  fi

  info "PR detected:"
  printf "  PR:        #%s\n" "$number"
  printf "  Title:     %s\n" "$title"
  printf "  State:     %s\n" "$state"
  printf "  Closed:    %s\n" "$closed"
  printf "  Merged:    %s\n" "$merged"
  printf "  Merged at: %s\n" "${merged_at:-N/A}"
  printf "  Base:      %s\n" "$base_ref"
  printf "  Mergeable: %s\n" "$mergeable"
  printf "  URL:       %s\n" "$url"
}

detect_current_branch_pr() {
  read_pr_info
}

choose_pr_with_retry() {
  local attempt input normalized pr_info gh_error

  for attempt in 1 2 3; do
    read -r -p "Enter PR number, #number, or PR URL to verify (empty to skip): " input

    if [[ -z "$input" ]]; then
      warn "Skipped PR verification because no PR was provided."
      return 1
    fi

    if ! normalized="$(normalize_pr_input "$input")"; then
      warn "Invalid PR reference: $input"
      warn "Use a number like '10', '#10', or a PR URL."
      continue
    fi

    if pr_info="$(read_pr_info "$normalized" 2>/tmp/workflow-common-gh-error.$$)"; then
      rm -f /tmp/workflow-common-gh-error.$$
      printf "%s" "$pr_info"
      return 0
    fi

    gh_error="$(cat /tmp/workflow-common-gh-error.$$ 2>/dev/null || true)"
    rm -f /tmp/workflow-common-gh-error.$$

    warn "Could not read PR '$input' with gh."
    if [[ -n "$gh_error" ]]; then
      warn "gh error:"
      printf "%s\n" "$gh_error" >&2
    fi
    warn "Try again, or press Enter to skip."
  done

  warn "Maximum PR verification attempts reached."
  return 1
}

get_pr_for_post_pr_action() {
  local pr_info gh_error

  if ! ensure_gh_ready; then
    return 1
  fi

  info "Using repository: $REPO_FULL_NAME"
  info "Trying to detect PR for current branch..."

  if pr_info="$(detect_current_branch_pr 2>/dev/null)"; then
    printf "%s" "$pr_info"
    return 0
  fi

  warn "Could not auto-detect a PR for the current branch."

  if ! gh_error="$(detect_current_branch_pr 2>&1 >/dev/null)"; then
    warn "gh error:"
    printf "%s\n" "$gh_error" >&2
  fi

  choose_pr_with_retry
}

refresh_default_branch() {
  local backup_branch

  if ! is_worktree_clean; then
    warn "Working tree is not clean. Cannot switch branches safely."
    git --no-pager status --short
    warn "Commit, stash, or reset changes, then refresh '$DEFAULT_BRANCH' manually."
    return 1
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
      return 1
    fi
  fi

  ok "Current branch: $(current_branch)"
  git --no-pager status --short
}

merge_pr_with_strong_confirmation() {
  local number="$1"
  local mergeable="$2"
  local expected_token="MERGE_PR_${number}"
  local answer

  if [[ "$mergeable" == "CONFLICTING" ]]; then
    warn "PR #$number has merge conflicts. Skipping gh merge."
    return 1
  fi

  warn "You are about to merge PR #$number with GitHub CLI."
  warn "This script will run:"
  warn "  gh pr merge $number --repo $REPO_FULL_NAME --squash"
  warn "It will not delete the remote branch automatically."

  printf "Type %s%s%s to merge, or anything else to skip: " "$BOLD" "$expected_token" "$RESET"
  read -r answer

  if [[ "$answer" != "$expected_token" ]]; then
    warn "Skipped gh merge for PR #$number."
    return 1
  fi

  gh pr merge "$number" --repo "$REPO_FULL_NAME" --squash
  ok "gh merge command completed for PR #$number."
}

handle_verified_pr_and_refresh() {
  local pr_info="$1"
  local number state closed merged_at base_ref url title mergeable refreshed_pr_info gh_error

  IFS=$'\t' read -r number state closed merged_at base_ref url title mergeable <<< "$pr_info"

  show_pr_info "$number" "$state" "$closed" "$merged_at" "$base_ref" "$url" "$title" "$mergeable"

  if [[ "$base_ref" != "$DEFAULT_BRANCH" ]]; then
    warn "PR #$number targets '$base_ref', not '$DEFAULT_BRANCH'."
    warn "Skipping default branch refresh."
    return 1
  fi

  if [[ -n "$merged_at" ]]; then
    ok "Verified PR #$number is already merged into '$DEFAULT_BRANCH'."
    refresh_default_branch
    return $?
  fi

  warn "PR #$number is not merged yet."

  while true; do
    printf "\n"
    info "Options:"
    printf "  1) Re-check PR state after manual merge\n"
    printf "  2) Open PR in browser for manual review/merge\n"
    printf "  3) Merge this PR now with gh using strong confirmation\n"
    printf "  4) Skip refresh\n"

    local choice
    read -r -p "Choose an option [1-4]: " choice

    case "$choice" in
      1)
        if refreshed_pr_info="$(read_pr_info "$number" 2>/dev/null)"; then
          handle_verified_pr_and_refresh "$refreshed_pr_info"
          return $?
        fi

        warn "Could not re-check PR #$number."
        if ! gh_error="$(read_pr_info "$number" 2>&1 >/dev/null)"; then
          warn "gh error:"
          printf "%s\n" "$gh_error" >&2
        fi
        ;;
      2)
        if gh pr view "$number" --repo "$REPO_FULL_NAME" --web >/dev/null 2>&1; then
          ok "Opened PR #$number in browser."
        else
          warn "Could not open PR in browser. URL: $url"
        fi
        ;;
      3)
        if merge_pr_with_strong_confirmation "$number" "$mergeable"; then
          if refreshed_pr_info="$(read_pr_info "$number" 2>/dev/null)"; then
            handle_verified_pr_and_refresh "$refreshed_pr_info"
            return $?
          fi

          warn "Could not verify PR #$number after gh merge."
          if ! gh_error="$(read_pr_info "$number" 2>&1 >/dev/null)"; then
            warn "gh error:"
            printf "%s\n" "$gh_error" >&2
          fi
          return 1
        fi
        ;;
      4|"")
        warn "Skipped default branch refresh."
        return 1
        ;;
      *)
        warn "Invalid option: $choice"
        ;;
    esac
  done
}

maybe_post_pr_action() {
  local pr_info

  printf "\n"
  info "Post-PR merge / refresh check."

  if ! confirm "Run PR verification / merge / refresh flow for '$DEFAULT_BRANCH'?"; then
    warn "Skipped post-PR flow."
    warn "After the PR is merged, run:"
    warn "  git switch $DEFAULT_BRANCH && git fetch origin $DEFAULT_BRANCH && git pull --ff-only origin $DEFAULT_BRANCH"
    return
  fi

  if ! pr_info="$(get_pr_for_post_pr_action)"; then
    warn "Post-PR flow did not find a valid PR."
    return
  fi

  handle_verified_pr_and_refresh "$pr_info" || warn "Post-PR flow finished without refreshing '$DEFAULT_BRANCH'."
}
