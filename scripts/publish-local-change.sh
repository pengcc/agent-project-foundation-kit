#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/workflow-common.sh
source "$SCRIPT_DIR/lib/workflow-common.sh"

# Publish repository-local changes through a feature branch and GitHub PR.
# This is a repo development helper, not the installable publish-current-branch skill.
#
# Usage:
#   bash scripts/publish-local-change.sh "Commit message"
#
# Optional environment variables:
#   DEFAULT_BRANCH=main
#   CHANGE_BRANCH_PREFIX=change

CHANGE_BRANCH_PREFIX="${CHANGE_BRANCH_PREFIX:-change}"
PUBLISH_CLASSIFICATION=""
VALIDATION_STATEMENT=""
PUBLISH_PR_FIELD_SEP=$'\037'

safe_branch_name_from_message() {
  local message="$1"
  local stem timestamp

  stem="$(printf "%s" "$message" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9._-]+/-/g; s/^-+//; s/-+$//')"
  if [[ -z "$stem" ]]; then
    stem="local-change"
  fi

  stem="$(printf "%.48s" "$stem" | sed -E 's/-+$//')"
  timestamp="$(date +%Y%m%d-%H%M%S)"
  printf "%s/%s-%s" "$CHANGE_BRANCH_PREFIX" "$stem" "$timestamp"
}

ensure_not_detached_head() {
  if [[ "$(current_branch)" == "HEAD" ]]; then
    die "Detached HEAD is not supported. Switch to a branch first."
  fi
}

ensure_origin_exists() {
  git remote get-url origin >/dev/null 2>&1 || die "Remote 'origin' is required."
}

has_uncommitted_changes() {
  [[ -n "$(git status --porcelain)" ]]
}

branch_has_unpushed_commits() {
  local branch upstream
  branch="$(current_branch)"

  if ! upstream="$(git rev-parse --abbrev-ref --symbolic-full-name "${branch}@{upstream}" 2>/dev/null)"; then
    upstream="origin/$DEFAULT_BRANCH"
    if ! git rev-parse --verify "$upstream" >/dev/null 2>&1; then
      return 0
    fi
  fi

  [[ -n "$(git log --oneline "$upstream..$branch" 2>/dev/null)" ]]
}

classification_label() {
  case "$PUBLISH_CLASSIFICATION" in
    SMALL_SAFE) printf "small safe update" ;;
    NORMAL) printf "normal update" ;;
    SIGNIFICANT) printf "significant / high-impact update" ;;
    *) printf "unknown" ;;
  esac
}

classify_update() {
  local answer

  step "Classify update risk."
  printf "  SMALL_SAFE  Small, well-understood, low-impact update\n"
  printf "  NORMAL      Normal theme or maintenance update\n"
  printf "  SIGNIFICANT Significant or high-impact update\n"
  prompt "Type SMALL_SAFE, NORMAL, or SIGNIFICANT: "
  read -r answer

  case "$answer" in
    SMALL_SAFE|NORMAL|SIGNIFICANT)
      PUBLISH_CLASSIFICATION="$answer"
      ;;
    *)
      die "Invalid classification. Use SMALL_SAFE, NORMAL, or SIGNIFICANT."
      ;;
  esac

  if [[ "$PUBLISH_CLASSIFICATION" == "SMALL_SAFE" ]]; then
    success "SMALL_SAFE accepted as explicit pre-approval."
    warn "This enables the automatic safe publish path through a feature branch and PR."
    warn "It never permits a direct push to '$DEFAULT_BRANCH'."
  else
    info "Classification: $(classification_label)"
  fi
}

show_section_or_skipped() {
  local heading="$1"
  shift
  local output

  info "$heading"
  output="$("$@" 2>/dev/null || true)"
  if [[ -n "$output" ]]; then
    printf "%s\n" "$output"
  else
    printf "  (none)\n"
  fi
}

show_change_summary() {
  step "Review local changes that may be included."
  show_section_or_skipped "Staged changes:" git --no-pager diff --cached --name-status
  show_section_or_skipped "Unstaged changes:" git --no-pager diff --name-status
  show_section_or_skipped "Untracked files:" git ls-files --others --exclude-standard
  show_section_or_skipped "Combined tracked diff stat:" git --no-pager diff HEAD --stat
}

show_final_staged_summary() {
  step "Final staged commit contents after 'git add -A'."
  show_section_or_skipped "Staged files:" git --no-pager diff --cached --name-status
  show_section_or_skipped "Staged diff stat:" git --no-pager diff --cached --stat
}

