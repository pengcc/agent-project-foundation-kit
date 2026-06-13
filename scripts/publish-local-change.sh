#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/workflow-common.sh
source "$SCRIPT_DIR/lib/workflow-common.sh"

# Publish repository-local changes through a feature branch and GitHub PR.
# This is a repo development helper, not the installable publish-current-branch skill.
#
# Usage:
#   bash scripts/publish-local-change.sh
#   bash scripts/publish-local-change.sh "Commit message"
#   bash scripts/publish-local-change.sh "Commit message" "PR title"
#
# Optional environment variables:
#   DEFAULT_BRANCH=main
#   CHANGE_BRANCH_PREFIX=change

CHANGE_BRANCH_PREFIX="${CHANGE_BRANCH_PREFIX:-change}"
PUBLISH_CLASSIFICATION=""
VALIDATION_STATEMENT=""
PUBLISH_PR_FIELD_SEP=$'\037'
CURRENT_BRANCH_PR_EXISTS=0
HAS_UNCOMMITTED_CHANGES=0
HAS_UNPUSHED_COMMITS=0

resolve_commit_message() {
  local message="${1:-}"

  if [[ -z "${message//[[:space:]]/}" ]]; then
    prompt "Enter commit message: "
    read -r message
  fi

  if [[ -z "${message//[[:space:]]/}" ]]; then
    die "Commit message must not be empty."
  fi

  printf "%s" "$message"
}

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

  upstream="$(publish_comparison_ref)"

  [[ -n "$(git log --oneline "$upstream..$branch" 2>/dev/null)" ]]
}

publish_comparison_ref() {
  local branch upstream
  branch="$(current_branch)"

  if upstream="$(git rev-parse --abbrev-ref --symbolic-full-name "${branch}@{upstream}" 2>/dev/null)"; then
    printf "%s" "$upstream"
    return
  fi

  upstream="origin/$DEFAULT_BRANCH"
  git rev-parse --verify "$upstream" >/dev/null 2>&1 || return 1
  printf "%s" "$upstream"
}

latest_commit_subject() {
  git log -1 --format=%s
}

inspect_default_branch_freshness() {
  step "Inspect default branch freshness."

  if ! git fetch origin "$DEFAULT_BRANCH"; then
    die "Could not fetch 'origin/$DEFAULT_BRANCH'."
  fi

  if git merge-base --is-ancestor "origin/$DEFAULT_BRANCH" HEAD; then
    success "Current HEAD includes the latest 'origin/$DEFAULT_BRANCH'."
    return
  fi

  warn "Current HEAD does not include the latest 'origin/$DEFAULT_BRANCH'."
  if ! confirm "Continue publishing from the current branch state?"; then
    die "Stopped because the current branch is not based on the latest default branch."
  fi
}

classification_label() {
  case "$PUBLISH_CLASSIFICATION" in
    SMALL_SAFE) printf "Small safe" ;;
    NORMAL) printf "Normal" ;;
    SIGNIFICANT) printf "Significant" ;;
    *) printf "Unknown" ;;
  esac
}

classify_update() {
  local answer

  step "Classify update risk."
  printf "  1) Small safe\n"
  printf "  2) Normal\n"
  printf "  3) Significant\n"

  while true; do
    prompt "Choose update type [1-3] (recommended: 2, Normal): "
    if ! read -r answer; then
      die "Update type selection is required."
    fi

    case "$answer" in
      1|SMALL_SAFE) PUBLISH_CLASSIFICATION="SMALL_SAFE"; break ;;
      2|NORMAL|"") PUBLISH_CLASSIFICATION="NORMAL"; break ;;
      3|SIGNIFICANT) PUBLISH_CLASSIFICATION="SIGNIFICANT"; break ;;
      *) warn "Invalid input. Please choose 1, 2, or 3." ;;
    esac
  done

  if [[ "$PUBLISH_CLASSIFICATION" == "SMALL_SAFE" ]]; then
    success "Small safe accepted as explicit post-scope authorization."
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
  show_section_or_skipped "Staged diff:" git --no-pager diff --cached
}

