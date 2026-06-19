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
- Theme 16: `write-a-skill` (renamed to `writing-great-skills`)
- Theme 16.1: local publish workflow entrypoint and safety hardening
- Theme 16.3: downstream AGENTS template operating contract
- Theme 17: reusable GitHub repository settings package
- Theme 17.1: installable publish workflow scripts
- Theme 17.3: Node publish CLI migration candidate and safety correction
- Theme 17.4: Node publish CLI smoke-test validation and usability stabilization
- Theme 17.5: Node publish default cutover with supported Bash fallback
- Theme 18.1: source-only Node installer candidate with Bash default retained
- Theme 18.2: Node-first automation and legacy Bash workflow archive
- Theme 18.3: explicit Node PR-only publish and PR-number merge modes
- Theme 19: core foundation alignment after Project Memory Context Gate
- Theme 20: plan, execute, and review quality hardening
- Theme 21: read-only codebase audit foundation
- Theme 21.1: supporting skill invocation and skill authoring verification
- Theme 22.0: stage review, inventory, and roadmap refresh
- Theme 22.0.1: dependency invariant and publish handoff clarification
- Theme 22.1: third-party skill adoption safety
- Theme 22.2: kit evolution and reusable lesson promotion loop
- Phase 5: UI Quality Foundation
- Phase 6: Architecture Review Refinement
- Phase 7: Optional Skill Catalog and Specialist Packs
- Consolidation: Archive Bash Apply-Theme Helper
- Release-readiness cleanup and publish secret-safety guard
- Requirement clarification gate and ambiguity handling contract
- AGENTS template and operating contract alignment
- Report depth levels and final report concision contract
- Downstream installation and first-adoption hardening
- Extract Grilling Primitive

Current conceptual skill taxonomy:

Meta:

- `project-memory`
- `docs-first-research`
- `plan-with-context`
- `update-project-memory`
- `initialize-project-context`
- `agent-roles-and-capabilities`
- `writing-great-skills`
- `handoff`
- `grilling`
- `grill-me`

Core:

- `execute-plan`
- `publish-current-branch`
- `project-architecture-plan`
- `code-review`
- `codebase-audit`
- `ui-design-basics`

Optional:

- `react-component-patterns`
- `tanstack-router-query-patterns`

The categories are metadata concepts. Meta and core skills remain physically under
`kit/skills/core/`; directory migration to `kit/skills/meta/` is deferred. Optional skills remain
source-only under `optional-skills/` and are not installed automatically.

Skill metadata declares `invocation: user | model | support`, `required`, and hard `depends_on`
relationships. The canonical taxonomy, dependency, and context-load rules live in
`kit/rules/skill-invocation-and-dependency-boundaries.md`.

Current canonical core rules:

- `agent-operating-contract`
- `docs-first-policy`
- `engineering-quality-principles`
- `skill-invocation-and-dependency-boundaries`

Current project-memory context control:

- `kit/skills/core/project-memory/SKILL.md` is the single canonical definition of the Project
  Memory Context Gate.
- `project-memory` owns durable memory reading/applying; `update-project-memory` owns confirmed
  durable writes.
- Root and downstream AGENTS entrypoints, the operating contract, and project-state workflow
  skills use short references to that definition.
- The gate applies both to downstream installed projects and this source repository's
  `.codex/project/` memory.
- Referenced plans, handoffs, reports, and research notes are checked only when task-relevant and
  only after freshness and source-of-truth verification.

Current foundation alignment boundaries:

- `kit/project-templates/AGENTS.md` remains a short downstream entrypoint. It points agents to
  `.codex/rules/agent-operating-contract.md` for detailed operating rules, including Requirement
  Clarification and concise-output behavior, without duplicating full rule text.
- `agent-operating-contract` owns Report Depth Levels for Brief, Standard, and Detailed reports.
  High-output workflows reference those levels briefly without duplicating the full convention.
  Concise output must still preserve decisions, validation status, risks or blockers when present,
  external/global actions, and the next recommended step.
- `agent-operating-contract` owns the lightweight Requirement Clarification Gate: agents must not
  assume requests are clear, complete, or scope-stable when ambiguity affects scope, safety, files,
  architecture, data, Git/publish, external side effects, irreversible actions, user intent, or
  acceptance criteria.
- Low-risk reversible assumptions may proceed only when explicitly stated. `grill-me` remains the
  deep clarification workflow for broad, branching, decision-heavy, or systematic requirement
  discovery.
- `grilling` owns the shared evidence-first, recommendation-led, one-branch-at-a-time clarification
  discipline. It is support-only; `grill-me` remains the user-facing deep clarification workflow.
  `plan-with-context`, `initialize-project-context`, and `project-architecture-plan` depend on the
  shared primitive without changing their output or approval boundaries.
