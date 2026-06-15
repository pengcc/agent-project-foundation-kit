#!/usr/bin/env bash

# Compatibility entrypoint for source-repository scripts.

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  printf "This file is intended to be sourced, not executed directly.\n" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=../../kit/scripts/lib/workflow-common.sh
source "$SCRIPT_DIR/../../kit/scripts/lib/workflow-common.sh"