show_unpushed_commit_summary() {
  local comparison_ref
  comparison_ref="$(publish_comparison_ref)"

  step "Review existing unpushed commits."
  info "Comparison base: $comparison_ref"
  show_section_or_skipped "Commits to publish:" git --no-pager log --oneline "$comparison_ref..HEAD"
  show_section_or_skipped "Changed files:" git --no-pager diff --name-status "$comparison_ref...HEAD"
  show_section_or_skipped "Diff stat:" git --no-pager diff --stat "$comparison_ref...HEAD"
  show_section_or_skipped "Diff:" git --no-pager diff "$comparison_ref...HEAD"
}

show_publish_recommendations() {
  local commit_message="$1"
  local pr_title="$2"

  step "Recommended publish context."
  info "Recommended update type: Normal"
  if [[ "$HAS_UNCOMMITTED_CHANGES" == "1" ]]; then
    info "Recommended commit message: $commit_message"
  else
    info "Recommended commit message: no new commit needed"
  fi
  info "Recommended PR title: $pr_title"
  info "Override the commit message with the first command argument and PR title with the second."
}

list_repository_open_prs() {
  gh pr list \
    --repo "$REPO_FULL_NAME" \
    --state open \
    --limit 100 \
    --json number,title,headRefName,baseRefName,url \
    --jq '.[] | "#\(.number) | \(.title) | \(.headRefName) -> \(.baseRefName) | \(.url)"'
}

detect_current_branch_pr_number() {
  local branch
  branch="$(current_branch)"

  gh pr list \
    --repo "$REPO_FULL_NAME" \
    --state all \
    --head "$branch" \
    --limit 1 \
    --json number \
    --jq '.[0].number // empty'
}

detect_current_branch_open_pr_number() {
  local branch
  branch="$(current_branch)"

  gh pr list \
    --repo "$REPO_FULL_NAME" \
    --state open \
    --head "$branch" \
    --limit 1 \
    --json number \
    --jq '.[0].number // empty'
}

refresh_current_branch_pr_state() {
  local current_pr_number pr_info

  CURRENT_BRANCH_PR_EXISTS=0
  if ! current_pr_number="$(detect_current_branch_pr_number)"; then
    return 1
  fi

  if [[ -z "$current_pr_number" ]]; then
    return 0
  fi

  if ! pr_info="$(read_publish_pr_info "$current_pr_number")"; then
    return 1
  fi

  parse_publish_pr_info "$pr_info"
  CURRENT_BRANCH_PR_EXISTS=1
}

refresh_current_branch_open_pr_state() {
  local current_pr_number pr_info

  CURRENT_BRANCH_PR_EXISTS=0
  if ! current_pr_number="$(detect_current_branch_open_pr_number)"; then
    return 1
  fi

  if [[ -z "$current_pr_number" ]]; then
    return 0
  fi

  if ! pr_info="$(read_publish_pr_info "$current_pr_number")"; then
    return 1
  fi

  parse_publish_pr_info "$pr_info"
  CURRENT_BRANCH_PR_EXISTS=1
}

confirm_github_preflight_uncertainty() {
  if ! confirm "Continue after reviewing this GitHub preflight warning?"; then
    die "Stopped during GitHub preflight."
  fi
}

inspect_github_pr_state() {
  local open_prs gh_error gh_error_file

  step "Inspect repository pull request state."

  if ! command -v gh >/dev/null 2>&1; then
    warn "GitHub CLI is unavailable; repository and current-branch PR state could not be checked."
    confirm_github_preflight_uncertainty
    return
  fi

  if ! gh auth status >/dev/null 2>&1; then
    warn "GitHub CLI is not authenticated; repository and current-branch PR state could not be checked."
    confirm_github_preflight_uncertainty
    return
  fi

  if ! ensure_repo_full_name; then
    warn "GitHub repository identity could not be determined."
    confirm_github_preflight_uncertainty
    return
  fi

  info "GitHub repository: $REPO_FULL_NAME"
  gh_error_file="$(make_workflow_temp_file "publish-open-prs-error")"

  if ! open_prs="$(list_repository_open_prs 2>"$gh_error_file")"; then
    gh_error="$(cat "$gh_error_file" 2>/dev/null || true)"
    rm -f "$gh_error_file"
    warn "Could not list repository-level open pull requests."
    if [[ -n "$gh_error" ]]; then
      printf "%s\n" "$gh_error" >&2
    fi
    confirm_github_preflight_uncertainty
  else
    rm -f "$gh_error_file"
    if [[ -n "$open_prs" ]]; then
      warn "Open pull requests already exist in this repository:"
      printf "%s\n" "$open_prs"
      warn "Confirm whether any listed PR is prerequisite work that should be merged first."
      if ! confirm "Continue after reviewing the open pull requests?"; then
        die "Stopped after repository-level pull request review."
      fi
    else
      info "No repository-level open pull requests detected."
    fi
  fi

  if ! refresh_current_branch_pr_state; then
    warn "Could not inspect the current branch for an existing pull request."
    confirm_github_preflight_uncertainty
  elif [[ "$CURRENT_BRANCH_PR_EXISTS" == "1" ]]; then
    warn "Current branch already has a pull request."
    show_publish_pr_info
  else
    info "No open pull request detected for current branch '$(current_branch)'."
  fi
}