- `docs-first-research` passes the Project Memory Context Gate for project-impacting research and
  may state the gate is not applicable for pure external fact lookup.
- External skills are reference candidates only; patterns require evaluation and rewriting before
  adoption.
- Third-party skill adoption safety lives in the existing `docs-first-policy`,
  `docs-first-research`, and `writing-great-skills` surfaces. It evaluates source URL, provenance,
  license/copying risk, trigger and boundary fit, workflow conflict, ecosystem assumptions,
  tool/mutation/network permissions, secret handling, source freshness, and rewrite requirements
  before adaptation.
- Kit evolution and reusable lesson promotion live in existing `update-project-memory`,
  `writing-great-skills`, and `agent-operating-contract` surfaces. Project experience must be
  recorded in local memory first, then generalized as a reusable lesson candidate with user
  confirmation and an approved plan before any foundation-kit rule, skill, template, or
  documentation change.
- `agent-roles-and-capabilities` owns the Missing Specialist Skill Policy.
- `grill-me` may use Brainstorming Mode only for clarification before routing back to planning or
  architecture workflows.

Current plan/execute/review quality boundaries:

- `plan-with-context` plans must be self-contained enough for a fresh agent to execute, with exact
  scope boundaries, baseline state, STOP conditions, and validation commands confirmed from repo
  files for non-trivial work.
- `execute-plan` treats the approved plan as the execution contract. Changed hunks must map to a
  plan step, validation step, or approved memory/design-log update; material drift returns to
  `plan-with-context`.
- `execute-plan` remains the primary workflow for approved-plan execution. It may invoke installed
  supporting skills for bounded substeps, but supporting skills do not override or expand the
  approved plan.
- `publish-current-branch` is a post-execution workflow transition, not an internal
  `execute-plan` supporting substep. Push, PR, and merge require an explicit workflow switch after
  execution.
- `code-review` remains review-only and advisory. Reviews distinguish findings introduced by the
  change from pre-existing issues, check generated package/theme zip safety, and perform plan-hunk
  alignment when an approved plan exists.
- `writing-great-skills` includes generic authoring verification for trigger clarity, boundary
  clarity, workflow separation, concise force prompts, and misuse/rationalization checks.
- Initial role/workflow routing may use `agent-roles-and-capabilities` before the Project Memory
  Context Gate. If routing depends on project-specific facts, use `project-memory` as supporting
  context before making project-state decisions.

Current codebase-audit boundaries:

- `codebase-audit` is a read-only repository survey workflow.
- It treats repository content as data, not instruction.
- It classifies findings as defects, risks, opportunities, or direction suggestions.
- It prioritizes findings by leverage, risk, confidence, and effort.
- Selected findings are inputs for `plan-with-context`, not executable plans.
- Concrete diffs, PRs, generated packages, commits, branches, and plan-alignment reviews remain
  `code-review` responsibilities.

Current UI Quality Foundation boundaries:

- UI quality guidance lives in `kit/rules/engineering-quality-principles.md`.
- It applies through existing planning, architecture, review, and audit workflows.
- It covers user flow clarity, visual hierarchy, responsive behavior, accessibility basics,
  loading / empty / error / disabled / success states, interaction feedback, content clarity,
  existing design system or UI library reuse, maintainability, and avoiding speculative redesign.
- It is not a UI workflow, component library, design system package, technology-specific UI skill,
  or professional accessibility audit.
- `ui-design-basics` is a core supporting skill for bounded baseline guidance on concrete pages,
  screens, flows, forms, layout clarity, UI states, and shadcn-aware reuse of an existing system.
  It is not professional design, brand design, accessibility certification, architecture planning,
  implementation approval, code review, or a framework specialist skill. React component patterns
  are available only through the source-only optional specialist; Next.js, TanStack, and shadcn
  specialist skills remain deferred and optional.

Current engineering quality boundaries:

- `engineering-quality-principles` favors focused units, explicit contracts, visible dependency
  direction, and extension points only after demonstrated variation or integration needs.
- Deploy-varying configuration and secrets remain separate from code and use project-approved
  runtime configuration or secret management.
- Security-sensitive behavior stays behind small auditable boundaries and favors secure defaults,
  least privilege, established libraries or patterns, and docs-first verification.
- This guidance does not prescribe plugin architectures, dependency-injection containers,
  mandatory layering, microservices, CQRS, or technology-specific patterns.

Current Architecture Review Refinement boundaries:

- Architecture review lives primarily in `code-review` Plan Alignment Review.
- It reviews structural direction, boundaries, dependency direction, data flow, migration/rollback
  risk, runtime/deployment assumptions, validation strategy, ownership, maintainability, and fit
  with project memory and accepted plans.
