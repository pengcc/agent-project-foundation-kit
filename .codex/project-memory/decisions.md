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

## Decision: Foundation Kit ownership and directory architecture

### Status

Accepted — 2026-07-20

### Context

The previous downstream layout mixed replaceable Kit content with repository-owned memory and
treated several installed Kit payloads as manual merge or manifest-gated replacement candidates.
That made fresh installation, routine Kit updates, and deliberate downstream-to-Kit promotion
more complex than the content ownership model required.

### Decision

Use these repository-owned downstream paths:

```txt
.codex/project-memory/guideline.md
.codex/project-memory/decisions.md
.codex/project-memory/lessons-learned.md
.codex/project-specific/agent-guidance.md
```

Optional repository-specific skills, rules, and prompts live under `.codex/project-specific/`
only when needed. They use the same capability formats and standards as Kit equivalents, may
depend on Kit skills, and must not become dependencies of Kit skills.

Treat root downstream `AGENTS.md` and the selected installed payload under `.codex/skills/`,
`.codex/rules/`, `.codex/prompts/`, `.codex/scripts/`, `.codex/config/`, and
`.codex/github-settings/` as Foundation Kit-owned and replaceable. Normal apply replaces differing
Kit-owned content and removes payload files no longer present in the selected source without
per-file conflict flags, semantic merge, or manifest-derived authority.

The installer creates missing Project Memory and project-specific guidance starters, then
preserves both repository-owned namespaces. It does not migrate or generate legacy
`.codex/project/` content. A valid downstream `package.json` remains project-owned and may receive
only missing default publish aliases as a bounded augmentation.

The Foundation Kit source repository uses the same current memory filenames under
`.codex/project-memory/`, but its root `AGENTS.md` remains distinct from
`kit/project-templates/AGENTS.md`.

### Supersedes

This decision supersedes the current-path and current-behavior portions of these earlier accepted
decisions while preserving their historical rationale:

- `Separate installable kit payload from repo development memory`, for the `.codex/project/`
  location;
- `Keep memory file names but rename memory skills`, for `project-guideline.md` and
  `project-decisions.md`;
- `Do not commit .codex/skills/ for this repo yet`, only where it says `.codex/project/` is the
  committed memory path;
- `Installer has a controlled source-to-target boundary exception`, for old template mappings and
  conflict handling;
- `Installer project mode controls conflict policy without changing payload behavior`;
- `Existing-project safe apply and selected optional-skill installation`, for safe-add-only and
  `.codex/skills/project/` ownership;
- `Installation manifests are evidence, not replacement authority`;
- `Managed replacement starts with a package-atomic React canary`;
- `Existing-project scripts are workflow-script merge items when different`; and
- `Existing-project upgrade safety v1 closes after WI-1/WI-2 validation`, for its accepted
  replacement limitations.

### Impact

Fresh installation and update share one direct mapping model. Repository-owned context survives
reinstallation, Kit-owned payload differences are normal update state, and reusable improvements
can be promoted deliberately between corresponding downstream and `kit/` paths without Markdown
merging or a second discovery system.

### Related files

```txt
AGENTS.md
kit/project-templates/
kit/skills/meta/project-memory/
kit/skills/meta/update-project-memory/
scripts/install-foundation-kit/
tests/install-foundation-kit/
.codex/project-memory/
```

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

## Decision: UI Quality Foundation uses existing rule and workflow surfaces

### Status

Accepted

### Decision

Implement Phase 5 UI Quality Foundation through existing foundation-kit surfaces:

```txt
kit/rules/engineering-quality-principles.md
kit/skills/core/project-architecture-plan/SKILL.md
kit/skills/core/code-review/SKILL.md
kit/skills/core/codebase-audit/SKILL.md
```

Do not add a new UI workflow, UI rule file, component library, design system package, or
technology-specific UI skill for this phase.

### Rationale

UI quality is a cross-technology engineering quality concern. The lightweight foundation belongs in
the shared quality rule, with short routing references from architecture planning, review, and
audit workflows.

This keeps core guidance reusable without turning the foundation kit into a UI style library.

## Decision: Architecture Review Refinement uses code-review Plan Alignment Review

### Status

Accepted

### Decision

Implement Phase 6 Architecture Review Refinement primarily in:

```txt
kit/skills/core/code-review/SKILL.md
```

Use short relationship references in:

```txt
kit/skills/core/project-architecture-plan/SKILL.md
kit/skills/core/codebase-audit/SKILL.md
```

Do not add a separate `architecture-review` skill, architecture rule file, or
`project-architecture-plan/REFERENCE.md` for this phase.

### Rationale

Architecture review is a review activity when the target is a plan, PR, branch, implementation
direction, or proposed structural change. `code-review` already owns review-only behavior, Plan
Alignment Review, findings, advisory verdicts, and routing to follow-up workflows.

Keeping Phase 6 in existing surfaces sharpens architecture review without creating a heavy
enterprise architecture process or blurring `project-architecture-plan`, `codebase-audit`, and
`execute-plan` boundaries.

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

## Decision: Local publish automation uses classified feature-branch and PR flows

### Status

Accepted

### Decision

Theme 16.1 hardens `scripts/publish-local-change.sh` as a repository-local development helper.

The script must:

- classify updates as `SMALL_SAFE`, `NORMAL`, or `SIGNIFICANT`
- use a numbered Small safe / Normal / Significant selection with invalid-input re-prompting
- preserve stable internal classification codes while using concise user-facing labels
- inspect local, branch, and PR state before requesting publish inputs
- prompt for a non-empty commit message only when uncommitted changes require a commit
- use the latest commit subject for the PR title when only unpushed commits need publishing
- show recommended update type, commit message, and PR title while allowing explicit overrides
- list repository-level open PRs and require acknowledgement without treating their existence as an automatic block
- update an existing current-branch PR instead of creating a duplicate
- always publish through a feature branch and PR, never by direct default-branch push
- show and confirm the complete relevant scope before classification can authorize publishing
- show final staged scope for uncommitted changes and commit/diff scope for existing unpushed commits
- record the fixed `SMALL_SAFE_SCOPE_CONFIRMED` validation statement without prompting in small-safe mode
- require structured validation codes for normal and significant modes; significant updates cannot use `NOT_RUN`
- treat no required checks as merge-eligible, pending checks as auto-merge eligible, and failing checks as merge-blocking
- preserve GitHub CLI stderr and block merge when required-check verification itself fails
- automatically enable squash auto-merge for `SMALL_SAFE` only after complete scope confirmation
- skip the PR completion mode and manual-review token for `SMALL_SAFE`
- poll GitHub for bounded merge verification and refresh local `main` only after `mergedAt` is confirmed for `SMALL_SAFE`
- recover a clean current-branch PR that merges after polling timeout, while requiring verified `mergedAt` and default-branch base before refresh
- require typed manual-review approval before squash auto-merge or immediate squash merge for `NORMAL` and `SIGNIFICANT`
- exit after enabling auto-merge without polling or refreshing the default branch for `NORMAL` and `SIGNIFICANT`
- refresh the default branch only after a verified merge and explicit approval outside the `SMALL_SAFE` automatic path
- create a backup branch and require typed `RESET_MAIN_TO_ORIGIN` before hard-reset recovery

At this stage, use a private dependency-free `package.json` for short local commands. Use
`publish:local`, not `publish`, and do not add dependencies or a lockfile. This command naming
was later superseded by the source publish command consolidation to `publish:changes`.

Task-start guidance must also inspect current branch work and pause before mixing an unrelated task
into a non-default branch with uncommitted changes, unpushed commits, or an open PR.

## Decision: Downstream AGENTS defines a generic operating contract

### Status

Accepted

### Context

The repository root AGENTS file and the downstream AGENTS template serve different audiences.
Downstream projects need the reusable operating behavior without foundation-kit development
instructions.

### Decision

The downstream AGENTS template must:

- require concise role routing for meaningful tasks and workflow or mode switches
- require professional, reviewable, and reversible working practices
- start new work from an up-to-date default branch and use a feature branch unless the user approves another workflow
- prohibit direct pushes to the default branch
- route completed and validated publishing through the installed `publish-current-branch` workflow
- classify implementation final reports by update risk and report changes, reason, impact, validation, memory or documentation updates, and external actions
- update installed project memory only for durable facts, decisions, and reusable lessons

The template references installed `.codex/` skills, rules, prompts, and project memory. It does
not include this repository's development paths, local commands, or GitHub protection policy.

### Impact

Downstream projects receive a consistent operating contract while detailed procedures remain
owned by their installed skills and rules.

## Decision: GitHub repository settings ship as reusable kit artifacts

### Status

Accepted

### Decision

Store reusable GitHub setup artifacts under:

```txt
kit/github-settings/
```

Install them into downstream projects under:

```txt
.codex/github-settings/
```

Use separate mechanisms for the two GitHub settings surfaces:

- rulesets use an importable JSON file that can be applied through the GitHub UI or rulesets REST API
- General repository settings use a minimal repository REST API payload plus a human checklist

The required General settings payload must change only settings required by the kit workflow:

```txt
allow_squash_merge = true
allow_auto_merge = true
```

Optional project policies such as required approvals, required status checks, merge queue,
automatic branch deletion, and bypass actors remain explicit project-specific decisions.

### Impact

New projects can reuse the repository protection baseline without copying settings manually.
The installer includes the artifacts but does not apply externally visible GitHub settings.

## Decision: Publish strategy and mechanics use separate installable layers

### Status

Accepted

### Decision

Theme 17.1 makes `kit/scripts/publish-changes.sh` the canonical mechanical publish implementation
and `kit/scripts/lib/workflow-common.sh` its shared helper.

At this stage, the installer copied the complete `kit/scripts/` tree to `.codex/scripts/` without
creating or modifying a downstream `package.json`. PR #115 later added the bounded safe-add alias
exception recorded below.

The `publish-current-branch` skill owns strategy, role routing, scope, authorization, and final
reporting. Agents prefer the installed script for Git and GitHub mechanics and use the skill's
manual procedure only when the script is unavailable.

This source repository dogfooded the same implementation through thin compatibility wrappers under
`scripts/`, preserving the then-current `pnpm publish:local` alias without maintaining a second
publish implementation. The source publish command was later consolidated to `publish:changes`.

### Impact

Downstream projects receive the mature state-aware publish workflow directly. Future behavior
fixes can be made once in the installable implementation and validated through both wrapper and
direct-execution tests.

## Decision: Theme 17.3 introduces Node publish mechanics without immediate default cutover

### Status

Accepted

### Decision

Theme 17.3 adds a Node.js 24+ ESM publish CLI under `kit/scripts/publish-changes.mjs`, with
publish-specific modules under `kit/scripts/publish-changes/` and only broadly reusable command,
Git, GitHub, error, and output modules under `kit/scripts/shared/`.

The source repository may use package-managed `yaml` for policy loading. Downstream direct Node
execution must not require an uninstalled package: when YAML support is unavailable, the CLI
warns, ignores the external policy file, and uses built-in conservative defaults.

The installer maps `kit/config/` to `.codex/config/` and continues copying the complete scripts
tree. At this stage, the Bash implementation and `pnpm publish:local` served as the fallback
until the Vitest parity suite, existing Bash publish tests, installer tests, and manual CLI output
review all passed. This fallback status was later superseded by the Node-first and Bash-archive
decisions.

