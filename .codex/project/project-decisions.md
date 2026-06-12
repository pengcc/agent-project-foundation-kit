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

Use `publish-current-branch` for pushing the current completed and validated branch, creating/updating PRs, and preparing merge or auto-merge when supported and authorized.

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

## Decision: Project architecture planning is a Project Lifecycle Skill

### Status

Accepted

### Context

After project initialization, a project needs an architecture and roadmap layer before individual feature-level planning.

`initialize-project-context` and `project-architecture-plan` are reusable across new projects, but in one project they are normally used only during initialization, major project pivots, major architecture resets, or new major product phases.

### Decision

Create `project-architecture-plan` as a core Project Lifecycle Skill.

It runs after `initialize-project-context` and before feature-level `plan-with-context`.

It creates a project-level architecture and roadmap plan, including:

- architecture overview
- module and boundary map
- data flow and state flow
- integration flow
- MVP scope and phase boundaries
- feature roadmap
- technology options and decisions
- architecture decisions
- risks and open questions
- validation strategy
- recommended next feature plans
- recommended project memory updates

It must not implement features, modify source code, create migrations, release, deploy, merge PRs, or directly update project memory.

### Boundaries

`project-architecture-plan` does not output feature implementation steps.

Concrete feature implementation plans remain the responsibility of `plan-with-context`.

Durable architecture facts and decisions become source of truth only after user confirmation and `update-project-memory`.

### Required Inputs

A formal Project Architecture Plan requires a product/project blueprint.

If no product description, project blueprint, development plan, README product description, docs requirement file, or user-provided blueprint exists, the skill must pause and output a missing blueprint notice.

It may create only a provisional architecture draft if the user explicitly confirms continuing without a complete blueprint.

### Technical Decisions

Technology choices require `docs-first-research` when they involve technical facts, versions, APIs, deployment limits, database/ORM compatibility, security constraints, external services, or long-term maintenance risk.

Multiple technology options must be compared with relevant weighted dimensions and must be confirmed by the user before being recorded as architecture facts.

## Decision: Code review is a core Review Workflow Skill

### Status

Accepted

### Context

After planning, execution, publishing, role routing, engineering quality principles, and project architecture planning were added, the remaining v0.1 core gap was a review workflow.

The user needs both normal PR/diff review and staged plan-alignment review to prevent quality regressions, scope drift, and architecture drift.

### Decision

Create `code-review` as a core Review Workflow Skill.

It supports two review modes:

```txt
Change Review
Plan Alignment Review
```

Change Review reviews concrete change targets:

```txt
PR diff
current local diff
generated theme zip / package before applying
specific commit
branch diff
```

PR diff is the primary Change Review target.

Plan Alignment Review is independent from normal diff review and focuses on architecture, engineering direction, plan consistency, roadmap / phase boundaries, scope, project memory, and accepted decisions.

Plan Alignment Review requires an explicit baseline. Without a baseline, it may only output a Provisional Alignment Review.

Important review reports should be saved as local-only artifacts under:

```txt
dev_locals/research-notes/YYYY-MM-DD-code-review-<topic>.md
```

Full review reports are not committed by default.

`code-review` may output issue-specific Fix Recommendations, but it must not output a full executable fix plan by default.

Larger, scope-affecting, architecture-affecting, data, security, migration, workflow, or unclear fixes must be routed to `plan-with-context`.

Tiny isolated fixes may be routed to `execute-plan` only after user confirmation.

Review reports may include lesson candidates categorized as:

```txt
Avoid
Keep
Mixed
```

Only distilled and user-confirmed facts, decisions, or lessons may be promoted into `.codex/project/` through `update-project-memory`.

`code-review` may output an advisory Merge / Apply Readiness verdict, but it does not approve, merge, apply, publish, release, deploy, modify code, or update memory.

## Decision: Installer has a controlled source-to-target boundary exception

### Status

Accepted

### Context

The foundation kit needs a safe way to install the reusable `kit/` payload into downstream projects.

The primary use case is a new or early-stage project. Mature existing projects may have legacy skills, project memory, architecture decisions, and technology choices that are too complex for a simple installer to reconcile.

The project also needs a clear file-operation safety boundary. Agents and scripts should not freely operate outside the active project root. However, the installer has a real need to copy from this foundation-kit repo into one explicit downstream target project.