- `project-architecture-plan` creates or updates project-level architecture direction.
- `codebase-audit` identifies broad architecture opportunities as read-only audit findings.
- Architecture review is advisory and review-only. It is not a separate skill, architecture rule,
  heavy enterprise process, repo-wide audit, executable plan, or implementation workflow.

Current Optional Skill Catalog boundaries:

- `docs/optional-skill-catalog.md` is source-repository planning documentation for future optional
  specialist skill and specialist pack candidates.
- It defines vocabulary, candidate metadata shape, status values, and workflow routing.
- It is not an installer manifest, package registry, marketplace, generated package workflow, or
  downstream-installed runtime file.
- `optional-skills/` contains source-only optional specialist packages and remains outside the
  default installable `kit/` payload.
- `optional-skills/react-component-patterns/` is an experimental, install-default-never specialist
  for React component and local-state implementation patterns. It requires explicit project
  adoption and a React project signal.
- `optional-skills/tanstack-router-query-patterns/` is an experimental,
  install-default-never specialist for TanStack Router routing/URL state and TanStack Query server
  state. It requires explicit project adoption plus a matching project signal or explicit request.
- Optional pack installation remains future work and requires separate planning and approval.
- React component patterns remain separate from `ui-design-basics`, Next.js, React Server
  Components, TanStack, shadcn/ui, Tailwind, testing, architecture, and data-fetching guidance.
- TanStack Router/Query patterns remain separate from React component/local-state guidance, visual
  design, full frontend architecture, Next.js, React Server Components, TanStack Start and other
  TanStack libraries, backend/API/database/authentication design, and testing strategy.
- External skill references remain reference candidates until evaluated through
  `docs-first-research` and rewritten for this kit through approved `writing-great-skills` and
  `execute-plan` work.

Current roadmap and stage-review status:

- `docs/foundation-kit-skills-review-and-optimization-roadmap.md` is the canonical long-term
  roadmap and planning reference.
- `docs/foundation-kit-stage-review-and-forward-plan-2026-06-16.md` is a dated stage-review
  report and audit input. It informs roadmap refresh work but does not replace the roadmap or
  durable project memory.
- Theme 22.0 refreshed current skill/rule/prompt inventory and next-step guidance before
  Third-Party Skill Adoption Safety or Kit Evolution work.

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
- Archived source-only Bash apply-theme tooling under `archive/legacy-bash-workflows/`
- Installable Node ESM scripts under `kit/scripts/`
- Source-only historical Bash snapshots under `archive/legacy-bash-workflows/`
- Historical zip-based theme delivery during development; future apply-theme behavior should be
  planned as a Node.js workflow before reintroduction
- `ripgrep` recommended for migration/reference checks
- Git / GitHub for version control
- GitHub CLI expected for PR publishing workflows when available
- Node.js 24+ for the default source-repository publish workflow
- pnpm 10.26.2 for local commands and dependency management
- Biome 2.5.0 for source-repository formatting, linting, and organize-imports checks
- Vitest for Node publish and installer tests
- `yaml` for source-repository policy loading, with built-in downstream fallback

## 5. Directory Structure

Important directories:

```txt
kit/
optional-skills/
kit/project-templates/
kit/skills/
kit/prompts/
kit/rules/
kit/config/
kit/github-settings/
kit/scripts/
tests/publish-changes/
tests/install-foundation-kit/
archive/legacy-bash-workflows/
docs/
scripts/
.codex/project/
dev_locals/
```

`kit/` is the installable payload source.

`optional-skills/` is source-only repository content for explicitly adopted specialist skills. It
is not copied by the maintained installer and must not be treated as default-installed capability.

`.codex/project/` is durable project memory for this repository itself and is not part of the installable `kit/` payload.

`dev_locals/` is local-only and contains plans, handoffs, scratch notes, research notes, initialization reports, and theme zip files.

Planning workflows save multi-step plans under `dev_locals/plans/` when writes are available. If
Plan Mode or the active tool environment blocks writes, they must report the blocked write, show
the exact intended path, and provide the plan content or a clear manual/save-later action. Plan
creation defaults to review and never authorizes execution.

Plans, handoffs, reports, research notes, and execution logs under `dev_locals/` are process
artifacts, not durable project truth. Check their date, status, and alignment with `AGENTS.md`,
project memory, current repository files, and current package scripts before using them.

Global toolchain and out-of-project operations follow a separate approval boundary:

- read-only diagnostics may distinguish project-local runtime configuration from machine state
- global tooling, shell profiles, PATH, global Git configuration, and out-of-project files must
  not be mutated without explicit user approval
