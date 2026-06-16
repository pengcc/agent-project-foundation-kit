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
- Theme 17.3: Node publish CLI migration candidate and safety correction
- Theme 17.4: Node publish CLI smoke-test validation and usability stabilization
- Theme 17.5: Node publish default cutover with supported Bash fallback
- Theme 18.1: source-only Node installer candidate with Bash default retained
- Theme 18.2: Node-first automation and legacy Bash workflow archive
- Theme 18.3: explicit Node PR-only publish and PR-number merge modes
- Theme 19: core foundation alignment after Project Memory Context Gate

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

- `docs-first-research` passes the Project Memory Context Gate for project-impacting research and
  may state the gate is not applicable for pure external fact lookup.
- External skills are reference candidates only; patterns require evaluation and rewriting before
  adoption.
- `agent-roles-and-capabilities` owns the Missing Specialist Skill Policy.
- `grill-me` may use Brainstorming Mode only for clarification before routing back to planning or
  architecture workflows.

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
- Active source-only Bash apply-theme tooling under `scripts/`
- Installable Node ESM scripts under `kit/scripts/`
- Source-only historical Bash snapshots under `archive/legacy-bash-workflows/`
- Zip-based theme delivery during development
- `ripgrep` recommended for migration/reference checks
- Git / GitHub for version control
- GitHub CLI expected for PR publishing workflows when available
- Node.js 24+ for the default source-repository publish workflow
- pnpm 10.26.2 for local commands and dependency management
- Vitest for Node publish and installer tests
- `yaml` for source-repository policy loading, with built-in downstream fallback

## 5. Directory Structure

Important directories:

```txt
kit/
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
scripts/apply-theme-zip.sh
scripts/lib/workflow-common.sh
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
pnpm publish:local
pnpm publish:node
pnpm publish:pr-only
pnpm publish:merge-pr
pnpm install:node
pnpm apply-theme
pnpm test
pnpm test:node
pnpm test:install
pnpm test:publish
pnpm check
```

Maintained workflow tooling boundary:

- `kit/scripts/publish-changes.mjs`, invoked by `pnpm publish:local` and `pnpm publish:node`, is
  the maintained publish path.
- `pnpm publish:pr-only` and `pnpm publish:merge-pr` are explicit modes of the same maintained
  Node publish CLI, not separate workflow implementations.
- `scripts/install-foundation-kit.mjs`, invoked by `pnpm install:node`, is the maintained
  installation path.
- `scripts/apply-theme-zip.sh` remains an active Bash source-repository helper and uses
  `scripts/lib/workflow-common.sh`.
- Bash publish and installer implementations under `archive/legacy-bash-workflows/` are
  unsupported historical reference, remain outside `kit/`, and are never installed downstream.

Historical theme and decision entries may describe superseded tooling states. They preserve
chronology and do not override this maintained boundary.

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

- `pnpm publish:local` and `pnpm publish:node` run `kit/scripts/publish-changes.mjs`
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

Current Node publish default behavior:

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
- manual Theme 17.4 smoke testing has mostly validated real `pnpm publish:node` usage and found
  the interaction flow smooth after minor message/UX correction
- manual scope-drift testing passed: changes introduced after scope collection were detected and
  publishing aborted before commit, push, or PR actions
- use Node as the source-repository `pnpm publish:local` default while retaining
  `pnpm publish:node` as an explicit alias
- keep Node publish tests, Node installer tests, active apply-theme shell syntax, and whitespace
  checks in `pnpm check`
- a real post-cutover `pnpm publish:local` run completed successfully using the Node default
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
- map `kit/skills/`, `kit/prompts/`, `kit/rules/`, `kit/config/`,
  `kit/github-settings/`, and `kit/scripts/` to their matching `.codex/` directories
- validate source and target path boundaries before copying
- warn when target files already exist
- never auto-merge existing files
- backup existing files before replacement under `.codex/backups/install-YYYYMMDD-HHMMSS/`
- never install this repo's own `.codex/project/`, `dev_locals/`, `docs/`, or source-repository `scripts/`
- never create or modify a downstream `package.json`

Current Node installer test purpose:

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

Current validation is mostly file/content based:

- Check generated zip contents
- Check line counts before/after apply
- Run `rg` to detect stale references
- Check old directories are removed after rename migration
- Check diff stats before commit
- Verify remote raw GitHub file line counts after push when needed
- Prefer PR review for high-risk or multi-file theme updates
- Run `pnpm check` for shell syntax, installer tests, publish workflow tests, and whitespace validation
- Verify the complete Project Memory Context Gate sequence and status meanings exist only in
  `kit/skills/core/project-memory/SKILL.md`; other entrypoints, rules, and workflow skills contain
  short references only
- Verify the complete Missing Specialist Skill Policy exists only in
  `kit/skills/core/agent-roles-and-capabilities/SKILL.md`
- For Theme 19-style docs-only alignment, confirm no scripts, package commands, installer files,
  dependencies, runtime behavior, tests, or archive files changed

## 10. Development Workflow

The repo is developed theme by theme:

1. Discuss theme decisions.
2. Freeze accepted decisions.
3. Choose the safest update method:
   - single small edit: manual edit or the Node publish workflow
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
- Phase 1 Project Memory Context Gate
    - canonical definition in `kit/skills/core/project-memory/SKILL.md`
    - concise references in entrypoints, the operating contract, and scoped workflows
- Theme 19 core foundation alignment
    - clarified `project-memory` / `update-project-memory` ownership
    - clarified docs-first gate and external-reference boundaries
    - added Missing Specialist Skill Policy to `agent-roles-and-capabilities`
    - added clarification-only Brainstorming Mode to `grill-me`
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
    - `pnpm publish:local` and `pnpm publish:node` use the Node CLI
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
    - `scripts/apply-theme-zip.sh` remains active with source-owned
      `scripts/lib/workflow-common.sh`
    - `pnpm check` validates Node publish, Node installer, active apply-theme syntax, and
      whitespace


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
- `scripts/apply-theme-zip.sh` remains active Bash tooling and owns its source-only helper at
  `scripts/lib/workflow-common.sh`.
- Project-wide file operations must stay inside explicit project boundaries by default; the installer has a controlled exception only for copying from `repo_root/kit/` into an explicit `target_root/`.
- Full-file replacement can be safer than manual multi-location edits, but mature files still require diff and line-count review.
- Project-specific lessons should not be copied into reusable `kit/` templates unless deliberately distilled into generic guidance.
- Project-local validation must not silently mutate global tooling to satisfy runtime requirements.
