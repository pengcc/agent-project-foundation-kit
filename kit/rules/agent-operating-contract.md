# Agent Operating Contract

## Purpose

This rule defines the first-run and daily operating contract for agents working in a project that installed the foundation kit.

Keep this contract concise and operational. Use the relevant workflow skill for details.

## Startup Order

After installing the foundation kit, or when adopting an existing project for the first time, start in this order:

```txt
AGENTS.md
-> project-memory
-> agent-roles-and-capabilities
-> initialize-project-context
-> routed follow-up skill
```

Do not jump directly into feature planning or implementation before initialization unless the user explicitly accepts the risk.

`grill-me` is not the first startup step. Use it when goals, scope, requirements, constraints, or decision branches remain unclear after checking available project context.

## Project Memory Context Gate

Before a workflow produces project-state output or changes project state, pass the Project Memory
Context Gate defined in the installed `project-memory` skill. Use its source selection, sequence,
reporting interface, and continuation rules rather than redefining them in this contract or in
individual workflow skills.

## Explicit Target Reference Guardrail

Before treating a concrete repository path as evidence, authoritative instructions, a workflow
input, a required dependency, or a target to inspect, modify, review, or validate:

1. resolve it against the current project or source layout;
2. verify that it exists as the expected file or directory;
3. compare it with current sources and known renames or migrations when locations conflict;
4. for skill packages, verify that the physical root matches `metadata.yml` category when
   relevant; and
5. classify the reference as current, unavailable, stale or obsolete, inconsistent, prospective,
   or historical.

Do not treat a path as a missing existing target when it is explicitly a new output to create, a
wildcard or placeholder, a clearly marked example, or part of a clearly historical decision,
design log, completed plan, or research report. For prospective output, verify its intended
parent, scope, and creation authority instead of requiring the final target to exist.

If a required existing target is missing, stale, or inconsistent, report the referenced path,
expected role, and observed state. Do not silently substitute a guessed path or claim the target
was read or applied. Stop and ask for direction when the target is required for correctness,
scope, safety, or workflow authority. If it is non-blocking, continue only after marking the
reference unavailable, stale, or historical and explaining the limited impact.

Installed meta skills use `.codex/skills/meta/<meta-skill>` and installed core skills use
`.codex/skills/core/<core-skill>`. A meta skill referenced under `.codex/skills/core/` is stale
unless the reference is clearly historical. Verification does not authorize creating, editing,
moving, deleting, backing up, migrating, or cleaning targets; those actions require the active
approved workflow. The installer does not automatically clean obsolete installed paths.

## Requirement Clarification Gate

Do not assume a user request is clear, complete, or scope-stable.

If ambiguity affects scope, safety, files, architecture, data, Git or publishing, external side
effects, irreversible actions, user intent, or acceptance criteria, pause before execution. State
the ambiguity plainly, provide the recommended interpretation or next decision, and ask the user
to confirm before proceeding.

For low-risk reversible assumptions, the agent may proceed only when the assumption is explicitly
stated.

Use `grill-me` when ambiguity is broad, branching, decision-heavy, or requires systematic
requirement discovery. Do not route every tiny ambiguity to `grill-me`.

## Project Root Boundary

The current project root is the default file-operation boundary.

Do not write, delete, move, or generate files outside the project root unless the user explicitly
approves the exact path and purpose. Read-only global toolchain diagnostics are allowed when
needed to distinguish project-local state from machine state.

Any exception must include:

1. exact path
2. reason
3. risk
4. cleanup or rollback option
5. user confirmation

Controlled exceptions must be documented by the active workflow. For example, the foundation-kit installer may copy from `repo_root/kit/` into an explicit `target_root/`.

## Global Toolchain and Out-of-Project Operation Boundary

Project-local runtime configuration and global machine configuration are separate trust
boundaries.

Without explicit user approval, agents must not install, upgrade, downgrade, unlink, relink,
configure, or otherwise mutate:

- Homebrew or other system package managers and packages
- Node.js, pnpm, npm, corepack, mise, Volta, or global package managers
- shell profiles such as `.zprofile`, `.zshrc`, or `.bashrc`
- PATH configuration
- global Git configuration
- files outside the current project root

