# Project Guideline

## 1. Project Overview

`agent-project-foundation-kit` is a reusable foundation kit for initializing software projects with agent-ready project memory, skills, prompts, rules, and workflow constraints.

The goal is to make Codex / coding agents work with clear project context, bounded workflows, docs-first technical judgment, explicit planning/execution phases, publishing boundaries, project initialization checks, project architecture planning, role routing, engineering quality principles, and durable project memory.

This repository develops the reusable foundation kit itself.

## 2. Current Scope

The current v0.1 focus is a minimal usable starter kit.

Completed themes:

- Theme 1: project memory foundation templates and initial memory skills
- Theme 2: `docs-first-research`
- Theme 3: `plan-with-context`
- Theme 4: `execute-plan`
- Theme 5: project memory rename migration
- Theme 6: this repository's own `.codex/project/` memory
- Theme 7: `publish-current-branch`
- Theme 8: `initialize-project-context`
- Theme 9: `agent-roles-and-capabilities`
- Theme 9.1: project memory and roadmap alignment cleanup
- Theme 10: `project-architecture-plan`
- Theme 11: `code-review`
- Theme 12: install / update workflow hardening
- Theme 13: first-run agent operating contract and durable memory loop
- Theme 14: `grill-me`
- Theme 15: `handoff`
- Theme 16: `write-a-skill`
- Theme 16.1: local publish workflow entrypoint and safety hardening
- Theme 16.3: downstream AGENTS template operating contract
- Theme 17: reusable GitHub repository settings package
- Theme 17.1: installable publish workflow scripts

Current canonical core skill names:

- `project-memory`
- `docs-first-research`
- `plan-with-context`
- `execute-plan`
- `update-project-memory`
- `publish-current-branch`
- `initialize-project-context`
- `agent-roles-and-capabilities`
- `project-architecture-plan`
- `code-review`

Current canonical core rules:

- `engineering-quality-principles`


Current canonical productivity skill names:

- `grill-me`
- `handoff`
- `write-a-skill`

Future planned themes:

- technology-specific skills
- release workflow
- deployment workflow

## 3. Non-Goals

v0.1 does not aim to solve full technology-specific expertise, release/deploy workflows, GitHub settings automation, or safe migration for existing non-empty `.codex/` installations.

Full role routing is now available at the generic level through `agent-roles-and-capabilities`, but framework-specific or provider-specific expert skills remain future work.

## 4. Tech Stack and Runtime

This repo is documentation/script oriented.

Current known tooling:

- Markdown for skills, templates, rules, prompts, and design logs
- Shell scripts under `scripts/`
- Installable shell scripts under `kit/scripts/`
- Zip-based theme delivery during development
- `ripgrep` recommended for migration/reference checks
- Git / GitHub for version control
- GitHub CLI expected for PR publishing workflows when available
- pnpm 10.26.2 as a dependency-free local command façade

## 5. Directory Structure

Important directories:

```txt
kit/
kit/project-templates/
kit/skills/
kit/prompts/
kit/rules/
kit/github-settings/
kit/scripts/
docs/
scripts/
.codex/project/
dev_locals/
```

`kit/` is the installable payload source.

`.codex/project/` is durable project memory for this repository itself and is not part of the installable `kit/` payload.

`dev_locals/` is local-only and contains plans, handoffs, scratch notes, research notes, initialization reports, and theme zip files.

Planning workflows save multi-step plans under `dev_locals/plans/` when writes are available. If
Plan Mode or the active tool environment blocks writes, they must report the blocked write, show
the exact intended path, and provide the plan content or a clear manual/save-later action. Plan
creation defaults to review and never authorizes execution.

The downstream `AGENTS.md` template defines generic role routing, working style, feature-branch publishing boundaries, final-report classification, and durable project-memory behavior using installed `.codex/` content.

## 6. Scripts and Commands

Current helper scripts:

```txt
scripts/apply-theme-zip.sh
scripts/publish-local-change.sh
scripts/install-foundation-kit.sh
scripts/test-install-foundation-kit.sh
scripts/test-publish-local-change.sh
```

Installable workflow scripts:

```txt
kit/scripts/publish-changes.sh
kit/scripts/lib/workflow-common.sh
```

Short command entrypoints:

```txt
pnpm publish:local
pnpm apply-theme
pnpm test:install
pnpm test:publish
pnpm check
```

Theme zip files should normally be stored under:

```txt
dev_locals/theme-zips/
```

The `apply-theme-zip.sh` script supports configurable environment variables:

```txt
THEME_ZIP_DIR
DEFAULT_BRANCH
THEME_BRANCH_PREFIX
DESTRUCTIVE_DROP_PERCENT
DESTRUCTIVE_DROP_LINES
```

Current `apply-theme-zip.sh` safety behavior:

- requires a clean working tree
- warns before applying a theme zip on `main` / `master` / default branch
- suggests and can create a feature branch
- lists zip contents
- lists incoming line counts
- scans for destructive-looking line-count drops
- requires `APPLY_DESTRUCTIVE` before applying high-risk overwrites
- shows local line counts after apply
- shows `git status` and `git diff --stat`
- can optionally commit, push, and create a PR
- never merges by default
- can refresh the default branch after a PR merge
- handles diverged local default branch with backup + reset confirmation

Current publish workflow architecture:

- keep `kit/scripts/publish-changes.sh` as the canonical, downstream-neutral implementation
- keep `kit/scripts/lib/workflow-common.sh` as the canonical shared helper
- keep `scripts/publish-local-change.sh` and `scripts/lib/workflow-common.sh` as thin source-repository compatibility wrappers
- publish local changes through a feature branch + PR workflow
- avoid unnecessary theme zip overhead for one/few-file changes
- classify updates as `SMALL_SAFE`, `NORMAL`, or `SIGNIFICANT`
- display and confirm the complete relevant scope before update classification
- use a numbered Small safe / Normal / Significant selection while preserving stable internal codes
- treat `SMALL_SAFE` selection as merge authorization only after scope confirmation
- inspect branch freshness, repository open PRs, current-branch PR state, uncommitted changes, and unpushed commits before prompting
- prompt for a commit message only when uncommitted changes need a commit
- use the latest commit subject as the PR title when publishing existing unpushed commits
- show recommended update type, commit message, and PR title while allowing overrides
- list repository-level open PRs and require acknowledgement without blocking solely because they exist
- update an existing current-branch PR instead of creating a duplicate
- show final staged scope for uncommitted changes and commit/diff scope for unpushed commits
- recover clean current-branch PRs that merged after a polling timeout and refresh only after verifying `mergedAt` and the default-branch base
- skip the validation prompt for `SMALL_SAFE` and record its scope-confirmed authorization statement
- use structured validation codes for `NORMAL` and `SIGNIFICANT`, with `NOT_RUN` allowed only for `NORMAL`
- distinguish no required checks, pending checks, failing checks, and GitHub CLI errors before merge
- automatically enable squash auto-merge for `SMALL_SAFE`, verify the remote merge, and refresh local `main`
- skip the PR completion mode and manual-review token for `SMALL_SAFE` because its post-scope classification is explicit authorization
- offer PR-only, squash auto-merge, or immediate squash merge modes for `NORMAL` and `SIGNIFICANT`
- require typed manual-review approval before scripted merge modes for `NORMAL` and `SIGNIFICANT`
- never push directly to the default branch
- exit after enabling auto-merge without polling for `NORMAL` and `SIGNIFICANT`
- refresh the default branch only after a verified merge; require explicit refresh approval outside the `SMALL_SAFE` automatic path
- create a backup branch and require `RESET_MAIN_TO_ORIGIN` before hard-reset recovery

Current `test-publish-local-change.sh` purpose:

