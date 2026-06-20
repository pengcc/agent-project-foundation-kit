# Foundation Design Log

## Project Name

agent-project-foundation-kit

## Purpose

Create a reusable foundation kit for initializing new software projects with agent-ready skills, rules, prompts, and project context templates.

The kit should support a minimal usable starter workflow first, while leaving room for future expansion.

The project must keep a clear boundary between:

```txt
kit/
```

Reusable installable payload for downstream projects.

```txt
.codex/project/
```

This repository's own development memory.

## v0.1 Core Scope

Completed core skills:

1. project-memory
2. docs-first-research
3. plan-with-context
4. execute-plan
5. update-project-memory
6. publish-current-branch
7. initialize-project-context
8. agent-roles-and-capabilities
9. project-architecture-plan
10. code-review

Completed core rules:

1. engineering-quality-principles


Planned productivity skills:

1. grill-me
2. handoff
3. write-a-skill

Future / optional:

- technology-specific skills
- release workflow
- deployment workflow
- teach
- caveman

## Theme 1: Project Guideline Foundation

Theme 1 created the original project guideline foundation.

Later Theme 5 renamed the skills but kept the memory files.

Accepted decisions:

1. `AGENTS.md` is the short, stable agent entry point.
2. `AGENTS.md` must not contain project-specific technology stack rules.
3. Project-specific facts belong in `.codex/project/project-guideline.md`.
4. `project-guideline.md` is the current project source of truth.
5. Plans are process documents and are not continuously maintained after execution.
6. Old plans must not be treated as current project facts.
7. `project-guideline.md` should use fixed sections.
8. Agents should update existing sections before adding new ones.
9. `project-decisions.md` should use a lightweight ADR-style format.
10. `lessons-learned.md` should record reusable lessons, not one-off scratch notes.
11. The original update skill must output an update summary before changing project memory files.
12. The update summary must mention files to update, reason, major changes, impact, decisions to record, and lessons learned.

Resulting files:

```txt
kit/project-templates/AGENTS.md
kit/project-templates/project-guideline.md
kit/project-templates/project-decisions.md
kit/project-templates/lessons-learned.md
kit/skills/core/project-guideline/SKILL.md
kit/skills/core/project-guideline/metadata.yml
kit/skills/core/update-project-guideline/SKILL.md
kit/skills/core/update-project-guideline/metadata.yml
```

## Theme 2: Docs-First Research

Accepted decisions:

1. `docs-first-research` triggers for technical judgment, versions, APIs, dependencies, configuration, deployment, testing, external services, debugging, and best practices.
2. Official documentation and project files are primary sources.
3. Model memory must not override official documentation or project reality.
4. Degraded mode can continue for low-impact local documentation work, but high-impact technical decisions require confirmation.
5. `docs-first-research` does not directly update project memory.
6. Durable findings should suggest `update-project-memory`.

Resulting files:

```txt
kit/skills/core/docs-first-research/SKILL.md
kit/skills/core/docs-first-research/metadata.yml
kit/rules/docs-first-policy.md
```

## Theme 3: Plan With Context

Accepted decisions:

1. `plan-with-context` is planning-only.
2. It must apply `project-memory` first.
3. Technical plans require `docs-first-research`.
4. Skill declarations must be truthful.
5. Executable plans default to `dev_locals/plans/YYYY-MM-DD-topic.md`.
6. Saved plans use fixed sections.
7. Requirements unclear after checking available project/docs/code/config/tests/official docs require `grill-me`.
8. Plans must include a recommendation.
9. Plans wait for user approval before execution.
10. `force-plan-with-context.md` exists as a workflow trigger prompt.

Resulting files:

```txt
kit/skills/core/plan-with-context/SKILL.md
kit/skills/core/plan-with-context/metadata.yml
kit/prompts/force-plan-with-context.md
```

## Theme 4: Execute Plan

Accepted decisions:

1. `execute-plan` only executes approved plans.
2. Generic Codex execution does not replace `execute-plan`.
3. Default input is a plan file path under `dev_locals/plans/`.
4. Execution is stepwise with validation.
5. Unverified technical assumptions trigger `docs-first-research`.
6. Execution modes are `strict` and `autonomous-within-plan`.
7. It must not silently update project memory.
8. It classifies project memory update targets.
9. It may create local commits only when included in the approved plan or explicitly requested.
10. It must not push, create PR, merge, release, or deploy.
11. Publishing must use `publish-current-branch`.
12. Execution ends or pauses with a fixed Execution Summary.
13. `force-execute-plan.md` exists as a workflow trigger prompt.

Resulting files:

```txt
kit/skills/core/execute-plan/SKILL.md
kit/skills/core/execute-plan/metadata.yml
kit/prompts/force-execute-plan.md
```

## Theme 5: Project Memory Rename Migration

Accepted decisions:

1. Rename `project-guideline` skill to `project-memory`.
2. Rename `update-project-guideline` skill to `update-project-memory`.
3. Do not rename memory files in v0.1.
4. Do not perform blind global string replacement.
5. Do not keep legacy alias skills in v0.1.

Resulting files / changes:

```txt
kit/skills/core/project-memory/
kit/skills/core/update-project-memory/
```

Old skill directories were removed after applying the migration.

## Theme 6: Foundation Kit Self Project Memory

Accepted decisions:

1. `agent-project-foundation-kit` needs its own project memory.
2. This repo's own durable project memory lives under `.codex/project/`.
3. It records foundation-kit development facts, decisions, and lessons.
4. It is not part of the installable `kit` payload.
5. `.codex/project/` should be committed for this repo.
6. `dev_locals/` remains local-only and must not be committed.
7. Theme 6 does not create or commit `.codex/skills/` to avoid duplicating `kit/skills/`.

Resulting files:

