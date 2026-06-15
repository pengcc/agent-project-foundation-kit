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

Use a private dependency-free `package.json` for short local commands. Use `publish:local`,
not `publish`, and do not add dependencies or a lockfile.

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

The installer copies the complete `kit/scripts/` tree to `.codex/scripts/`. It does not create or
modify a downstream `package.json`.

The `publish-current-branch` skill owns strategy, role routing, scope, authorization, and final
reporting. Agents prefer the installed script for Git and GitHub mechanics and use the skill's
manual procedure only when the script is unavailable.

This source repository dogfoods the same implementation through thin compatibility wrappers under
`scripts/`, preserving `pnpm publish:local` without maintaining a second publish implementation.

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
tree. The Bash implementation and `pnpm publish:local` remain the active fallback until the
Vitest parity suite, existing Bash publish tests, installer tests, and manual CLI output review
all pass.

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

These results increase confidence in the candidate but do not change the default command.
`pnpm publish:local` remains on the Bash fallback. Replacing that default requires a separate
Theme 17.5 decision that reviews the complete smoke-test record, remaining gaps, downstream
runtime packaging, and rollback expectations.

### Impact

Theme 17.4 can close as smoke-test stabilization without silently turning validation evidence into
cutover approval. The Bash path remains available while Theme 17.5 makes the default-entrypoint
decision explicitly.

## Decision: Theme 17.5 makes Node the source-repository publish default

### Status

Accepted

### Decision

`pnpm publish:local` and the explicit `pnpm publish:node` alias run the Node.js 24+ ESM publish
CLI. `pnpm publish:bash` retains `scripts/publish-local-change.sh` as the supported operational
fallback.

The Bash implementation is not removed. Node Vitest coverage, existing Bash publish tests,
installer tests, remaining shell syntax checks, and whitespace validation stay in `pnpm check`
until Bash is deliberately removed in a later theme.

A real source-repository publish completed successfully through the post-cutover
`pnpm publish:local` Node default. This validates Theme 17.5 for current source-repository use but
does not authorize removing `pnpm publish:bash`. Continue dogfooding the Node default for several
more real updates before reviewing fallback removal as a separate decision.

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
copy, or verification. The installer never creates or modifies downstream `package.json`.

### Impact

The source repository gains a testable migration candidate while preserving the known Bash
rollback path. `pnpm check` covers Node and Bash installer behavior together. Default cutover and
Bash removal remain separate future decisions.

### Validation status

The Node candidate has been exercised manually in a downstream installation scenario. The smoke
test looked good and exposed no blocking issue, so Theme 18.1 is validated enough for continued
Node installer dogfooding.

This evidence does not change the active/default installer. Bash remains active until a separate
Theme 18.2 decision considers a Node-first workflow and an explicit Bash archive plan. If later
dogfooding finds a Node installer defect, prefer correcting the Node implementation rather than
retreating from the candidate without analysis.

## Decision: Theme 18.2 standardizes Node-first automation and archives legacy Bash workflows

### Status

Accepted

### Context

The Node publish CLI is the source-repository default and has been successfully dogfooded. The
Node installer candidate passed automated coverage and a downstream smoke test. Maintaining Bash
publish and installer implementations in parallel now duplicates workflow behavior and validation
without providing the preferred defect-fix path.

The active apply-theme workflow still uses Bash and previously depended on a helper shared with
the legacy publish path.

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

`scripts/apply-theme-zip.sh` remains active Bash tooling. Its required helper is source-owned at
`scripts/lib/workflow-common.sh`, so it does not depend on archived or installable Bash files.

`pnpm check` validates Node publish tests, Node installer tests, active apply-theme shell syntax,
and whitespace.

### Impact

The maintained workflow surface is smaller and fresh downstream installs receive only the Node
publish implementation. Historical Bash behavior remains inspectable without being presented as
an operational fallback. Apply-theme remains unchanged as an explicit active Bash exception.