inspect_publish_state() {
  step "Inspect local publish state."
  info "Current branch: $(current_branch)"

  if has_uncommitted_changes; then
    HAS_UNCOMMITTED_CHANGES=1
    info "Uncommitted changes: yes"
  else
    info "Uncommitted changes: no"
  fi

  if [[ "$CURRENT_BRANCH_PR_EXISTS" == "1" &&
        "$PUBLISH_PR_HEAD_OID" == "$(git rev-parse HEAD)" ]]; then
    info "Unpushed commits: no (local HEAD matches PR head)"
  elif branch_has_unpushed_commits; then
    HAS_UNPUSHED_COMMITS=1
    info "Unpushed commits: yes"
  else
    info "Unpushed commits: no"
  fi

  if [[ "$CURRENT_BRANCH_PR_EXISTS" == "1" &&
        "$PUBLISH_PR_STATE" != "OPEN" &&
        ( "$HAS_UNCOMMITTED_CHANGES" == "1" || "$HAS_UNPUSHED_COMMITS" == "1" ) ]]; then
    info "Ignoring prior $PUBLISH_PR_STATE PR #$PUBLISH_PR_NUMBER because new local work is pending."
    CURRENT_BRANCH_PR_EXISTS=0
  fi

  if [[ "$CURRENT_BRANCH_PR_EXISTS" == "1" ]]; then
    info "Current-branch PR: #$PUBLISH_PR_NUMBER ($PUBLISH_PR_STATE)"
  else
    info "Current-branch PR: none detected"
  fi
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

confirm_scope_consistency() {
  if ! confirm "Does the complete scope shown above match the intended plan and task boundary?"; then
    die "Stopped because scope consistency was not confirmed."
  fi
}

prepare_and_confirm_publish_scope() {
  if [[ "$HAS_UNCOMMITTED_CHANGES" == "1" ]]; then
    show_change_summary
    git add -A
    show_final_staged_summary
  fi

  if [[ "$HAS_UNPUSHED_COMMITS" == "1" ]]; then
    show_unpushed_commit_summary
  fi

  if [[ "$CURRENT_BRANCH_PR_EXISTS" == "1" ]]; then
    step "Review current-branch PR context."
    show_publish_pr_info
    info "Review URL: $PUBLISH_PR_URL"
  fi

  confirm_scope_consistency
}

commit_changes_if_needed() {
  local commit_message="$1"

  if ! has_uncommitted_changes; then
    info "No uncommitted changes; publishing existing local commits."
    return
  fi

  git commit -m "$commit_message"
  success "Committed all staged, unstaged, and untracked changes."
}

capture_validation_statement() {
  local validation_code

  if [[ "$PUBLISH_CLASSIFICATION" == "SMALL_SAFE" ]]; then
    VALIDATION_STATEMENT="SMALL_SAFE_SCOPE_CONFIRMED - complete scope confirmed; validation prompt skipped by Small safe authorization."
    skipped "Local/manual validation prompt skipped because Small safe was authorized after scope confirmation."
    return
  fi

  step "Select validation performed."
  printf "  DOC_REVIEWED     Documentation/text-only change reviewed manually\n"
  printf "  CHECK_PASSED     Automated checks passed\n"
  printf "  MANUAL_REVIEWED  Full manual review completed\n"
  printf "  MANUAL_TESTED    Manual smoke/runtime test completed\n"
  if [[ "$PUBLISH_CLASSIFICATION" == "NORMAL" ]]; then
    printf "  NOT_RUN          Validation not run or not applicable\n"
  fi
  prompt "Type a validation code: "
  read -r validation_code

  if [[ "$PUBLISH_CLASSIFICATION" == "SIGNIFICANT" ]]; then
    case "$validation_code" in
      CHECK_PASSED|MANUAL_REVIEWED|MANUAL_TESTED) ;;
      *)
        die "SIGNIFICANT updates require CHECK_PASSED, MANUAL_REVIEWED, or MANUAL_TESTED."
        ;;
    esac
  else
    case "$validation_code" in
      DOC_REVIEWED|CHECK_PASSED|MANUAL_REVIEWED|MANUAL_TESTED|NOT_RUN) ;;
      *) die "Invalid validation code for NORMAL update." ;;
    esac
  fi

  case "$validation_code" in
    DOC_REVIEWED) VALIDATION_STATEMENT="DOC_REVIEWED - documentation/text-only change reviewed manually." ;;
    CHECK_PASSED) VALIDATION_STATEMENT="CHECK_PASSED - automated checks passed." ;;
    MANUAL_REVIEWED) VALIDATION_STATEMENT="MANUAL_REVIEWED - full manual review completed." ;;
    MANUAL_TESTED) VALIDATION_STATEMENT="MANUAL_TESTED - manual smoke/runtime test completed." ;;
    NOT_RUN)
      VALIDATION_STATEMENT="NOT_RUN - validation not run / not applicable."
      warn "NORMAL update is continuing without validation."
      ;;
  esac

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
  jq_expr='[.number, .url, .state, .baseRefName, .headRefName, (.isDraft|tostring), (.mergeable // "UNKNOWN"), (.mergeStateStatus // "UNKNOWN"), .headRefOid, (.mergedAt // ""), (.reviewDecision // ""), .title] | map(tostring) | join("\u001f")'

  gh pr view "$pr_ref" \
    --repo "$REPO_FULL_NAME" \
    --json number,url,state,baseRefName,headRefName,isDraft,mergeable,mergeStateStatus,headRefOid,mergedAt,reviewDecision,title \
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
    PUBLISH_PR_REVIEW_DECISION \
    PUBLISH_PR_TITLE <<< "$pr_info"
}