### Decision

Default project-wide rule:

```txt
Agents, scripts, tests, installers, workflow helpers, generated debug snapshots, test runs, backups, and review artifacts must operate inside their active project root by default.
```

Any exception must explain the path, reason, risk, cleanup or rollback, and wait for user approval.

The installer has one controlled current exception:

```txt
source: current foundation-kit repo root / kit/
target: explicit user-provided target project root
```

The installer may read only from:

```txt
repo_root/kit/
```

The installer may write only inside:

```txt
target_root/
```

The installer must not install from this repo's:

```txt
.codex/project/
dev_locals/
docs/
scripts/
```

Use this install mapping:

```txt
kit/project-templates/AGENTS.md -> AGENTS.md
kit/project-templates/project-guideline.md -> .codex/project/project-guideline.md
kit/project-templates/project-decisions.md -> .codex/project/project-decisions.md
kit/project-templates/lessons-learned.md -> .codex/project/lessons-learned.md
kit/skills/ -> .codex/skills/
kit/prompts/ -> .codex/prompts/
kit/rules/ -> .codex/rules/
```

The installer requires an explicit `--target`.

The target directory must already exist.

The target must not equal the foundation-kit repo root.

The installer defaults to dry-run. Writes require:

```txt
--apply
```

When target files already exist, the installer must show a clear conflict and risk analysis. It must not automatically merge or silently overwrite existing files.

Before replacing an existing file, it must backup the original under:

```txt
.codex/backups/install-YYYYMMDD-HHMMSS/<original-path>
```

The installer script itself is not installed into downstream projects.

Theme 12 also adds `scripts/test-install-foundation-kit.sh`. The installer is not complete unless local validation covers explicit target requirement, dry-run, fresh install, install mapping, conflict detection, no silent overwrite, backup-before-replace, missing kit source behavior, missing target behavior, target==repo-root blocking, and target boundary escape behavior.

Test artifacts must stay under:

```txt
dev_locals/test-runs/install-foundation-kit/
```

## Decision: First-run agent operating contract

### Status

Accepted

### Context

After the foundation kit is installed into a downstream project, the agent needs a clear first-run path.

Without a first-run contract, agents may jump directly into feature planning, skip role routing, miss project memory, or fail to understand project boundaries.

### Decision

Use this first-run startup order:

```txt
AGENTS.md
-> project-memory
-> agent-roles-and-capabilities
-> initialize-project-context
-> routed follow-up skill
```

Keep `AGENTS.md` short and operational.

Put detailed first-run, boundary, routing, concise output, evidence-first, and durable memory rules in:

```txt
kit/rules/agent-operating-contract.md
```

`grill-me` remains a planned productivity skill in Theme 13. Theme 13 only defines when it should be routed to.

### Impact

Downstream projects get a clearer agent startup contract after installation.

`initialize-project-context` becomes explicitly role-routed and should run after `agent-roles-and-capabilities`.

Durable memory updates are considered after meaningful planning, implementation, debugging, review, publishing, installation, or major discussion.

## Decision: Lessons include Avoid, Keep, and Mixed patterns

### Status

Accepted

### Decision

Use `.codex/project/lessons-learned.md` for both mistakes and successful reusable patterns.

Classify lessons as:

```txt
Avoid:
  mistakes, risks, bad patterns, repeated failure modes

Keep:
  successful patterns, useful workflows, good validation strategies, stable engineering practices

Mixed:
  tradeoffs or patterns useful only in specific contexts
```

### Impact

Future agents can preserve useful practices, not only avoid previous mistakes.

## Decision: Grill-me is a dependency-style clarification skill

### Status

Accepted

### Context

Theme 13 routed unclear goals, requirements, constraints, scope, and decision branches to `grill-me`, but the skill itself was not yet implemented.

The foundation kit will continue to add, rename, remove, or refine skills over time, so `grill-me` should not depend on a fixed list of current workflows.

### Decision

Implement `grill-me` as a reusable clarification dependency for current and future workflows.

Other workflows may route to `grill-me` when ambiguity blocks safe progress.

`grill-me` must:

- inspect available project context before asking
- avoid asking questions that repo context can answer
- ask the smallest number of high-leverage questions needed
- ask one question at a time by default
- include a recommended answer or direction
- resolve decision branches in dependency order
- return to the appropriate next workflow after clarification