Default-branch refresh is based on verified merge state rather than update classification. It may
run only after GitHub reports a merge into the configured default branch. Diverged local default
branches require a backup and typed approval before reset.

External YAML policy is configuration, not authorization. It may enable configured merge modes,
but it cannot remove immutable validation, manual-review, typed-confirmation, or `NOT_RUN`
restrictions for higher-risk classifications.

For uncommitted changes, the Node workflow fingerprints tracked and untracked state, stages only
the observed path set, shows the exact upstream-relative publish scope including prior unpushed
commits, obtains scope confirmation, and verifies that the index tree is unchanged immediately
before commit. Worktree or index drift aborts publishing and requires a new confirmation cycle.

### Impact

The migration can be reviewed and exercised without forcing an early wrapper cutover. The module
boundaries support future workflow reuse while keeping publish-only prompts local to the publish
workflow.

## Decision: Theme 17.4 smoke validation does not authorize the Node default cutover

### Status

Accepted

### Decision

Theme 17.4 manual smoke testing mostly validates the Node publish candidate for real source-repo
use. `pnpm publish:node` completed a real publish flow smoothly, and the deliberate scope-drift
scenario detected a changed worktree after scope collection and aborted before publishing.

These results increased confidence in the candidate but did not change the default command at
that stage. `pnpm publish:local` stayed on the Bash fallback at that stage until the later Theme
17.5 cutover decision reviewed the complete smoke-test record, remaining gaps, downstream runtime
packaging, and rollback expectations.

### Impact

Theme 17.4 can close as smoke-test stabilization without silently turning validation evidence into
cutover approval. The Bash path remains available while Theme 17.5 makes the default-entrypoint
decision explicitly.

## Decision: Theme 17.5 makes Node the source-repository publish default

### Status

Accepted

### Decision

At this stage, `pnpm publish:local` and the explicit `pnpm publish:node` alias ran the Node.js
24+ ESM publish CLI. `pnpm publish:bash` retained `scripts/publish-local-change.sh` as the
supported operational fallback. These aliases were later superseded by the source publish command
consolidation to `publish:changes`, `publish:pr-only`, and `publish:merge-pr`.

The Bash implementation is not removed. Node Vitest coverage, existing Bash publish tests,
installer tests, remaining shell syntax checks, and whitespace validation stay in `pnpm check`
until Bash is deliberately removed in a later theme.

A real source-repository publish completed successfully through the then-current post-cutover
`pnpm publish:local` Node default. This validated Theme 17.5 for source-repository use at that
time but did not authorize removing `pnpm publish:bash`. The fallback-removal question was later
resolved by Node-first automation and Bash archive decisions.

The installer continues copying both implementations without creating or modifying a downstream
`package.json`. Downstream projects may run the installed Node CLI directly when runtime
requirements are met or use the installed Bash script as a fallback.

### Impact

The source repository defaults to the smoke-tested Node workflow while retaining a tested,
immediate rollback path. Removing Bash or changing downstream package-manager configuration
requires a separate decision.

## Decision: Publish CLI theme config controls color and line coverage only

### Status

Accepted

### Decision

`kit/config/publish-cli-theme.json` is the source-repository source of truth for publish CLI output
styles and is installed as `.codex/config/publish-cli-theme.json`.

Each required level configures only `color` and `fullLine`. Colors may be ANSI color strings or
RGB arrays containing exactly three integers from 0 to 255. Hex strings and `boldLabel` are not
supported.

All `[LEVEL]` labels are bold by fixed rendering policy. For `fullLine: true`, the label and
message share the configured color while only the label is bold. For `fullLine: false`, only the
label is colored. Missing or invalid config warns and falls back to built-in defaults that match
the canonical file.

The canonical values preserve the tested color behavior from `main`. Future generic output
refactors must not reset that behavior. Documentation should link to the config instead of
maintaining duplicate complete color tables.

### Impact

Publish output can be themed without making safety-oriented emphasis configurable or adding a
runtime dependency. Source and installed behavior remain aligned through the existing complete
`kit/config/` installer mapping.

## Decision: Planning persistence must be truthful and execution remains separately approved

### Status

Accepted

### Context

Planning workflows normally persist multi-step plans under `dev_locals/plans/`, but Plan Mode or
the active tool environment may prevent filesystem writes. A rendered plan can also be mistaken
for execution approval when the UI offers an execution action.

### Decision

When plan persistence is blocked, planning workflows must not claim that the plan was saved. They
must state that writing is blocked, show the exact intended path, and provide the complete plan
content or a clear action for manually saving it or saving it later in a write-capable mode.

Creating a plan does not approve execution. The default next step is review, revision, or saving
the plan. Implementation requires explicit user approval after review, regardless of UI or tool
execution affordances.

### Impact

Agents no longer depend on nonexistent plan files or imply that planning automatically advances
into implementation. The same boundary applies in this source repository and downstream projects.

## Decision: Theme 18.1 adds a source-only Node installer candidate

### Status

Accepted

### Context

The Bash installer is established and tested, but its monolithic structure makes boundary,
preparation, backup, and interruption behavior harder to isolate and validate. A Node.js 24+ ESM
candidate can provide explicit planning and deterministic local tests without forcing an
installer cutover.

### Decision

Theme 18.1 adds:

```txt
scripts/install-foundation-kit.mjs
scripts/install-foundation-kit/
tests/install-foundation-kit/
```

The Node installer is source-repository tooling only. It consumes `kit/` as the complete
installable payload and must never install its own entrypoint or installer-specific modules
downstream. It may import existing source helpers from `kit/scripts/shared/` at runtime; this
reuse does not change installer ownership or payload boundaries.

The command aliases are:

```txt
pnpm install:node
pnpm install:bash
pnpm test:install:node
pnpm test:install:bash
pnpm test:install
```

No default `install` alias is added. Bash remains the active installer until a later explicit
cutover decision.

The Node candidate defaults to dry-run and requires `--apply` for writes. Conflicts require the
exact `INSTALL_WITH_BACKUP` token through interactive or piped input. Before any downstream write,
all replacement files and required backup snapshots must be staged and hash-verified outside the
target, and the complete source/target plan must be revalidated. A materialized backup includes a
relative-path-only manifest with source, target, original/replacement hashes, status, and completed
targets.

`diff -u` is optional preview behavior. Its absence cannot block planning, authorization, backup,
copy, or verification. At this stage, the installer did not create or modify downstream
`package.json`; PR #115 later added the bounded safe-add alias exception recorded below.

### Impact

The source repository gains a testable migration candidate while preserving the known Bash
rollback path. `pnpm check` covers Node and Bash installer behavior together. Default cutover and
Bash removal remain separate future decisions.

### Validation status

The Node candidate has been exercised manually in a downstream installation scenario. The smoke
test looked good and exposed no blocking issue, so Theme 18.1 is validated enough for continued
Node installer dogfooding.

This evidence did not change the active/default installer at that stage. Bash stayed active until
the later Theme 18.2 decision considered a Node-first workflow and an explicit Bash archive plan.
If later dogfooding found a Node installer defect, the preferred path was correcting the Node
implementation rather than retreating from the candidate without analysis.

## Decision: Theme 18.2 standardizes Node-first automation and archives legacy Bash workflows

### Status

Accepted

### Context

The Node publish CLI is the source-repository default and has been successfully dogfooded. The
Node installer candidate passed automated coverage and a downstream smoke test. Maintaining Bash
publish and installer implementations in parallel now duplicates workflow behavior and validation
without providing the preferred defect-fix path.

At this stage, the apply-theme workflow still used Bash and previously depended on a helper
shared with the legacy publish path. The apply-theme Bash helper was later archived as
source-only history.

### Decision

Theme 18.2 makes the Node publish CLI and Node installer the maintained automation paths. Future
publish or installer defects should be fixed in the Node implementations first.

Legacy Bash publish and installer files are preserved as exact source-only snapshots under:

```txt
archive/legacy-bash-workflows/
```

The archive is unsupported historical reference, remains outside `kit/`, and must never be
installed downstream. Active Bash publish and installer aliases, tests, wrappers, and installable
payload files are removed. Existing downstream projects may retain files installed by earlier
versions; the Node installer does not automatically delete them.

At this stage, `scripts/apply-theme-zip.sh` remained active Bash tooling. Its required helper was
source-owned at `scripts/lib/workflow-common.sh`, so it did not depend on archived or installable
Bash files. This active status was later superseded by the Bash apply-theme archive decision.

At this stage, `pnpm check` validated Node publish tests, Node installer tests, apply-theme shell
syntax, and whitespace. That apply-theme shell syntax validation was later removed when the Bash
helper was archived.

### Impact

The maintained workflow surface is smaller and fresh downstream installs receive only the Node
publish implementation. Historical Bash behavior remains inspectable without being presented as
an operational fallback. Apply-theme remains unchanged as an explicit active Bash exception.

## Decision: Global toolchain and out-of-project mutations require explicit approval

### Status

Accepted

### Context

After Theme 18.2, a global Node version differed from the project runtime. Investigation found
duplicated or misordered local shell profile configuration and PATH ordering. Codex did not cause
the mismatch and no repository change caused it.

The investigation exposed a broader safety gap: agents need an explicit boundary between
project-local runtime configuration, read-only machine diagnostics, and global machine mutation.

### Decision

Agents may run read-only diagnostics to identify executable paths, versions, mise state, PATH,
shell-profile contents, package-manager information, logs, and Git configuration.

Agents must not install, upgrade, downgrade, unlink, relink, configure, or otherwise mutate global
developer tooling, shell profiles, PATH, global Git configuration, or files outside the project
root without explicit user approval.

When required tooling is missing or wrong, the agent must stop the affected workflow, report the
detected and required versions and failing command, distinguish global from project-local state,
recommend a manual fix with its machine-wide risk, and wait for explicit approval.

Every task final report explicitly records external/global actions, including `None`.

### Impact

Project validation remains reproducible without granting agents implicit authority over machine
configuration. Runtime diagnostics stay available, while global remediation remains visible and
user-controlled.

## Decision: Process artifacts do not override current project truth

### Status

Accepted

### Context

Local plans, handoffs, reports, research notes, and execution logs preserve useful working context,
but they can outlive the implementation state and tooling boundary they describe.

### Decision

Treat process artifacts as temporary evidence, not durable project truth or automatic execution
authority.

Before using one, verify its date, status, explicit user selection, and alignment with:

```txt
AGENTS.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
current repository files
current package scripts
current maintained tooling boundaries
```

Current project memory and repository state win when a process artifact conflicts with them.
Plans older than one day must not be proactively used as execution authority unless the user
explicitly names the plan and it is re-verified. If the conflict cannot be resolved from current
sources, stop and request user review.

Superseded process artifacts should be marked superseded, deprecated, or archived so their status
is visible without erasing useful history.

### Impact

Future work will not revive archived Bash publish or installer workflows, or execute stale plans,
solely because old process artifacts still mention them.

## Decision: Separate quick PR publication from explicit PR-number merge

### Status

Accepted

### Context

At this stage, the classified `publish:local` workflow was appropriate when an agent needed
update classification, validation evidence, completion-mode selection, and policy-controlled
merge handling. Review-fix publishing and deliberate merge of an already reviewed PR needed
smaller, explicit workflows without duplicating the Node publish implementation. The source
publish command was later consolidated to `publish:changes`.

