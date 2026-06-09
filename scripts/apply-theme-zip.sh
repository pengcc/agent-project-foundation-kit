#!/usr/bin/env bash

set -euo pipefail

ZIP_FILE="${1:-}"
COMMIT_MESSAGE="${2:-}"

info() {
  printf "\033[34m[INFO]\033[0m %s\n" "$1"
}

process() {
  printf "\033[36m[PROCESS]\033[0m %s\n" "$1"
}

success() {
  printf "\033[32m[SUCCESS]\033[0m %s\n" "$1"
}

warning() {
  printf "\033[33m[WARNING]\033[0m %s\n" "$1"
}

danger() {
  printf "\033[31m[DANGER]\033[0m %s\n" "$1"
}

ask_yes_no() {
  local prompt="$1"
  local answer

  printf "%s [y/N]: " "$prompt"
  read -r answer

  case "$answer" in
    y|Y|yes|YES)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

if [[ -z "$ZIP_FILE" ]]; then
  danger "Missing zip file argument."
  echo "Usage:"
  echo "  bash scripts/apply-theme-zip.sh <theme-zip-file> \"<commit message>\""
  exit 1
fi

if [[ ! -f "$ZIP_FILE" ]]; then
  danger "Zip file not found: $ZIP_FILE"
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  danger "This script must be run inside a git repository."
  exit 1
fi

if ! command -v unzip >/dev/null 2>&1; then
  danger "unzip is required but not installed."
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

info "Repo root: $REPO_ROOT"
info "Zip file: $ZIP_FILE"

process "Listing zip contents..."
unzip -Z1 "$ZIP_FILE"

process "Extracting zip to temporary directory..."
unzip -q "$ZIP_FILE" -d "$TMP_DIR"

process "Line counts inside zip:"
while IFS= read -r file; do
  if [[ -f "$TMP_DIR/$file" ]]; then
    lines="$(wc -l < "$TMP_DIR/$file" | tr -d ' ')"
    printf "%5s %s\n" "$lines" "$file"
  fi
done < <(unzip -Z1 "$ZIP_FILE")

warning "This will overwrite matching files in the current repository."
if ! ask_yes_no "Continue and apply zip contents?"; then
  info "Cancelled. No files were changed."
  exit 0
fi

process "Applying zip contents to repo..."
unzip -oq "$ZIP_FILE" -d "$REPO_ROOT"
success "Zip contents applied."

process "Local line counts after apply:"
while IFS= read -r file; do
  if [[ -f "$REPO_ROOT/$file" ]]; then
    lines="$(wc -l < "$REPO_ROOT/$file" | tr -d ' ')"
    printf "%5s %s\n" "$lines" "$file"
  else
    warning "Missing after apply: $file"
  fi
done < <(unzip -Z1 "$ZIP_FILE")

process "Git status:"
git status --short

process "Git diff stat:"
git diff --stat || true

if [[ -z "$COMMIT_MESSAGE" ]]; then
  warning "No commit message provided."
  echo "You can review changes and commit manually."
  exit 0
fi

if git diff --quiet && git diff --cached --quiet; then
  info "No changes detected."
  exit 0
fi

if ! ask_yes_no "Commit changes with message: \"$COMMIT_MESSAGE\"?"; then
  info "Not committed. Review changes manually."
  exit 0
fi

process "Staging files from zip..."
while IFS= read -r file; do
  if [[ -e "$REPO_ROOT/$file" ]]; then
    git add "$file"
  fi
done < <(unzip -Z1 "$ZIP_FILE")

process "Committing..."
git commit -m "$COMMIT_MESSAGE"
success "Committed."

if ask_yes_no "Push current branch?"; then
  current_branch="$(git branch --show-current)"
  process "Pushing branch: $current_branch"
  git push -u origin "$current_branch"
  success "Pushed."

  remote_url="$(git remote get-url origin 2>/dev/null || true)"

  if [[ "$remote_url" == *"github.com"* ]]; then
    info "Remote verify commands:"
    echo

    owner_repo=""

    if [[ "$remote_url" =~ github.com[:/]([^/]+/[^/.]+)(\.git)?$ ]]; then
      owner_repo="${BASH_REMATCH[1]}"
    fi

    if [[ -n "$owner_repo" ]]; then
      while IFS= read -r file; do
        echo "curl -sL https://raw.githubusercontent.com/$owner_repo/$current_branch/$file | wc -l"
      done < <(unzip -Z1 "$ZIP_FILE")
    else
      warning "Could not parse GitHub owner/repo from remote URL: $remote_url"
    fi
  fi
else
  info "Not pushed."
fi

# ------------------------------------------------------------

# Optional cleanup

# ------------------------------------------------------------

if [[ -f "$ZIP_FILE" ]]; then

  if ask_yes_no "Delete local zip file now?"; then

    rm "$ZIP_FILE"

    success "Deleted zip file: $ZIP_FILE"

  else

    info "Kept zip file: $ZIP_FILE"

  fi

fi

success "Theme zip apply workflow finished."