- runtime mismatches must report detected versus required versions and the failing command
- agents must recommend manual remediation and explain machine-wide risk before requesting
  approval
- every task final report must include an `External / global actions` section

The downstream `AGENTS.md` template defines generic role routing, working style, feature-branch publishing boundaries, final-report classification, and durable project-memory behavior using installed `.codex/` content.

## 6. Scripts and Commands

Current helper scripts:

```txt
scripts/install-foundation-kit.mjs
scripts/install-foundation-kit/
```

Installable workflow scripts:

```txt
kit/scripts/publish-changes.mjs
kit/scripts/publish-changes/
kit/scripts/shared/
kit/config/publish-changes-policy.yml
kit/config/publish-cli-theme.json
```

Short command entrypoints:

```txt
pnpm publish:changes
pnpm publish:pr-only
pnpm publish:merge-pr
pnpm publish:merge-pr:auto
pnpm install:node
pnpm test
pnpm test:node
pnpm test:install
pnpm test:publish
pnpm format
pnpm format:check
pnpm biome:fix
pnpm check
```

Maintained workflow tooling boundary:

- `kit/scripts/publish-changes.mjs`, invoked by `pnpm publish:changes`, is
  the maintained publish path.
- `pnpm publish:pr-only`, `pnpm publish:merge-pr`, and `pnpm publish:merge-pr:auto` are explicit
  entrypoints to modes of the same maintained
  Node publish CLI, not separate workflow implementations.
- `pnpm publish:changes` and `pnpm publish:pr-only` run a lightweight dependency-free
  secret-safety guard against the confirmed publish scope before commit, push, or PR create/update
  side effects.
- The secret-safety guard scans confirmed publish-scope paths and diff content for dangerous
  credential paths and high-confidence secret patterns. It is not a complete secret-scanning
  product and does not validate tokens over the network.
- `pnpm publish:merge-pr` does not perform remote PR diff secret scanning.
- `scripts/install-foundation-kit.mjs`, invoked by `pnpm install:node`, is the maintained
  installation path.
- Skill `metadata.yml` files should remain single YAML metadata documents, with source-repository
  tests covering parse hygiene.
- Installer tree mapping excludes local OS junk files such as `.DS_Store`, `Thumbs.db`,
  `desktop.ini`, and AppleDouble `._*` files from downstream `.codex/` mappings.
- Biome 2.5.0 is source-repository tooling configured by `biome.json`. `pnpm format` writes
  formatting, `pnpm format:check` checks formatting, `pnpm biome:fix` applies safe Biome fixes,
  and `pnpm check` runs `biome check .` before tests and whitespace validation.
- Source-repository Biome checks include installable content under `kit/` before publication or
  installation. The installer does not install Biome, create downstream Biome configuration, or
  modify target `package.json`; downstream Biome adoption remains an optional manual setup task.
- Bash apply-theme tooling is archived under `archive/legacy-bash-workflows/` as source-only
  historical reference.
- Future apply-theme behavior should be planned as a Node.js workflow before being reintroduced.
- Bash publish and installer implementations under `archive/legacy-bash-workflows/` are
  unsupported historical reference, remain outside `kit/`, and are never installed downstream.

Historical theme and decision entries may describe superseded tooling states. They preserve
chronology and do not override this maintained boundary.

Historical theme zip files were normally stored under:

```txt
dev_locals/theme-zips/
```

The archived `apply-theme-zip.sh` script supported configurable environment variables:

```txt
THEME_ZIP_DIR
DEFAULT_BRANCH
THEME_BRANCH_PREFIX
DESTRUCTIVE_DROP_PERCENT
DESTRUCTIVE_DROP_LINES
```

Historical `apply-theme-zip.sh` safety behavior:

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

- `pnpm publish:changes` runs `kit/scripts/publish-changes.mjs`
- `pnpm publish:pr-only` and `pnpm publish:merge-pr` expose explicit modes of the same Node CLI
- Node is the maintained publish workflow; future publish defects should be fixed there first
- legacy Bash publish snapshots are unsupported source-only history under
  `archive/legacy-bash-workflows/`
- archived files remain outside `kit/` and are never installed downstream
- publish local changes through a feature branch + PR workflow
- avoid unnecessary theme zip overhead for one/few-file changes
- classify updates as `SMALL_SAFE`, `NORMAL`, or `SIGNIFICANT`
- display a preliminary scope, select update type, and then confirm the complete publish scope
- use a numbered Small safe / Normal / Significant selection while preserving stable internal codes
- treat `SMALL_SAFE` selection as merge authorization only after scope confirmation
- inspect branch freshness, repository open PRs, current-branch PR state, uncommitted changes, and unpushed commits before prompting
- prompt for a commit message only when uncommitted changes need a commit
- use the latest commit subject as the PR title when publishing existing unpushed commits
- show recommended update type, commit message, and PR title while allowing overrides
- list repository-level open PRs and require acknowledgement without blocking solely because they exist
- update an existing current-branch PR instead of creating a duplicate
- use `publish:pr-only` for non-interactive create/update PR publishing from an existing feature
  branch without classification, validation, completion, merge, or default-branch refresh