### Decision

The maintained Node publish CLI provides two additional modes:

```txt
pnpm publish:pr-only "Commit message" ["PR title"]
pnpm publish:merge-pr <pr-number> [--yes]
```

PR-only mode operates only from an existing feature branch. It retains deterministic worktree
snapshot, observed-path staging, commit integrity, authentication, and drift checks while skipping
classification, validation, scope-confirmation, completion, merge, and refresh prompts. It reuses
the branch's open PR and preserves its title unless an explicit replacement is provided.

Merge-PR mode requires a clean worktree and explicit PR number. It validates the default-branch
target, open/non-draft state, mergeability, required checks, and unchanged head OID before squash
merge. `--yes` skips only human confirmation. Refresh occurs only after verified merge and is
fast-forward only; this mode never uses admin bypass or hard-reset recovery.

At this stage, the existing `publish:local` and `publish:node` command behavior was unchanged.
These aliases were later superseded by the source publish command consolidation.

### Impact

Review fixes can be published without stepping through the full classified workflow, while merge
authorization remains an explicit and independently verifiable action. Both modes share the
maintained Node clients and narrow safety helpers, and no Bash publish path is restored.

## Decision: Project memory has one canonical context gate

### Status

Accepted

### Context

Project-state workflows previously repeated different memory-reading lists. That duplication made
source-repository versus downstream behavior unclear and allowed workflow references to drift from
the central project-memory contract.

### Decision

Define the complete Project Memory Context Gate sequence, source selection, reporting interface,
continuation rules, and status meanings only in:

```txt
kit/skills/core/project-memory/SKILL.md
```

Root `AGENTS.md`, the downstream AGENTS template, the operating contract, and scoped workflow
skills use short references without redefining the gate.

The same gate applies to downstream installed projects and this foundation-kit source repository.
Initialization and memory-update workflows follow the central context-repair continuation rules.
Plans, handoffs, reports, and research notes are inspected only when identified as task-relevant,
after freshness and source-of-truth verification.

### Impact

Project-state workflows share one auditable context contract while preserving their existing
planning, execution, review, publishing, handoff, and skill-authoring boundaries. Future gate
changes have one canonical edit location.

## Decision: Core foundation alignment keeps ownership centralized

### Status

Accepted

### Context

After Project Memory Context Gate, nearby foundation instructions needed light alignment so agents
do not duplicate gate rules, confuse memory reads with memory writes, or pretend unavailable
specialist skills exist.

External skill references from Vercel Labs and Obra are useful pattern inputs, but copying their
rules wholesale would blur this kit's workflow boundaries and safety model.

### Decision

Keep ownership centralized:

```txt
project-memory -> durable memory reading/applying + Project Memory Context Gate
update-project-memory -> confirmed durable writes
docs-first-research -> external fact verification + project-impacting research gate handling
agent-roles-and-capabilities -> role routing + Missing Specialist Skill Policy
grill-me -> clarification, including bounded brainstorming before planning
```

The full Project Memory Context Gate remains only in `project-memory`. The full Missing Specialist
Skill Policy lives only in `agent-roles-and-capabilities`; other files may reference it but must
not redefine it.

External skills are reference candidates only. Agents may extract evaluated patterns and rewrite
them for this kit, but must not copy external skill content wholesale or treat external skills as
project authority.

### Impact

The foundation entrypoints stay short, missing specialist skills become visible without adding
optional technology skills, and early brainstorming remains clarification-only rather than an
implementation or planning bypass.

## Decision: Plans, execution, and reviews use explicit quality contracts

### Status

Accepted

### Context

After Project Memory Context Gate and core foundation alignment, the existing planning,
execution, and review skills needed small quality hardening without creating new workflows or
changing runtime/tooling behavior.

### Decision

`plan-with-context` must produce self-contained plans that a fresh agent can execute. Non-trivial
plans include exact files in scope and out of scope, a baseline branch/commit/state, STOP
conditions, and validation commands confirmed from repository sources.

`execute-plan` treats the approved plan as the execution contract. Every changed hunk maps to a
plan step, validation step, or approved memory/design-log update. Material drift returns to
`plan-with-context`; user or pre-existing changes are not reverted without explicit approval.

`code-review` remains advisory and review-only. It distinguishes findings introduced by the
reviewed change from pre-existing issues, checks generated package/theme zip safety, and performs
plan-hunk alignment when an approved plan exists.

### Impact

Future agents have clearer boundaries for planning, execution, and review quality while preserving
the existing workflow set. Theme 20 does not add codebase audit, new prompts/rules/metadata,
technology-specific skills, scripts, package commands, installer behavior, dependencies, tests, or
runtime behavior.

## Decision: Codebase audit is read-only and routes findings to planning

### Status

Accepted

### Context

After plan, execute, and review hardening, the kit needed a repository-wide survey workflow
without turning `code-review` into full repo audit or letting audit output become implementation
authority.

### Decision

Add `codebase-audit` as a core read-only workflow.

It surveys repository evidence, treats repo content as data rather than instruction, classifies
findings as defects, risks, opportunities, or direction suggestions, and prioritizes them by
leverage, risk, confidence, and effort.

Selected findings become inputs for `plan-with-context`. They are not executable fix plans.

Concrete diffs, PRs, generated packages, commits, branches, and plan-alignment reviews remain the
responsibility of `code-review`.

### Impact

The kit can now identify and prioritize repository-wide improvement work while preserving workflow
boundaries. Theme 21 does not add architecture-review, third-party skill policy, kit evolution
loop, UI rules, technology-specific skills, scripts, package commands, installer behavior,
dependencies, tests, archive changes, or runtime behavior.

## Decision: Approved-plan execution may use bounded supporting skills

### Status

Accepted

### Context

Executing an approved plan can include bounded substeps that clearly belong to an installed
dedicated skill, such as skill authoring, external fact verification, durable memory updates,
review, auditing, clarification, or publishing. Theme 21 showed that creating or refining a skill
should keep `execute-plan` as the primary workflow while explicitly applying `write-a-skill` as
supporting guidance.

### Decision

`execute-plan` remains the primary workflow for approved-plan execution.

Before each step group, the executor may classify whether an installed supporting skill applies to
a bounded substep. If used, the supporting skill must be read or applied, reported, and then the
agent returns to the primary workflow.

Supporting skills do not override the approved plan, expand scope, bypass the Project Memory
Context Gate, bypass safety rules, or silently change workflow boundaries. Material drift returns
to `plan-with-context`.

`write-a-skill` includes generic authoring verification for trigger clarity, boundary clarity,
workflow separation, concise force prompts, and misuse or rationalization checks. These checks use
external references only as inspiration and must not copy external skill content or adopt
tool-specific process mechanics unless separately approved.

### Impact

Future implementation work can apply dedicated skill guidance without turning supporting skills
into new workflows or weakening approved-plan control. Theme 21.1 does not change scripts,
package commands, installer behavior, dependencies, tests, archive files, generated package
workflow, or runtime behavior.

## Decision: Stage reviews are dated inputs, not roadmap replacements

### Status

Accepted

### Context

After Themes 19, 20, 21, and 21.1, the foundation kit had current project memory and a dated stage
review report that identified roadmap and inventory drift. The review was useful, but treating it
as the new roadmap would create another source of truth and repeat the process-artifact drift
problem.

### Decision

Keep:

```txt
docs/foundation-kit-skills-review-and-optimization-roadmap.md
```

as the canonical long-term roadmap and planning reference.

Treat dated stage review reports, including:

```txt
docs/foundation-kit-stage-review-and-forward-plan-2026-06-16.md
```

as audit inputs that can inform roadmap refreshes, project memory updates, and design-log entries.
They do not replace project memory for current facts, and they do not replace the roadmap for
long-term planning.

### Impact

Future planning starts from the refreshed roadmap and current project memory while still preserving
stage reviews as useful historical evidence. Theme 22.0 does not implement Third-Party Skill
Adoption Safety, Kit Evolution, UI Quality Foundation, Architecture Review Refinement, Optional
Skill Catalog, release workflow, deployment workflow, technology-specific skills, or runtime/tooling
changes.

## Decision: Publishing handoff and role routing stay bootstrap-safe

### Status

Accepted

### Context

Theme 21.1 allowed approved-plan execution to use bounded supporting skills. A dependency/deadlock
risk review found that treating `publish-current-branch` like a normal internal supporting substep
could blur the boundary between execution and externally visible publishing actions. The same
review found that role routing must remain usable before the Project Memory Context Gate so agents
can decide which workflow should run.

### Decision

`publish-current-branch` is a post-execution workflow transition. `execute-plan` may recommend a
publish handoff after execution, but it must not run `publish-current-branch` as an internal
execution substep. Push, PR, and merge require an explicit workflow switch after execution.

`agent-roles-and-capabilities` may be used for initial role/workflow routing without first passing
the Project Memory Context Gate. If routing depends on project-specific facts, use
`project-memory` as supporting context before making project-state decisions.

### Impact

Approved-plan execution keeps a clear boundary around externally visible GitHub actions, while
initial routing remains bootstrap-safe and avoids a context-gate dependency loop.

## Decision: Third-party skill adoption safety uses existing rule and skill surfaces

### Status

Accepted

### Context

Theme 19 established that external skills are reference candidates only. Theme 21.1 clarified that
`execute-plan` may use bounded supporting skills, and `write-a-skill` owns reusable skill
adaptation. The kit needed a lightweight safety boundary for evaluating external skill patterns
without adding another workflow, broad policy file, or catalog.

### Decision

Use existing surfaces for Theme 22.1:

```txt
docs-first-policy -> concise evaluation boundary
docs-first-research -> external source verification and evaluation report
write-a-skill -> adaptation of approved patterns into this kit
```

Do not create a new third-party adoption workflow, external skill catalog, or
`third-party-skill-adoption-policy.md` file for this theme.

External skill evaluation checks source URL, provenance, license/copying risk, trigger and
boundary fit, duplication with existing workflows, workflow conflict, ecosystem assumptions, tool
assumptions, file/network/mutation/global-tooling/destructive-action permissions, secret handling,
source freshness, and whether adaptation belongs in `write-a-skill`.

Accepted patterns must be rewritten for this kit and must not override AGENTS, project memory,
workflow boundaries, safety rules, or maintained tooling boundaries.

### Impact

External skill learning now has a lightweight safety gate while preserving the current workflow
set. Theme 22.1 does not implement Theme 22.2 Kit Evolution, a marketplace/catalog, technology
skills, scripts, package commands, installer behavior, dependencies, tests, archive changes,
generated package workflow, or runtime behavior.

## Decision: Reusable lesson promotion uses existing memory and skill surfaces

### Status

Accepted

### Context

The kit needs to learn from project experience without copying downstream or source-repository
history into generic installable assets. Existing workflows already separate local memory writes,
skill/rule authoring, planning, execution, review, and external fact research.

### Decision

Use existing surfaces for Theme 22.2:

```txt
update-project-memory -> project-local durable memory and reusable lesson candidates
write-a-skill -> adaptation of confirmed reusable patterns into kit guidance
agent-operating-contract -> concise operating boundary for promotion
```

Do not create a new kit-evolution workflow, marketplace, catalog, technology-specific skill, or
`kit/rules/kit-evolution-loop.md` for this theme.