```txt
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

## Theme 7: Publish Current Branch

Accepted decisions:

1. `publish-current-branch` publishes the current completed and validated branch into the GitHub workflow.
2. It can push the current branch, create/update PR, and prepare merge or auto-merge when supported and authorized.
3. It does not implement features, execute plans, release, or deploy.
4. It supports short trigger commands.
5. It performs lightweight runtime preflight checks.
6. If the current branch is `main` or `master`, it pauses by default.
7. If the working tree is dirty or there is no local commit, it pauses.
8. Auto-merge requires explicit authorization or known project convention, and known repo support.
9. Repo-level GitHub settings readiness belongs to `initialize-project-context` / setup check, not every publish run.
10. It does not immediately merge by default.
11. It must not bypass branch protection, rulesets, checks, or reviews.
12. It ends or pauses with a fixed Publish Summary.

Resulting files:

```txt
kit/skills/core/publish-current-branch/SKILL.md
kit/skills/core/publish-current-branch/metadata.yml
kit/prompts/force-publish-current-branch.md
docs/foundation-design-log.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
```

## Theme 8: Initialize Project Context

Accepted decisions:

1. `initialize-project-context` is the foundation-kit installation / first project adoption workflow.
2. It runs before formal feature planning.
3. It combines product descriptions, project development plans, README, docs, configuration, code, tests, Git/GitHub state, and existing project memory.
4. It compares product/plan documents against repo reality.
5. It must identify product goals, current implementation state, tech stack, key versions, scripts, validation, deployment, GitHub readiness, missing information, and manual setup tasks.
6. It does not implement features, execute plans, refactor code, modify GitHub settings, release, or deploy.
7. Durable memory updates must be performed through `update-project-memory`.
8. Its report must distinguish:
   - Product / Plan says
   - Repo currently shows
   - Gap / Risk
   - Question for user
   - Recommended project memory update
9. It must output a fixed Project Initialization Report.
10. The report includes Project Identity, Product / Plan Summary, Repo Reality Check, Tech Stack and Version Check, Scripts and Validation Check, Environment and Secrets Check, Git and GitHub Readiness, Deployment Readiness, Capability Areas Detected, Gaps/Risks/Open Questions, Manual Setup Tasks, Recommended Project Memory Updates, and Recommended Next Workflow.
11. If `agent-roles-and-capabilities` exists, it may be used for Agent Role Profile Suggestions.
12. If that skill does not exist, role suggestions must be provisional and only capability areas are detected.
13. Full role taxonomy, capability boundaries, and task-to-role routing belong to later `agent-roles-and-capabilities`.
14. Full reports default to `dev_locals/research-notes/YYYY-MM-DD-project-initialization-report.md`.
15. Initialization reports are local-only analysis artifacts, not long-term source of truth.
16. Missing information must be classified as Blocking before project memory update, Needed before first feature planning, or Nice to clarify later.
17. It must ask high-priority blocking questions first, one tight group at a time, with a recommendation or direction.
18. It must not silently write project memory.
19. It outputs recommended project memory updates grouped by `project-guideline.md`, `project-decisions.md`, and `lessons-learned.md`.
20. It uses `docs-first-research` for external technical facts, version recommendations, compatibility, deployment/GitHub Actions behavior, security/auth/database choices, or external constraints that may be written into project memory.
21. It does not need `docs-first-research` for reading repo-internal facts.
22. `force-initialize-project-context.md` exists as a workflow trigger prompt.

Resulting files:

```txt
kit/skills/core/initialize-project-context/SKILL.md
kit/skills/core/initialize-project-context/metadata.yml
kit/prompts/force-initialize-project-context.md
docs/foundation-design-log.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
```

## Theme 9: Agent Roles and Capabilities

Accepted decisions:

1. `agent-roles-and-capabilities` is an independent core skill for roles, capability boundaries, maturity expectations, and task-to-role routing.
2. It does not directly execute feature implementation and does not replace planning, execution, review, research, or publishing workflows.
3. Role titles do not default to `Senior`, but roles define expected maturity and apply senior-level engineering judgment for architecture, planning, review, security, data model, integration, deployment strategy, cross-system decisions, and high-risk implementation.
4. Small bounded tasks remain pragmatic and should avoid overengineering.
5. Specific technology experts such as Next.js, Vue, TanStack, NestJS, TypeScript, databases/ORMs, and integrations remain future technology-specific skills.
6. If technology-specific skills are not installed, generic roles must rely on repo facts and `docs-first-research` for framework/API/version/config claims.
7. Final generic role categories:
   - Product / Context / Planning
   - Architecture / System Design
   - Frontend / Web Platform
   - Backend / API / Integration
   - Data / Persistence
   - Quality / Review / Testing
   - Security / Performance / Accessibility
   - Tooling / Build / DevOps / Delivery
   - Documentation / Memory / Handoff
8. `Project Architect` is the core role for project architecture and feature roadmap / feature plan after initialization.
9. A future `project-architecture-plan` workflow should implement overall architecture and roadmap planning.
10. Until then, `plan-with-context` may be used as a high-level architecture plan fallback, but it must be marked as not a normal implementation plan.
11. `engineering-quality-principles` is added as a core rule under `kit/rules/`.
12. Existing workflow skills are lightly patched with a short Role Routing Integration section.
13. Existing mature skill content must be preserved; large deletions require explicit review.

Resulting files:

```txt
kit/skills/core/agent-roles-and-capabilities/SKILL.md
kit/skills/core/agent-roles-and-capabilities/metadata.yml
kit/rules/engineering-quality-principles.md
kit/skills/core/initialize-project-context/SKILL.md
kit/skills/core/plan-with-context/SKILL.md
kit/skills/core/execute-plan/SKILL.md
kit/skills/core/docs-first-research/SKILL.md
kit/skills/core/update-project-memory/SKILL.md
kit/skills/core/publish-current-branch/SKILL.md
docs/foundation-design-log.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
```

## Theme 9.1: Project Memory and Roadmap Alignment Cleanup

Accepted decisions:

1. Pause new theme work after Theme 9 to review repo status, project goal alignment, current progress, and next priorities.
2. Clean project memory and design log before starting the next feature/theme.
3. Do not add new installable `kit/` content in this cleanup theme.
4. Keep foundation-kit-specific lessons in `.codex/project/lessons-learned.md` first.
5. Do not prematurely copy development lessons into `kit/project-templates/lessons-learned.md`.
6. Generic reusable rules may be distilled into `kit/` later as a deliberate theme.
7. For multi-location documentation updates, full-file replacement plus diff review is safer than manual partial editing.

Resulting files:

```txt
.codex/project/project-guideline.md
.codex/project/lessons-learned.md
docs/foundation-design-log.md
```

## Lessons-Learned Extraction Completion

PR #81 completed the deliberate extraction of generic change-safety guidance from source project
memory into `kit/rules/engineering-quality-principles.md` section `Change Safety and Evidence`.

Distilled principles:

- prefer the simplest safe path;
- preserve mature files unless full replacement is explicitly justified;
- treat large deletions, line-count drops, and stub replacements as destructive-risk signals;
- search repository-wide before and after rename/migration work;
- choose update methods by review safety;
- verify remote/external facts through authoritative evidence;
- treat manual confirmation as intent, not external fact;
- place confirmations at safety boundaries.

Repository-specific history remains in `.codex/project/lessons-learned.md`; the downstream
`kit/project-templates/lessons-learned.md` remains blank. Future generic lessons require deliberate
distillation into reusable rules, skills, or documentation rather than automatic copying.

## Theme 10: Project Architecture Plan

Accepted decisions:

1. `project-architecture-plan` is a core Project Lifecycle Skill.
2. It runs after `initialize-project-context` and before feature-level `plan-with-context`.
3. It may also run during major project pivots, architecture resets, or new major product phases.
4. It is planning-only and does not implement code, modify source files, commit, push, release, deploy, merge PRs, or directly update project memory.
5. It creates project-level architecture and roadmap plans only.
6. It does not output concrete feature implementation steps; those remain the responsibility of `plan-with-context`.
7. A formal architecture plan requires a product/project blueprint.
8. If no product/project blueprint exists, it must pause with a Missing Product Blueprint Notice and minimum blueprint template.
9. If the user explicitly confirms continuing without a complete blueprint, it may produce only a provisional architecture draft.
10. `initialize-project-context` reports are recommended and must be read when available or provided, but are not absolutely required if project memory, blueprint, and repo reality are sufficient.
11. Repo reality checks are required. New/empty repos may produce target architecture; existing repos must distinguish current architecture, target architecture, and gap/migration path.
12. Technology choices require `docs-first-research` when they involve technical facts, versions, APIs, deployment limits, database/ORM compatibility, external services, security, or long-term maintenance risk.
13. Multiple technology options must be compared with relevant dimensions selected from product, repo, MVP, constraints, and risk profile.
14. Feature roadmap must be phase-level and dependency-oriented, not ticket-level.
15. Output should include text architecture diagrams or Mermaid diagrams when useful.
16. Architecture decisions must be categorized as Accepted, Proposed, or Deferred.
17. Risks and open questions must be grouped as Blocking, High, Medium, or Low.
18. Every plan must declare Plan Status: Final / Ready for Feature Planning or Provisional / Incomplete.
19. Plans default to `dev_locals/plans/YYYY-MM-DD-project-architecture-plan.md`.
20. The skill outputs Recommended Project Memory Updates but does not write memory directly.
21. `force-project-architecture-plan.md` exists as a workflow trigger prompt.
22. Metadata follows current core skill style; lifecycle/frequency details live in `SKILL.md`, not a new metadata schema.
23. Existing mature skills are preserved. Theme 10 only lightly updates `agent-roles-and-capabilities`.

Resulting files:

```txt
kit/skills/core/project-architecture-plan/SKILL.md
kit/skills/core/project-architecture-plan/metadata.yml
kit/prompts/force-project-architecture-plan.md
kit/skills/core/agent-roles-and-capabilities/SKILL.md
docs/foundation-design-log.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
```

## Theme 11: Code Review

Accepted decisions:

1. `code-review` is a core Review Workflow Skill, not only a PR review skill.
2. It has two review modes:
   - Change Review
   - Plan Alignment Review
3. Change Review reviews concrete change targets.
4. PR diff is the primary Change Review target.
5. Secondary Change Review targets are current local diff, generated theme zip / package before applying, specific commit, and branch diff.
6. Plan Alignment Review is independent from normal diff review and requires architecture, engineering direction, and planning-level judgment.
7. Plan Alignment Review requires an explicit baseline; without one, it may only output a Provisional Alignment Review.
8. Important review reports are saved as local-only artifacts under `dev_locals/research-notes/YYYY-MM-DD-code-review-<topic>.md`.
9. Full review reports are not committed by default.
10. Only distilled and user-confirmed facts, decisions, or lessons may be promoted into `.codex/project/` through `update-project-memory`.
11. `code-review` must not output a full executable fix plan by default.
12. It may output issue-specific Fix Recommendations.
13. Larger, scope-affecting, architecture-affecting, data, security, migration, workflow, or unclear fixes should be routed to `plan-with-context`.
14. Tiny isolated fixes may be routed directly to `execute-plan` only after user confirmation.
15. `plan-with-context` supports a Review Report Integration path for planning from review findings.
16. Review reports may include lesson candidates categorized as Avoid, Keep, or Mixed.
17. `code-review` may output an advisory Merge / Apply Readiness verdict.
18. The readiness verdict does not approve, merge, apply, publish, release, deploy, modify code, or update memory.

Resulting files:

```txt
kit/skills/core/code-review/SKILL.md
kit/skills/core/code-review/metadata.yml
kit/prompts/force-code-review.md
kit/skills/core/plan-with-context/SKILL.md
kit/skills/core/agent-roles-and-capabilities/SKILL.md
docs/foundation-design-log.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
```

## Theme 12: Install / Update Workflow Hardening

Accepted decisions:

1. Theme 12 primarily supports fresh installation into new or early-stage projects.
2. Existing project support is limited to detecting existing files, showing clear risk analysis, and requiring careful user confirmation before replacement.
3. Theme 12 does not migrate or optimize mature existing projects.
4. Project-wide file operations must stay inside explicit project boundaries by default.
5. The installer has one controlled source-to-target boundary exception.
6. The installer may read only from the current foundation-kit repo's `kit/`.
7. The installer may write only inside the explicit target project root.
8. All installable content must come from `kit/`.
9. `AGENTS.md` installs to the downstream project root.
10. Project templates install under `.codex/project/`.
11. `kit/skills/`, `kit/prompts/`, and `kit/rules/` install under `.codex/skills/`, `.codex/prompts/`, and `.codex/rules/`.
12. The installer requires explicit `--target`.
13. The target directory must already exist.
14. The target must not equal the foundation-kit repo root.
15. The installer defaults to dry-run.
16. Actual writes require `--apply`.
17. Existing files must not be automatically merged or silently overwritten.
18. Existing files must be backed up before replacement under `.codex/backups/install-YYYYMMDD-HHMMSS/<original-path>`.
19. The installer script itself is not installed into downstream projects.
20. Theme 12 does not add a new installer skill or prompt.
21. Theme 12 includes a local validation script for common installer failure modes.
22. Installer tests must keep artifacts under `dev_locals/test-runs/install-foundation-kit/`.
23. Installer tests must dynamically verify real `kit/` sample files instead of hard-coding nonexistent filenames.
24. `agent-roles-and-capabilities` adds a lightweight Validation / Test Designer role to make validation strategy explicit.

Resulting files:

```txt
scripts/install-foundation-kit.sh
scripts/test-install-foundation-kit.sh
kit/skills/core/agent-roles-and-capabilities/SKILL.md
docs/foundation-design-log.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

## Theme 13: First-run Agent Operating Contract

Accepted decisions:

1. Theme 13 defines the post-install first-run workflow for downstream projects.

2. `AGENTS.md` stays short and operational.

3. Detailed first-run rules live in `kit/rules/agent-operating-contract.md`.

4. First-run startup order is:

   - `AGENTS.md`

   - `project-memory`

   - `agent-roles-and-capabilities`

   - `initialize-project-context`

   - routed follow-up skill

5. `agent-roles-and-capabilities` should be applied before `initialize-project-context` during first-run setup.

6. `initialize-project-context` is a role-routed onboarding and gap-analysis workflow, not only a file scan.

7. `grill-me` is not implemented in Theme 13. It is only referenced as the correct routing target when goals, scope, requirements, constraints, or decision branches remain unclear.

8. Theme 13 adds a durable memory loop:

   - current facts go to `.codex/project/project-guideline.md`

   - long-term decisions go to `.codex/project/project-decisions.md`

   - lessons and reusable patterns go to `.codex/project/lessons-learned.md`

9. Lessons are categorized as Avoid, Keep, or Mixed.

10. Theme 13 reinforces concise output: use the shortest format that preserves correctness, project terms, decisions, risks, validation status, and next actions.

11. Theme 13 also exposed and fixed apply-theme zip workflow issues:

    - `tmp_dir` trap referenced a local variable after `main` returned under `set -u`

    - PR info parsing using TSV collapsed empty `mergedAt` fields and shifted PR fields

Resulting files / changes:

```txt

kit/project-templates/AGENTS.md

kit/rules/agent-operating-contract.md

kit/project-templates/project-guideline.md

kit/project-templates/lessons-learned.md

kit/skills/core/initialize-project-context/SKILL.md

kit/skills/core/update-project-memory/SKILL.md

scripts/apply-theme-zip.sh

scripts/lib/workflow-common.sh

docs/foundation-design-log.md

.codex/project/project-guideline.md

.codex/project/project-decisions.md

.codex/project/lessons-learned.md
```

## Theme 14: Grill Me

Accepted decisions:

1. `grill-me` is implemented as a reusable clarification skill for unclear goals, requirements, scope, constraints, tradeoffs, and decision branches.

2. `grill-me` is a dependency-style productivity skill. Other current and future workflows may route to it when ambiguity blocks safe progress.

3. `grill-me` is not tightly coupled to the current skill list. Skills can be added, renamed, removed, or replaced later without changing the core clarification behavior.

4. `grill-me` must inspect available project context before asking the user a question.

5. It must not ask questions that can be answered from project memory, repo docs, code, config, tests, package files, or official / high-quality technical sources.

6. It asks the smallest number of high-leverage questions needed to unblock the next workflow.

7. It asks one question at a time by default. A tight group of related questions is allowed only when they belong to the same decision and answering them together reduces friction.

8. Every question should include a recommended answer or recommended direction.

9. `grill-me` is clarification-only. It must not implement code, execute plans, modify project files, update project memory directly, commit, push, create PRs, merge, release, or deploy.

10. If clarification creates durable facts, decisions, or lessons, it recommends `update-project-memory`.

Resulting files / changes:

```txt
kit/skills/core/grill-me/SKILL.md
kit/skills/core/grill-me/metadata.yml
kit/prompts/force-grill-me.md
kit/rules/agent-operating-contract.md
docs/foundation-design-log.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
```

## Theme 15: Handoff

Accepted decisions:

1. `handoff` is implemented as a reusable productivity skill for compact cross-session or cross-agent continuation.

2. `handoff` is adapted from an existing productivity skill pattern, but rewritten for this foundation kit instead of copied directly.

3. Handoffs are local-only process artifacts, not durable project memory.

4. Handoffs default to:

```txt
dev_locals/handoffs/YYYY-MM-DD-short-topic.md
```

5. Handoffs must not be committed.

6. Handoffs should reference existing artifacts by path or URL instead of duplicating full plans, PRDs, ADRs, issues, commits, diffs, or memory files.