- preserve an existing PR title in PR-only mode unless an explicit second title argument is given
- use `publish:merge-pr <pr-number>` for explicit squash merge with clean-worktree, base-branch,
  mergeability, required-check, and head-OID verification
- use `publish:merge-pr:auto <pr-number>` only for explicit PR-level auto-merge authorization;
  passed checks retain immediate merge, while pending checks request GitHub auto-merge with squash
  and expected-head protection
- after an auto-merge request, read the PR once; refresh only if already verified merged, otherwise
  report the open waiting PR and leave the local branch unchanged
- treat repository-level Allow auto-merge as permission for the feature, not per-PR enablement
- treat `--yes` in merge-PR mode as confirmation bypass only, never as safety or branch-protection
  bypass
- refresh after explicit PR merge only after verified remote merge and with fast-forward-only
  behavior; never hard-reset in merge-PR mode
- show final staged scope for uncommitted changes and commit/diff scope for unpushed commits
- recover clean current-branch PRs that merged after a polling timeout and refresh only after verifying `mergedAt` and the default-branch base
- skip the validation prompt for `SMALL_SAFE` and record its scope-confirmed authorization statement
- use structured validation codes for `NORMAL` and `SIGNIFICANT`, with `NOT_RUN` allowed only for `NORMAL`
- distinguish no required checks, pending checks, failing checks, and GitHub CLI errors before merge
- retry GitHub's transient `UNKNOWN` merge-readiness state for a bounded interval before blocking
- automatically enable squash auto-merge for `SMALL_SAFE`, verify the remote merge, and refresh local `main`
- skip the PR completion mode and manual-review token for `SMALL_SAFE` because its post-scope classification is explicit authorization
- offer PR-only, squash auto-merge, or immediate squash merge modes for `NORMAL` and `SIGNIFICANT`
- require typed manual-review approval before scripted merge modes for `NORMAL` and `SIGNIFICANT`
- never push directly to the default branch
- exit after enabling auto-merge without polling for `NORMAL` and `SIGNIFICANT`
- refresh the default branch only after a verified merge; require explicit refresh approval outside the `SMALL_SAFE` automatic path
- create a backup branch and require `RESET_MAIN_TO_ORIGIN` before hard-reset recovery


- require Node.js 24+
- keep reusable command, Git, GitHub, error, and output modules under `kit/scripts/shared/`
- keep publish-only orchestration, prompts, policy, state, actions, and validation modules under
  `kit/scripts/publish-changes/`
- show a concise preliminary scope before classification and keep full diff output opt-in
- select update type before final scope confirmation
- fingerprint tracked and untracked worktree state and abort if it changes before staging
- stage only the observed path set, show the exact upstream-relative publish scope including prior
  unpushed commits, and freeze the index tree through commit
- reject YAML policies that remove immutable Normal or Significant validation/review gates
- verify stale default-branch state and require confirmation before continuing
- refresh the default branch only after verified merge state, independent of classification
- manual Theme 17.4 smoke testing validated real Node publish CLI usage through the then-current
  `pnpm publish:node` alias and found the interaction flow smooth after minor message/UX correction
- manual scope-drift testing passed: changes introduced after scope collection were detected and
  publishing aborted before commit, push, or PR actions
- use `pnpm publish:changes` as the canonical source-repository publish command
- keep Biome checks, Node publish tests, Node installer tests, and whitespace checks in `pnpm check`
- a real post-cutover publish run completed successfully through the then-current
  `pnpm publish:local` alias before the source publish command was consolidated to
  `publish:changes`
- consider Theme 17.5 post-cutover validated for source-repository usage
- load publish output styles from `kit/config/publish-cli-theme.json` in the source repository and
  `.codex/config/publish-cli-theme.json` after installation
- accept only ANSI color strings or three-integer RGB arrays plus `fullLine` in theme level styles
- render every `[LEVEL]` label bold as a fixed rule; label bold is not theme-configurable
- warn and use matching built-in defaults when the theme config is missing or invalid
- keep the complete color table in the JSON source of truth rather than duplicating it in docs
- dispatch explicit PR-only and merge-PR modes without loading the classification policy used by
  the default publish flow