Reusable lesson promotion follows this order:

```txt
project experience
-> local project memory
-> reusable lesson candidate
-> generalization review
-> user confirmation
-> approved plan
-> foundation-kit rule / skill / template / documentation update
```

Project-specific history, project names, business context, secrets, customer data, and one-off
implementation details must not be copied into installable templates or kit assets. Promotion
requires an explicit user decision and an approved plan before implementation.

### Impact

The foundation kit has a lightweight learning loop while preserving local project memory
boundaries. Theme 22.2 does not implement UI Quality Foundation, Architecture Review Refinement,
Optional Skill Catalog, specialist packs, scripts, package commands, installer behavior,
dependencies, tests, archive changes, generated package workflow, or runtime behavior.

## Decision: Phase 7 defines optional skill catalog shape without installable packs

### Status

Accepted

### Context

The foundation kit needs a way to discuss future optional specialist skills and specialist packs
without bloating the minimal core kit, implying unavailable specialist support, or creating an
external marketplace or installer behavior prematurely.

### Decision

Use `docs/optional-skill-catalog.md` as source-repository planning documentation for optional
specialist candidate evaluation.

The catalog defines:

```txt
core versus optional terminology
candidate metadata shape
candidate status values
candidate-only workflow routing
external source / provenance / license checks
```

Do not create `kit/catalog/`, `kit/catalog/optional-skills.yml`, actual optional skill
directories, technology-specific specialist packs, marketplace behavior, auto-install behavior, or
installer mappings for Phase 7.

### Impact

Future optional specialist work has a shared vocabulary and routing model, but the minimal
installable kit remains unchanged. Actual optional packs, technology-specific skills, installer
support, release workflow, and deployment workflow remain future work requiring separate approved
plans.

## Decision: Source publish command is publish:changes and Bash apply-theme is archived

### Status

Accepted

### Context

The source repository no longer maintains the Bash apply-theme helper as active tooling. The
source-repository publish command was also consolidated to avoid duplicate `publish:local` and
`publish:node` aliases for the same maintained Node CLI.

### Decision

Use `pnpm publish:changes` as the canonical source-repository publish command. Keep
`pnpm publish:pr-only`, `pnpm publish:merge-pr`, and `pnpm install:node` as explicit maintained
commands.

Archive the Bash apply-theme helper and its shared helper under:

```txt
archive/legacy-bash-workflows/apply-theme-zip.sh
archive/legacy-bash-workflows/lib/workflow-common.sh
```

Remove the active `apply-theme` package command and remove active Bash apply-theme syntax checks
from `pnpm check`.

### Impact

The active source-repository workflow surface is Node-first. Bash apply-theme remains source-only
historical reference. This cleanup does not implement a Node apply-theme replacement, publish
secret-safety guard, metadata parse validation, source hygiene validation, release/deployment
workflow, optional specialist packs, technology-specific skills, or Node publish behavior changes.

## Decision: Release-readiness hygiene and publish secret-safety guard

### Status

Accepted

### Context

A release-readiness review found that one source skill metadata file was not parseable as a single
YAML document and that ignored local OS artifacts under `kit/` could be mapped into downstream
`.codex/` payloads. The maintained Node publish CLI also lacked a local fail-fast guard for
high-confidence secrets in changes about to be committed, pushed, or used to create/update a PR.

### Decision

Keep `kit/skills/core/*/metadata.yml` files as single YAML metadata documents and validate that
hygiene in source-repository tests.

Exclude local OS junk files such as `.DS_Store`, `Thumbs.db`, `desktop.ini`, and AppleDouble `._*`
files from installable tree mappings.

Add a lightweight dependency-free secret-safety guard to `pnpm publish:changes` and
`pnpm publish:pr-only`. The guard scans confirmed publish-scope paths and diff content for
dangerous credential file paths and high-confidence secret patterns before commit, push, PR
creation, or PR update side effects. It redacts previews and does not print full secret values.

Do not add bypass flags, dependencies, token-validity network checks, full entropy scanning, or
remote PR diff scanning in this phase. `pnpm publish:merge-pr` behavior remains unchanged.

### Impact

Release-readiness checks now cover metadata parse hygiene, installer source hygiene, and local
publish secret-safety before upload. The guard is a lightweight safety net with possible false
positives and false negatives; it is not a complete secret-scanning product.

## Decision: Requirement Clarification Gate uses operating contract plus grill-me

### Status

Accepted

### Context

`grill-me` already handles deep clarification for unclear goals, requirements, scope,
constraints, tradeoffs, and decision branches. The kit still needed a lighter global convention
for cases where ambiguity is important enough to pause, but not broad enough to require a full
clarification workflow.

### Decision

Add the lightweight Requirement Clarification Gate to `agent-operating-contract`.

Agents must not assume user requests are clear, complete, or scope-stable when ambiguity affects
scope, safety, files, architecture, data, Git/publish, external side effects, irreversible
actions, user intent, or acceptance criteria. In those cases, agents should state the ambiguity,
recommend an interpretation or next decision, and ask for confirmation before proceeding.

Low-risk reversible assumptions may proceed only when explicitly stated. `grill-me` remains the
deep clarification workflow for broad, branching, decision-heavy, or systematic requirement
discovery.

Do not create a separate requirement-clarification skill or workflow for this convention.

### Impact

Core workflows can pause on meaningful ambiguity without turning every small assumption into a
full `grill-me` session. This decision does not change package scripts, runtime code, publish
workflow behavior, installer behavior, secret-safety behavior, archive files, optional packs,
release workflow, deployment workflow, or dependencies.

## Decision: Downstream AGENTS template delegates detailed operating rules

### Status

Accepted

### Context

The downstream `kit/project-templates/AGENTS.md` file is the stable entrypoint for projects that
install the foundation kit. The operating contract already owns detailed first-run, routing,
Requirement Clarification, concise-output, memory, evidence, and safety rules.

### Decision

Keep the downstream AGENTS template short and operational. It may contain brief entrypoint
reminders, but it must delegate detailed operating rules to:

```txt
.codex/rules/agent-operating-contract.md
```

Do not duplicate the full Project Memory Context Gate, full Requirement Clarification Gate, or a
future report-depth policy in AGENTS.

### Impact

Downstream projects get visible startup and clarification reminders without creating a second
policy surface that can drift from the installed operating contract.

## Decision: Report depth levels live in the operating contract

### Status

Accepted

### Context

The kit already required concise output and explicit external/global action reporting, but it did
not define how much detail different task types should use. High-output workflows also had fixed
report structures that should not be rewritten or duplicated across skills.

### Decision

Define shared Report Depth Levels in `agent-operating-contract`:

```txt
Brief
Standard
Detailed
```

Use short references from high-output workflows instead of duplicating the full convention in each
skill. Concise output must still preserve what changed, what was reviewed, or what was decided,
validation status, risks or blockers when present, external/global actions, and the next
recommended step.

### Impact

Agents can scale report detail to task risk and complexity without making small tasks noisy or
omitting important decisions, validation, or risks. This decision does not change package scripts,
runtime code, publish workflow behavior, installer behavior, secret-safety behavior, archive
files, release workflow, deployment workflow, dependencies, tests, or generated artifacts.

## Decision: Engineering quality uses minimal composable and security boundaries

### Status

Accepted

### Context

The engineering quality rule already covered simplicity, premature abstraction, responsibility,
testability, trust-boundary validation, and project/global tooling separation. Before downstream
adoption, it needed a concise cross-technology statement about dependency direction,
deploy-varying configuration, secrets, and security-sensitive implementation boundaries.

### Decision

Keep `engineering-quality-principles` minimal while adding two focused sections:

```txt
Composable Boundaries and Extension Seams
Configuration, Secrets, and Security Boundaries
```

Use explicit contracts and visible dependencies, and add extension points only after demonstrated
variation or integration needs. Keep configuration and secrets separate from code. Keep
security-sensitive behavior behind small auditable boundaries and prefer secure defaults, least
privilege, established libraries or patterns, and docs-first verification.

Do not prescribe plugin architectures, dependency-injection containers, mandatory layering,
microservices, CQRS, framework-specific composition, or a broad security handbook.

### Impact

Planning, implementation, and review receive stronger reusable boundary guidance without changing
workflow routing, project templates, runtime behavior, tooling, dependencies, or tests. Further
optimization should follow concrete downstream project experience.

## Decision: UI design basics is a core supporting skill

### Status

Accepted

### Context

Most downstream software projects need practical baseline guidance for UI clarity, hierarchy,
states, content, and reuse even when they do not have a dedicated design specialist or a mature
design system.

### Decision

Add `ui-design-basics` as a framework-agnostic core supporting skill. Keep it bounded guidance
inside planning, execution, review, and architecture workflows; it must not replace those
workflows or provide standalone architecture direction, implementation approval, or review
verdicts.

Treat shadcn/ui support as detection-based existing-system reuse. Apply it only when repository
evidence confirms shadcn/ui and the active project approves the relevant changes or tooling; do
not make shadcn/ui mandatory.

Defer React, Next.js, TanStack, and shadcn specialist skills until concrete downstream project
experience demonstrates stable reusable needs. External skills and discovery platforms remain
research sources only. Installing an external skill, plugin, MCP server, CLI, or other tool
requires explicit user approval.

### Impact

Downstream projects gain practical baseline UI guidance without expanding the core skill into
professional design, accessibility certification, framework specialization, or automatic external
tool installation.

### Related files

```txt
kit/skills/core/ui-design-basics/SKILL.md
kit/skills/core/ui-design-basics/metadata.yml
kit/prompts/force-ui-design-basics.md
kit/skills/core/agent-roles-and-capabilities/SKILL.md
```

## Decision: React component patterns is source-only optional guidance

### Status

Accepted

### Context

React projects repeatedly need focused guidance for component responsibility, state ownership,
derived values, controlled boundaries, Effects, refs, custom Hooks, and memoization. These concerns
are too framework-specific for the core kit, while `ui-design-basics` intentionally owns visual
and flow clarity rather than React implementation behavior.

The maintained installer copies the complete `kit/skills/` tree. Placing a React specialist there
would make it default-installed and conflict with the optional-skill model.

### Decision

Create `optional-skills/react-component-patterns/` as an experimental source-only specialist
package with install default `never`. Keep `optional-skills/` outside `kit/`; it is not copied by
the installer and requires explicit project adoption before use.

This supersedes only the React-specific deferral in the earlier `ui-design-basics` decision.
Next.js, TanStack, and shadcn specialist skills remain deferred and optional.

Core workflow skills may reference `react-component-patterns` only with "when installed" or "when
explicitly adopted" wording. Do not add a force prompt while the skill is not default-installed.

Keep the skill limited to React component and local-state implementation patterns. Keep
`ui-design-basics`, Next.js, React Server Components, TanStack Query, TanStack Router, shadcn/ui,
Tailwind, testing, frontend architecture, state-library selection, and data-fetching strategy as
separate concerns. Use official React documentation through `docs-first-research` for React
version-specific or API-specific claims.

### Impact

The repository gains reusable React implementation guidance without assuming React for downstream
projects or changing package, runtime, installer, publishing, test, template, or archive behavior.
Future optional installation or distribution requires a separate approved plan.

### Related files