show_publish_pr_info() {
  info "PR #$PUBLISH_PR_NUMBER: $PUBLISH_PR_URL"
  printf "  Title: %s\n" "$PUBLISH_PR_TITLE"
  printf "  State: %s | Base: %s | Head: %s | Draft: %s\n" \
    "$PUBLISH_PR_STATE" "$PUBLISH_PR_BASE" "$PUBLISH_PR_HEAD" "$PUBLISH_PR_DRAFT"
  printf "  Mergeable: %s | Merge state: %s | Review: %s\n" \
    "$PUBLISH_PR_MERGEABLE" "$PUBLISH_PR_MERGE_STATE" "${PUBLISH_PR_REVIEW_DECISION:-N/A}"
}

create_or_update_pr() {
  local pr_title="$1"
  local branch head_sha body pr_info
  branch="$(current_branch)"
  head_sha="$(git rev-parse HEAD)"
  body="$(publish_record_body "$head_sha")"

  step "Create or update the pull request."

  if ! refresh_current_branch_open_pr_state; then
    die "Could not verify whether the current branch already has an open PR. Refusing to create a possible duplicate."
  fi

  if [[ "$CURRENT_BRANCH_PR_EXISTS" == "1" ]]; then
    pr_info="$(read_publish_pr_info "$PUBLISH_PR_NUMBER")"
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
      --title "$pr_title" \
      --body "$body" >/dev/null
    success "Created pull request for '$branch'."
  fi

  pr_info="$(read_publish_pr_info "$branch")"
  parse_publish_pr_info "$pr_info"
  show_publish_pr_info
}