- keep PR-only deterministic and non-interactive except for a missing required commit message
- report PR-only results as created, updated, or unchanged with the PR files URL
- report merge-PR partial success when GitHub merged the PR but local default-branch refresh cannot
  fast-forward

Current Node publish test purpose:

- run deterministic local validation for publish workflow behavior
- use project-local fixtures with fake `git` and `gh` commands
- avoid real pushes, PR creation, merges, and network access
- cover scope-confirmation ordering, numbered classification, recommendations, repository/current-branch PR handling, late-merge recovery, required-check states, GitHub CLI errors, merge modes, and verified post-merge refresh
- cover PR-only default-branch blocking, title preservation, duplicate prevention, observed-path
  staging, drift protection, and created/updated/unchanged reporting
- cover explicit PR-number validation, clean-worktree enforcement, required checks, head changes,
  confirmation-only `--yes`, verified merge, and fast-forward-only refresh

Current `install-foundation-kit.mjs` purpose:

- install the reusable `kit/` payload into new or existing downstream projects
- use a controlled source-to-target boundary exception
- read only from the current foundation-kit repo's `kit/`
- write only inside the explicit target project root
- require explicit `--target`
- require the target directory to already exist
- block target equal to the foundation-kit repo root
- default to dry-run
- require `--apply` before writing files
- default `--project-mode` to `auto`, resolving project signals or conflicts to existing-like
  caution and empty conflict-free targets to new-like behavior
- support explicit `new` and `existing` modes without changing file mappings
- block existing-like conflict apply before staging unless `--overwrite-conflicts` is supplied
- keep conflict display, strong warning, typed confirmation, verified backup, plan revalidation,
  and overwrite mandatory after explicit overwrite authorization
- map `kit/project-templates/AGENTS.md` to target root `AGENTS.md`
- map project templates to `.codex/project/`
- map `kit/skills/`, `kit/prompts/`, `kit/rules/`, `kit/config/`,
  `kit/github-settings/`, and `kit/scripts/` to their matching `.codex/` directories
- validate source and target path boundaries before copying
- warn when target files already exist
- never auto-merge existing files
- backup existing files before replacement under `.codex/backups/install-YYYYMMDD-HHMMSS/`
- never install this repo's own `.codex/project/`, `dev_locals/`, `docs/`, or source-repository `scripts/`
- never create or modify a downstream `package.json`
- report first-adoption next steps and direct successful installs to
  `.codex/prompts/force-initialize-project-context.md`

Current Node installer test purpose:

- run local validation for installer behavior
- keep test artifacts under `dev_locals/test-runs/install-foundation-kit/`
- verify explicit target requirement, project-mode parsing/resolution, project-signal detection,
  dry-run, fresh install, complete mapping correctness, existing-like pre-staging conflict blocking,
  explicit overwrite safeguards, no silent overwrite, backup-before-replace, missing-source
  blocking, missing-target blocking, target==repo-root blocking, and target boundary escape blocking

Current `kit/github-settings/` purpose:

- provide a reusable default-branch ruleset JSON for GitHub UI or REST API import
- provide a minimal General settings REST payload enabling squash merge and auto-merge
- provide a checklist for UI/API application, verification, optional hardening, and rollback
- install into downstream projects under `.codex/github-settings/`
- remain copied-only artifacts; the installer does not apply repository settings

Current `kit/scripts/` purpose:

- provide installable mechanical workflow executors for downstream projects
- install under `.codex/scripts/`
- run from the downstream project root; package aliases remain optional manual setup
- provide a Node.js 24+ ESM publish default with modular Git, GitHub, output, prompt, policy,
  state, action, and final-report boundaries
- install publish policy under `.codex/config/`
- install publish CLI theme config under `.codex/config/`
- fall back to built-in conservative policy when downstream YAML support is unavailable
- fall back to built-in canonical output styles when publish theme config is missing or invalid
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
PUBLISH_READINESS_POLL_ATTEMPTS
PUBLISH_READINESS_POLL_INTERVAL_MS
PUBLISH_MERGE_POLL_ATTEMPTS
PUBLISH_MERGE_POLL_INTERVAL_MS
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


- Check generated zip contents
- Check line counts before/after apply
- Run `rg` to detect stale references
- Check old directories are removed after rename migration
- Check diff stats before commit
- Verify remote raw GitHub file line counts after push when needed
- Prefer PR review for high-risk or multi-file theme updates
- Run `pnpm check` for Biome checks, publish workflow tests, installer tests, and whitespace
  validation
- Verify the complete Project Memory Context Gate sequence and status meanings exist only in
  `kit/skills/core/project-memory/SKILL.md`; other entrypoints, rules, and workflow skills contain
  short references only
