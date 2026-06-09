#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# Config
# ------------------------------------------------------------

# Default location for downloaded/generated theme zip files.
# You can still pass a full path to the zip file.
THEME_ZIP_DIR="${THEME_ZIP_DIR:-dev_locals/theme-zips}"

DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"

# ------------------------------------------------------------
# Output helpers
# ------------------------------------------------------------

if [[ -t 1 ]]; then
  COLOR_INFO="\033[36m"
  COLOR_PROCESS="\033[34m"
  COLOR_SUCCESS="\033[32m"
  COLOR_WARNING="\033[33m"
  COLOR_DANGER="\033[31m"
  COLOR_RESET="\033[0m"
else
  COLOR_INFO=""
  COLOR_PROCESS=""
  COLOR_SUCCESS=""
  COLOR_WARNING=""
  COLOR_DANGER=""
  COLOR_RESET=""
fi

info() {
  echo -e "${COLOR_INFO}[INFO]${COLOR_RESET} $*"
}

process() {
  echo -e "${COLOR_PROCESS}[PROCESS]${COLOR_RESET} $*"
}

success() {
  echo -e "${COLOR_SUCCESS}[SUCCESS]${COLOR_RESET} $*"
}

warning() {
  echo -e "${COLOR_WARNING}[WARNING]${COLOR_RESET} $*"
}

danger() {
  echo -e "${COLOR_DANGER}[DANGER]${COLOR_RESET} $*"
}

die() {
  danger "$*"
  exit 1
}

ask_yes_no() {
  local prompt="$1"
  local answer

  while true; do
    read -r -p "$prompt [y/N] " answer
    case "$answer" in
      y|Y|yes|YES) return 0 ;;
      ""|n|N|no|NO) return 1 ;;
      *) warning "Please answer y or n." ;;
    esac
  done
}

# ------------------------------------------------------------
# Usage
# ------------------------------------------------------------

usage() {
  cat <<EOF
Usage:
  bash scripts/apply-theme-zip.sh <zip-file-or-name> "<commit message>"

Examples:
  bash scripts/apply-theme-zip.sh agent-execute-plan.zip "Add execute-plan skill"
  bash scripts/apply-theme-zip.sh dev_locals/theme-zips/agent-execute-plan.zip "Add execute-plan skill"
  THEME_ZIP_DIR=/tmp/theme-zips bash scripts/apply-theme-zip.sh agent-execute-plan.zip "Add execute-plan skill"

Default theme zip directory:
  ${THEME_ZIP_DIR}
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 2 ]]; then
  usage
  exit 1
fi

ZIP_INPUT="$1"
COMMIT_MESSAGE="$2"

# ------------------------------------------------------------
# Repo checks
# ------------------------------------------------------------

git rev-parse --show-toplevel >/dev/null 2>&1 || die "Not inside a git repository."

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

CURRENT_BRANCH="$(git branch --show-current)"
if [[ -z "$CURRENT_BRANCH" ]]; then
  die "Could not detect current git branch."
fi

info "Repository: $REPO_ROOT"
info "Current branch: $CURRENT_BRANCH"

if [[ "$CURRENT_BRANCH" != "$DEFAULT_BRANCH" ]]; then
  warning "Current branch is '$CURRENT_BRANCH', not '$DEFAULT_BRANCH'."
  if ! ask_yes_no "Continue anyway?"; then
    die "Aborted."
  fi
fi

# ------------------------------------------------------------
# Resolve zip path
# ------------------------------------------------------------

resolve_zip_path() {
  local input="$1"

  # Full or relative path provided directly.
  if [[ -f "$input" ]]; then
    realpath "$input"
    return 0
  fi

  # Filename provided, look inside THEME_ZIP_DIR.
  if [[ -f "$THEME_ZIP_DIR/$input" ]]; then
    realpath "$THEME_ZIP_DIR/$input"
    return 0
  fi

  return 1
}

ZIP_FILE="$(resolve_zip_path "$ZIP_INPUT")" || {
  danger "Zip file not found: $ZIP_INPUT"
  echo
  info "Checked:"
  echo "  $ZIP_INPUT"
  echo "  $THEME_ZIP_DIR/$ZIP_INPUT"
  exit 1
}

[[ "$ZIP_FILE" == *.zip ]] || die "File is not a .zip: $ZIP_FILE"

success "Using zip file: $ZIP_FILE"