Read-only diagnostics are allowed without approval. Examples include `node -v`, `which node`,
`which -a node`, `pnpm -v`, `mise current`, `mise doctor`, `brew info`,
`brew list --versions`, Homebrew log inspection, PATH inspection, shell-profile inspection without
editing, and Git configuration inspection without modification.

Mutating commands such as `brew install`, `brew upgrade`, `brew reinstall`, `brew link`,
`brew unlink`, `mise use -g`, non-project/global `mise install`, `pnpm env use`,
`corepack enable`, shell-profile edits, PATH changes, and global Git configuration changes require
explicit approval.

If required tooling is missing or wrong:

1. stop the affected workflow
2. report the detected version
3. report the required version
4. report the failing command
5. distinguish global runtime state from project-local runtime state
6. recommend a manual fix and explain global-change risk
7. wait for explicit approval before running a mutating command

Never silently change global tooling to make validation pass. If a possible global or
out-of-project change is discovered, report it instead of hiding it or assuming it is safe.

## Skill Routing Map

Use the matching skill instead of bypassing the workflow.

```txt
First project adoption / onboarding:
  initialize-project-context

Role and capability routing:
  agent-roles-and-capabilities

Unclear goals / requirements / decision branches:
  grill-me

Unclear or drift-prone task/change, or unclear product purpose / user goals / PRD baseline:
  product-framing-review

External technical facts / framework behavior / community practice:
  docs-first-research

Architecture direction / module boundaries:
  project-architecture-plan

Concrete UI screen / flow / form clarity:
  ui-design-basics

Feature or implementation planning:
  plan-with-context

Approved execution:
  execute-plan

Review / alignment / PR / diff:
  code-review

Repository survey / prioritized improvement audit:
  codebase-audit

Cross-session / cross-agent continuation:
  handoff

Skill creation / skill refinement:
  writing-great-skills

Durable memory update:
  update-project-memory

Push / PR / merge:
  publish-current-branch
```

If a referenced skill is not installed yet, state that clearly and use the closest installed workflow without pretending the missing skill exists.

When a technology-specific or domain-specific skill would be useful but is not installed, follow
the Missing Specialist Skill Policy in `agent-roles-and-capabilities`; do not define a separate
policy here.

## Concise Output Contract

Stay concise, but not incomplete.

Use the shortest format that preserves:

- correctness
- project terminology
- decisions
- risks
- validation status
- next actions

Do not produce long reports when a short answer is enough. Do not compress away important uncertainty, warnings, or decisions.

## Report Depth Levels

Use the smallest report depth that preserves correctness and decision quality.

- `Brief`: simple answers, confirmations, or work with no meaningful repository mutation.
- `Standard`: normal planning, implementation, review, publish, or PR work.
- `Detailed`: audits, architecture decisions, high-risk changes, ambiguous requirements,
  user-requested deep analysis, or multi-step validation.

Concise does not mean incomplete.

Meaningful reports should preserve:

- what changed, what was reviewed, or what was decided
- validation status
- risks, uncertainties, blockers, or scope deviations when present
- external/global actions
- next recommended step

## Durable Project Memory Loop

After meaningful planning, implementation, debugging, review, publishing, installation, or major discussion, consider whether durable project memory should be updated.

Route durable knowledge as follows:

```txt
Current facts -> .codex/project/project-guideline.md
Long-term decisions -> .codex/project/project-decisions.md
Lessons and reusable patterns -> .codex/project/lessons-learned.md
```

Use `update-project-memory` for confirmed updates.

Do not silently update memory. Do not copy plans, handoffs, logs, or scratch notes into project memory. Summarize only durable facts, decisions, and reusable lessons.

Project-local lessons must not be copied into installable templates or kit assets merely because
they exist in local memory. Reusable lesson promotion requires generalization, explicit user
confirmation, and an approved plan before changing foundation-kit rules, skills, templates, or
documentation.

## Lessons as Pattern Memory

`lessons-learned.md` is not only for mistakes.

Use it for:

```txt
Avoid:
  mistakes, risks, bad patterns, repeated failure modes

Keep:
  successful patterns, useful workflows, good validation strategies, stable engineering practices

Mixed:
  tradeoffs or patterns that are useful only in specific contexts
```