ensure_feature_branch() {
  local commit_message="$1"
  local branch target_branch
  branch="$(current_branch)"

  if [[ "$branch" != "$DEFAULT_BRANCH" && "$branch" != "main" && "$branch" != "master" ]]; then
    info "Using current feature branch: $branch"
    return
  fi

  target_branch="$(safe_branch_name_from_message "$commit_message")"
  warn "Current branch is '$branch'; direct publishing from it is blocked."
  info "Feature branch: $target_branch"

  if [[ "$PUBLISH_CLASSIFICATION" == "SMALL_SAFE" ]]; then
    skipped "Branch-creation confirmation skipped because SMALL_SAFE was pre-approved."
  elif ! confirm "Create and switch to '$target_branch'?"; then
    die "Stopped before creating the required feature branch."
  fi

  git switch -c "$target_branch"
  success "Switched to feature branch '$target_branch'."
}

confirm_plan_consistency() {
  case "$PUBLISH_CLASSIFICATION" in
    SMALL_SAFE)
      skipped "Manual pre-commit gates skipped because the update was pre-approved as SMALL_SAFE."
      ;;
    NORMAL)
      if ! confirm "Do the staged changes match the intended plan and scope?"; then
        die "Stopped because plan consistency was not confirmed."
      fi
      ;;
    SIGNIFICANT)
      danger "High-impact updates require typed plan consistency confirmation."
      if ! confirm_typed \
        "Confirm that the staged changes match the reviewed plan and intended scope." \
        "CHANGES_MATCH_APPROVED_PLAN"; then
        die "Stopped because high-impact plan consistency was not confirmed."
      fi
      ;;
  esac
}

commit_changes_if_needed() {
  local commit_message="$1"

  if ! has_uncommitted_changes; then
    info "No uncommitted changes; publishing existing local commits."
    confirm_plan_consistency
    return
  fi

  git add -A
  show_final_staged_summary
  confirm_plan_consistency
  git commit -m "$commit_message"
  success "Committed all staged, unstaged, and untracked changes."
}

capture_validation_statement() {
  step "Record local/manual validation."
  prompt "Describe the validation completed (required, one line): "
  read -r VALIDATION_STATEMENT

  if [[ -z "${VALIDATION_STATEMENT//[[:space:]]/}" ]]; then
    die "A non-empty validation statement is required before push or PR creation."
  fi

  if [[ "$PUBLISH_CLASSIFICATION" == "SIGNIFICANT" ]]; then
    if ! confirm_typed \
      "Confirm that the recorded validation is complete for this high-impact update." \
      "VALIDATION_CONFIRMED"; then
      die "Stopped because high-impact validation was not confirmed."
    fi
  fi

  success "Validation statement recorded."
}

ensure_gh_publish_ready() {
  require_command gh

  if ! gh auth status >/dev/null 2>&1; then
    die "GitHub CLI is not authenticated. Authenticate before publishing."
  fi

  ensure_repo_full_name || die "Could not determine the GitHub repository."
  info "GitHub repository: $REPO_FULL_NAME"
}

push_branch() {
  local branch
  branch="$(current_branch)"

  if [[ "$branch" == "$DEFAULT_BRANCH" || "$branch" == "main" || "$branch" == "master" ]]; then
    die "Refusing to push directly from default branch '$branch'."
  fi

  if ! branch_has_unpushed_commits; then
    info "No unpushed commits detected for '$branch'."
    return
  fi

  git push -u origin "$branch"
  success "Pushed feature branch '$branch'."
}

publish_record_body() {
  local head_sha="$1"

  printf '%s\n' \
    "## Local publish record" \
    "" \
    "- Classification: \`$PUBLISH_CLASSIFICATION\` ($(classification_label))" \
    "- Validation: $VALIDATION_STATEMENT" \
    "- Head commit: \`$head_sha\`" \
    "- Target branch: \`$DEFAULT_BRANCH\`" \
    "" \
    "Generated by \`scripts/publish-local-change.sh\`."
}

read_publish_pr_info() {
  local pr_ref="$1"
  local jq_expr
  jq_expr='[.number, .url, .state, .baseRefName, .headRefName, (.isDraft|tostring), (.mergeable // "UNKNOWN"), (.mergeStateStatus // "UNKNOWN"), .headRefOid, (.mergedAt // ""), (.reviewDecision // "")] | map(tostring) | join("\u001f")'

  gh pr view "$pr_ref" \
    --repo "$REPO_FULL_NAME" \
    --json number,url,state,baseRefName,headRefName,isDraft,mergeable,mergeStateStatus,headRefOid,mergedAt,reviewDecision \
    --jq "$jq_expr"
}

