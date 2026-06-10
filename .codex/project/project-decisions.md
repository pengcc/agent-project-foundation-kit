# Project Decisions

This file records durable decisions for the `agent-project-foundation-kit` repository itself.

## Decision: Separate installable kit payload from repo development memory

### Status

Accepted

### Decision

Use two separate memory layers:

```txt
kit/
```

Installable reusable payload for downstream projects.

```txt
.codex/project/
```

Durable project memory for this repository itself.

The repo's own `.codex/project/` is committed to this repository but is not part of the installable kit payload.

## Decision: Keep memory file names but rename memory skills

### Status

Accepted

### Decision

Rename skills:

```txt
project-guideline -> project-memory
update-project-guideline -> update-project-memory
```

Keep memory file names:

```txt
project-guideline.md
project-decisions.md
lessons-learned.md
```

## Decision: Do not commit `.codex/skills/` for this repo yet

### Status

Accepted

### Decision

Commit only:

```txt
.codex/project/
```

Do not commit:

```txt
.codex/skills/
```

for now.

Agents should reference canonical skill sources under `kit/skills/` while developing this repo.

## Decision: Theme zips belong under `dev_locals/theme-zips/`

### Status

Accepted

### Decision

Store theme zip files under:

```txt
dev_locals/theme-zips/
```

`dev_locals/` remains local-only and ignored by git.

## Decision: Publish current branch workflow boundary

### Status

Accepted

### Decision

Use `publish-current-branch` for pushing the current completed branch, creating/updating PRs, and preparing merge or auto-merge when supported and authorized.

It must not implement features, execute plans, release, deploy, bypass branch protection, or force push to main.

## Decision: GitHub repo-level settings belong to setup workflow

### Status

Accepted

### Decision

Repo-level GitHub readiness belongs to `initialize-project-context` or a future deeper setup workflow.

`publish-current-branch` performs only lightweight runtime preflight checks each time.

If readiness is unknown, it creates/updates PR only and recommends setup check.

## Decision: Initialize project context before feature planning

### Status

Accepted

### Context

After installing the foundation kit, an agent should not jump directly into feature planning or implementation without understanding project identity, product goals, repo reality, scripts, validation, deployment readiness, and GitHub readiness.

### Decision

Use `initialize-project-context` after foundation kit installation or when an existing project first adopts the kit.

It must compare product/plan documents against repo reality and output a fixed Project Initialization Report.

It must not implement features, execute plans, refactor code, modify GitHub settings, release, deploy, or silently write project memory.

## Decision: Product/plan documents must be compared against repo reality

### Status

Accepted

### Decision

`initialize-project-context` must prioritize and compare product descriptions, project development plans, README, docs, configuration, code, tests, and Git/GitHub state.

The report must separate:

```txt
Product / Plan says:
Repo currently shows:
Gap / Risk:
Question for user:
Recommended project memory update:
```

## Decision: Role suggestions depend on future agent-roles-and-capabilities

### Status

Accepted

### Decision

`initialize-project-context` may detect capability areas.

If an `agent-roles-and-capabilities` skill exists, it may use or reference that skill to generate role profile suggestions.

If that skill does not exist, role suggestions must be marked provisional.

Full role taxonomy, capability boundaries, and task-to-role routing belong to a later `agent-roles-and-capabilities` skill.

## Decision: Initialization reports are local-only analysis artifacts

### Status

Accepted

### Decision

By default, save the full initialization report to:

```txt
dev_locals/research-notes/YYYY-MM-DD-project-initialization-report.md
```

The report is local-only and not committed.

Durable facts, decisions, and lessons must be written to `.codex/project/` via `update-project-memory`.

## Decision: Initialization questions must be prioritized

### Status

Accepted

### Decision

Classify missing information as:

```txt
Blocking before project memory update
Needed before first feature planning
Nice to clarify later
```

Ask the highest-priority blocking questions first, one tight group at a time, and include a recommended answer or direction.

## Decision: Initialization uses docs-first-research only for external technical facts

### Status

Accepted

### Decision

`initialize-project-context` must prioritize repo-internal facts.

It must use `docs-first-research` when analysis depends on external technical facts, version recommendations, compatibility, deployment/GitHub Actions behavior, security/auth/database choices, or external constraints that may be written into project memory.


## Decision: Agent role routing is a core capability

### Status

Accepted

### Context

The user wants agents to behave more deliberately across different task types instead of using a single generic developer mode.

### Decision

Create `agent-roles-and-capabilities` as a core skill.

It defines generic role categories, core role profiles, role/workflow combinations, task-to-role routing, expected maturity, and capability boundaries.

It does not directly implement features and does not replace planning, execution, review, research, or publishing workflows.

### Impact

Core workflows can route tasks through explicit roles and output a concise Role Routing Header.

## Decision: Engineering quality principles are a core rule

### Status

Accepted

### Decision

Create `kit/rules/engineering-quality-principles.md`.

It defines cross-technology quality constraints such as KISS, DRY with no premature abstraction, single responsibility, clear naming, testability, early return, comments explaining why, style consistency, defensive programming, complexity control, avoiding magic values, small focused changes, and validation.

It is a rule, not a standalone workflow skill.

## Decision: Preserve existing workflow skill content during role routing integration

### Status

Accepted

### Decision

Theme 9 role routing integration must preserve existing mature core skill content.

Existing workflow skills may receive a short `Role Routing Integration` section, but their previously accepted workflow boundaries, steps, and output formats must remain intact.

Large line-count drops or major deletions in existing skills must be treated as high-risk destructive changes.