7. Handoffs must include suggested next skills so a future agent can resume with correct workflow routing.

8. Handoffs must redact secrets and unnecessary sensitive information.

9. Durable facts, decisions, or lessons discovered while creating a handoff must be routed to `update-project-memory`.

10. `agent-operating-contract.md` now routes cross-session / cross-agent continuation to `handoff`.

Resulting files / changes:

```txt
kit/skills/core/handoff/SKILL.md
kit/skills/core/handoff/metadata.yml
kit/prompts/force-handoff.md
kit/rules/agent-operating-contract.md
docs/foundation-design-log.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
```

## Theme 16: Write a Skill

Accepted decisions:

1. `write-a-skill` is implemented as a reusable productivity skill for creating or refining reusable agent skills.

2. `write-a-skill` completes the currently planned v0.1 productivity skill set together with `grill-me` and `handoff`.

3. `write-a-skill` is adapted from an existing productivity skill pattern, but rewritten for this foundation kit instead of copied directly.

4. The skill is responsible for skill authoring conventions, not for normal feature planning, execution, review, handoff, research, publishing, release, deploy, or project memory updates.

5. New skills should have clear triggers, boundaries, required context checks, output expectations, and project memory follow-up guidance.

6. Required installable skill files are:

```txt
kit/skills/core/<skill-name>/SKILL.md
kit/skills/core/<skill-name>/metadata.yml
```

7. Optional support files may include:

```txt
kit/prompts/force-<skill-name>.md
kit/skills/core/<skill-name>/REFERENCE.md
kit/skills/core/<skill-name>/EXAMPLES.md
kit/skills/core/<skill-name>/scripts/
```

8. External skills may be used as references, but agents must inspect, extract patterns, and rewrite for this project. They must not copy external skills wholesale.

9. Scripts inside skills are allowed only when they are deterministic, repeatable, useful for validation or automation, and can be tested safely.

10. `agent-operating-contract.md` now routes skill creation / skill refinement to `write-a-skill`.

Resulting files / changes:

```txt
kit/skills/core/write-a-skill/SKILL.md
kit/skills/core/write-a-skill/metadata.yml
kit/prompts/force-write-a-skill.md
kit/rules/agent-operating-contract.md
docs/foundation-design-log.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
```

## Theme 16.1 Follow-up: State-Aware Local Publish Workflow

Accepted decisions:

1. Publish startup inspects default-branch freshness, repository open PRs, current-branch PR state, uncommitted changes, and unpushed commits before requesting a commit message.
2. Commit messages are requested only for uncommitted changes. Existing unpushed commits use the latest commit subject as the PR title.
3. Repository-level open PRs are listed for prerequisite review and require acknowledgement, but do not automatically block publishing.
4. Existing current-branch PRs receive a publish record and continue through the selected completion flow without duplicate PR creation.
5. Validation uses classification-aware codes. `SMALL_SAFE` remains pre-approved, `NORMAL` may use `NOT_RUN` with a warning, and `SIGNIFICANT` requires a positive validation code.
6. Required-check handling separates no checks, passing, pending, failing, and GitHub CLI errors. CLI errors preserve stderr and block merge.
7. Typed confirmations remain on externally visible or destructive boundaries such as squash merge and hard reset.

Stabilization decisions:

1. Complete staged, commit, and PR scope is displayed and confirmed before update classification.
2. Update type selection uses numbered Small safe / Normal / Significant choices with stable internal codes and invalid-input re-prompting.
3. Publish context shows recommended update type, commit message, and PR title while allowing overrides.
4. `SMALL_SAFE` can skip structured validation and manual PR review only after scope confirmation.
5. Clean feature branches recover PRs that merged after a polling timeout and refresh only after verified `mergedAt` and default-branch base.
6. New meaningful work pauses when an unrelated non-default branch has unfinished changes, commits, or a PR.

Resulting files / changes:

```txt
scripts/publish-local-change.sh
scripts/test-publish-local-change.sh
README.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Theme 16.3: Downstream AGENTS Template Operating Contract

Accepted decisions:

1. The downstream `AGENTS.md` template defines generic operating behavior and does not include instructions specific to developing this repository.
2. Meaningful tasks declare workflow, primary role, supporting roles, scope, and stop conditions. Workflow or mode switches restate the routing.
3. Work starts from an up-to-date default branch and uses a feature branch unless the user explicitly approves another workflow. Direct pushes to the default branch are prohibited.
4. Completed and validated branches use the installed `publish-current-branch` workflow.
5. Implementation final reports classify update risk and report changed files, reason, impact, validation, memory or documentation updates, and external actions.
6. Installed project memory records only durable facts, decisions, and reusable lessons.
7. The template refers to installed `.codex/skills/`, `.codex/rules/`, `.codex/prompts/`, and `.codex/project/` content.
8. This theme does not redesign publishing, define GitHub protection policy, modify skills, or change installation scripts.

Resulting files / changes:

```txt
kit/project-templates/AGENTS.md
docs/foundation-design-log.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
```

## Theme 17: Reusable GitHub Repository Settings

Accepted decisions:

1. Reusable ruleset, General settings payload, and application checklist artifacts live under `kit/github-settings/`.
2. The installer copies the complete package to `.codex/github-settings/` and never applies GitHub settings.
3. The required General settings payload changes only squash merge and auto-merge enablement.
4. Approvals, status checks, merge queue, bypass actors, and other hardening remain project-specific.
5. Documentation covers UI/API application, verification, rollback, and plan or repository-visibility availability constraints.
6. Installer tests compare the complete GitHub settings directory.

Resulting files / changes:

```txt
kit/github-settings/
scripts/install-foundation-kit.sh
scripts/test-install-foundation-kit.sh
README.md
.codex/project/
docs/foundation-design-log.md
```

## Theme 17.1: Installable Publish Workflow Scripts

Accepted decisions:

1. `kit/scripts/publish-changes.sh` is the canonical downstream-neutral publish implementation.
2. `kit/scripts/lib/workflow-common.sh` is the canonical shared Bash helper, including standard
   default-no confirmation handling with invalid-input re-prompting.
3. Source-repository wrappers delegate to the kit implementation so `pnpm publish:local` and
   `apply-theme-zip.sh` keep their existing compatibility without duplicate helper logic.
4. The installer copies the complete `kit/scripts/` tree to `.codex/scripts/` and treats existing
   targets as dangerous conflicts.
5. The installer does not create or modify downstream `package.json`; direct Bash invocation is
   the documented default and a package-manager alias is optional project configuration.
6. `publish-current-branch` owns strategy and authorization. Agents prefer the installed script
   for mechanics and retain the manual workflow only as a fallback.
7. Deterministic tests cover source-wrapper delegation, direct installable execution, complete
   installer mapping, confirmation re-prompting, and the existing fake-CLI publish behavior.

Resulting files / changes:

```txt
kit/scripts/
kit/skills/core/publish-current-branch/SKILL.md
scripts/publish-local-change.sh
scripts/lib/workflow-common.sh
scripts/install-foundation-kit.sh
scripts/test-install-foundation-kit.sh
scripts/test-publish-local-change.sh
README.md
package.json
.codex/project/
docs/foundation-design-log.md
```

## Theme 17.3: Node Publish CLI Migration

Accepted decisions:

1. Add a Node.js 24+ ESM publish CLI with structured command execution and JSON-based GitHub CLI
   parsing.
2. Keep reusable command, Git, GitHub, error, and output modules under `kit/scripts/shared/`.
3. Keep publish-only prompts and orchestration under `kit/scripts/publish-changes/` until another
   workflow demonstrates reuse.
4. Store classification behavior in `kit/config/publish-changes-policy.yml` with strict schema
   validation and conservative built-in defaults.
5. Permit source-repository YAML loading through a package-managed dependency, but never require
   an uninstalled downstream package; missing YAML support activates built-in defaults.
6. Install `kit/config/` to `.codex/config/` and continue installing the complete scripts tree.
7. Keep `pnpm publish:local` on the Bash fallback during Theme 17.3. Cutover requires passing
   Vitest parity, existing Bash publish tests, installer tests, and manual CLI output review.
8. Allow default-branch refresh only after GitHub verifies a merge into the configured default
   branch, independent of classification. Divergence requires backup plus typed reset approval.
9. Treat external policy as configuration rather than authorization; immutable validation and
   review gates remain enforced in code.
10. For uncommitted work, stage only the observed path set, display the exact upstream-relative
    publish scope including prior unpushed commits, and verify the confirmed index tree again
    before commit.

Resulting files / changes:

```txt
.mise.toml
package.json
pnpm-lock.yaml
kit/config/
kit/scripts/publish-changes.mjs
kit/scripts/publish-changes/
kit/scripts/shared/
tests/publish-changes/
scripts/install-foundation-kit.sh
scripts/test-install-foundation-kit.sh
kit/skills/core/publish-current-branch/SKILL.md
README.md
.codex/project/
docs/foundation-design-log.md
```

## Theme 17.4: Node Publish CLI Smoke-Test Stabilization

Status:

- Manual smoke testing is mostly complete.
- Real `pnpm publish:node` usage completed successfully and the flow was reported as smooth after
  a minor message/UX correction.
- Smoke Test 10 passed: a worktree change introduced after scope collection was detected and the
  CLI aborted before publishing.
- `pnpm publish:local` remains on the Bash fallback.
- Default cutover to Node is deferred to a separate Theme 17.5 decision.

The smoke results validate the candidate without treating test completion as implicit cutover
authorization.

## Theme 17.5: Node Publish Default Cutover

Accepted decisions:

1. `pnpm publish:local` now runs the Node.js 24+ ESM publish CLI.
2. `pnpm publish:node` remains an explicit alias for the Node CLI.
3. `pnpm publish:bash` retains the Bash source-repository wrapper as an immediate rollback path.
4. The Bash implementation and its tests remain supported until removal is deliberately approved
   in a later theme.
5. `pnpm check` continues validating Node publish tests, Bash publish tests, installer behavior,
   remaining shell syntax, and whitespace.
6. The installer continues copying both implementations without creating or modifying downstream
   `package.json`.
7. Downstream projects may invoke the installed Node CLI directly when Node 24+ is available or
   use the installed Bash script as a fallback.

Post-cutover validation status:

- A real source-repository publish completed successfully through the new `pnpm publish:local`
  Node default.
- Theme 17.5 is post-cutover validated for source-repository usage.
- `pnpm publish:node` remains the explicit Node alias and `pnpm publish:bash` remains the supported
  fallback.
- Continue dogfooding the Node default for several more real updates before considering Bash
  removal in a separate decision.

Resulting files / changes:

```txt
package.json
kit/scripts/shared/output.mjs
tests/publish-changes/core.test.mjs
README.md
kit/skills/core/publish-current-branch/SKILL.md
.codex/project/
docs/foundation-design-log.md
```

### Publish CLI Theme Configuration Follow-Up

Accepted decisions:

1. `kit/config/publish-cli-theme.json` is the canonical source for publish CLI level colors and
   label-only versus full-line rendering.
2. Installed projects receive the same config at `.codex/config/publish-cli-theme.json`.
3. Level entries contain only `color` and `fullLine`; `boldLabel` is intentionally unsupported.
4. ANSI color strings and RGB arrays of three integers from 0 to 255 are supported. Hex strings
   are not supported.
5. Every level label remains bold by fixed rendering policy. Full-line styles color label and
   message without leaking bold into the message; label-only styles reset before message text.
6. Missing or invalid config warns and falls back to built-in defaults matching the canonical
   file.
7. The canonical config preserves the tested `main` behavior. Documentation references the config
   instead of maintaining another complete color table.

## Maintenance Update: Plan Mode Persistence and Execution Boundary

Accepted decisions:

1. Multi-step planning workflows continue to use `dev_locals/plans/` for local plan persistence.
2. If Plan Mode or the active tool environment blocks writes, agents must not report the plan as
   saved.
3. A blocked persistence report includes the exact intended path and the complete plan content or
   a clear manual/save-later action.
4. Plan creation is not execution approval.
5. The default post-plan action is review, revision, or saving the plan.
6. Execution requires explicit user approval after review, even when the UI or tool offers an
   execution action.
7. The source-repository and downstream AGENTS contracts use the same boundary.

Resulting files / changes:

```txt
AGENTS.md
kit/project-templates/AGENTS.md
kit/skills/core/plan-with-context/SKILL.md
kit/skills/core/project-architecture-plan/SKILL.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
docs/foundation-design-log.md
```

## Theme 18.1: Node Installer Candidate

Accepted decisions:

1. Add a Node.js 24+ ESM installer candidate under source `scripts/`.
2. Keep `scripts/install-foundation-kit.sh` as the active installer and supported fallback.
3. Do not add or switch a default installer alias in Theme 18.1.
4. Keep installer-specific modules under `scripts/install-foundation-kit/`.
5. The Node installer consumes only `kit/` as installable payload and is never installed
   downstream.
6. Source-only installer code may reuse `kit/scripts/shared/` output helpers at runtime without
   changing payload ownership.
7. Dry-run is the default; writes require `--apply`.
8. Existing files, including identical files, are conflicts and require the exact
   `INSTALL_WITH_BACKUP` token through interactive or piped input.
9. Replacement staging, complete backup snapshot preparation, hash verification, and plan
   revalidation must all succeed before any downstream write.
10. Backups are materialized under `.codex/backups/install-YYYYMMDD-HHMMSS[-N]/` with a
    relative-path-only manifest and partial-progress status.
11. Optional `diff -u` preview is non-blocking when unavailable.
12. The installer never creates or modifies downstream `package.json`.
13. `test:install` runs the Node Vitest suite and the existing Bash suite; `pnpm check` retains
    publish tests, installer tests, shell syntax, and whitespace validation.
14. Default cutover and Bash removal require later explicit themes.

Manual downstream validation status:

- The Node installer candidate was used in a downstream installation smoke test.
- The smoke test looked good and no blocking issues were observed.
- Theme 18.1 is validated enough for continued Node installer dogfooding.
- Bash remains the active/default installer.
- Theme 18.2 may separately consider a Node-first workflow and Bash archive planning.
- If later dogfooding finds Node installer issues, prefer fixing the Node implementation.

Resulting files / changes:

```txt
scripts/install-foundation-kit.mjs
scripts/install-foundation-kit/
tests/install-foundation-kit/
package.json
README.md
.codex/project/
docs/foundation-design-log.md
```

## Theme 18.2: Node-First Automation and Legacy Bash Archive

Accepted decisions:

1. The Node publish CLI and Node installer are the maintained publish and installer paths.
2. Future defects should be fixed in the Node implementations first.
3. Preserve exact legacy Bash publish and installer snapshots under
   `archive/legacy-bash-workflows/` as unsupported source-only historical reference.
4. Keep the archive outside `kit/` so it is never installed downstream.
5. Remove active Bash publish/installer aliases, tests, wrappers, and installable payload files.
6. Do not automatically remove previously installed Bash files from existing downstream projects.
7. Keep `scripts/apply-theme-zip.sh` active and give it a source-owned
   `scripts/lib/workflow-common.sh` helper before removing the installable shared Bash helper.
8. Keep `pnpm check` focused on Node publish tests, Node installer tests, active apply-theme shell
   syntax, and whitespace.
9. Reassess runtime choice early when shell scripts grow from command glue into complex workflow
   engines with state, structured data, backups, recovery, or path-boundary enforcement.

Resulting files / changes:

```txt
archive/legacy-bash-workflows/
package.json
scripts/lib/workflow-common.sh
kit/scripts/
tests/publish-changes/
tests/install-foundation-kit/
README.md
kit/skills/core/publish-current-branch/SKILL.md
kit/rules/engineering-quality-principles.md
.codex/project/
docs/foundation-design-log.md
```

## Guardrail Update: Global Toolchain and Out-of-Project Operation Boundary

Accepted decisions:

1. Project-local runtime configuration and global machine tooling are separate trust boundaries.
2. Read-only diagnostics may inspect versions, executable paths, mise state, package-manager
   information, logs, PATH, shell profiles, and Git configuration.
3. Global tooling, shell profiles, PATH, global Git configuration, and files outside the current
   project must not be mutated without explicit user approval.
4. Runtime mismatch reports include detected version, required version, failing command, and
   global versus project-local state.
5. Agents recommend manual remediation and explain machine-wide risk before requesting approval.
6. Agents never silently repair global tooling to make validation pass.
7. Every task final report explicitly lists external/global actions, including `None`.
8. The Node version incident was caused by local shell profile duplication/PATH ordering, not
   Codex or repository changes; the durable outcome is clearer operation boundaries.

Resulting files / changes:

```txt
AGENTS.md
kit/project-templates/AGENTS.md
kit/rules/agent-operating-contract.md
kit/rules/engineering-quality-principles.md
kit/skills/core/execute-plan/SKILL.md
kit/skills/core/initialize-project-context/SKILL.md
kit/skills/core/publish-current-branch/SKILL.md
kit/skills/core/update-project-memory/SKILL.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
docs/foundation-design-log.md
```

## Phase 0: Process Artifact Lifecycle and Maintained Tooling Boundary

Accepted decisions:

1. Plans, handoffs, reports, research notes, and execution logs are process artifacts, not durable
   project truth or automatic execution authority.
2. Current `AGENTS.md`, project memory, repository files, package scripts, and maintained tooling
   boundaries take precedence over stale process artifacts.
3. Plans older than one day require explicit user selection and current-source re-verification
   before execution.
4. The Node publish CLI and Node installer are the maintained publish and installation paths.
5. `scripts/apply-theme-zip.sh` remains an active Bash source-repository helper.
6. Bash publish and installer snapshots under `archive/legacy-bash-workflows/` are unsupported
   historical reference, remain outside `kit/`, and are never installed downstream.

Rationale:

- prevent future planning from reviving archived Bash workflows
- preserve useful historical artifacts without confusing them with current authority
- make current package scripts and project memory the explicit freshness check

Non-goals:

- no publish, installer, apply-theme, archive, or script behavior changes
- no Project Memory Context Gate implementation
- no Phase 1-7 roadmap implementation

Resulting files / changes:

```txt
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/
docs/foundation-design-log.md
```

Local-only artifact updated, not committed:

```txt
dev_locals/plans/2026-06-10-shared-workflow-script-library-plan.md
```

## Phase 1: Project Memory Context Gate

Accepted decisions:

1. Define the complete Project Memory Context Gate sequence, source selection, reporting
   interface, continuation rules, and status meanings only in
   `kit/skills/core/project-memory/SKILL.md`.
2. Keep root and downstream AGENTS entrypoints, the operating contract, and scoped workflow
   skills as short references to the canonical definition.
3. Apply the gate both to downstream installed projects and this foundation-kit source
   repository's `.codex/project/` memory.
4. Let initialization and memory-update workflows follow the central context-repair continuation
   rules without duplicating them.
5. Inspect plans, handoffs, reports, and research notes only when identified as task-relevant and
   only after freshness and source-of-truth verification.

Rationale:

- prevent duplicated gate definitions from drifting across mature workflow skills
- make source-repository and downstream context handling explicit
- preserve process artifacts as useful evidence without treating them as durable truth

Non-goals:

- no publish CLI, package command, validation-command, installer, script, dependency, or runtime
  behavior changes
- no Phase 2-7 roadmap work or new optional workflow skills

Validation:

- the canonical sequence and status meanings appear only in `project-memory`
- all scoped entrypoints, rules, and workflow skills contain concise references
- repository validation and diff checks pass without script or package changes

Resulting files / changes:

```txt
AGENTS.md
kit/project-templates/AGENTS.md
kit/skills/core/project-memory/SKILL.md
kit/rules/agent-operating-contract.md
kit/skills/core/{plan-with-context,execute-plan,code-review,project-architecture-plan}/SKILL.md
kit/skills/core/{initialize-project-context,update-project-memory,handoff}/SKILL.md
kit/skills/core/{publish-current-branch,write-a-skill}/SKILL.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Theme 19: Core Foundation Alignment

Accepted decisions:

1. Keep `project-memory` and `update-project-memory` names unchanged.
2. Clarify that `project-memory` owns durable memory reading/applying and the Project Memory
   Context Gate, while `update-project-memory` owns confirmed durable writes.
3. Clarify that `docs-first-research` passes the gate for project-impacting research and may
   report the gate as not applicable for pure external fact lookup.
4. Define the Missing Specialist Skill Policy only in `agent-roles-and-capabilities`.
5. Add `grill-me` Brainstorming Mode as clarification-only: explore alternatives, ask focused
   questions, recommend a direction, then route back to planning or architecture.
6. Treat Vercel Labs `find-skills` and Obra Superpowers as reference inputs only. Do not copy
   external skill content wholesale.

Rationale:

- align the foundational skill boundaries after Project Memory Context Gate
- make missing specialist capabilities visible without adding technology-specific skills
- preserve short AGENTS and operating-contract references instead of duplicating skill rules
- keep external skill patterns auditable before adoption

Non-goals:

- no codebase-audit, third-party skill adoption policy, external skill catalog, kit evolution
  loop, UI rules, technology-specific skills, or Plan/Execute/Review hardening
- no scripts, package commands, installer behavior, dependencies, runtime behavior, tests, or
  archived-file changes

Validation:

- full Project Memory Context Gate remains only in `project-memory`
- full Missing Specialist Skill Policy appears only in `agent-roles-and-capabilities`
- scoped search confirms Theme 19 references
- `pnpm check` passes without runtime or tooling changes

Resulting files / changes:

```txt
AGENTS.md
kit/project-templates/AGENTS.md
kit/rules/agent-operating-contract.md
kit/rules/docs-first-policy.md
kit/skills/core/project-memory/SKILL.md
kit/skills/core/update-project-memory/SKILL.md
kit/skills/core/docs-first-research/SKILL.md
kit/skills/core/agent-roles-and-capabilities/SKILL.md
kit/skills/core/grill-me/SKILL.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Theme 20: Plan Execute Review Quality Hardening

Accepted decisions:

1. Strengthen `plan-with-context` with self-contained plan quality requirements for fresh-agent
   execution, exact scope boundaries, baseline state, STOP conditions, and validated commands.
2. Strengthen `execute-plan` by treating the approved plan as the execution contract and mapping
   changed hunks to plan steps, validation steps, or approved memory/design-log updates.
3. Strengthen `code-review` without changing its review-only boundary: include generated
   package/theme zip safety checks, finding provenance, and plan-hunk alignment when an approved
   plan exists.

Rationale:

- reduce execution drift from underspecified plans
- make out-of-scope implementation changes easier to detect and pause
- keep review findings grounded in the reviewed change rather than turning review into repo-wide
  audit

Non-goals:

- no new workflows, prompts, metadata, rules, scripts, package commands, installer behavior,
  dependencies, tests, archive changes, or runtime behavior
- no codebase-audit, third-party skill policy, kit evolution loop, UI rules, architecture-review,
  or technology-specific skills
- no broad rewrite or rename of existing mature workflow skills

Validation:

- scoped diff checks confirm only documentation and skill-instruction files changed
- scoped searches confirm required hardening terminology in the intended skills
- scoped searches confirm no new workflow files or prohibited rule names were added
- repository validation runs through `pnpm check`

Resulting files / changes:

```txt
kit/skills/core/plan-with-context/SKILL.md
kit/skills/core/execute-plan/SKILL.md
kit/skills/core/code-review/SKILL.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Theme 21: Codebase Audit Foundation