`grill-me` must not implement code, execute plans, modify project files, update project memory directly, publish, merge, release, or deploy.

### Impact

Requirement clarification becomes an explicit reusable workflow rather than ad hoc questioning.

Future skills can depend on `grill-me` without `grill-me` needing to know every future skill.

Durable facts, decisions, or lessons discovered during clarification should be routed to `update-project-memory`.

## Decision: Handoffs are local-only continuation artifacts

### Status

Accepted

### Context

Theme 15 implements `handoff` as a productivity skill for compact cross-session or cross-agent continuation.

The external productivity handoff pattern suggests compacting a conversation so another agent can continue, but this foundation kit needs project-specific boundaries and storage conventions.

### Decision

Implement `handoff` as a reusable productivity skill that creates local continuation documents under:

```txt
dev_locals/handoffs/YYYY-MM-DD-short-topic.md
```

Handoff files are local-only process artifacts.

They must not be committed and must not be treated as durable project memory.

Handoffs should reference existing artifacts by path or URL instead of duplicating full plans, PRDs, ADRs, issues, commits, diffs, or memory files.

Every handoff should include suggested next skills so the next agent can resume with correct workflow routing.

Handoffs must redact secrets and unnecessary sensitive information.

Durable facts, long-term decisions, or reusable lessons discovered while creating a handoff must be routed to `update-project-memory`.

### Impact

Future sessions and agents can continue work with less dependence on long chat history.

The project keeps a clean boundary between:

```txt
dev_locals/handoffs/        -> local continuation artifacts
.codex/project/             -> durable project memory
docs/ and source files      -> project source-of-truth artifacts
```

The workflow avoids copying large existing artifacts into handoffs and keeps durable memory updates intentional.

## Decision: Skill authoring uses `write-a-skill` and project-specific rewrite rules

### Status

Accepted

### Context

Theme 16 implements `write-a-skill` as the final currently planned productivity skill.

The foundation kit needs a consistent way to create or refine future skills without duplicating external skill text, mixing workflow boundaries, or silently changing project memory.

### Decision

Use `write-a-skill` as the routing workflow for creating or refining reusable agent skills.

New installable core skills should normally include:

```txt
kit/skills/core/<skill-name>/SKILL.md
kit/skills/core/<skill-name>/metadata.yml
```

Optional support files may include:

```txt
kit/prompts/force-<skill-name>.md
kit/skills/core/<skill-name>/REFERENCE.md
kit/skills/core/<skill-name>/EXAMPLES.md
kit/skills/core/<skill-name>/scripts/
```

Skill authoring must define clear triggers, boundaries, required context checks, output expectations, validation expectations, and project memory follow-up guidance.

External skills may be used as references, but agents must inspect, extract useful patterns, and rewrite for this project. They must not copy external skills wholesale.

Scripts inside skills should be added only when deterministic, repeatable, useful for automation or validation, and safe to test.

`write-a-skill` does not replace `plan-with-context`, `execute-plan`, `code-review`, `handoff`, `docs-first-research`, `publish-current-branch`, or `update-project-memory`.

### Impact

The planned productivity skill set is now complete:

```txt
grill-me
handoff
write-a-skill
```

Future capability growth can add new skills using a consistent project-specific authoring workflow.

The next recommended theme area can move from productivity skill completion to GitHub ruleset / branch protection setup guidance.

## Decision: Local publish automation uses classified feature-branch and PR flows

### Status

Accepted

### Decision

Theme 16.1 hardens `scripts/publish-local-change.sh` as a repository-local development helper.

The script must:

- classify updates as `SMALL_SAFE`, `NORMAL`, or `SIGNIFICANT`
- treat typed `SMALL_SAFE` as the only pre-commit pre-approval and clearly report skipped gates
- always publish through a feature branch and PR, never by direct default-branch push
- show the complete staged, unstaged, and untracked change scope before commit
- capture validation before push and record it in the PR
- require typed manual-review approval before squash auto-merge or immediate squash merge
- refresh the default branch only after a verified merge and explicit approval

Use a private dependency-free `package.json` for short local commands. Use `publish:local`,
not `publish`, and do not add dependencies or a lockfile.

This decision does not redesign the installable `publish-current-branch` skill or GitHub
ruleset / branch protection guidance.