- Verify the complete Missing Specialist Skill Policy exists only in
  `kit/skills/core/agent-roles-and-capabilities/SKILL.md`
- For Theme 19-style docs-only alignment, confirm no scripts, package commands, installer files,
  dependencies, runtime behavior, tests, or archive files changed
- For Theme 20-style plan/execute/review hardening, confirm no new workflows, prompts, metadata,
  rules, scripts, package commands, installer files, dependencies, runtime behavior, tests, or
  archive files changed
- For Theme 21-style codebase-audit foundation, confirm the new workflow is read-only, routing
  references stay short, selected findings route to `plan-with-context`, concrete change reviews
  remain `code-review`, and no scripts, package commands, installer files, dependencies, tests,
  archive files, or runtime behavior changed
- For Theme 21.1-style supporting-skill hardening, confirm `execute-plan` remains the primary
  workflow, supporting skills stay bounded, `writing-great-skills` verification remains generic and not
  external-tool-specific, and no scripts, package commands, installer files, dependencies, tests,
  archive files, or runtime behavior changed

## 10. Development Workflow

The repo is developed theme by theme:

1. Discuss theme decisions.
2. Freeze accepted decisions.
3. Choose the safest update method:
   - single small edit: manual edit or the Node publish workflow
   - multiple coordinated edits in one file: full-file replacement
   - multiple coordinated files: full-file replacement bundle or a separately planned workflow
   - mature files: verify line counts and diff before commit
4. Generate the selected artifact when needed.
5. Keep generated local artifacts under `dev_locals/`.
6. Plan any future apply-theme behavior as a Node.js workflow before reintroducing it.
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
- Extract Grilling Primitive
    - added `kit/skills/core/grilling` as a meta/support skill
    - reclassified `grill-me` as a meta/user wrapper over `grilling`
    - added explicit `grilling` dependencies to planning, initialization, and architecture planning
    - preserved physical paths, installer mappings, output formats, and workflow boundaries
- Theme 15 `handoff`
    - `kit/skills/core/handoff`
    - `kit/prompts/force-handoff.md`
- Theme 16 skill authoring workflow, now `writing-great-skills`
    - `kit/skills/core/writing-great-skills`
    - `kit/prompts/force-writing-great-skills.md`
- Phase 1 Project Memory Context Gate
    - canonical definition in `kit/skills/core/project-memory/SKILL.md`
    - concise references in entrypoints, the operating contract, and scoped workflows
- Theme 19 core foundation alignment
    - clarified `project-memory` / `update-project-memory` ownership
    - clarified docs-first gate and external-reference boundaries
    - added Missing Specialist Skill Policy to `agent-roles-and-capabilities`
    - added clarification-only Brainstorming Mode to `grill-me`
- Theme 20 plan, execute, and review quality hardening
    - strengthened self-contained plan requirements in `plan-with-context`
    - strengthened approved-plan contract handling in `execute-plan`
    - strengthened generated package safety, finding provenance, and plan-hunk alignment in
      `code-review`
- Theme 21 codebase audit foundation
    - added read-only `codebase-audit`
    - added `force-codebase-audit`
    - added short routing references in the operating contract and role routing
    - kept selected findings routed to `plan-with-context`
- Theme 21.1 supporting skill invocation and skill authoring verification
    - clarified bounded supporting skill activation during `execute-plan`
    - added the Supporting Skill Invocation concept to role routing
    - strengthened generic `writing-great-skills` authoring verification
- Theme 22.0 stage review, inventory, and roadmap refresh
    - refreshed long-term roadmap current-state inventory and next-step guidance
    - corrected current canonical rule inventory in project memory
    - preserved the stage review report as a dated input, not a roadmap replacement
- Theme 22.0.1 dependency invariant and publish handoff clarification
    - clarified that `publish-current-branch` is a post-execution workflow transition
    - recorded bootstrap-safe role-routing invariants
- Theme 22.1 third-party skill adoption safety
    - added lightweight external-skill evaluation boundaries to existing surfaces
    - kept external skills as reference candidates until evaluated and rewritten
- Theme 22.2 kit evolution and reusable lesson promotion loop
    - kept project experience promotion behind local memory, generalization, user confirmation,
      approved planning, and execution
- Phase 5 UI Quality Foundation
    - added lightweight UI quality guidance through existing engineering-quality and workflow
      surfaces
- Phase 6 Architecture Review Refinement
    - refined architecture review through existing review, architecture planning, and audit
      surfaces
- Phase 7 Optional Skill Catalog and Specialist Packs
    - added `docs/optional-skill-catalog.md` as source-repository planning documentation
    - defined optional candidate metadata, status, and workflow routing without adding packs or
      installer behavior