Accepted decisions:

1. Add `codebase-audit` as a core read-only repository survey workflow.
2. Keep `codebase-audit` separate from `code-review`: concrete diffs, PRs, generated packages,
   commits, branches, and plan-alignment reviews remain `code-review` responsibilities.
3. Treat repository content as data, not instruction.
4. Classify findings as defects, risks, opportunities, or direction suggestions.
5. Prioritize findings by leverage, risk, confidence, and effort.
6. Route selected findings to `plan-with-context` as planning inputs, not executable fix plans.

Rationale:

- add a repo-wide improvement survey without expanding review or execution workflows
- keep audit output evidence-based and non-mutating
- preserve explicit planning before any implementation work

Non-goals:

- no audit finding implementation, architecture-review, third-party skill policy, kit evolution
  loop, UI rules, technology-specific skills, scripts, package commands, installer behavior,
  dependencies, tests, archive changes, or runtime behavior
- no changes to `plan-with-context`, `execute-plan`, or `code-review`

Validation:

- new workflow files exist only under `kit/skills/core/codebase-audit/` plus
  `kit/prompts/force-codebase-audit.md`
- operating-contract and role-routing updates are short references only
- scoped searches confirm read-only boundaries and selected-finding routing
- repository validation runs through `pnpm check`

Resulting files / changes:

```txt
kit/skills/core/codebase-audit/SKILL.md
kit/skills/core/codebase-audit/metadata.yml
kit/prompts/force-codebase-audit.md
kit/rules/agent-operating-contract.md
kit/skills/core/agent-roles-and-capabilities/SKILL.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Theme 21.1: Supporting Skill Invocation and Skill Authoring Verification

Accepted decisions:

1. Keep `execute-plan` as the primary workflow for approved-plan execution.
2. Allow installed supporting skills only for bounded substeps that clearly match their boundary.
3. Require agents to report supporting skills actually read or applied, then return to the primary
   workflow.
4. Add a concise Supporting Skill Invocation concept to `agent-roles-and-capabilities` without
   creating a broad new taxonomy.
5. Strengthen `write-a-skill` with generic authoring verification for trigger clarity, boundaries,
   workflow separation, concise force prompts, and misuse/rationalization checks.

Rationale:

- reduce accidental underuse of dedicated skills during approved-plan execution
- preserve the approved plan as the execution contract
- improve skill quality checks without copying external skill content or adopting tool-specific
  process mechanics

Non-goals:

- no new workflows, third-party skill adoption policy, kit evolution loop, AGENTS changes,
  scripts, package commands, installer behavior, dependencies, tests, archive changes, generated
  package workflow, or runtime behavior
- no Obra, Superpowers, Claude, or TodoWrite-specific runtime language

Validation:

- scoped searches confirm supporting-skill language in intended files
- scoped searches confirm generic `write-a-skill` verification wording
- negative searches confirm no external-tool-specific runtime language
- repository validation runs through `pnpm check`

Resulting files / changes:

```txt
kit/skills/core/execute-plan/SKILL.md
kit/skills/core/agent-roles-and-capabilities/SKILL.md
kit/skills/core/write-a-skill/SKILL.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Theme 22.0: Stage Review, Inventory, and Roadmap Refresh

Accepted decisions:

1. Keep `docs/foundation-kit-skills-review-and-optimization-roadmap.md` as the canonical
   long-term roadmap.
2. Preserve `docs/foundation-kit-stage-review-and-forward-plan-2026-06-16.md` as a dated review
   input, not a roadmap replacement.
3. Refresh the roadmap current-state inventory for skills, rules, prompts, implemented phases, and
   recommended next steps.
4. Record Theme 22.1 Third-Party Skill Adoption Safety and Theme 22.2 Kit Evolution and Reusable
   Lesson Promotion Loop as separate future work.
5. Correct this repository's current project-memory inventory for canonical rules.

Rationale:

- avoid future agents planning from stale roadmap fragments
- keep useful long-term roadmap sections while correcting current state
- make the stage review useful without promoting a process artifact into project truth

Non-goals:

- no Third-Party Skill Adoption Safety implementation
- no Kit Evolution Loop implementation
- no new workflows, skills, prompts, rules, scripts, package commands, installer behavior,
  dependencies, tests, archive changes, generated package workflow, or runtime behavior
- no AGENTS changes, skill renames, or broad mature-skill rewrites

Validation:

- roadmap inventory includes `codebase-audit`
- project memory lists all current canonical rules
- scoped diff checks confirm no skill, rule, prompt, runtime, tooling, test, script, package,
  installer, archive, or dependency changes
- repository validation runs through `pnpm check`

Resulting files / changes:

```txt
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Theme 22.0.1: Dependency Invariant and Publish Handoff Clarification

Accepted decisions:

1. Treat `publish-current-branch` as a post-execution workflow transition, not an internal
   `execute-plan` supporting substep.
2. Require an explicit workflow switch after execution before push, PR, or merge actions.
3. Keep `agent-roles-and-capabilities` bootstrap-safe for initial role/workflow routing before the
   Project Memory Context Gate.
4. Use `project-memory` as supporting context when routing depends on project-specific facts.

Rationale:

- prevent approved-plan execution from accidentally absorbing externally visible publishing work
- avoid a role-routing dependency loop before an agent knows which workflow applies
- keep the change as a small instruction clarification before Theme 22.1

Non-goals:

- no Theme 22.1 or Theme 22.2 implementation
- no new workflows, skills, rules, prompts, scripts, package commands, installer behavior,
  dependencies, tests, archive changes, generated package workflow, or runtime behavior
- no AGENTS changes, skill renames, or mature-skill rewrites

Resulting files / changes:

```txt
docs/foundation-kit-skill-dependency-deadlock-risk-review-2026-06-16.md
kit/skills/core/execute-plan/SKILL.md
kit/skills/core/agent-roles-and-capabilities/SKILL.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
```

## Theme 22.1: Third-Party Skill Adoption Safety

Accepted decisions:

1. Keep external skills as reference candidates only; they are not project authority.
2. Use `docs-first-policy` for the concise external-skill evaluation boundary.
3. Use `docs-first-research` for source verification and evaluation reporting.
4. Use `write-a-skill` to adapt approved patterns into this kit after evaluation.
5. Do not add a new workflow, new skill, external skill catalog, broad policy file, or
   `third-party-skill-adoption-policy.md`.

Rationale:

- prevent wholesale copying or unsafe adoption of third-party skill instructions
- preserve this kit's AGENTS, project memory, workflow, safety, and tooling boundaries
- keep Theme 22.1 lightweight and separate from Theme 22.2 Kit Evolution

Non-goals:

- no Theme 22.2 Kit Evolution / Reusable Lesson Promotion Loop implementation
- no broad external skill marketplace or catalog
- no technology-specific skills
- no scripts, package commands, installer behavior, dependencies, tests, archive changes,
  generated package workflow, or runtime behavior
- no AGENTS changes, skill renames, or mature-skill rewrites

Validation:

- scoped searches confirm reference-candidate, no-wholesale-copying, license/provenance, and
  rewrite-for-this-kit language
- scoped checks confirm no runtime/tooling, package, installer, test, archive, metadata, prompt,
  new workflow, new skill, catalog, or policy-file changes
- repository validation runs through `pnpm check`

Resulting files / changes:

```txt
kit/rules/docs-first-policy.md
kit/skills/core/docs-first-research/SKILL.md
kit/skills/core/write-a-skill/SKILL.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Theme 22.2: Kit Evolution and Reusable Lesson Promotion Loop

Accepted decisions:

1. Keep project experience in local project memory first.
2. Treat reusable lesson promotion as a candidate review and generalization process, not an
   automatic write into the foundation kit.
3. Use `update-project-memory` for reusable lesson candidates.
4. Use `write-a-skill` to adapt confirmed reusable patterns into generic kit guidance.
5. Use `agent-operating-contract` for a concise promotion boundary.
6. Do not add a new workflow, catalog, marketplace, technology-specific skill, or
   `kit/rules/kit-evolution-loop.md`.

Rationale:

- prevent project-specific history from polluting installable templates
- require generalization, explicit user confirmation, and an approved plan before kit changes
- keep the learning loop lightweight and separate from future UI, architecture, catalog, release,
  deployment, and technology-specific work

Non-goals:

- no UI Quality Foundation implementation
- no Architecture Review Refinement implementation
- no Optional Skill Catalog or specialist packs
- no broad marketplace/catalog
- no technology-specific skills
- no scripts, package commands, installer behavior, dependencies, tests, archive changes,
  generated package workflow, or runtime behavior
- no AGENTS changes, skill renames, or mature-skill rewrites

Validation:

- scoped searches confirm reusable lesson, promotion, generalization, user confirmation,
  project-specific history, and approved-plan language
- scoped checks confirm no runtime/tooling, package, installer, test, archive, metadata, prompt,
  new workflow, catalog, technology-specific, UI, architecture-review, release, or deployment
  changes
- repository validation runs through `pnpm check`

Resulting files / changes:

```txt
kit/rules/agent-operating-contract.md
kit/skills/core/update-project-memory/SKILL.md
kit/skills/core/write-a-skill/SKILL.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Phase 5: UI Quality Foundation

Accepted decisions:

1. Implement UI Quality Foundation through existing rule and workflow surfaces.
2. Use `kit/rules/engineering-quality-principles.md` as the canonical home for lightweight UI
   quality and design-system reuse guidance.
3. Add only short references in `project-architecture-plan`, `code-review`, and `codebase-audit`.
4. Do not create a new UI workflow, UI rule file, component library, design system package,
   screenshots/mockups/generated UI assets, or technology-specific UI skill.

Rationale:

- UI quality is a cross-technology engineering quality concern.
- Existing project UI conventions, components, tokens, and design systems should win over generic
  advice.
- Architecture planning, review, and audit need routing hooks, but concrete UI changes still route
  through existing planning/execution workflows.

Non-goals:

- no `ui-review` implementation
- no UI component library or design system package
- no React, Vue, Tailwind, shadcn, CSS architecture, or frontend framework skill pack
- no screenshots, mockups, generated UI assets, scripts, package commands, installer behavior,
  dependencies, tests, archive changes, generated package workflow, or runtime behavior
- no Architecture Review Refinement, Optional Skill Catalog, release workflow, deployment
  workflow, or technology-specific skill implementation

Validation:

- scoped searches confirm UI quality, visual hierarchy, responsive, accessibility, state,
  interaction, content clarity, reuse, and maintainability language
- scoped checks confirm no runtime/tooling, package, installer, test, archive, generated asset,
  new UI workflow, new UI rule file, component library, design system package, or
  technology-specific UI skill changes
- repository validation runs through `pnpm check`

Resulting files / changes:

```txt
kit/rules/engineering-quality-principles.md
kit/skills/core/project-architecture-plan/SKILL.md
kit/skills/core/code-review/SKILL.md
kit/skills/core/codebase-audit/SKILL.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Phase 6: Architecture Review Refinement

Accepted decisions:

1. Make `code-review` Plan Alignment Review the primary home for architecture review guidance.
2. Add only short relationship references in `project-architecture-plan` and `codebase-audit`.
3. Keep architecture review advisory and review-only.
4. Do not create a separate `architecture-review` skill, architecture rule file, or
   `project-architecture-plan/REFERENCE.md`.

Rationale:

- architecture review is a review activity when the target is a plan, PR, branch, implementation
  direction, or proposed structural change
- `code-review` already owns review-only behavior, Plan Alignment Review, findings, advisory
  verdicts, and follow-up routing