```txt
optional-skills/README.md
optional-skills/react-component-patterns/SKILL.md
optional-skills/react-component-patterns/metadata.yml
docs/optional-skill-catalog.md
```

## Decision: TanStack Router and Query patterns is combined source-only optional guidance

### Status

Accepted

### Context

Upcoming React tool-style projects need focused guidance for route structure, URL/search state,
loaders, navigation, server-state queries, mutations, caching, and invalidation. TanStack Router
and TanStack Query have a documented coordination boundary, but adding broad TanStack or frontend
framework guidance to the default kit would conflict with the minimal-core model.

### Decision

Create `optional-skills/tanstack-router-query-patterns/` as one experimental source-only
specialist package with install default `never`. Keep Router and Query responsibilities in
separate sections and apply their integration guidance only when both libraries are confirmed or
explicitly requested.

Keep `optional-skills/` outside `kit/`; the maintained installer does not copy it. Require explicit
project adoption plus a matching TanStack Router or Query signal, or an explicit user request,
before use. Core workflow skills may reference it only with "when installed" or "when explicitly
adopted" wording. Do not add a force prompt while the skill is not default-installed.

This supersedes only the TanStack Router and Query deferral in the earlier `ui-design-basics` and
React component-patterns decisions. Keep TanStack Table, Form, Virtual, Start, Store, DB, Pacer,
AI, and other TanStack libraries; Next.js; React Server Components; backend/API/database/auth
design; testing strategy; and full frontend architecture out of scope. Keep React component and
local-state concerns in `react-component-patterns`, visual hierarchy and UI state presentation in
`ui-design-basics`, and version-specific TanStack claims in `docs-first-research`.

### Impact

The repository gains reusable TanStack Router and Query guidance without changing package,
runtime, installer, publishing, test, template, archive, generated-file, or default-installed
behavior. Future optional installation or distribution requires a separate approved plan.

### Related files

```txt
optional-skills/tanstack-router-query-patterns/SKILL.md
optional-skills/tanstack-router-query-patterns/metadata.yml
docs/optional-skill-catalog.md
```

## Decision: Installer project mode controls conflict policy without changing payload behavior

### Status

Accepted

### Context

The maintained installer previously used one conflict path for both empty starter projects and
established projects. Existing projects may contain important `AGENTS.md` or `.codex/project/`
context that should not reach overwrite authorization by default.

### Decision

Add `--project-mode auto|new|existing`, defaulting to `auto`, plus
`--overwrite-conflicts` for explicit existing-like overwrite authorization.

Auto mode resolves detected project signals or mapped-file conflicts to existing-like caution.
Existing-like apply with conflicts stops before staging, backup preparation, prompting, or target
writes unless `--overwrite-conflicts` is present. Explicit overwrite still requires complete
conflict display, a strong warning, typed `INSTALL_WITH_BACKUP` confirmation, verified backup,
plan revalidation, and the existing single apply path. New mode retains the same safeguards while
treating conflicts as starter files or previous-install remnants.

Project mode does not change mappings, optional-skill installation, downstream `package.json`,
dependencies, formatter/linter installation, project-memory merging, publish behavior, or the
installed publish runtime.

Successful installation directs users to `force-initialize-project-context`. Existing product
plans and roadmaps are initialization inputs. Feature implementation waits for initialization and
approved durable-memory updates. At this stage, optional skills, package aliases, and Biome
adoption remained manual, separately approved setup. PR #115 later superseded only the package
alias part through the bounded safe-add decision below.

### Impact

Existing projects receive a non-zero safety stop before conflict side effects, while intentional
new-project and explicit-overwrite flows reuse the mature backup/apply machinery. The installer
remains payload-stable and dependency-free.

## Decision: Biome is a source-repository quality gate, not a downstream requirement

### Status

Accepted

### Context

Installable scripts, documentation, skills, prompts, rules, and templates should be formatted and
checked consistently before they are published or installed downstream. That source-repository
quality concern must not silently become target-project tooling policy.

### Decision

Use pinned Biome 2.5.0 and the root `biome.json` for foundation-kit source formatting, linting,
and organize-imports assists. Expose `format`, `format:check`, and `biome:fix` package scripts, and
run `biome check .` at the start of `pnpm check`.

Biome covers source files under `kit/`, including scripts that the installer later copies to
downstream `.codex/scripts/`. The installer does not install Biome, create target Biome
configuration, add dependencies, or require downstream projects to adopt Biome. PR #115's
safe-add publish aliases are independent of Biome adoption.

When initialization finds no existing formatter/linter in a downstream project, it may recommend
Biome as a manual setup candidate through a separate approved plan. Existing project tooling takes
priority.

### Impact

The source repository gains one consistent quality gate while preserving downstream project
autonomy and existing installer boundaries.

## Decision: Generic change-safety lessons are deliberately distilled, not template-copied

### Status

Accepted

### Context

The source lesson history combines reusable principles with foundation-kit-specific context.

### Decision

Keep repository-specific lessons in `.codex/project/lessons-learned.md`. PR #81 distilled the
generic change-safety subset into `kit/rules/engineering-quality-principles.md` section `Change
Safety and Evidence`. Keep `kit/project-templates/lessons-learned.md` as a blank downstream
template. Future promotions require deliberate generalization into a reusable rule, skill, or
documentation; never copy project memory automatically.

### Impact

Reusable guidance, source history, and downstream memory remain cleanly separated.

## Decision: Explicit merge-PR auto-merge waits for pending requirements

### Status

Accepted

### Context

Explicit PR-number merge safely stopped when required checks were pending, but callers had to wait
and rerun the command even when the repository supported GitHub auto-merge.

### Decision

Add public `--auto-merge` only to `--mode merge-pr`, with source alias
`publish:merge-pr:auto`. Passed checks retain the existing immediate squash-merge path. Pending
checks request GitHub PR-level auto-merge using squash and expected-head protection, then read the
PR once. Refresh the default branch only when that read verifies a merge; otherwise report the
open waiting PR and leave the local branch unchanged. Failed or unknown checks, changed heads,
drafts, conflicts, dirty worktrees, and wrong bases remain blocking.

Repository-level **Allow auto-merge** permits the feature but does not enable it per PR. The option
is never inferred, never bypasses checks or reviews, and is invalid for normal publish and PR-only
modes. At this stage, downstream package aliases remained optional manual setup; PR #115 later
superseded that setup boundary with the safe-add decision below.

### Impact

Users can explicitly delegate the wait for required checks and reviews to GitHub without adding a
second merge implementation or weakening merge safety.

## Decision: Skill taxonomy separates reusable disciplines, default workflows, and optional capabilities

### Status

Accepted

### Context

The physical `kit/skills/core/` tree contains both reusable agent disciplines and default
engineering workflows, while `optional-skills/` contains explicitly adopted specialists. Category
and invocation intent were implicit, which made routing, dependency review, and metadata token
load harder to evaluate consistently.

### Decision

Use conceptual categories `meta`, `core`, and `optional`, plus invocation types `user`, `model`,
and `support`. Metadata descriptions are invocation logic: model-invoked descriptions stay short
and trigger-focused, user wrappers stay thin, and shared behavior has one canonical meta skill or
rule. `depends_on` records hard skill dependencies only.

Meta skills may depend only on meta skills or support references. Core skills may depend on meta
skills. Meta and core skills must remain functional without optional skills. Optional skills may
depend on meta skills; optional-to-optional dependencies must be explicit, and optional use of a
core workflow must be documented and justified.

Rename `write-a-skill` to `writing-great-skills` inside `kit/skills/core/`, including its force
prompt and active references. Preserve mature skill content. Defer physical migration to
`kit/skills/meta/`; do not change installer mappings, downstream installation, optional-skill
installation, or publish behavior in this theme.

### Impact

Routing and dependency intent become machine-checkable without changing the installed payload
shape. Future directory migration remains a separate reviewed theme.

### Related files

```txt
kit/rules/skill-invocation-and-dependency-boundaries.md
kit/skills/core/*/metadata.yml
kit/skills/core/writing-great-skills/
optional-skills/*/metadata.yml
tests/install-foundation-kit/core.test.mjs
```

## Decision: Grilling is the shared support primitive for blocking clarification

### Status

Accepted

### Context

`grill-me`, planning, initialization, and architecture planning repeated the same evidence-first,
one-question-at-a-time, recommendation-led clarification discipline. The accepted taxonomy favors
one meta source of truth for reusable behavior and thin user-facing wrappers.

### Decision

Add `grilling` under `kit/skills/core/grilling/` with `category: meta`, `required: true`,
`invocation: support`, and no hard dependencies. It owns only the shared discipline: inspect
available evidence before asking, resolve blocking ambiguity one dependency-ordered branch at a
time, include a recommended direction, and return when the caller can continue or is blocked on
user input.

Reclassify `grill-me` as a meta/user workflow and make it depend on `grilling`. Keep `grill-me` as
the user-facing deep clarification workflow with its existing role routing, workflow boundaries,
output modes, stop conditions, relationship routing, and memory follow-up.

Make `plan-with-context`, `initialize-project-context`, and `project-architecture-plan` depend on
`grilling` and reference it only at their clarification boundaries. The calling workflows retain
their context gates, outputs, approvals, persistence, and execution boundaries.

Do not add a force prompt for `grilling`, move files to `kit/skills/meta/`, or change installer,
downstream mapping, optional installation, publish, release, deployment, or memory-write behavior.

### Impact

Clarification mechanics have one reusable support source while user routing and mature workflow
contracts remain stable. The metadata graph makes the dependency explicit without changing default
installation.

### Related files

```txt
kit/skills/core/grilling/
kit/skills/core/grill-me/
kit/skills/core/plan-with-context/
kit/skills/core/initialize-project-context/
kit/skills/core/project-architecture-plan/
tests/install-foundation-kit/core.test.mjs
```

## Decision: Physical skill paths match meta and core categories

### Status

Accepted

### Context

The taxonomy originally classified reusable disciplines as meta while keeping them physically
under `kit/skills/core/`. The separately reviewed source migration has now been completed and
merged.

### Decision

Store meta skills under `kit/skills/meta/` and core workflows under `kit/skills/core/`. Keep
optional skills under `optional-skills/`, outside the default installable payload.

Preserve the installer's complete-tree `kit/skills/` mapping so fresh default installs continue to
receive both meta and core skills. Do not add automatic deletion, movement, backup, or cleanup of
obsolete meta-skill paths in existing downstream projects; that maintenance remains manual or
requires a separate approved plan.

This supersedes only the prior deferral of physical `kit/skills/meta/` migration. Earlier taxonomy,
invocation, dependency, workflow-boundary, and optional-adoption decisions remain accepted, and
their historical path references remain historical records.

### Impact

Current source paths communicate category directly without changing installer mapping or optional
installation behavior. Existing downstream projects may retain old installed paths until they are
maintained separately.

### Related files

```txt
kit/skills/meta/
kit/skills/core/
optional-skills/
tests/install-foundation-kit/core.test.mjs
```

## Decision: Explicit repository target verification belongs to the agent operating contract

### Status

Accepted

### Context

The physical meta skill migration left active references aligned, but the repository lacked one
general contract requiring agents to verify concrete skill, rule, prompt, template, and installed
`.codex/` paths before relying on them. Existing metadata tests and missing-skill handling covered
only parts of that risk.

### Decision