- run deterministic local validation for publish workflow behavior
- use project-local fixtures with fake `git` and `gh` commands
- avoid real pushes, PR creation, merges, and network access
- cover scope-confirmation ordering, numbered classification, recommendations, repository/current-branch PR handling, late-merge recovery, required-check states, GitHub CLI errors, merge modes, and verified post-merge refresh

Current `install-foundation-kit.sh` purpose:

- install the reusable `kit/` payload into a new or early-stage downstream project
- use a controlled source-to-target boundary exception
- read only from the current foundation-kit repo's `kit/`
- write only inside the explicit target project root
- require explicit `--target`
- require the target directory to already exist
- block target equal to the foundation-kit repo root
- default to dry-run
- require `--apply` before writing files
- map `kit/project-templates/AGENTS.md` to target root `AGENTS.md`
- map project templates to `.codex/project/`
- map `kit/skills/`, `kit/prompts/`, `kit/rules/`, `kit/github-settings/`, and `kit/scripts/` to their matching `.codex/` directories
- validate source and target path boundaries before copying
- warn when target files already exist
- never auto-merge existing files
- backup existing files before replacement under `.codex/backups/install-YYYYMMDD-HHMMSS/`
- never install this repo's own `.codex/project/`, `dev_locals/`, `docs/`, or source-repository `scripts/`
- never create or modify a downstream `package.json`

Current `test-install-foundation-kit.sh` purpose:

- run local validation for installer behavior
- keep test artifacts under `dev_locals/test-runs/install-foundation-kit/`
- verify explicit target requirement, dry-run, fresh install, complete mapping correctness, conflict detection, no silent overwrite, backup-before-replace, missing-source blocking, missing-target blocking, target==repo-root blocking, and target boundary escape blocking

Current `kit/github-settings/` purpose:

- provide a reusable default-branch ruleset JSON for GitHub UI or REST API import
- provide a minimal General settings REST payload enabling squash merge and auto-merge
- provide a checklist for UI/API application, verification, optional hardening, and rollback
- install into downstream projects under `.codex/github-settings/`
- remain copied-only artifacts; the installer does not apply repository settings

Current `kit/scripts/` purpose:

- provide installable mechanical workflow executors for downstream projects
- install under `.codex/scripts/`
- preserve Bash + Git + GitHub CLI as the current runtime contract
- let skills own workflow strategy and authorization while scripts own repeatable mechanics

## 7. Environment Variables

Known script-level environment variables:

```txt
THEME_ZIP_DIR
DEFAULT_BRANCH
THEME_BRANCH_PREFIX
DESTRUCTIVE_DROP_PERCENT
DESTRUCTIVE_DROP_LINES
CHANGE_BRANCH_PREFIX
```

## 8. Architecture and Data Flow

The repo separates reusable installable content from repo-development memory.

Installable content:

```txt
kit/
```

Repository development memory:

```txt
.codex/project/
```

Local-only execution/planning/research artifacts:

```txt
dev_locals/
```

Future installer behavior should copy installable content from `kit/` into a target project `.codex/`.

The installer should not copy this repo's own `.codex/project/` into downstream projects.

## 9. Testing and Validation

Current validation is mostly file/content based:

- Check generated zip contents
- Check line counts before/after apply
- Run `rg` to detect stale references
- Check old directories are removed after rename migration
- Check diff stats before commit
- Verify remote raw GitHub file line counts after push when needed
- Prefer PR review for high-risk or multi-file theme updates
- Run `pnpm check` for shell syntax, installer tests, publish workflow tests, and whitespace validation

## 10. Development Workflow

The repo is developed theme by theme:

1. Discuss theme decisions.
2. Freeze accepted decisions.
3. Choose the safest update method:
   - single small edit: manual edit or `publish-local-change.sh`
   - multiple coordinated edits in one file: full-file replacement
   - multiple coordinated files: zip or full-file replacement bundle
   - mature files: verify line counts and diff before commit