- existing-surface guidance avoids a heavy enterprise architecture process and preserves workflow
  boundaries

Non-goals:

- no separate `architecture-review` skill
- no `kit/rules/architecture-review-principles.md`
- no `kit/skills/core/project-architecture-plan/REFERENCE.md`
- no Optional Skill Catalog, specialist packs, release workflow, deployment workflow, or
  technology-specific architecture skills
- no scripts, package commands, installer behavior, dependencies, tests, archive changes,
  generated package workflow, runtime behavior, AGENTS changes, skill renames, or mature-skill
  rewrites

Validation:

- scoped searches confirm architecture review, boundary impact, dependency direction, data flow,
  migration, rollback, maintainability, runtime, deployment, ownership, alternatives, and next
  workflow language
- scoped checks confirm no runtime/tooling, package, installer, test, archive, AGENTS, new
  architecture-review skill, architecture rule file, or `REFERENCE.md` changes
- repository validation runs through `pnpm check`

Resulting files / changes:

```txt
kit/skills/core/code-review/SKILL.md
kit/skills/core/project-architecture-plan/SKILL.md
kit/skills/core/codebase-audit/SKILL.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Phase 7: Optional Skill Catalog and Specialist Packs

Accepted decisions:

1. Add a source-repository optional skill catalog model at `docs/optional-skill-catalog.md`.
2. Treat optional specialist packs as future candidates, not installed capabilities.
3. Keep `agent-roles-and-capabilities` responsible for missing-specialist routing.
4. Allow `initialize-project-context` to report optional pack candidates from project signals
   without installing or promoting them.
5. Use `write-a-skill` only after external evaluation, planning, and approval to author future
   optional skills or packs.
6. Do not create `docs/external-skill-catalog.md`, `kit/catalog/`, actual optional packs,
   technology-specific skills, marketplace behavior, auto-install behavior, or installer changes.

Rationale:

- make future specialist needs discoverable without bloating the minimal core kit
- keep external references as candidates until evaluated through `docs-first-research`
- preserve workflow boundaries between detection, evaluation, planning, authoring, execution, and
  memory updates

Non-goals:

- no React, Vue, Node, SFCC, Tailwind, shadcn, database, deployment, release, security, UI, or
  architecture specialist packs
- no marketplace, auto-install behavior, default optional packs, package dependencies, installer
  mapping, package commands, runtime behavior, tests, archives, generated package workflow,
  release workflow, or deployment workflow
- no AGENTS changes, skill renames, broad mature-skill rewrites, or copied external skill content

Validation:

- scoped searches confirm optional skill, specialist pack, candidate metadata, status, and
  workflow routing language
- scoped checks confirm no runtime/tooling, installer, package, test, archive, `kit/catalog`,
  marketplace, auto-install, or actual technology-specific pack changes
- repository validation runs through `pnpm check`

Resulting files / changes:

```txt
docs/optional-skill-catalog.md
kit/skills/core/agent-roles-and-capabilities/SKILL.md
kit/skills/core/initialize-project-context/SKILL.md
kit/skills/core/write-a-skill/SKILL.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Theme 18.3: Explicit Node PR-Only and PR-Number Merge Modes

Accepted decisions:

1. Add `pnpm publish:pr-only "Commit message" ["PR title"]` as a quick create-or-update PR mode
   on the maintained Node publish CLI.
2. Keep PR-only deterministic but non-interactive: retain authentication, observed-path staging,
   commit integrity, and scope-drift checks while skipping classification, validation,
   scope-confirmation, completion, merge, and refresh prompts.
3. Require PR-only callers to start from an existing feature branch and reuse its open PR instead
   of creating duplicate review-fix PRs.
4. Add `pnpm publish:merge-pr <pr-number> [--yes]` as an explicit squash-merge mode with
   clean-worktree, default-base, open/non-draft, mergeability, required-check, and head-OID gates.
5. Define `--yes` as human-confirmation bypass only; it does not bypass repository rules or safety
   checks.
6. Verify GitHub's merged state before switching branches, then refresh the default branch with
   fast-forward-only behavior and report partial success without hard reset when refresh is
   blocked.
7. Preserve existing `publish:local` and `publish:node` behavior and reuse only narrow Node helper
   boundaries.

Rationale:

- make repeated review-fix publication quick without weakening deterministic scope safety
- separate PR creation/update intent from explicit merge authorization
- retain one maintained Node implementation and avoid restoring archived Bash workflows

Non-goals:

- no installer, apply-theme Bash, archive, publish-policy schema, release, or deployment changes
- no Project Memory Context Gate implementation

Resulting files / changes:

```txt
package.json
README.md
kit/scripts/publish-changes.mjs
kit/scripts/publish-changes/
kit/scripts/shared/gh-client.mjs
kit/skills/core/publish-current-branch/SKILL.md
tests/publish-changes/
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Roadmap Snapshot

This design log records historical theme decisions and design rationale. The current project status is tracked in `.codex/project/project-guideline.md`.

Priority order after Theme 17.5 Node publish default cutover:

1. technology-specific skills
2. release workflow
3. deployment workflow

Rationale:

- The planned productivity skill set is now complete: `grill-me`, `handoff`, and `write-a-skill` are implemented.
- Technology-specific skills should come after the core project lifecycle and productivity workflows are stable.
- Release and deployment workflows should remain after skill-authoring and repository workflow conventions are stable.



## Future Ideas

- safe update for non-empty projects
- backup before overwrite
- diff before overwrite
- project-specific file protection
- skill version migration
- optional technology-specific skills
- support for agent directories beyond `.codex/`
- optional teach workflow for learning-oriented projects
- release workflow
- deployment workflow
- deliberate reusable lesson/rule distillation from `.codex/project/lessons-learned.md` into `kit/`

## Consolidation: Archive Bash Apply-Theme Helper

Accepted decisions:

1. Treat the Bash apply-theme helper as historical source-only tooling.
2. Archive `scripts/apply-theme-zip.sh` under
   `archive/legacy-bash-workflows/apply-theme-zip.sh`.
3. Archive `scripts/lib/workflow-common.sh` under
   `archive/legacy-bash-workflows/lib/workflow-common.sh`.
4. Remove the active `apply-theme` package command.
5. Remove active Bash apply-theme syntax checks from `pnpm check`.
6. Use `publish:changes` as the canonical source-repository publish command instead of duplicate
   `publish:local` / `publish:node` aliases.
7. Do not add a Node apply-theme replacement in this cleanup.

Rationale:

- keep active workflow commands focused on maintained Node publish and installer paths
- prevent future agents from planning against an active Bash apply-theme helper that no longer
  exists under `scripts/`
- preserve Bash apply-theme history under `archive/legacy-bash-workflows/` for source-only
  reference

Non-goals:

- no publish secret-safety guard
- no metadata parse or source hygiene implementation
- no release or deployment workflow
- no installer behavior change except removing expectations for archived Bash files
- no optional specialist packs
- no technology-specific skills
- no Node apply-theme replacement

Resulting files / changes:

```txt
README.md
package.json
tests/publish-changes/core.test.mjs
tests/install-foundation-kit/flow.test.mjs
docs/foundation-kit-skills-review-and-optimization-roadmap.md
archive/legacy-bash-workflows/README.md
archive/legacy-bash-workflows/apply-theme-zip.sh
archive/legacy-bash-workflows/lib/workflow-common.sh
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Release-Readiness Cleanup and Publish Secret-Safety Guard

Accepted decisions:

1. Keep core skill `metadata.yml` files as single YAML metadata documents.
2. Validate source-repository metadata hygiene through tests.
3. Exclude local OS junk files such as `.DS_Store`, `Thumbs.db`, `desktop.ini`, and AppleDouble
   `._*` files from installable tree mappings.
4. Add a lightweight dependency-free secret-safety guard to `publish:changes` and
   `publish:pr-only`.
5. Run the guard against confirmed publish-scope paths and diff content before commit, push, PR
   creation, or PR update side effects.
6. Keep `publish:merge-pr` unchanged in this phase.
7. Do not add bypass flags, dependencies, token-validity network checks, or a full secret-scanning
   product.

Rationale:

- make release/checkpoint hygiene verifiable instead of relying on ad hoc review
- prevent ignored local OS artifacts from entering downstream `.codex/` installs
- reduce risk of locally staged or committed secrets being uploaded by maintained publish commands
- keep the guard high-confidence and self-contained so it fits the current Node publish CLI

Non-goals:

- no release or deployment workflow
- no optional specialist pack or technology-specific skill
- no Node apply-theme replacement
- no package dependency change
- no bypass flag
- no remote PR diff secret scanning

Resulting files / changes:

```txt
README.md
kit/skills/core/code-review/metadata.yml
scripts/install-foundation-kit/mapping.mjs
tests/install-foundation-kit/core.test.mjs
kit/scripts/publish-changes/secret-safety.mjs
kit/scripts/publish-changes/flow.mjs
kit/scripts/publish-changes/pr-only-flow.mjs
tests/publish-changes/secret-safety.test.mjs
tests/publish-changes/flow.test.mjs
tests/publish-changes/modes.test.mjs
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Requirement Clarification Gate and Ambiguity Handling Contract

Accepted decisions:

1. Add a lightweight Requirement Clarification Gate to `agent-operating-contract`.
2. Do not assume every user request is clear, complete, or scope-stable.
3. Pause before execution when ambiguity affects scope, safety, files, architecture, data,
   Git/publish, external side effects, irreversible actions, user intent, or acceptance criteria.
4. State the ambiguity, recommend an interpretation or next decision, and ask the user to confirm.
5. Allow low-risk reversible assumptions only when explicitly stated.
6. Keep `grill-me` as the deep clarification workflow for broad, branching, decision-heavy, or
   systematic requirement discovery.
7. Do not create a separate requirement-clarification skill or workflow.

Rationale:

- reduce unsafe guessing without turning every small assumption into a full clarification session
- keep the global convention in one operating rule
- let existing workflows reference the rule without duplicating it

Non-goals:

- no new skill or workflow
- no broad rewrite of `grill-me`
- no package scripts, runtime code, publish, installer, secret-safety, archive, release,
  deployment, optional-pack, dependency, or generated-package changes

Resulting files / changes:

```txt
kit/rules/agent-operating-contract.md
kit/skills/core/plan-with-context/SKILL.md
kit/skills/core/execute-plan/SKILL.md
kit/skills/core/agent-roles-and-capabilities/SKILL.md
kit/skills/core/grill-me/SKILL.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## AGENTS Template and Operating Contract Alignment

Accepted decisions:

1. Keep `kit/project-templates/AGENTS.md` short and operational.
2. Point downstream agents to `.codex/rules/agent-operating-contract.md` for detailed operating
   rules.
3. Add only short downstream reminders for Requirement Clarification, `grill-me` deep
   clarification routing, and concise reports.
4. Do not duplicate the full Project Memory Context Gate, full Requirement Clarification Gate, or
   future report-depth policy in AGENTS.

Rationale:

- keep the downstream AGENTS template useful as a stable entrypoint
- avoid creating a second policy surface that can drift from the operating contract
- make the newly added ambiguity-handling convention visible to downstream projects

Non-goals:

- no operating-contract rewrite
- no roadmap rewrite
- no full report-depth policy
- no package scripts, runtime code, publish, installer, secret-safety, archive, release,
  deployment, dependency, test, or generated-package changes

Resulting files / changes:

```txt
kit/project-templates/AGENTS.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Report Depth Levels and Final Report Concision Contract

Accepted decisions:

1. Add shared Report Depth Levels to `agent-operating-contract`.
2. Use `Brief`, `Standard`, and `Detailed` as lightweight depth choices.
3. Keep concise output from becoming incomplete by preserving decisions, validation, risks or
   blockers when present, external/global actions, and next recommended steps.
4. Add only short references from high-output workflows.
5. Do not duplicate the full report-depth convention across skills or rewrite existing workflow
   report structures.

Rationale:

- give agents a shared way to scale output detail to task risk and complexity
- prevent small tasks from producing noisy reports
- prevent concise reports from omitting decisions, validation, risks, or external action status

Non-goals:

- no formal report template engine
- no new skill, prompt, or rule file
- no package scripts, runtime code, publish, installer, secret-safety, archive, release,
  deployment, dependency, test, or generated-artifact changes
- no broad rewrite of existing workflow report structures

Resulting files / changes:

```txt
kit/rules/agent-operating-contract.md
kit/skills/core/plan-with-context/SKILL.md
kit/skills/core/execute-plan/SKILL.md
kit/skills/core/code-review/SKILL.md
kit/skills/core/codebase-audit/SKILL.md
kit/skills/core/publish-current-branch/SKILL.md
kit/skills/core/handoff/SKILL.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Engineering Quality Principles Minimal Strengthening

Accepted decisions:

1. Add `Composable Boundaries and Extension Seams` to favor focused units, explicit contracts,
   visible dependency direction, and demonstrated variation before extension points.
2. Add `Configuration, Secrets, and Security Boundaries` to separate deploy-varying configuration
   and secrets from code and keep security-sensitive behavior small and auditable.
3. Prefer secure defaults, least privilege, established libraries or patterns, and docs-first
   verification for security-sensitive behavior.
4. Preserve the existing simplicity and anti-overengineering direction.

Rationale:

- strengthen broadly reusable engineering boundaries before downstream adoption
- close narrow composition, dependency, configuration, secret, and security-boundary gaps
- leave further optimization to concrete downstream project experience

Non-goals:

- no technology-specific framework rules
- no plugin architecture, dependency-injection container, mandatory layering, microservices, or
  CQRS guidance
- no security handbook or custom security mechanism guidance
- no workflow, template, runtime, tooling, dependency, archive, or test changes

Resulting files / changes:

```txt
kit/rules/engineering-quality-principles.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## UI Design Basics Core Supporting Skill

Accepted patterns:

1. Reuse an existing shadcn/ui system when repository evidence confirms it; do not make shadcn/ui
   mandatory.
2. Use Anthropic frontend-design material as process inspiration only, without adopting a strong
   visual persona.
3. Use the last30days pattern of a top-loaded contract, named failure modes, and a final
   self-check.
4. Treat external skill discovery platforms as research sources, not installation approval.

Rejected patterns / non-goals:

- professional design system
- full accessibility audit
- strong or bold default aesthetic
- copied external skill content
- automatic external skill, plugin, MCP, or tool installation
- React, Next.js, or TanStack specialist skills in this theme

Resulting files / changes:

```txt
kit/prompts/force-ui-design-basics.md
kit/rules/agent-operating-contract.md
kit/skills/core/agent-roles-and-capabilities/SKILL.md
kit/skills/core/code-review/SKILL.md
kit/skills/core/execute-plan/SKILL.md
kit/skills/core/plan-with-context/SKILL.md
kit/skills/core/ui-design-basics/SKILL.md
kit/skills/core/ui-design-basics/metadata.yml
kit/skills/core/write-a-skill/SKILL.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## React Component Patterns Source-Only Optional Skill

Accepted patterns:

1. Use official React documentation as the primary technical source.
2. Decompose components around responsibility and data flow rather than arbitrary size limits.
3. Keep state minimal, derived values out of state, and one owner for each state value.
4. Treat Effects and refs as escape hatches, custom Hooks as reusable stateful logic boundaries,
   and memoization as an evidence-based performance tool.
5. Keep the package under `optional-skills/` with install default `never` and explicit adoption.
6. Let planning, execution, and review invoke it only when installed or explicitly adopted.

Rejected patterns / non-goals:

- core or default-installed React guidance
- force prompt or installer behavior
- copied React documentation
- visual design overlap with `ui-design-basics`
- Next.js, React Server Components, TanStack Query, TanStack Router, shadcn/ui, Tailwind, form
  libraries, state-management libraries, testing, frontend architecture, or data-fetching strategy
- package, runtime, publish, template, test, or archive changes

Research basis:

- React Learn: `https://react.dev/learn/thinking-in-react`, `describing-the-ui`,
  `adding-interactivity`, and `managing-state`
- React Learn: `escape-hatches`, `you-might-not-need-an-effect`,
  `referencing-values-with-refs`, and `reusing-logic-with-custom-hooks`
- React API reference: `https://react.dev/reference/react/memo`, `useMemo`, and `useCallback`

Resulting files / changes:

```txt
optional-skills/README.md
optional-skills/react-component-patterns/SKILL.md
optional-skills/react-component-patterns/metadata.yml
kit/skills/core/agent-roles-and-capabilities/SKILL.md
kit/skills/core/plan-with-context/SKILL.md
kit/skills/core/execute-plan/SKILL.md
kit/skills/core/code-review/SKILL.md
docs/optional-skill-catalog.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## TanStack Router and Query Patterns Source-Only Optional Skill

Accepted patterns:

1. Use one combined specialist because Router and Query have a documented coordination boundary,
   while keeping their responsibilities in separate sections.
2. Preserve the project's detected file-based or code-based routing convention and generated-file
   ownership.
3. Treat search params as validated URL state and keep loader dependencies limited to values that
   affect the loader result.
4. Keep TanStack Query focused on server state, complete query keys, deliberate freshness and
   retention, targeted invalidation, and bounded optimistic updates.
5. Reuse one QueryClient when Router loaders coordinate critical Query data; avoid duplicate data
   ownership.
6. Keep the package under `optional-skills/` with install default `never`, explicit adoption, and
   conditional core workflow references.

Rejected patterns / non-goals:

- separate Router and Query skills for the current focused scope
- core or default-installed TanStack guidance
- force prompt, installer behavior, or automatic activation
- copied TanStack documentation or version-specific claims based on model memory
- routing-style migrations without a project need
- React component/local-state or visual-design overlap
- TanStack Table, Form, Virtual, Start, Store, DB, Pacer, AI, or other TanStack libraries
- Next.js, React Server Components, backend/API/database/authentication design, testing strategy,
  full frontend architecture, package, runtime, publish, template, test, archive, or generated-file
  changes

Research basis:

- TanStack Router overview, route trees, file-based routing, navigation, path params, search params,
  data loading, router context, not-found handling, and external data loading:
  `https://tanstack.com/router/latest/docs/`
- TanStack Query React overview, important defaults, queries, query keys, query functions,
  mutations, invalidation, initial data, placeholder data, and optimistic updates:
  `https://tanstack.com/query/latest/docs/framework/react/`
- TanStack Start overview, used only to confirm the full-stack framework boundary:
  `https://tanstack.com/start/latest`

Resulting files / changes:

```txt
optional-skills/tanstack-router-query-patterns/SKILL.md
optional-skills/tanstack-router-query-patterns/metadata.yml
docs/optional-skill-catalog.md
kit/skills/core/agent-roles-and-capabilities/SKILL.md
kit/skills/core/plan-with-context/SKILL.md
kit/skills/core/execute-plan/SKILL.md
kit/skills/core/code-review/SKILL.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Downstream Installation and First-Adoption Hardening

Accepted decisions:

1. Add installer project modes `auto`, `new`, and `existing`; default to `auto`.
2. Resolve project signals or conflicts to existing-like caution in auto mode.
3. Block existing-like conflict apply before staging unless `--overwrite-conflicts` is explicit.
4. Keep conflict display, strong warning, typed confirmation, verified backup, plan revalidation,
   apply, and cleanup on the single existing safe path.
5. Keep mappings, optional-skill installation, downstream package files, dependencies,
   formatter/linter installation, project-memory merging, and publish runtime behavior unchanged.
6. Direct successful installations to force project-context initialization and treat roadmaps as
   initialization input.
7. Keep `.codex/scripts` as the installed helper location, package aliases as manual setup,
   optional skills as manually adopted source-only packages, and Biome as recommendation-only.
8. Promote generic change-safety lessons into the existing engineering quality rule without
   copying source-repository history into downstream templates.

Resulting files / changes:

```txt
scripts/install-foundation-kit/
tests/install-foundation-kit/
README.md
kit/prompts/force-initialize-project-context.md
kit/skills/core/initialize-project-context/SKILL.md
kit/rules/engineering-quality-principles.md
optional-skills/README.md
docs/optional-skill-catalog.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
docs/foundation-design-log.md
```

## Source-Repository Biome Quality Gate

Accepted decisions:

1. Pin Biome 2.5.0 as a source-repository development dependency.
2. Use `pnpm format`, `pnpm format:check`, and `pnpm biome:fix` for source formatting/checking and
   safe Biome fixes, including organize-imports assists.
3. Run `biome check .` before publish tests, installer tests, and whitespace validation in
   `pnpm check`.
4. Apply source checks to installable `kit/` content before it is published or installed.
5. Do not install Biome, create Biome configuration, or modify `package.json` in downstream
   projects.
6. Keep downstream Biome adoption recommendation-only when initialization finds no existing
   formatter/linter setup.

Resulting files / changes:

```txt
biome.json
package.json
pnpm-lock.yaml
README.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
docs/foundation-design-log.md
```

## Explicit Auto-Merge for Pending Required Checks

Accepted decisions:

1. Add public `--auto-merge` only to explicit `merge-pr` mode and expose the source alias
   `pnpm publish:merge-pr:auto -- <PR_NUMBER>`.
2. Preserve immediate squash merge when required checks pass and continue blocking failed or
   unknown checks and every existing worktree, PR-state, base, mergeability, and head-OID hazard.
3. For pending checks with explicit authorization, reuse the GitHub client to request
   `gh pr merge <PR_NUMBER> --auto --squash --match-head-commit <SHA>`.
4. Read the PR once after the request. Refresh the local default branch only after verified merge;
   otherwise report auto-merge enabled and leave the local branch unchanged without polling.
5. Treat repository-level **Allow auto-merge** as a prerequisite, not per-PR activation. Auto-merge
   waits for required checks and reviews and never bypasses them.
6. Preserve PR-only behavior, installer behavior, downstream `package.json`, and optional manual
   downstream aliases.

Resulting files / changes:

```txt
kit/scripts/publish-changes/cli-options.mjs
kit/scripts/publish-changes/merge-pr-flow.mjs
kit/scripts/publish-changes/final-report.mjs
kit/scripts/publish-changes/validation.mjs
package.json
tests/publish-changes/
README.md
kit/skills/core/publish-current-branch/SKILL.md
kit/prompts/force-publish-current-branch.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Skill Taxonomy and Token-Load Boundaries

Accepted decisions:

1. Use conceptual `meta`, `core`, and `optional` categories without moving existing meta
   candidates out of `kit/skills/core/` in this theme.
2. Declare `invocation: user | model | support`, `required`, and hard `depends_on` relationships in
   every current skill metadata file.
3. Keep meta dependencies within meta; allow core and optional skills to depend on meta; keep meta
   and core functional without optional skills; require explicit optional-to-optional dependencies.
4. Treat metadata descriptions as invocation logic, keep model descriptions trigger-focused, keep
   user wrappers thin, and keep shared behavior behind one canonical meta skill or rule.
5. Rename `write-a-skill` to `writing-great-skills` inside `kit/skills/core/` while preserving its
   mature content and updating its force prompt and active references.
6. Add metadata-policy validation without changing installer mappings, optional installation,
   downstream package behavior, publish workflows, or unrelated scripts.
7. Defer physical `kit/skills/meta/` migration to a separately reviewed theme.

