# Project Guideline

## 1. Project Overview

`agent-project-foundation-kit` is a reusable foundation kit for initializing software projects with agent-ready project memory, skills, prompts, rules, and workflow constraints.

The goal is to make Codex / coding agents work with clear project context, bounded workflows, docs-first technical judgment, explicit planning/execution phases, and durable project memory.

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

Current canonical core skill names:

- `project-memory`
- `docs-first-research`
- `plan-with-context`
- `execute-plan`
- `update-project-memory`
- `code-review`
- `publish-current-branch`

Current canonical productivity skill names:

- `grill-me`
- `handoff`
- `write-a-skill`

## 3. Non-Goals

v0.1 does not aim to solve:

- Safe migration for existing non-empty `.codex/` installations
- Multi-agent framework support beyond Codex-oriented structure
- Full installer backup / diff / merge support
- Deployment workflow
- Release workflow
- Technology-specific skills
- GitHub ruleset / branch protection automation
- Full prompt library design

## 4. Tech Stack and Runtime

This repo is documentation/script oriented.

Current known tooling:

- Markdown for skills, templates, rules, prompts, and design logs
- Shell scripts under `scripts/`
- Zip-based theme delivery during development
- `ripgrep` recommended for migration/reference checks
- Git / GitHub for version control

## 5. Directory Structure

Important directories:

```txt
kit/
```

Installable payload source. This is what the future installer copies into downstream projects.

```txt
kit/project-templates/
```

Reusable project memory templates for downstream projects.

```txt
kit/skills/
```

Canonical reusable skill source.

```txt
kit/prompts/
```

Reusable workflow trigger prompts.

```txt
kit/rules/
```

Reusable policy/rule documents.

```txt
docs/
```

Foundation design and planning documentation.

```txt
scripts/
```

Development helper scripts for this repo.

```txt
.codex/project/
```

Durable project memory for this repository itself. This is not part of the installable `kit/` payload.

```txt
dev_locals/
```

Local-only workspace for plans, handoffs, scratch notes, research notes, and theme zip files. This must not be committed.

## 6. Scripts and Commands

Current helper script:

```txt
scripts/apply-theme-zip.sh
```

Purpose:

- Apply generated theme zip files
- Show zip contents and line counts
- Apply files to repo root
- Show local line counts
- Optionally commit and push
- Generate remote raw GitHub verify commands for files only
- Optionally delete the local zip at the end

Theme zip files should normally be stored under:

```txt
dev_locals/theme-zips/
```

The script supports a configurable `THEME_ZIP_DIR`.

## 7. Environment Variables

Known script-level environment variables:

```txt
THEME_ZIP_DIR
```

Default:

```txt
dev_locals/theme-zips
```

Used by `scripts/apply-theme-zip.sh` to locate theme zip files when only a filename is passed.

```txt
DEFAULT_BRANCH
```

Default:

```txt
main
```

Used by `scripts/apply-theme-zip.sh` for branch checks and raw GitHub verify command generation.

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

Local-only execution/planning artifacts:

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
- Verify remote raw GitHub file line counts after push

Example migration reference check:

```bash
rg "project-guideline|update-project-guideline" .
```

Allowed old-name matches after Theme 5:

- `project-guideline.md` file/path references
- historical entries in `docs/foundation-design-log.md`

## 10. Development Workflow

The repo is developed theme by theme.

Typical flow:

1. Discuss theme decisions one by one.
2. Freeze accepted decisions.
3. Generate a theme zip.
4. Put the zip under `dev_locals/theme-zips/`.
5. Apply it with `scripts/apply-theme-zip.sh`.
6. Verify local and remote file counts.
7. Commit and push.
8. Update this repo's project memory when durable facts, decisions, or lessons change.

For rename/migration themes, manually delete old directories before applying the migration zip when deletions are required.

## 11. Deployment

No deployment workflow is currently defined.

Publishing repository changes is separate from deployment.

Push / PR / merge behavior belongs to the future `publish-current-branch` theme.

Release and deploy workflows are future work.

## 12. Current Implementation Status

Completed:

- Project memory template foundation
- `docs-first-research`
- `plan-with-context`
- `execute-plan`
- Project memory rename migration:
  - `project-guideline` skill renamed to `project-memory`
  - `update-project-guideline` skill renamed to `update-project-memory`
  - memory files remain named `project-guideline.md`, `project-decisions.md`, and `lessons-learned.md`
- `scripts/apply-theme-zip.sh` improved to support `dev_locals/theme-zips/`, configurable `THEME_ZIP_DIR`, file-only remote verify commands, and optional zip cleanup

In progress / next likely themes:

- `publish-current-branch`
- `code-review`
- installer behavior
- GitHub ruleset / branch protection setup guidance

## 13. Known Constraints and Risks

- Theme zip files cannot express deletions. Old files/directories must be removed separately.
- Rename migrations can miss references outside skills/prompts/templates/docs, such as `kit/rules/`.
- The reusable templates under `kit/project-templates/` must stay generic and must not contain this repo's own development history.
- `.codex/project/` belongs to this repo and must not be treated as installable payload.
- `.codex/skills/` is not committed for this repo to avoid duplicating `kit/skills/`.

## 14. Agent Notes

When working on this repo:

- Use `project-memory` as the entry point for repo context.
- Use `plan-with-context` for new theme planning.
- Use `execute-plan` for approved theme implementation.
- Use `update-project-memory` when this repo's current facts, decisions, or lessons change.
- Do not write foundation-kit development lessons into `kit/project-templates/lessons-learned.md`.