4. Generate the selected artifact when needed.
5. Put theme zip files under `dev_locals/theme-zips/` when using zip delivery.
6. Apply with `scripts/apply-theme-zip.sh` when using zip delivery.
7. Verify local diff, line counts, and stale references.
8. Commit and push through feature branch + PR workflow.
9. Update this repo's project memory when durable facts, decisions, or lessons change.

## 11. Deployment

No deployment workflow is currently defined.

Publishing repository changes is separate from deployment.

Push / PR / merge behavior belongs to `publish-current-branch` or repo helper scripts.

Release and deploy workflows are future work.

## 12. Current Implementation Status

Completed:

- Project memory template foundation
- `docs-first-research`
- `plan-with-context`
- `execute-plan`
- Project memory rename migration
- `scripts/apply-theme-zip.sh` improvements
- Foundation-kit repo self project memory under `.codex/project/`
- `publish-current-branch`
- `initialize-project-context`
- `agent-roles-and-capabilities`
- `engineering-quality-principles`
- Theme 9.1 project memory and roadmap alignment cleanup
    - `scripts/publish-local-change.sh`
- Theme 10 `project-architecture-plan`
- Theme 11 `code-review`
- Theme 12 install / update workflow hardening
    - `scripts/install-foundation-kit.sh`
    - `scripts/test-install-foundation-kit.sh`
- Theme 13 first-run agent operating contract
    - `kit/rules/agent-operating-contract.md`
    - first-run routing integration in `initialize-project-context` and `update-project-memory`
    - `apply-theme-zip.sh` post-PR / cleanup bug fixes
- Theme 14 `grill-me`
    - `kit/skills/core/grill-me`
    - `kit/prompts/force-grill-me.md`
- Theme 15 `handoff`
    - `kit/skills/core/handoff`
    - `kit/prompts/force-handoff.md`
- Theme 16 `write-a-skill`
    - `kit/skills/core/write-a-skill`
    - `kit/prompts/force-write-a-skill.md`
- Theme 16.1 local publish workflow entrypoint and safety hardening
    - private dependency-free `package.json` command façade
    - hardened `scripts/publish-local-change.sh`
    - project-local workflow temporary files
    - deterministic `scripts/test-publish-local-change.sh`
- Theme 17 reusable GitHub repository settings
    - `kit/github-settings/`
    - installer mapping to `.codex/github-settings/`
    - publish authorization, late-merge recovery, documentation, and complete mapping stabilization
- Theme 17.1 installable publish workflow scripts
    - canonical `kit/scripts/publish-changes.sh`
    - canonical `kit/scripts/lib/workflow-common.sh`
    - source-repository compatibility wrappers
    - installer mapping to `.codex/scripts/`
    - deterministic wrapper, direct implementation, and complete-copy tests


In progress / next likely themes:

- technology-specific skills
- release workflow
- deployment workflow

## 13. Known Constraints and Risks

- Theme zip files cannot express deletions.
- Rename migrations can miss references outside skills/prompts/templates/docs.
- Reusable templates under `kit/project-templates/` must stay generic.
- `.codex/project/` belongs to this repo and must not be treated as installable payload.
- `.codex/skills/` is not committed for this repo to avoid duplicating `kit/skills/`.
- `initialize-project-context` can identify capability areas and use `agent-roles-and-capabilities` when installed.
- `agent-roles-and-capabilities` now defines generic role profiles and role routing, but technology-specific expert skills remain future work.
- `project-architecture-plan` is a Project Lifecycle Skill and is normally used after initialization and before feature-level planning.
- `code-review` is a core Review Workflow Skill with Change Review and Plan Alignment Review modes.
- `install-foundation-kit.sh` is a repo distribution helper for fresh or early-stage downstream project installation and must install only from `kit/`.
- Project-wide file operations must stay inside explicit project boundaries by default; the installer has a controlled exception only for copying from `repo_root/kit/` into an explicit `target_root/`.
- Full-file replacement can be safer than manual multi-location edits, but mature files still require diff and line-count review.
- Project-specific lessons should not be copied into reusable `kit/` templates unless deliberately distilled into generic guidance.