handle_clean_existing_pr() {
  local choice refreshed_info

  if [[ -n "$PUBLISH_PR_MERGED_AT" && "$PUBLISH_PR_BASE" == "$DEFAULT_BRANCH" ]]; then
    success "PR #$PUBLISH_PR_NUMBER is verified merged into '$DEFAULT_BRANCH'."
    if confirm "Switch to and refresh '$DEFAULT_BRANCH' now?"; then
      refresh_default_branch
    else
      skipped "Default branch refresh was not approved."
    fi
    return
  fi

  if [[ "$PUBLISH_PR_STATE" != "OPEN" ]]; then
    warn "PR #$PUBLISH_PR_NUMBER is '$PUBLISH_PR_STATE' without a verified merge into '$DEFAULT_BRANCH'."
    info "PR: $PUBLISH_PR_URL"
    return
  fi

  while true; do
    warn "PR #$PUBLISH_PR_NUMBER is still open and there are no local changes or unpushed commits."
    info "PR: $PUBLISH_PR_URL"
    printf "  1) Re-check PR state\n"
    printf "  2) Open PR in browser\n"
    printf "  3) Exit\n"
    prompt "Choose [1-3]: "
    if ! read -r choice; then
      return
    fi

    case "$choice" in
      1)
        refreshed_info="$(read_publish_pr_info "$PUBLISH_PR_NUMBER")"
        parse_publish_pr_info "$refreshed_info"
        if [[ -n "$PUBLISH_PR_MERGED_AT" && "$PUBLISH_PR_BASE" == "$DEFAULT_BRANCH" ]]; then
          success "PR #$PUBLISH_PR_NUMBER is verified merged into '$DEFAULT_BRANCH'."
          if confirm "Switch to and refresh '$DEFAULT_BRANCH' now?"; then
            refresh_default_branch
          else
            skipped "Default branch refresh was not approved."
          fi
          return
        fi
        ;;
      2)
        gh pr view "$PUBLISH_PR_NUMBER" --repo "$REPO_FULL_NAME" --web
        ;;
      3|"")
        info "Leaving PR #$PUBLISH_PR_NUMBER open without changing local '$DEFAULT_BRANCH'."
        return
        ;;
      *)
        warn "Invalid input. Please choose 1, 2, or 3."
        ;;
    esac
  done
}

report_github_cli_failure() {
  local context="$1"
  local status="$2"
  local command="$3"
  local details="$4"

  error "$context (exit code $status)."
  error "Command: $command"
  if [[ -n "$details" ]]; then
    error "GitHub CLI error:"
    printf "%s\n" "$details" >&2
  else
    error "GitHub CLI returned no error details."
  fi
}

check_pr_merge_readiness() {
  local mode="$1"
  local expected_head="$2"
  local check_summary check_status check_error check_output_file check_error_file
  local normalized_summary normalized_error
  local check_state check_bucket has_pending=0
  local -a check_states=()

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

  check_output_file="$(make_workflow_temp_file "publish-checks-output")"
  check_error_file="$(make_workflow_temp_file "publish-checks-error")"

  set +e
  gh pr checks "$PUBLISH_PR_NUMBER" \
    --repo "$REPO_FULL_NAME" \
    --required \
    --json bucket,state \
    --jq '[.[] | "\(.bucket)|\(.state)"] | unique | join(",")' >"$check_output_file" 2>"$check_error_file"
  check_status=$?
  set -e

  check_summary="$(cat "$check_output_file" 2>/dev/null || true)"
  check_error="$(cat "$check_error_file" 2>/dev/null || true)"
  rm -f "$check_output_file" "$check_error_file"
  normalized_summary="$(printf "%s" "$check_summary" | tr '[:upper:]' '[:lower:]')"
  normalized_error="$(printf "%s" "$check_error" | tr '[:upper:]' '[:lower:]')"

  if [[ "$normalized_error" == *"no required checks reported"* ||
        "$normalized_error" == *"no checks reported on the "* ]]; then
    check_summary=""
    normalized_summary=""
    check_status=0
  elif [[ "$check_status" != "0" && -z "$normalized_summary" ]]; then
    report_github_cli_failure \
      "GitHub CLI could not verify required checks for PR #$PUBLISH_PR_NUMBER" \
      "$check_status" \
      "gh pr checks $PUBLISH_PR_NUMBER --repo $REPO_FULL_NAME --required" \
      "$check_error"
    return 1
  fi

  info "Required check state: ${check_summary:-none reported}"

  if [[ -n "$normalized_summary" ]]; then
    IFS=',' read -r -a check_states <<< "$normalized_summary"
    for check_state in "${check_states[@]}"; do
      check_state="${check_state//[[:space:]]/}"
      check_bucket="${check_state%%|*}"
      case "$check_bucket" in
        pass)
          ;;
        pending)
          has_pending=1
          ;;
        fail|cancel|skipping)
          die "Required checks are failing: $check_summary"
          ;;
        *)
          die "Unknown required check state: $check_summary"
          ;;
      esac
    done
  fi

  if [[ "$check_status" != "0" && "$has_pending" == "0" ]]; then
    report_github_cli_failure \
      "GitHub CLI could not verify required checks for PR #$PUBLISH_PR_NUMBER" \
      "$check_status" \
      "gh pr checks $PUBLISH_PR_NUMBER --repo $REPO_FULL_NAME --required" \
      "$check_error"
    return 1
  fi

  if [[ "$has_pending" == "1" ]]; then
    if [[ "$mode" == "immediate" ]]; then
      die "Required checks are pending. Use auto-merge or PR-only mode."
    fi
    warn "Required checks are pending; auto-merge may wait for them to complete."
  fi

  if [[ "$mode" == "immediate" && "$PUBLISH_PR_MERGE_STATE" == "BLOCKED" ]]; then
    die "PR merge state is BLOCKED. Use auto-merge or PR-only mode."
  fi
}