Resulting files / changes:

```txt
README.md
kit/rules/skill-invocation-and-dependency-boundaries.md
kit/rules/engineering-quality-principles.md
kit/skills/core/*/metadata.yml
kit/skills/core/writing-great-skills/
kit/prompts/force-writing-great-skills.md
optional-skills/*/metadata.yml
tests/install-foundation-kit/core.test.mjs
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Extract Grilling Primitive

Accepted decisions:

1. Add `grilling` under `kit/skills/core/` as a concise `meta` / `support` skill with no triggers,
   force prompt, or dependencies.
2. Make the shared primitive own evidence-first questioning, blocking-only persistence,
   dependency-ordered branch traversal, one-question default, recommended answers, and the
   continue-or-blocked stop decision.
3. Keep `grill-me` as the user-facing clarification workflow, reclassify it as `meta`, and declare
   its dependency on `grilling`.
4. Add short `grilling` references and hard dependencies to `plan-with-context`,
   `initialize-project-context`, and `project-architecture-plan` only at their clarification
   boundaries.
5. Preserve all mature output formats, role routing, approval/execution boundaries, relationship
   routing, stop conditions, and project-memory ownership.
6. Strengthen metadata regression tests for the primitive and consumer graph.
7. Keep physical paths under `kit/skills/core/`; do not change installer mappings, optional skill
   installation, publish behavior, or deferred skill themes.

Resulting files / changes:

```txt
kit/skills/core/grilling/SKILL.md
kit/skills/core/grilling/metadata.yml
kit/skills/core/grill-me/SKILL.md
kit/skills/core/grill-me/metadata.yml
kit/skills/core/plan-with-context/{SKILL.md,metadata.yml}
kit/skills/core/initialize-project-context/{SKILL.md,metadata.yml}
kit/skills/core/project-architecture-plan/{SKILL.md,metadata.yml}
tests/install-foundation-kit/core.test.mjs
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Skill Token-Load Pruning — Bounded First Pass

Accepted implementation scope:

1. Tighten only the `code-review` and `codebase-audit` metadata descriptions so they focus on
   invocation rather than workflow documentation.
2. Replace duplicated taxonomy, invocation, and dependency prose in `writing-great-skills` with a
   concise pointer to the canonical rule.
3. Preserve all workflow structures, safety boundaries, installer behavior, mappings, optional
   installation behavior, tests, prompts, rules, and physical skill directories.

Resulting files / changes:

```txt
kit/skills/core/code-review/metadata.yml
kit/skills/core/codebase-audit/metadata.yml
kit/skills/core/writing-great-skills/SKILL.md
.codex/project/project-guideline.md
docs/foundation-design-log.md
```

## Skill Token-Load Pruning — Bounded Second Pass

Accepted implementation scope:

1. Tighten only the `publish-current-branch` metadata description so it states the invocation
   purpose without documenting publish mechanics.
2. Preserve the complete publish workflow, safety boundaries, installer behavior, mappings,
   optional installation behavior, tests, prompts, rules, package scripts, and skill directories.

Resulting files / changes:

```txt
kit/skills/core/publish-current-branch/metadata.yml
.codex/project/project-guideline.md
docs/foundation-design-log.md
```

## Physical Meta Skill Directory Migration — Completed Stages B and C

Accepted implementation result:

1. Move the ten meta skill directories to `kit/skills/meta/` while keeping the six core workflow
   directories under `kit/skills/core/`.
2. Keep optional skills source-only under `optional-skills/` and outside default installation.
3. Preserve the installer complete-tree `kit/skills/` mapping so fresh installs include both meta
   and core skills without separate mappings.
4. Do not add downstream obsolete-path detection, deletion, backup, movement, or automatic cleanup;
   existing downstream cleanup remains manual or separately planned.
5. Preserve historical pre-migration path references as historical records while using
   category-aligned paths in current and forward-looking documentation.

Resulting current-state records:

```txt
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
docs/foundation-design-log.md
```

## Explicit Target Reference Guardrail

Accepted implementation result:

1. Make `kit/rules/agent-operating-contract.md` the single canonical owner for verifying concrete
   repository targets before relying on them.
2. Require missing, stale, obsolete, or category-inconsistent targets to be reported; stop when a
   required target blocks safe work and mark non-blocking unavailable or historical references
   before continuing.
3. Classify prospective outputs, placeholders, examples, and historical records separately so the
   guardrail does not create false missing-target failures or rewrite history.
4. Keep root/downstream entrypoints, taxonomy, and initialization to concise pointers.
5. Add focused canonical-ownership and active stale-meta-path regression checks.
6. Preserve installer runtime and mapping, downstream cleanup boundaries, metadata, prompts,
   optional skills, package scripts, physical directories, and mature workflow contracts.

Resulting files / changes:

```txt
AGENTS.md
kit/project-templates/AGENTS.md
kit/rules/agent-operating-contract.md
kit/rules/skill-invocation-and-dependency-boundaries.md
kit/skills/meta/initialize-project-context/SKILL.md
tests/install-foundation-kit/core.test.mjs
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Theme 23: Diagnosis and Work Item Slicing

Theme 23 adds two core engineering workflow skills: `diagnose` and `to-work-items`.

`diagnose` introduces an evidence-first debugging workflow for bugs, failing tests, regressions,
unexpected behavior, production-like symptoms, flaky behavior, broken builds, and performance
issues. It requires a tight red-capable feedback loop, explicit hypotheses, targeted evidence
collection, and validation against the same signal after an approved fix.

`to-work-items` converts approved or sufficiently clear plans into small, agent-ready vertical
slices with dependencies, acceptance criteria, validation commands, and suggested workflow
routing. It is local-first under `dev_locals/plans/` and does not create GitHub Issues directly in
this version.

The theme also adds concise module-depth and seam vocabulary to engineering quality principles and
clarifies that stable domain vocabulary belongs inside existing project memory rather than a
parallel `CONTEXT.md` system.

External skills from Matt Pocock's public skills repository were used only as inspiration. The
update deliberately avoids copying external text, introducing a second memory system, adding issue
tracker automation, or broadly rewriting mature skills.

## Existing-Project Safe Upgrade and Optional-Skill Source Migration

The maintained installer now separates content state, ownership, and bounded migration state.
`--apply --skip-conflicts` writes only genuinely new safe entries and uses a no-replace final write;
identical files are skipped, while differences, project memory, differing `AGENTS.md`, and legacy
skill collisions remain review items. The established explicit backup-and-overwrite workflow is
unchanged.

The active optional-skill source moved into `kit/optional-skills/`. Exact repeatable
`--include-optional <name>` selections map only to `.codex/skills/engineering/<name>/` and remain
excluded by default. Collision checks are limited to kit-managed core, meta, and engineering
namespaces. Project-local `.codex/skills/project/` content remains outside installer inspection and
ownership. Historical root-level optional-skill references above remain chronology, not current
source-path guidance.

## Execute Plan Pre-Execution Status Update

`execute-plan` now requires one concise user-visible readiness update after applicable preflight
checks and before branch creation, file changes, or another execution mutation. The update covers
the approved plan and readiness state, project-memory alignment, relevant repository and PR state,
branch strategy, conditionally required runtime/tooling alignment, staged implementation groups,
and stop conditions. Checks that are not applicable or not checkable must be identified honestly.

This is a reporting contract over existing execution requirements. It does not introduce universal
GitHub, clean-default-branch, runtime, or tooling checks; alter plan approval or validation; or
change installer, script, prompt, metadata, package, dependency, or test behavior. Local branch
creation remains local setup only. Push, PR creation, merge, release, deployment, and publish
actions remain outside `execute-plan`, with push/PR/merge behind an explicit
`publish-current-branch` workflow switch.

## Existing-Project Workflow-Script Merge Safety

The installer now classifies mapped `.codex/scripts/*` files as `workflow-script` ownership.
Existing-different scripts become `script-merge` review items and receive a `[SCRIPT-MERGE]`
warning that calls out possible project-specific workflow, publish, CI, or local automation
changes. Final reports surface script-merge counts separately.

New scripts still install normally, identical scripts remain no-ops, and
`--apply --skip-conflicts` still writes only safe new entries with no target overwrite or backup
prompt. Explicit overwrite retains its existing verified backup, typed confirmation, and plan
revalidation behavior. No script auto-merge/migration, `.codex/skills/project/` handling,
installer redesign, dependency/runtime change, or publish/push/PR/merge/release/deploy behavior
was added.

## Capability-Preserving Skill Efficiency — First Phase

Accepted implementation result:

1. Add one compact installable standard for skill/rule/output efficiency with the primary
   constraint that intelligence, capability, and safety must not be reduced.
2. Preserve context and approval gates, validation, STOP conditions, workflow and publish
   boundaries, uncertainty, failure evidence, and required final-report facts.
3. Allow terse success-path progress and canonical-owner deduplication only when behavior and
   boundary visibility remain unchanged.
4. Create a local read-only audit of the 12 P1 artifacts with a canonical owner map, preservation
   criteria, regression scenarios, one later pilot recommendation, and rollback guidance.
5. Record reviewable work-item decomposition as a separate future-work candidate involving
   `plan-with-context`, `to-work-items`, `execute-plan`, and potentially
   `engineering-quality-principles`; do not modify those files in this phase.
6. Preserve all existing P1 content and installer, mapping, publish, package, dependency, runtime,
   prompt, metadata, test, archive, release, and deployment behavior.

Resulting files / changes:

```txt
kit/rules/skill-and-output-efficiency.md
dev_locals/research-notes/2026-06-20-capability-preserving-skill-efficiency-audit.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
docs/foundation-design-log.md
```

## Execute Plan Output Noise Control

Accepted implementation result:

1. Add a compact `Output Noise Control` section to `execute-plan`.
2. Preserve the required pre-execution status update and all approval, scope, validation, drift,
   mutation, STOP, memory, commit, and publish boundaries.
3. Prefer terse checkpoints for routine successful progress.
4. Keep warnings, blockers, skipped checks, validation failures, and scope drift complete with
   reason, evidence, impact, and next action when relevant.
5. Keep final reports complete while permitting changed-file count/category summaries when Git or
   the UI already exposes exact paths; retain exact paths when review or safe follow-up needs them.
6. Do not change planning, work-item slicing, publishing, installer, mapping, package, dependency,
   runtime, prompt, metadata, test, archive, release, or deployment behavior.

Resulting files / changes:

```txt
kit/skills/core/execute-plan/SKILL.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

## Reviewable Work-Item Planning

Accepted implementation result:

1. Require `plan-with-context` to classify non-trivial work as one focused execution pass,
   embedded reviewable work items, or a route to `to-work-items`.
2. Add the reviewability decision to the saved-plan structure and require a brief single-pass
   justification or explicit decomposition route.
3. Keep `to-work-items` as the canonical non-executing decomposition workflow and add expected
   file/area scope, allowed mutation, non-goals, STOP conditions, and review/PR boundaries to each
   work item.
4. Require `execute-plan` to verify the approved current slice is scoped, validated, and
   reviewable before mutation.
5. Stop and route broad or review-hostile plans back to planning or decomposition; do not silently
   split and continue execution.
6. Execute only the approved current slice unless the user explicitly approves multiple slices
   together after their combined scope and reviewability are visible.
7. Preserve planning/execution approval, validation, project-memory, and publish boundaries.
8. Leave `engineering-quality-principles` unchanged because its existing Small Focused Changes
   and Change Safety sections already establish the general quality principle.

Resulting files / changes:

```txt
kit/skills/meta/plan-with-context/SKILL.md
kit/skills/core/to-work-items/SKILL.md
kit/skills/core/execute-plan/SKILL.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```
