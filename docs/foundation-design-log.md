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
- GitHub ruleset / branch protection setup guidance
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

## Current Recommended Next Themes

Priority order after Theme 12:

1. productivity skills completion: `grill-me`, `handoff`, `write-a-skill`
2. GitHub ruleset / branch protection setup guidance
3. technology-specific skills
4. release workflow
5. deployment workflow

Rationale:

- `code-review` should follow because it is the remaining planned v0.1 core skill and will use role routing plus engineering quality principles.
- Installer hardening should follow once the core installed workflow set is clearer.
- Productivity and technology-specific skills should come after the core project lifecycle is more stable.

## Future Ideas

- safe update for non-empty projects
- backup before overwrite
- diff before overwrite
- project-specific file protection
- skill version migration
- optional technology-specific skills
- support for agent directories beyond `.codex/`
- optional teach workflow for learning-oriented projects
- GitHub ruleset / branch protection setup checklist
- release workflow
- deployment workflow
- deliberate reusable lesson/rule distillation from `.codex/project/lessons-learned.md` into `kit/`