parse_publish_pr_info() {
  local pr_info="$1"

  IFS="$PUBLISH_PR_FIELD_SEP" read -r \
    PUBLISH_PR_NUMBER \
    PUBLISH_PR_URL \
    PUBLISH_PR_STATE \
    PUBLISH_PR_BASE \
    PUBLISH_PR_HEAD \
    PUBLISH_PR_DRAFT \
    PUBLISH_PR_MERGEABLE \
    PUBLISH_PR_MERGE_STATE \
    PUBLISH_PR_HEAD_OID \
    PUBLISH_PR_MERGED_AT \
    PUBLISH_PR_REVIEW_DECISION <<< "$pr_info"
}

show_publish_pr_info() {
  info "PR #$PUBLISH_PR_NUMBER: $PUBLISH_PR_URL"
  printf "  State: %s | Base: %s | Head: %s | Draft: %s\n" \
    "$PUBLISH_PR_STATE" "$PUBLISH_PR_BASE" "$PUBLISH_PR_HEAD" "$PUBLISH_PR_DRAFT"
  printf "  Mergeable: %s | Merge state: %s | Review: %s\n" \
    "$PUBLISH_PR_MERGEABLE" "$PUBLISH_PR_MERGE_STATE" "${PUBLISH_PR_REVIEW_DECISION:-N/A}"
}

create_or_update_pr() {
  local commit_message="$1"
  local branch head_sha body pr_info
  branch="$(current_branch)"
  head_sha="$(git rev-parse HEAD)"
  body="$(publish_record_body "$head_sha")"

  step "Create or update the pull request."

  if pr_info="$(read_publish_pr_info "$branch" 2>/dev/null)"; then
    parse_publish_pr_info "$pr_info"
    if [[ "$PUBLISH_PR_STATE" != "OPEN" ]]; then
      die "Existing PR #$PUBLISH_PR_NUMBER is '$PUBLISH_PR_STATE', not OPEN."
    fi

    gh pr comment "$PUBLISH_PR_NUMBER" --repo "$REPO_FULL_NAME" --body "$body"
    success "Updated existing PR #$PUBLISH_PR_NUMBER with the publish record."
  else
    gh pr create \
      --repo "$REPO_FULL_NAME" \
      --base "$DEFAULT_BRANCH" \
      --head "$branch" \
      --title "$commit_message" \
      --body "$body" >/dev/null
    success "Created pull request for '$branch'."
  fi

  pr_info="$(read_publish_pr_info "$branch")"
  parse_publish_pr_info "$pr_info"
  show_publish_pr_info
}

check_pr_merge_readiness() {
  local mode="$1"
  local expected_head="$2"
  local check_summary check_status

  if [[ "$PUBLISH_PR_STATE" != "OPEN" ]]; then
    die "PR #$PUBLISH_PR_NUMBER is not open."
  fi
  if [[ "$PUBLISH_PR_BASE" != "$DEFAULT_BRANCH" ]]; then
    die "PR #$PUBLISH_PR_NUMBER targets '$PUBLISH_PR_BASE', not '$DEFAULT_BRANCH'."
  fi
  if [[ "$PUBLISH_PR_HEAD" != "$(current_branch)" ]]; then
    die "PR head '$PUBLISH_PR_HEAD' does not match current branch '$(current_branch)'."
  fi
  if [[ "$PUBLISH_PR_HEAD_OID" != "$expected_head" ]]; then
    die "PR head commit does not match local HEAD. Push and re-check before merge."
  fi
  if [[ "$PUBLISH_PR_DRAFT" == "true" ]]; then
    die "PR #$PUBLISH_PR_NUMBER is a draft."
  fi
  if [[ "$PUBLISH_PR_MERGEABLE" == "CONFLICTING" ]]; then
    die "PR #$PUBLISH_PR_NUMBER has merge conflicts."
  fi
  if [[ "$PUBLISH_PR_MERGEABLE" == "UNKNOWN" || "$PUBLISH_PR_MERGE_STATE" == "UNKNOWN" ]]; then
    die "GitHub has not resolved PR merge readiness. Re-check later or use PR-only mode."
  fi

  if check_summary="$(gh pr checks "$PUBLISH_PR_NUMBER" \
    --repo "$REPO_FULL_NAME" \
    --required \
    --json bucket \
    --jq '[.[].bucket] | unique | join(",")' 2>/dev/null)"; then
    check_status=0
  else
    check_status=$?
  fi

  info "Required check state: ${check_summary:-none reported}"

  if [[ "$check_status" != "0" && "$check_status" != "1" && "$check_status" != "8" ]]; then
    die "Could not verify required checks with GitHub CLI."
  fi

  if [[ "$check_summary" == *"fail"* || "$check_summary" == *"cancel"* || "$check_status" == "1" ]]; then
    die "Required checks are failing or cancelled."
  fi

  if [[ "$mode" == "immediate" && ( "$check_summary" == *"pending"* || "$check_status" == "8" ) ]]; then
    die "Required checks are pending. Use auto-merge or PR-only mode."
  fi

  if [[ "$mode" == "immediate" && "$PUBLISH_PR_MERGE_STATE" == "BLOCKED" ]]; then
    die "PR merge state is BLOCKED. Use auto-merge or PR-only mode."
  fi
}