Define the complete Explicit Target Reference Guardrail in
`kit/rules/agent-operating-contract.md`. Root and downstream AGENTS entrypoints,
`skill-invocation-and-dependency-boundaries`, and `initialize-project-context` use concise pointers
without restating the full semantics.

Verify existing concrete targets before treating them as evidence, authoritative instructions,
workflow inputs, dependencies, or change/review targets. Report missing, stale, obsolete, or
category-inconsistent targets without silently guessing replacements. Stop when a required target
blocks correctness, scope, safety, or workflow authority; otherwise continue only after marking
the reference unavailable, stale, or historical and explaining the limited impact.

Prospective outputs, placeholders, marked examples, and clearly historical records are classified
separately. Historical paths may remain unchanged and do not override current sources. This
guardrail does not authorize installer cleanup, migration, deletion, movement, backup, target
creation, or historical rewriting.

### Impact

Future renames and migrations have a shared behavioral and test boundary for active references
without adding a new skill or changing installer and workflow responsibilities.

### Related files

```txt
AGENTS.md
kit/project-templates/AGENTS.md
kit/rules/agent-operating-contract.md
kit/rules/skill-invocation-and-dependency-boundaries.md
kit/skills/meta/initialize-project-context/SKILL.md
tests/install-foundation-kit/core.test.mjs
```

## Theme 23: Diagnosis and Work Item Slicing

### Status

Accepted

### Context

The kit already plans, executes, reviews, and audits work, but it lacks a dedicated evidence-first
workflow for unknown causes and a standard bridge from large approved plans to focused execution
passes.

### Decision

- `diagnose` is a core skill, not a meta skill, because it supports day-to-day downstream project
  debugging and regression investigation.
- `to-work-items` is a core skill, not a meta skill, because it bridges approved plans into
  execution-ready downstream engineering work.
- Work-item output is local-first under `dev_locals/plans/`; Theme 23 does not create GitHub Issues
  directly.
- The kit will not introduce a parallel `CONTEXT.md` domain-model source of truth. Stable domain
  vocabulary belongs inside the existing project-memory structure.
- Matt Pocock's skills are external inspiration only. Foundation-kit guidance is rewritten in the
  kit's native style and preserves its workflow and safety boundaries.

### Impact

Downstream projects gain explicit evidence-first diagnosis and vertical work-item slicing without
new dependencies, runtime behavior, issue-tracker automation, or a second memory system.

### Related files

```txt
kit/skills/core/diagnose/
kit/skills/core/to-work-items/
kit/rules/engineering-quality-principles.md
kit/skills/meta/update-project-memory/SKILL.md
```

## Decision: Existing-project safe apply and selected optional-skill installation

### Status

Accepted

### Context

Existing downstream projects need a bounded installer path that can adopt newly introduced kit
files without replacing project-owned context. Optional specialists also need an exact,
source-boundary-safe installation path after their source migration into `kit/`.

### Decision

- Move the active optional-skill source from repo-root historical locations to
  `kit/optional-skills/<name>/`; earlier decisions describing a root-level active source are
  superseded.
- Keep optional skills excluded from default installation. Exact repeatable
  `--include-optional <name>` selections install only to `.codex/skills/engineering/<name>/`.
- Treat `.codex/skills/project/` as project-owned and outside installer inspection, validation,
  migration, and collision handling.
- Add `--apply --skip-conflicts` as a zero-overwrite mode. It writes only genuinely new mapped
  files, skips identical files, and preserves every existing target.
- Classify existing project memory as preserved and differing `AGENTS.md` as a manual merge
  candidate in safe mode.
- Treat legacy-name collisions in kit-managed core, meta, and engineering namespaces as migration
  review items rather than safe new files.
- Retain the established explicit overwrite path, including backup, typed confirmation, and plan
  revalidation. This decision does not create a broader skill-taxonomy migration.

### Impact

Existing projects can partially adopt safe additions without target-file replacement, while
optional skill ownership and destination paths remain explicit. A new destination path alone is
not proof that a skill write is safe.

### Related files

```txt
kit/optional-skills/
scripts/install-foundation-kit/
tests/install-foundation-kit/
README.md
docs/optional-skill-catalog.md
```

## Decision: Installation manifests are evidence, not replacement authority

### Status

Accepted

### Context

PR #106 implemented WI-1 manifest-backed classification for existing-project upgrades. The
installer needs durable baseline evidence without converting installation history into permission
to overwrite project-owned or customized content.

### Decision

- Generate the stable schema-v1 manifest at
  `.codex/foundation-kit/installation-manifest.json` after successful apply.
- Store SHA-256 full-file baseline evidence only for eligible kit-managed paths. Source-controlled
  ownership policy wins over downstream manifest claims.
- Keep WI-1 existing-project target writes safe-add-only. Any later existing-file replacement
  requires separately approved, source-controlled authorization and cannot derive authority from
  manifest evidence alone.
- Permit exact unchanged, baseline-adoptable kit-managed files to be adopted into the manifest
  during explicit apply without rewriting target bytes.
- Do not silently claim project memory, project-owned configuration, workflow scripts and other
  manual-risk paths, mixed entrypoints/config, or unclaimed project skills as replaceable kit
  baselines.
- Block apply before mapped target writes when the manifest is malformed or conflicts with source
  policy.

### Impact

The manifest can support deterministic classification and later review, but it cannot bypass
ownership or risk policy. Existing-file replacement requires separate planning, authorization,
and validation.

### Related files

```txt
scripts/install-foundation-kit/installation-manifest.mjs
scripts/install-foundation-kit/ownership-policy.mjs
scripts/install-foundation-kit/planner.mjs
scripts/install-foundation-kit/flow.mjs
tests/install-foundation-kit/
```

## Decision: Managed replacement starts with a package-atomic React canary

### Status

Accepted

### Context

PR #108 introduced the first existing-project managed-replacement slice after WI-1. Allowing one
file from a selected optional skill package to advance independently could leave the installed
package internally inconsistent or record a partial baseline.

### Decision

- Keep existing-project apply safe-add-only by default and retain `--replace-kit-managed` as a
  separate explicit authorization.
- Allow replacement only for the exact source-controlled pair
  `.codex/skills/engineering/react-component-patterns/SKILL.md` and `metadata.yml`; do not infer
  replacement authority for any other path from manifest evidence.
- Require both React files to be selected and each classified as `KIT_MANAGED_REPLACE` with
  `managedReplaceAllowed`. If either file is missing, unselected, not baseline-equal, mixed,
  manual-risk, or otherwise ineligible, replace neither file and report the package as ineligible.
- Treat target writes and manifest advancement as one package operation. If a copy or manifest
  write fails, restore both React files and preserve the previous installation manifest.
- Keep AGENTS, project memory, rules, prompts, core/meta skills, scripts, configuration, GitHub
  settings, mixed/manual-risk paths, and downstream project-specific skills outside this
  replacement allowlist.

### Impact

The first managed-replacement capability is deliberately narrow and fail-closed. A downstream
manifest proves baseline equality but does not grant replacement permission, and partial React
package replacement or partial manifest advancement is not allowed.

### Related files

```txt
scripts/install-foundation-kit/ownership-policy.mjs
scripts/install-foundation-kit/flow.mjs
scripts/install-foundation-kit/installation-manifest.mjs
scripts/install-foundation-kit/conflict.mjs
scripts/install-foundation-kit/final-report.mjs
tests/install-foundation-kit/flow.test.mjs
README.md
```

## Decision: Execute-plan readiness checks require a visible pre-execution status boundary

### Status

Accepted

### Context

`execute-plan` already required plan approval, project-memory alignment, repository preflight, and
plan completeness checks, but it did not require one consolidated user-visible readiness update
before implementation began. Agents could therefore perform the checks without making their
result, unknowns, staged approach, or stop conditions clear to the user.

### Decision

After applicable checks and before branch creation or another execution mutation, `execute-plan`
must emit a concise Pre-Execution Status Update. It reports the approved plan source and readiness,
project-memory alignment, relevant repository and PR state, branch strategy, plan- or
project-required runtime/tooling alignment, staged implementation groups, and stop conditions.

Unavailable or irrelevant checks must be identified as not checkable or not applicable rather
than reported as passed. This is an observability contract over existing requirements, not a new
universal requirement for clean synchronized `main`, GitHub checks, or runtime checks.

Local branch creation may remain part of local execution setup. It does not authorize push, PR
creation, merge, release, deployment, or another publish action. Push, PR, and merge remain behind
an explicit `publish-current-branch` workflow switch.

### Impact

Approved-plan execution starts with a consistent, truthful readiness boundary while preserving
the existing execution, project-memory, branch, and publishing responsibilities.

### Related files

```txt
kit/skills/core/execute-plan/SKILL.md
.codex/project/lessons-learned.md
docs/foundation-design-log.md
```

## Decision: Existing-project scripts are workflow-script merge items when different

### Status

Accepted

### Context

Scripts installed from `kit/scripts/` begin as reusable workflow executors, but downstream
projects may customize their installed `.codex/scripts/` copies for repository-specific publish,
CI, validation, safety, or local automation behavior. Reporting those differences as ordinary
reusable-file conflicts under-communicates the risk of replacing project workflow automation.

### Decision

Classify mapped `.codex/scripts/*` files as `workflow-script` ownership. New scripts retain normal
safe-write behavior, and identical scripts remain safe skips. Existing-different scripts use the
distinct `script-merge` action and `[SCRIPT-MERGE]` reporting so users review or manually merge
project-specific automation.

Safe apply continues to write only `action === "write"` and therefore preserves every existing
script without backup prompts. Explicit overwrite remains available through the established
backup, typed-confirmation, and revalidation path; the installer does not auto-merge or migrate
target scripts.

This classification does not authorize or change push, PR, merge, release, deployment, or publish
workflow behavior.

### Impact

Existing-project upgrades make customized script risk visible while preserving fresh-install,
identical-file, safe-apply, and explicit-overwrite semantics.

### Related files

```txt
scripts/install-foundation-kit/planner.mjs
scripts/install-foundation-kit/conflict.mjs
scripts/install-foundation-kit/final-report.mjs
tests/install-foundation-kit/
README.md
```

## Decision: Skill and output efficiency must preserve capability and safety

### Status

Accepted

### Context

High-frequency skills, rules, entrypoints, and reports can accumulate duplicated rationale and
success-path output. Optimizing them only for line or token count can remove context gates,
validation, STOP conditions, workflow boundaries, uncertainty, or failure evidence that carries
real capability and safety value.

### Decision

Use `kit/rules/skill-and-output-efficiency.md` as the compact standard for future efficiency work.

The primary constraint is to preserve intelligence, capability, and safety. Preserve the safety
kernel: context, approval, clarification, and external-verification gates; mutation and workflow
boundaries; validation; STOP and rollback behavior; uncertainty and evidence; final-report facts;
and complete warnings, blockers, and errors.

Compress routine success-path progress, repeated rationale, decorative prose, duplicate examples,
and behavior-neutral wording. Deduplicate shared guidance only after identifying a canonical owner
and confirming that boundary-local safeguards remain equally visible and enforceable.

Mature content requires a small pilot, semantic inventory, and applicable regression scenarios
before broader compression. First-phase work is limited to the new standard, a local read-only P1
audit, and durable records. It does not modify existing P1 content or change installer, mapping,
publish, package, dependency, runtime, prompt, metadata, test, archive, release, or deployment
behavior.

