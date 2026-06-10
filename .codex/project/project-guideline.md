# Project Guideline

## 1. Project Overview

`agent-project-foundation-kit` is a reusable foundation kit for initializing software projects with agent-ready project memory, skills, prompts, rules, and workflow constraints.

The goal is to make Codex / coding agents work with clear project context, bounded workflows, docs-first technical judgment, explicit planning/execution phases, publishing boundaries, project initialization checks, and durable project memory.

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

Current canonical core skill names:

- `project-memory`
- `docs-first-research`
- `plan-with-context`
- `execute-plan`
- `update-project-memory`
- `code-review`
- `publish-current-branch`
- `initialize-project-context`
- `agent-roles-and-capabilities`
- `engineering-quality-principles`
- `agent-roles-and-capabilities`

Current canonical productivity skill names:

- `grill-me`
- `handoff`
- `write-a-skill`

Future planned skill/theme:

- `project-architecture-plan`
- `code-review`
- technology-specific skills

## 3. Non-Goals

v0.1 does not aim to solve full role taxonomy, technology-specific skills, release/deploy workflows, GitHub settings automation, or safe migration for existing non-empty `.codex/` installations.

## 4. Tech Stack and Runtime

This repo is documentation/script oriented.

Current known tooling:

- Markdown for skills, templates, rules, prompts, and design logs
- Shell scripts under `scripts/`
- Zip-based theme delivery during development
- `ripgrep` recommended for migration/reference checks
- Git / GitHub for version control
- GitHub CLI expected for PR publishing workflows when available

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

Current helper script:

```txt
scripts/apply-theme-zip.sh
```

Theme zip files should normally be stored under:

```txt
dev_locals/theme-zips/
```

The script supports configurable `THEME_ZIP_DIR` and `DEFAULT_BRANCH`.

## 7. Environment Variables

Known script-level environment variables:

```txt
THEME_ZIP_DIR
DEFAULT_BRANCH
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
- Verify remote raw GitHub file line counts after push

## 10. Development Workflow

The repo is developed theme by theme:

1. Discuss theme decisions.
2. Freeze accepted decisions.
3. Generate a theme zip.
4. Put the zip under `dev_locals/theme-zips/`.
5. Apply it with `scripts/apply-theme-zip.sh`.
6. Verify local and remote file counts.
7. Commit and push.
8. Update this repo's project memory when durable facts, decisions, or lessons change.

## 11. Deployment

No deployment workflow is currently defined.

Publishing repository changes is separate from deployment.

Push / PR / merge behavior belongs to `publish-current-branch`.

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

In progress / next likely themes:

- `agent-roles-and-capabilities`
- `code-review`
- installer behavior
- GitHub ruleset / branch protection setup guidance

## 13. Known Constraints and Risks

- Theme zip files cannot express deletions.
- Rename migrations can miss references outside skills/prompts/templates/docs.
- Reusable templates under `kit/project-templates/` must stay generic.
- `.codex/project/` belongs to this repo and must not be treated as installable payload.
- `.codex/skills/` is not committed for this repo to avoid duplicating `kit/skills/`.
- `initialize-project-context`
- `agent-roles-and-capabilities` can identify capability areas, but full role definitions belong to future `agent-roles-and-capabilities`.

## 14. Agent Notes

When working on this repo:

- Use `project-memory` as the entry point for repo context.
- Use `initialize-project-context` after installing the kit into a new project or when first taking over an existing project.
- Use `plan-with-context` for new theme planning.
- Use `execute-plan` for approved theme implementation.
- Use `publish-current-branch` for push / PR / merge preparation.
- Use `update-project-memory` when this repo's current facts, decisions, or lessons change.
- Do not write foundation-kit development lessons into `kit/project-templates/lessons-learned.md`.


## Theme 9 Note: Agent Roles and Engineering Quality

Theme 9 adds `agent-roles-and-capabilities` as a core role-routing skill and `engineering-quality-principles` as a core rule.

Existing workflow skills are only lightly patched with a short Role Routing Integration section.

Important safety constraint: mature workflow skills must not be replaced with short stubs unless an explicit full rewrite is approved.