# ------------------------------------------------------------
# Required tools
# ------------------------------------------------------------

command -v unzip >/dev/null 2>&1 || die "Missing required command: unzip"
command -v wc >/dev/null 2>&1 || die "Missing required command: wc"
command -v find >/dev/null 2>&1 || die "Missing required command: find"
command -v sort >/dev/null 2>&1 || die "Missing required command: sort"

# ------------------------------------------------------------
# Temporary extraction
# ------------------------------------------------------------

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

process "Extracting zip to temporary directory..."
unzip -q "$ZIP_FILE" -d "$TMP_DIR"

success "Extracted to: $TMP_DIR"

# ------------------------------------------------------------
# Zip content checks
# ------------------------------------------------------------

info "Files in zip:"
echo

find "$TMP_DIR" -type f | sort | while read -r file; do
  rel_path="${file#$TMP_DIR/}"
  echo "  $rel_path"
done

echo
info "Line counts in zip:"
echo

find "$TMP_DIR" -type f | sort | while read -r file; do
  rel_path="${file#$TMP_DIR/}"
  lines="$(wc -l < "$file" | tr -d ' ')"
  printf "%5s %s\n" "$lines" "$rel_path"
done

echo

if ! ask_yes_no "Apply these files to the repository root?"; then
  die "Aborted before applying files."
fi

# ------------------------------------------------------------
# Apply files
# ------------------------------------------------------------

process "Applying files to repository root..."

# Copy only file contents while preserving paths.
# Directories are created as needed.
find "$TMP_DIR" -type f | sort | while read -r file; do
  rel_path="${file#$TMP_DIR/}"
  target="$REPO_ROOT/$rel_path"
  mkdir -p "$(dirname "$target")"
  cp "$file" "$target"
done

success "Files applied."

# ------------------------------------------------------------
# Local verify
# ------------------------------------------------------------

info "Local line counts after apply:"
echo

find "$TMP_DIR" -type f | sort | while read -r file; do
  rel_path="${file#$TMP_DIR/}"
  target="$REPO_ROOT/$rel_path"

  if [[ -f "$target" ]]; then
    lines="$(wc -l < "$target" | tr -d ' ')"
    printf "%5s %s\n" "$lines" "$rel_path"
  else
    printf "%5s %s\n" "MISSING" "$rel_path"
  fi
done

echo

# ------------------------------------------------------------
# Git status and diff
# ------------------------------------------------------------

info "Git status:"
git status --short

echo
info "Git diff stat:"
git diff --stat || true

echo

if ! git diff --quiet || [[ -n "$(git status --short)" ]]; then
  if ask_yes_no "Create local commit with message: '$COMMIT_MESSAGE'?"; then
    process "Creating local commit..."
    git add .
    git commit -m "$COMMIT_MESSAGE"
    success "Committed."

    if ask_yes_no "Push current branch '$CURRENT_BRANCH'?"; then
      process "Pushing..."
      git push
      success "Pushed."
    else
      warning "Skipped push."
    fi
  else
    warning "Skipped commit."
  fi
else
  success "No changes detected."
fi

# ------------------------------------------------------------
# Remote verify commands
# ------------------------------------------------------------

REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
GITHUB_REPO=""

if [[ "$REMOTE_URL" =~ github.com[:/](.+/.+)(\.git)?$ ]]; then
  GITHUB_REPO="${BASH_REMATCH[1]}"
  GITHUB_REPO="${GITHUB_REPO%.git}"
fi

if [[ -n "$GITHUB_REPO" ]]; then
  echo
  info "Remote verify commands:"
  echo

  # Only generate verify commands for files, never directories.
  find "$TMP_DIR" -type f | sort | while read -r file; do
    rel_path="${file#$TMP_DIR/}"
    echo "curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/${DEFAULT_BRANCH}/${rel_path} | wc -l"
  done

  echo
else
  warning "Could not detect GitHub repo from origin remote. Skipped remote verify commands."
fi

# ------------------------------------------------------------
# Optional zip cleanup
# ------------------------------------------------------------

if [[ -f "$ZIP_FILE" ]]; then
  echo
  if ask_yes_no "Delete local zip file now?"; then
    rm "$ZIP_FILE"
    success "Deleted zip file: $ZIP_FILE"
  else
    info "Kept zip file: $ZIP_FILE"
  fi
fi

success "Theme zip apply workflow finished."