- React Component Patterns optional specialist
    - added `optional-skills/react-component-patterns/` as source-only, experimental guidance
    - kept default installation, installer behavior, force prompts, and adjacent frontend
      specialist concerns out of scope
- TanStack Router and Query Patterns optional specialist
    - added `optional-skills/tanstack-router-query-patterns/` as source-only, experimental guidance
    - kept default installation, installer behavior, force prompts, other TanStack libraries, and
      adjacent React/UI/architecture/backend concerns out of scope
- Consolidation archive Bash apply-theme helper
    - archived `scripts/apply-theme-zip.sh` and `scripts/lib/workflow-common.sh` under
      `archive/legacy-bash-workflows/`
    - consolidated the source-repository publish command to `pnpm publish:changes`
    - removed active apply-theme package command and Bash syntax validation from `pnpm check`
- Release-readiness cleanup and publish secret-safety guard
    - fixed source skill metadata parse hygiene
    - excluded local OS junk files from installable tree mappings
    - added lightweight confirmed-scope secret-safety checks to `publish:changes` and
      `publish:pr-only`
- Requirement clarification gate and ambiguity handling contract
    - added a lightweight global ambiguity rule to `agent-operating-contract`
    - kept `grill-me` as the deep clarification workflow, not the default for tiny assumptions
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
- Theme 17.3 Node publish CLI migration candidate
    - Node.js 24+ ESM entrypoint and modular publish/shared boundaries
    - YAML policy with conservative built-in downstream fallback
    - Vitest publish safety coverage
    - installer mapping to `.codex/config/` and complete Node script paths
    - exact upstream-relative publish-scope confirmation and immutable policy safety gates
    - Bash remained the primary fallback pending manual Node 24/GitHub smoke review
- Theme 17.4 Node publish CLI smoke-test stabilization
    - representative real publish paths and deliberate scope-drift protection validated manually
- Theme 17.5 Node publish default cutover
    - the then-current `pnpm publish:local` and `pnpm publish:node` aliases used the Node CLI before
      later consolidation to `pnpm publish:changes`
    - `pnpm publish:bash` retains the supported Bash fallback
    - `pnpm check` validates both implementations, installer behavior, shell syntax, and whitespace
    - post-cutover source-repository dogfood publish completed successfully
    - Bash removal remains deferred pending several more real Node-default updates
- Theme 18.1 Node installer candidate
    - source-only Node.js 24+ ESM entrypoint under `scripts/`
    - installer-specific modules remain under `scripts/install-foundation-kit/`
    - `install:node` candidate and `install:bash` active fallback aliases
    - aggregate Node Vitest and Bash installer validation through `test:install`
    - dry-run default and exact-token conflict authorization
    - replacement staging, backup snapshots, and complete plan revalidation before downstream writes
    - backup manifests with verified hashes and partial-progress status
    - manual downstream installation smoke testing completed with no blocking issues observed
    - candidate is validated for continued dogfooding
    - Bash remains active/default; Node-first workflow and Bash archive planning require a
      separate Theme 18.2 decision
- Theme 18.2 Node-first automation and Bash archive
    - Node publish and installer paths are the maintained workflows
    - active Bash publish/installer aliases, tests, and installable payload files are removed
    - historical Bash snapshots are retained under `archive/legacy-bash-workflows/`
    - existing downstream Bash files are not automatically deleted
    - Bash apply-theme was later archived under `archive/legacy-bash-workflows/`
    - `pnpm check` now validates Node publish, Node installer, and whitespace


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
- `install-foundation-kit.mjs` is maintained source-repository tooling for fresh or early-stage
  downstream installation. It may reuse source helpers from `kit/scripts/shared/`, but neither
  the entrypoint nor installer-specific modules are copied downstream.
- The Node installer must not write downstream until apply authorization, replacement staging,
  backup snapshot preparation, and complete plan revalidation have succeeded.
- Legacy Bash publish and installer snapshots are unsupported source-only history under
  `archive/legacy-bash-workflows/`; archive content must never enter downstream mappings.
- Older downstream projects may retain previously installed Bash files. The Node installer does
  not remove those files automatically.
- Bash apply-theme helper snapshots are unsupported source-only history under
  `archive/legacy-bash-workflows/`; future apply-theme behavior should be planned as a Node.js
  workflow before being reintroduced.
- Project-wide file operations must stay inside explicit project boundaries by default; the installer has a controlled exception only for copying from `repo_root/kit/` into an explicit `target_root/`.
- Full-file replacement can be safer than manual multi-location edits, but mature files still require diff and line-count review.
- Project-specific lessons should not be copied into reusable `kit/` templates unless deliberately distilled into generic guidance.
- Project-local validation must not silently mutate global tooling to satisfy runtime requirements.