### Impact

Future efficiency work has an explicit semantic-preservation gate and can reduce low-value output
without using line count as a proxy for quality. The first audit recommends `writing-great-skills`
as a possible later pilot and keeps reviewable work-item decomposition as a separate future
workflow-quality theme.

### Related files

```txt
kit/rules/skill-and-output-efficiency.md
dev_locals/research-notes/2026-06-20-capability-preserving-skill-efficiency-audit.md
docs/foundation-design-log.md
```

## Decision: Execute-plan compresses routine progress while preserving boundary output

### Status

Accepted

### Context

`execute-plan` must keep approval, readiness, scope, validation, drift, mutation, memory, STOP, and
publish boundaries visible. Routine successful progress and repeated changed-file paths can still
create output noise without improving user decisions or execution safety.

### Decision

Apply the capability-preserving efficiency standard inside `execute-plan` output:

- keep pre-execution status, warnings, blockers, skipped checks, validation failures, scope drift,
  permission or publish boundaries, and final reports complete but concise;
- require reason, evidence, impact, and next action when they are relevant to a warning, blocker,
  error, or failed boundary;
- prefer terse checkpoints for routine successful progress; and
- allow final reports to summarize changed files by count and category when Git or the UI already
  exposes exact paths, while retaining exact paths when review, ambiguity, or safe follow-up needs
  them.

This changes output guidance only. It does not change approval, execution, validation, commit,
memory, publish, release, deployment, or STOP semantics.

### Impact

Normal successful execution becomes easier to scan while failure paths and decision boundaries
remain complete and actionable.

### Related files

```txt
kit/skills/core/execute-plan/SKILL.md
kit/rules/skill-and-output-efficiency.md
docs/foundation-design-log.md
```

## Decision: Broad plans require reviewable work items before execution

### Status

Accepted

### Context

Self-contained plans can still be too broad for one focused execution pass. Without an explicit
reviewability decision, one approved plan may combine independently reviewable outcomes, vague
file scope, or incompatible validation loops and produce a review-hostile change set.

### Decision

`plan-with-context` classifies every non-trivial plan as one focused execution pass, embedded
reviewable work items, or a required handoff to `to-work-items`. The decision uses expected
file/area scope, validation boundaries, independent outcomes, safety boundaries, and reviewability
rather than numeric-only size thresholds.

`to-work-items` remains the canonical decomposition workflow. Each item defines its goal,
dependency order, expected file/area scope, allowed mutation, non-goals, validation, acceptance
criteria, STOP conditions, and review/PR boundary. Decomposition does not authorize execution.

Before mutation, `execute-plan` verifies the approved current slice is focused, scoped, validated,
and reviewable. Broad or review-hostile plans without the required approved work items must stop
and return to `plan-with-context` or `to-work-items`. The executor must not invent decomposition or
silently continue. When approved work items exist, execution is limited to the approved current
slice unless the user explicitly approves multiple slices together with visible combined scope.

Push, PR, and merge remain owned by `publish-current-branch`. Durable memory writes remain owned by
`update-project-memory`.

### Impact

Planning and execution now protect reviewability as an execution-readiness property while keeping
small focused work lightweight and preserving existing approval, validation, memory, and publish
boundaries.

### Related files

```txt
kit/skills/meta/plan-with-context/SKILL.md
kit/skills/core/to-work-items/SKILL.md
kit/skills/core/execute-plan/SKILL.md
docs/foundation-design-log.md
```

## Decision: Publish review handoff uses verified PR head and explicit merge authorization

### Status

Accepted

### Context

Repeated updates to an open pull request needed a direct review handoff for the newly pushed head,
while the normal `publish:merge-pr` confirmation repeated authorization already expressed by the
explicit command and PR number. Any optimization still had to preserve required checks,
mergeability, expected-head enforcement, squash semantics, merge verification, auto-merge
authorization, and fast-forward-only refresh.

### Decision

`publish:pr-only` continues to report the general PR Files changed URL. After creating or updating
the PR, it compares re-read PR metadata with the verified pushed head. Only a match permits the
neutral `Latest commit changes` URL using `/changes/<head-sha>`; a mismatch reports the verified
pushed SHA instead. The report also prints a copyable `publish:merge-pr <pr-number>` next step.

The explicit normal `publish:merge-pr <pr-number>` command authorizes the existing immediate
squash-merge attempt without a second confirmation. All technical validation and revalidation
remain unchanged. The distinct auto-merge path keeps its confirmation unless `--yes` is supplied,
and `--yes` remains accepted for compatibility.

### Impact

Reviewers can move directly from a repeated PR update to the relevant head and then to the explicit
merge command. Normal merge has less redundant interaction without bypassing GitHub checks,
reviews, branch rules, head verification, or local refresh safety. No installer, package script,
dependency, runtime, or unrelated publish-mode behavior changes.

### Related Files

- `kit/scripts/publish-changes/pr-only-flow.mjs`
- `kit/scripts/publish-changes/final-report.mjs`
- `kit/scripts/publish-changes/merge-pr-flow.mjs`
- `tests/publish-changes/modes.test.mjs`
- `kit/skills/core/publish-current-branch/SKILL.md`

## Decision: Task execution uses one shared proportional classification

### Status

Accepted

### Context

Requiring a full saved plan for every mutation adds disproportionate overhead to small, explicit,
low-risk work, while adding scoped-brief support only to `execute-plan` leaves planning itself too
heavy. Apparent size cannot be the shortcut: a one-line change may affect installer, publish,
security, data, permission, runtime, deployment, or destructive side-effect boundaries.

### Decision

Use `kit/rules/task-execution-classification.md` as the canonical task-scale and reviewability
classification shared by `plan-with-context`, `execute-plan`, and `to-work-items`. It defines four
outcomes:

1. Direct Answer / No Mutation;
2. Scoped Task Execution Brief;
3. Full Saved Plan; and
4. Work Items.

`plan-with-context` applies the shared model before selecting its output. It may provide no
implementation artifact, create the complete eight-section Scoped Task Execution Brief, retain the
current 13-section full plan, or route broad/review-hostile work to `to-work-items`.

`execute-plan` accepts an explicitly approved full plan or scoped brief. It may assemble an inline
brief only from exact user authorization and verified repository facts, must expose it before
mutation, and must not invent missing contract terms or silently research, reclassify, decompose,
or expand the task.

`to-work-items` consumes the shared Work Items outcome and remains the canonical decomposition
workflow. It does not maintain a separate scale taxonomy, create scoped briefs, execute, publish,
or update project memory.

Eligibility is semantic and risk-based; line and file counts are supporting evidence only. New
product features, new user workflows, behavior-changing feature work, feature work with meaningful
product or technical decisions, architecture, broad-refactor, installer,
publish/merge/release/deploy, package/dependency/runtime/CI/CD, prompt/metadata,
auth/security/permission, data/schema/persistence, external-service, destructive, production, and
downstream-template changes do not qualify regardless of size. Narrow UI, CSS, layout, responsive
presentation, or readability fixes may qualify only when all scoped-brief gates pass and existing
behavior, data semantics, routing/state, accessibility, validation, and safety contracts remain
unchanged. Ambiguous scope, unknown validation or rollback, or unverified technical assumptions
require clarification, `docs-first-research`, a full plan, or work items as appropriate.

Scoped briefs remain strict planning artifacts and execution contracts, not planless execution.
Existing Project Memory Context Gate, clarification, research, project-memory, validation, commit,
publish, release, deployment, and supporting-skill boundaries remain unchanged.

### Impact

Planning and execution overhead is proportional to verified task scope while high-risk, uncertain,
or broad work retains full planning or decomposition. One shared owner prevents the three workflows
from drifting into competing classification models.

### Related Files

- `kit/rules/task-execution-classification.md`
- `kit/skills/meta/plan-with-context/SKILL.md`
- `kit/skills/core/execute-plan/SKILL.md`
- `kit/skills/core/to-work-items/SKILL.md`
- `docs/foundation-design-log.md`

## Decision: Existing-project upgrade safety v1 closes after WI-1/WI-2 validation

### Status

Accepted

### Context

WI-1/WI-2 established fail-closed classification, safe-add-only default behavior, and one atomic
managed-replacement canary. The read-only Germany Holiday dry-run preserved project-owned memory,
config, and customized scripts, identified additive files, and left the downstream repository
unchanged.

### Decision

Close the initiative at v1. No immediate installer safety fix is required. Keep differing scripts
manual-risk. Defer WI-3 and WI-4; reopen either only for a concrete unresolved safety gap or
repeated maintenance evidence, with separate planning and explicit approval.

### Impact

Accepted limitations include manual handling for no-manifest differences, no automatic script
upgrade, and no partial `AGENTS.md` update path. These are usability tradeoffs, not silent-overwrite
defects.

### Related local-only evidence

```txt
dev_locals/plans/2026-06-21-existing-project-upgrade-safety-plan.md
dev_locals/research-notes/2026-06-22-existing-project-dry-run-validation.md
dev_locals/research-notes/2026-06-22-existing-project-upgrade-safety-closeout.md
```

## Decision: Publishable change handoff separates PR-for-review from final publication

### Status

Accepted

### Context

The handoff initially treated PR-only publication as an after-review action, conflating the PR
needed to conduct review with the later merge or final publication decision.

### Decision

When a non-publish workflow leaves a publishable local change, its final handoff prints this fixed
copyable command format using the recommended commit message and PR title:

```bash
pnpm publish:pr-only "<commit message>" "<PR title>"
```

This is a stable output contract. `execute-plan` does not need to verify package scripts on every
task before printing it. A missing or different project publishing command is a project setup
issue and does not change the handoff format. Do not use `pnpm publish:changes` as the
create-PR-for-review command or infer another command form from package script names.

Printing the command does not authorize or execute publication. `execute-plan` must not push,
create or update PRs, merge, release, deploy, or mutate external settings. Actual PR creation
requires a user-run command or explicit user authorization through `publish-current-branch`, which
remains the workflow authorized for push, PR, and merge actions. Merge, release, deploy, or other
final publication requires completed review and separate explicit user authorization.

When no publishable local change exists, do not print an executable create-PR command. Use the
not-applicable handoff shape defined by `agent-operating-contract`.

### Impact

Handoff reports use one reliable copyable create-PR command while preserving the separation
between output and authorization. The decision does not change package scripts, installer
behavior, publish-script behavior, or publication permissions.

### Related Files

- `kit/rules/agent-operating-contract.md`
- `kit/skills/core/execute-plan/SKILL.md`
- `tests/install-foundation-kit/core.test.mjs`

## Decision: Downstream publish package aliases are safe-add installer conveniences

### Status

Accepted

### Context

Installed publish scripts run from `.codex/scripts/`, but downstream projects previously needed to
add package aliases manually. Automatically replacing existing aliases or claiming
`package.json` as kit-managed would violate project ownership and existing-project safety.

### Decision

For a valid existing downstream `package.json`, the installer may add these missing aliases:

```txt
publish:changes        node .codex/scripts/publish-changes.mjs
publish:pr-only        node .codex/scripts/publish-changes.mjs --mode pr-only
publish:merge-pr       node .codex/scripts/publish-changes.mjs --mode merge-pr
publish:merge-pr:auto  node .codex/scripts/publish-changes.mjs --mode merge-pr --auto-merge
```