run_pr_merge_command() {
  local mode="$1"
  local head_sha="$2"
  local merge_command merge_error merge_error_file merge_status mode_label normalized_merge_error
  local -a merge_args

  if [[ "$mode" == "auto" ]]; then
    merge_args=(
      "$PUBLISH_PR_NUMBER"
      --repo "$REPO_FULL_NAME"
      --auto
      --squash
      --match-head-commit "$head_sha"
    )
    mode_label="squash auto-merge"
    merge_command="gh pr merge $PUBLISH_PR_NUMBER --repo $REPO_FULL_NAME --auto --squash --match-head-commit $head_sha"
  else
    merge_args=(
      "$PUBLISH_PR_NUMBER"
      --repo "$REPO_FULL_NAME"
      --squash
      --match-head-commit "$head_sha"
    )
    mode_label="immediate squash merge"
    merge_command="gh pr merge $PUBLISH_PR_NUMBER --repo $REPO_FULL_NAME --squash --match-head-commit $head_sha"
  fi

  merge_error_file="$(make_workflow_temp_file "publish-merge-error")"

  set +e
  gh pr merge "${merge_args[@]}" 2>"$merge_error_file"
  merge_status=$?
  set -e

  merge_error="$(cat "$merge_error_file" 2>/dev/null || true)"
  rm -f "$merge_error_file"

  if [[ "$merge_status" != "0" ]]; then
    normalized_merge_error="$(printf "%s" "$merge_error" | tr '[:upper:]' '[:lower:]')"
    report_github_cli_failure \
      "GitHub rejected $mode_label for PR #$PUBLISH_PR_NUMBER" \
      "$merge_status" \
      "$merge_command" \
      "$merge_error"
    if [[ "$normalized_merge_error" == *"auto merge is not allowed"* ]]; then
      error "Repository auto-merge is disabled."
      error "Enable: GitHub repository Settings > General > Pull Requests > Allow auto-merge."
    fi
    return 1
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

wait_for_small_safe_merge() {
  local attempts="${SMALL_SAFE_MERGE_POLL_ATTEMPTS:-12}"
  local interval_seconds="${SMALL_SAFE_MERGE_POLL_INTERVAL_SECONDS:-5}"
  local attempt refreshed_info read_error read_error_file read_status

  for ((attempt = 1; attempt <= attempts; attempt++)); do
    read_error_file="$(make_workflow_temp_file "publish-merge-status-error")"

    set +e
    refreshed_info="$(read_publish_pr_info "$PUBLISH_PR_NUMBER" 2>"$read_error_file")"
    read_status=$?
    set -e

    read_error="$(cat "$read_error_file" 2>/dev/null || true)"
    rm -f "$read_error_file"

    if [[ "$read_status" != "0" ]]; then
      report_github_cli_failure \
        "GitHub CLI could not verify auto-merge completion for PR #$PUBLISH_PR_NUMBER" \
        "$read_status" \
        "gh pr view $PUBLISH_PR_NUMBER --repo $REPO_FULL_NAME" \
        "$read_error"
      return 1
    fi

    parse_publish_pr_info "$refreshed_info"

    if [[ -n "$PUBLISH_PR_MERGED_AT" && "$PUBLISH_PR_BASE" == "$DEFAULT_BRANCH" ]]; then
      success "Verified PR #$PUBLISH_PR_NUMBER merged into '$DEFAULT_BRANCH'."
      return
    fi

    if [[ "$PUBLISH_PR_STATE" != "OPEN" ]]; then
      error "PR #$PUBLISH_PR_NUMBER is '$PUBLISH_PR_STATE' without a verified merge into '$DEFAULT_BRANCH'."
      error "PR: $PUBLISH_PR_URL"
      return 1
    fi

    if ((attempt < attempts)); then
      info "Waiting for GitHub to complete auto-merge for PR #$PUBLISH_PR_NUMBER ($attempt/$attempts)."
      sleep "$interval_seconds"
    fi
  done

  error "Auto-merge was enabled, but PR #$PUBLISH_PR_NUMBER was not merged after $attempts checks."
  error "PR state: $PUBLISH_PR_STATE | Merge state: $PUBLISH_PR_MERGE_STATE | URL: $PUBLISH_PR_URL"
  error "Resolve pending checks, review threads, or repository rules, then re-run the publish workflow."
  return 1
}

run_merge_flow() {
  local mode="$1"
  local head_sha fresh_info
  head_sha="$(git rev-parse HEAD)"

  fresh_info="$(read_publish_pr_info "$PUBLISH_PR_NUMBER")"
  parse_publish_pr_info "$fresh_info"
  show_publish_pr_info
  check_pr_merge_readiness "$mode" "$head_sha"

  if [[ "$PUBLISH_CLASSIFICATION" == "SMALL_SAFE" ]]; then
    skipped "Manual PR review approval skipped because SMALL_SAFE was pre-approved."
  else
    confirm_manual_pr_review
  fi

  if [[ "$mode" == "auto" ]]; then
    run_pr_merge_command "$mode" "$head_sha"
    success "Enabled squash auto-merge for PR #$PUBLISH_PR_NUMBER."

    if [[ "$PUBLISH_CLASSIFICATION" == "SMALL_SAFE" ]]; then
      wait_for_small_safe_merge
      refresh_default_branch
      return
    fi

    info "Exiting without polling for merge completion or refreshing local '$DEFAULT_BRANCH'."
    return
  fi

  run_pr_merge_command "$mode" "$head_sha"
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

complete_pr_workflow() {
  if [[ "$PUBLISH_CLASSIFICATION" == "SMALL_SAFE" ]]; then
    step "Complete SMALL_SAFE publish automatically."
    info "Skipping PR completion mode selection because SMALL_SAFE was pre-approved."
    run_merge_flow "auto"
    return
  fi

  choose_pr_mode
}

main() {
  local commit_message="" pr_title=""

  require_command git
  ensure_git_repo
  ensure_not_detached_head
  ensure_origin_exists
  info "Current branch: $(current_branch)"
  inspect_default_branch_freshness
  inspect_github_pr_state
  inspect_publish_state

  if [[ "$HAS_UNCOMMITTED_CHANGES" == "0" && "$HAS_UNPUSHED_COMMITS" == "0" && "$CURRENT_BRANCH_PR_EXISTS" == "0" ]]; then
    success "No uncommitted changes, unpushed commits, or current-branch PR detected. Nothing to publish."
    return
  fi

  if [[ "$HAS_UNCOMMITTED_CHANGES" == "0" && "$HAS_UNPUSHED_COMMITS" == "0" && "$CURRENT_BRANCH_PR_EXISTS" == "1" ]]; then
    handle_clean_existing_pr
    return
  fi

  if [[ "$HAS_UNCOMMITTED_CHANGES" == "1" ]]; then
    commit_message="$(resolve_commit_message "${1:-}")"
  elif [[ "$CURRENT_BRANCH_PR_EXISTS" == "1" && -n "${PUBLISH_PR_TITLE:-}" ]]; then
    commit_message="$PUBLISH_PR_TITLE"
    info "Using existing PR title: $commit_message"
  else
    commit_message="$(latest_commit_subject)"
    info "Using latest commit subject as PR title: $commit_message"
  fi

  pr_title="${2:-$commit_message}"
  prepare_and_confirm_publish_scope
  show_publish_recommendations "$commit_message" "$pr_title"
  classify_update

  ensure_feature_branch "$commit_message"
  commit_changes_if_needed "$commit_message"
  capture_validation_statement
  ensure_gh_publish_ready
  push_branch
  create_or_update_pr "$pr_title"
  complete_pr_workflow

  success "Local publish workflow complete."
}

main "$@"