Do not record one-off noise or unverified assumptions.

## Evidence-First Research

Use `docs-first-research` when work depends on external technical facts, official behavior, tool behavior, framework/version behavior, security-sensitive guidance, deployment behavior, or high-quality community practice.

Project files and durable project memory are the source of truth for project-specific facts.

Official documentation and high-quality primary/community sources beat model memory.

Do not copy third-party skills or rules directly into the project. Treat external skills as
reference candidates, extract patterns only after evaluation, rewrite them for this project, and
keep runtime rules auditable.

## Scope and Safety Guardrails

Apply `task-and-change-safety-principles.md` for proportional scope, focused and reviewable
changes, validation and evidence, safe update methods, and conditional design flexibility. That
shared rule guides judgment only; it does not replace any startup, context, approval, project-root,
global-tooling, routing, memory, reporting, publish, or other hard boundary in this contract.

- Do not expand scope without calling it out.
- Do not bypass matching installed skills.
- Do not perform destructive actions without explicit user approval.
- Do not publish, merge, release, or deploy unless the user explicitly requests the matching workflow.
- Do not introduce dependencies, tooling, architecture changes, or workflow changes without checking project memory and explaining impact.
- Prefer small, reversible changes.

## Final Report Boundary

Every task final report must explicitly include:

```txt
External / global actions:
- None
```

If any external or global action was performed with explicit approval, list the command or change,
approval, reason, and result.

## Publishable Change Handoff

When a non-publish workflow creates or recommends committing publishable repository changes and
leaves them for later publication, its final report must include:

Recommended update type: <small safe update | normal update | significant / high-impact update>

Recommended commit message: <commit message>

Recommended PR title: <PR title>

Create PR for review command:

```bash
pnpm publish:pr-only "<commit message>" "<PR title>"
```

Recommended next action:
Create the PR for review, then run code-review on the resulting PR.

Publication guardrail: do not create/update a PR unless the user explicitly authorizes PR publication; do not merge, release, deploy, or otherwise finalize publication until review is complete and the user explicitly authorizes it.

Reproduce these six field labels in this order. Do not paraphrase, rename, merge, or substitute
descriptive prose for any field. Keep the fields as normal report text; do not wrap the complete
handoff in a code block.

The `Create PR for review command` label must be normal text followed by a `bash` code block
containing only this fixed command shape:

```bash
pnpm publish:pr-only "<commit message>" "<PR title>"
```

Use the same commit message and PR title values in their fields and in the command. Whenever
`Recommended commit message` and `Recommended PR title` are present for a publishable local
change, `Create PR for review command` and `Recommended next action` are also required. Do not
silently omit either field.

Print the fixed command without executing it and without requiring per-task package-script
verification. A missing or different project publishing command is a project setup issue; it does
not change this stable handoff format. Do not use `pnpm publish:changes` as the create-PR-for-review
command and do not infer another command form from package script names.

When no publishable local change exists, including blocked, analysis-only, review-only,
planning-only, failed-validation, no-change, or reverted-change outcomes, do not print a command.
Use:

```txt
Publishable change handoff:
not applicable; no publishable local change.

Create PR for review command:
not applicable.

Recommended next action:
<appropriate blocker, retry, planning, or none action>
```

Local-only artifacts, including `dev_locals/**` plans, research notes, handoffs, scratch files,
execution logs, dry-run reports, temporary notes, or unsaved conversation text, are not
publishable unless the project explicitly marks them as publishable. When only local-only
artifacts changed, use the no-publishable-change handoff above and also report:

```txt
Publishable changes: none; local-only artifacts changed: <paths or summary>
```

When publishable changes and local-only artifacts both changed, include the handoff for the
publishable scope and report the local-only artifacts separately. Do not include local-only
artifacts in the proposed commit or create-PR-for-review scope.

Do not create or update a PR unless the user explicitly authorizes publishing the branch for
review. The PR-only action exists so review can happen; it does not require completed review. Do
not merge, release, deploy, or otherwise finalize publication until review is complete and the
user explicitly authorizes that action. `publish-current-branch` remains the only workflow
authorized to push, create or update a PR, or merge, and its own factual Publish Summary is outside
this pre-publication handoff. This handoff does not itself authorize any publication action.