Existing same-name aliases with different values are preserved and reported. Missing, invalid,
non-object, or structurally unsafe package files are not created or repaired. `package.json`
remains project-owned and outside installation-manifest authority. The canonical guaranteed
executor remains `node .codex/scripts/publish-changes.mjs`; source-repository aliases may instead
invoke `kit/scripts/publish-changes.mjs` because they run before installation.

### Impact

Downstream projects receive convenient default commands without silent package-script overwrite,
dependency changes, or broader installer ownership. Direct installed-script execution remains the
stable fallback.

### Related Files

- `scripts/install-foundation-kit/publish-aliases.mjs`
- `scripts/install-foundation-kit/planner.mjs`
- `scripts/install-foundation-kit/flow.mjs`
- `scripts/install-foundation-kit/final-report.mjs`
- `tests/install-foundation-kit/flow.test.mjs`

## Decision: Plausible Extension Check is conditional engineering-quality guidance

### Status

Accepted

### Context

Static payload grouping showed that a small conceptual boundary can preserve a credible adjacent
use without implementing that future behavior. The reusable distinction belongs with existing
simplicity, composability, and extension-seam guidance rather than in another workflow surface.

### Decision

Keep the Plausible Extension Check in `kit/rules/engineering-quality-principles.md` as conditional
guidance for reusable systems and durable design boundaries. It may justify only cheap structural
optionality; real extension behavior still requires demonstrated variation or integration need.

Do not make the check a standalone rule, a new skill, or a mandatory workflow step unless future
evidence shows that the existing engineering-quality owner is insufficient.

### Impact

Planning, architecture, implementation, and review can preserve low-cost flexibility without
adding speculative capability or new workflow ceremony.

### Related Files

- `kit/rules/engineering-quality-principles.md`
- `dev_locals/research-notes/2026-06-29-plausible-extension-check-placement-analysis.md`

## Decision: Task and change safety uses a common non-authorizing rule

### Status

Accepted

### Context

PR #118 placed the Plausible Extension Check in engineering quality because a standalone rule for
that check alone was not justified. A later ownership review found a broader coherent set of
proportional scope, change-safety, evidence, and design-safety principles that applies to code and
non-code work and now has two direct consumers.

### Decision

Use `kit/rules/task-and-change-safety-principles.md` as the compact common owner. Reference it from
`agent-operating-contract.md` and `engineering-quality-principles.md` without creating a workflow,
task taxonomy, output template, broad collaboration protocol, or authorization mechanism.

Keep hard startup, context, target-reference, clarification, project-root, global-tooling,
routing, memory, reporting, and publish boundaries directly visible in the operating contract.
Keep code, UI, runtime, security, and module-quality guidance in engineering quality. The shared
rule remains proportional and non-ceremonial, and the Plausible Extension Check remains conditional
and does not authorize speculative capabilities.

Classify the new installed rule as `common-workflow`. Do not add it to bootstrap-critical or
dependency-guard lists, and do not change installer mapping, conflict, ownership, write, apply, or
rendering behavior.

This supersedes the PR #118 decision only for the check's canonical location. Its conditionality,
cheap-structural-optionality limit, and anti-speculation safeguards remain accepted.

### Impact

Code and non-code workflows can share one small judgment rule while the operating contract retains
direct enforcement and engineering quality remains focused. Skills, prompts, package files,
downstream projects, and installer behavior remain unchanged.

### Related Files

- `kit/rules/task-and-change-safety-principles.md`
- `kit/rules/agent-operating-contract.md`
- `kit/rules/engineering-quality-principles.md`
- `scripts/install-foundation-kit/payload-groups.mjs`

## Decision: Docs installation is one explicit additive profile

### Status

Accepted

### Context

Non-code projects need the foundation kit's planning, research, writing, memory, and publish
workflow without carrying code-review or repository-setup surfaces. Static payload groups provide
a verified capability boundary, but arbitrary group combinations would introduce incomplete
packages and dependency-solving pressure.

### Decision

Support exactly `--kit-profile docs` in the maintained installer. It selects project templates,
common workflow, docs/writing workflow, and the complete publish package. It excludes code
workflow, GitHub setup, optional skills, and unclassified mappings. Include publish because its
project-memory dependency is present and its aliases already preserve project ownership and
conflicts.

Build and validate the complete mapping against manifest policy before filtering current mappings
for per-target planning. Detect obsolete manifest records against the complete mapping and omit
unclassified obsolete entries from docs-profile planning. Carry the requested profile through both
revalidation points and the plan fingerprint.

Keep the feature additive per invocation. Do not persist profile metadata in schema-v1, remove
out-of-profile files or records, infer project type, support profile switching, expose free-form
groups or standalone packages, or add dependency solving. No-profile behavior remains the
complete installer path. Profile groups select scope only; ownership, conflict, backup, apply,
manifest, alias, and verification authority remain unchanged.

### Impact

Writing, research, planning, business-note, interview-preparation, and documentation projects can
install a smaller coherent workflow through the mature installer safety path. Generalized package
or profile behavior remains deferred until concrete evidence requires it.

### Related Files

- `scripts/install-foundation-kit/kit-profiles.mjs`
- `scripts/install-foundation-kit/planner.mjs`
- `scripts/install-foundation-kit/flow.mjs`
- `scripts/install-foundation-kit/final-report.mjs`
- `tests/install-foundation-kit/kit-profiles.test.mjs`

## Decision: Task and product framing is a lightweight pre-planning discipline

### Status

Accepted

### Context

Agents can prematurely translate work into implementation mechanics before the task boundary,
affected party, or smallest sufficient solution is clear. Product-facing work can additionally
collapse into widgets, filters, tabs, colors, state, API shape, or layout before the user-facing
purpose is clear. The kit needs a reusable framing check without turning every task into a full
PRD or project-management workflow.

### Decision

Use Task and Product Framing Skill as the visible name while intentionally retaining
`product-framing-review` as the stable workflow/package identifier and installed path basename.
The identifier participates in metadata routing, cross-skill references, installer payload
grouping, installed destinations, and existing-project manifest/obsolete-path handling. Renaming
it would be a separate migration requiring compatibility, cleanup, and installer validation; this
wording update does not authorize that migration.

Use lightweight Task / Change Framing when work is unclear or drift-prone, including workflow,
rule, skill, prompt, documentation, maintenance, source-of-truth, and product tasks. Identify the
intended capability, current problem, affected party, smallest sufficient solution, reason it
works, non-goals, and readiness.

Use deeper Product Framing only when work affects end-user product behavior, workflow meaning,
data semantics, invalid or partial states, or a PRD/product baseline. Keep both modes proportional,
ask focused questions, route broad ambiguity to `grill-me`, and route implementation planning to
`plan-with-context` only after framing is clear.

Use the same framing as a review gate before reviewing, approving, or executing a plan or proposal.
Compare the proposal with the intended capability, current problem, proposed solution, non-goals,
and readiness. If it solves a broader or different problem, return to framing before reviewing
implementation details; do not absorb unscoped high-impact work as an implementation detail.

Do not turn the skill into mandatory full-PRD generation, issue-tracker automation, or execution
authorization.

### Impact

Planning, review, and implementation workflows gain a general task-boundary guardrail plus a
deeper product-purpose mode while preserving existing clarification, execution, publishing, and
project-memory boundaries.

### Related Files

- `kit/skills/meta/product-framing-review/SKILL.md`
- `kit/skills/meta/product-framing-review/metadata.yml`
- `kit/rules/agent-operating-contract.md`
- `kit/skills/meta/plan-with-context/SKILL.md`
- `kit/skills/meta/agent-roles-and-capabilities/SKILL.md`

## Decision: Instruction references separate logical invocation from physical location

### Status

Accepted

### Context

Installable instructions are authored in the foundation-kit source repository under `kit/...`
and installed into downstream projects under `.codex/...`. A physical source path can therefore
be misleading when an instruction means to apply a rule or skill rather than inspect or maintain
that file. Conversely, physical paths remain necessary when location, installation, or source
maintenance is the subject.

### Decision

Classify instruction references by semantic purpose:

- logical invocation uses the rule or skill identifier;
- source maintenance uses the applicable `kit/...` path;
- installed runtime uses the applicable `.codex/...` path; and
- dual-context guidance explicitly labels both source and installed locations.

Do not globally replace or remove physical paths. Determine the semantic role first. In
particular, `.codex/project/project-guideline.md`, `.codex/project/project-decisions.md`, and
`.codex/project/lessons-learned.md` remain valid installed target project-memory paths inside
installable skills.

The existing Publishable Change Handoff decision remains centralized in
`agent-operating-contract`. Consumer skills reference that logical rule and apply it exactly
without duplicating its fixed field list. `update-project-memory` uses the
`Project Memory Curator` role.

### Impact

Source and downstream instructions can express operating dependencies without coupling consumers
to the foundation-kit repository layout, while retaining precise paths wherever physical location
is part of the contract. Shared publish-handoff ownership remains centralized and auditable.

### Related Files

- `kit/rules/agent-operating-contract.md`
- `kit/rules/skill-invocation-and-dependency-boundaries.md`
- `kit/skills/meta/agent-roles-and-capabilities/SKILL.md`
- `kit/skills/meta/writing-great-skills/SKILL.md`
- `kit/skills/meta/update-project-memory/SKILL.md`
- `kit/skills/core/execute-plan/SKILL.md`

## Decision: PR workflow commands use review and merge semantics

### Status

Accepted

### Context

The former `publish:pr-only` command could commit confirmed Git-visible changes, push the
current feature branch, and create or update its pull request. Its name therefore understated its
behavior and blurred the distinction between preparing a PR for review and final publication.
The related merge aliases and CLI modes also used inconsistent word order.

### Decision

Keep `pnpm publish:changes` as the guided publish workflow. Use these explicit PR commands and CLI
modes:

```txt
pnpm pr:review      -> --mode pr-review
pnpm pr:merge       -> --mode pr-merge
pnpm pr:auto-merge  -> --mode pr-merge --auto-merge
```

`pr:review` creates or updates a PR for review and may commit confirmed changes and push the
current feature branch. It does not run code review, merge, release, deploy, refresh the default
branch, or finalize publication. `pr:merge` and `pr:auto-merge` retain the existing guarded merge
behavior and require the applicable review, checks, and authorization.

Remove the legacy source aliases and CLI modes rather than preserving compatibility aliases.
Existing downstream `package.json` aliases remain project-owned and are not deleted by the
installer's safe-add behavior.

This decision supersedes earlier command names and active output contracts only. Historical
decisions remain unchanged as records of the behavior and naming in effect when they were made.

### Impact

Agent and user handoffs now distinguish PR creation for review from guarded post-review merge.
Runtime Git/GitHub mechanics, publish policy, secret scanning, squash behavior, expected-head
validation, auto-merge confirmation, and fast-forward-only refresh remain unchanged.

### Related Files

- `package.json`
- `kit/scripts/publish-changes.mjs`
- `kit/scripts/publish-changes/`
- `scripts/install-foundation-kit/publish-aliases.mjs`
- `kit/rules/agent-operating-contract.md`
- `kit/skills/core/publish-current-branch/SKILL.md`
- `README.md`
- `tests/publish-changes/`
- `tests/install-foundation-kit/`
