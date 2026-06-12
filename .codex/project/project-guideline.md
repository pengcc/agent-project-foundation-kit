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

- GitHub ruleset / branch protection setup guidance
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
docs/
scripts/
.codex/project/
dev_locals/
```

`kit/` is the installable payload source.

`.codex/project/` is durable project memory for this repository itself and is not part of the installable `kit/` payload.

`dev_locals/` is local-only and contains plans, handoffs, scratch notes, research notes, initialization reports, and theme zip files.

## 6. Scripts and Commands

Current helper scripts:

```txt
scripts/apply-theme-zip.sh
scripts/publish-local-change.sh
scripts/install-foundation-kit.sh
scripts/test-install-foundation-kit.sh
scripts/test-publish-local-change.sh
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

Current `publish-local-change.sh` purpose:

- publish local changes through a feature branch + PR workflow
- avoid unnecessary theme zip overhead for one/few-file changes
- classify updates as `SMALL_SAFE`, `NORMAL`, or `SIGNIFICANT`
- treat typed `SMALL_SAFE` classification as the sole pre-commit pre-approval
- show staged, unstaged, untracked, and final staged change summaries
- record local/manual validation in the PR body or an existing-PR comment
- offer PR-only, squash auto-merge, or immediate squash merge modes
- require typed manual-review approval before any scripted merge mode
- never push directly to the default branch
- exit after enabling auto-merge without polling or refreshing the default branch
- refresh the default branch only after a verified merge and explicit approval
- create a backup branch and require `RESET_MAIN_TO_ORIGIN` before hard-reset recovery

Current `test-publish-local-change.sh` purpose:

- run deterministic local validation for publish workflow behavior
- use project-local fixtures with fake `git` and `gh` commands
- avoid real pushes, PR creation, merges, and network access
- cover small-safe pre-approval, normal auto-merge, significant typed gates, existing PR updates, and verified post-merge refresh

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
- map `kit/skills/`, `kit/prompts/`, and `kit/rules/` to `.codex/skills/`, `.codex/prompts/`, and `.codex/rules/`
- validate source and target path boundaries before copying
- warn when target files already exist
- never auto-merge existing files
- backup existing files before replacement under `.codex/backups/install-YYYYMMDD-HHMMSS/`
- never install this repo's own `.codex/project/`, `dev_locals/`, `docs/`, or `scripts/`

Current `test-install-foundation-kit.sh` purpose:

- run local validation for installer behavior
- keep test artifacts under `dev_locals/test-runs/install-foundation-kit/`
- verify explicit target requirement, dry-run, fresh install, mapping correctness, conflict detection, no silent overwrite, backup-before-replace, missing-source blocking, missing-target blocking, target==repo-root blocking, and target boundary escape blocking

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


In progress / next likely themes:

- GitHub ruleset / branch protection setup guidance
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