confirm_manual_pr_review() {
  if ! confirm_typed \
    "Confirm that you manually reviewed the PR diff and approve a squash merge." \
    "I HAVE REVIEWED THE PR AND APPROVE SQUASH MERGE"; then
    die "Stopped because manual PR review approval was not provided."
  fi

  if [[ "$PUBLISH_CLASSIFICATION" == "SIGNIFICANT" ]]; then
    if ! confirm_typed \
      "High-impact merge requires one additional explicit approval." \
      "I APPROVE HIGH IMPACT MERGE"; then
      die "Stopped because high-impact merge approval was not provided."
    fi
  fi
}

refresh_after_verified_merge() {
  local refreshed_info
  refreshed_info="$(read_publish_pr_info "$PUBLISH_PR_NUMBER")"
  parse_publish_pr_info "$refreshed_info"

  if [[ -z "$PUBLISH_PR_MERGED_AT" || "$PUBLISH_PR_BASE" != "$DEFAULT_BRANCH" ]]; then
    warn "PR merge is not yet verified. Local '$DEFAULT_BRANCH' was not refreshed."
    return
  fi

  if confirm "PR #$PUBLISH_PR_NUMBER is verified merged. Switch to and refresh '$DEFAULT_BRANCH'?"; then
    refresh_default_branch
  else
    skipped "Default branch refresh was not approved."
  fi
}

run_merge_flow() {
  local mode="$1"
  local head_sha fresh_info
  head_sha="$(git rev-parse HEAD)"

  fresh_info="$(read_publish_pr_info "$PUBLISH_PR_NUMBER")"
  parse_publish_pr_info "$fresh_info"
  show_publish_pr_info
  check_pr_merge_readiness "$mode" "$head_sha"
  confirm_manual_pr_review

  if [[ "$mode" == "auto" ]]; then
    gh pr merge "$PUBLISH_PR_NUMBER" \
      --repo "$REPO_FULL_NAME" \
      --auto \
      --squash \
      --match-head-commit "$head_sha"
    success "Enabled squash auto-merge for PR #$PUBLISH_PR_NUMBER."
    info "Exiting without polling for merge completion or refreshing local '$DEFAULT_BRANCH'."
    return
  fi

  gh pr merge "$PUBLISH_PR_NUMBER" \
    --repo "$REPO_FULL_NAME" \
    --squash \
    --match-head-commit "$head_sha"
  success "Squash merge command completed for PR #$PUBLISH_PR_NUMBER."
  refresh_after_verified_merge
}

choose_pr_mode() {
  local choice

  step "Choose the PR completion mode."
  printf "  1) PR only\n"
  printf "  2) Enable auto-merge with squash\n"
  printf "  3) Merge immediately with squash\n"

  if [[ "$PUBLISH_CLASSIFICATION" == "SIGNIFICANT" ]]; then
    warn "PR-only mode is recommended for significant / high-impact updates."
  else
    info "Auto-merge with squash is recommended for normal reviewed updates."
  fi

  prompt "Choose [1-3]: "
  read -r choice

  case "$choice" in
    1|"")
      success "PR published. Merge remains manual."
      ;;
    2)
      run_merge_flow "auto"
      ;;
    3)
      run_merge_flow "immediate"
      ;;
    *)
      die "Invalid PR mode: $choice"
      ;;
  esac
}

main() {
  if [[ $# -lt 1 || -z "${1//[[:space:]]/}" ]]; then
    die "Usage: bash scripts/publish-local-change.sh \"Commit message\""
  fi

  local commit_message="$1"

  require_command git
  ensure_git_repo
  ensure_not_detached_head
  ensure_origin_exists
  classify_update
  show_change_summary

  if ! has_uncommitted_changes && ! branch_has_unpushed_commits; then
    success "No local changes or unpushed commits detected. Nothing to publish."
    return
  fi

  ensure_feature_branch "$commit_message"
  commit_changes_if_needed "$commit_message"
  capture_validation_statement
  ensure_gh_publish_ready
  push_branch
  create_or_update_pr "$commit_message"
  choose_pr_mode

  success "Local publish workflow complete."
}

main "$@"
