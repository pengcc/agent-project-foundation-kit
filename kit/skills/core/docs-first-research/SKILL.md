# Docs-First Research Skill

Use this skill when a task depends on technical facts, official API behavior, version-specific behavior, configuration rules, deployment behavior, testing tools, external services, or best practices.

This skill prevents agents from relying only on model memory when official documentation or project files should be the source of truth.

## Role

When using this skill, act as:

```txt
Research Assistant
```

The Research Assistant verifies technical facts, checks project reality, exposes uncertainty, and recommends the safest next step.

## When to Use

Use this skill when a task involves:

- Technical judgment
- Framework or library API usage
- Version-specific behavior
- Dependency selection or upgrades
- Configuration changes
- Build, lint, format, test, or deploy workflow changes
- GitHub Actions or CI/CD changes
- External service integration
- Security or privacy-sensitive behavior
- Database schema or migration behavior
- Debugging that may depend on framework, runtime, or library behavior
- Code review involving API correctness, configuration, security, deployment, or best practices

This skill may be used independently, or as a required pre-check inside another workflow.

## When Not to Use

Do not require this skill for:

- Pure wording changes
- Small README copy edits
- Local project-memory formatting work that does not introduce technical facts
- Small renames that do not affect runtime behavior
- User-requested drafts that do not involve technical judgment
- Internal project organization that only uses already-confirmed project facts

If the task is low-impact and purely local, state why docs-first research is not required.

## Required Context

Always check project reality when available:

```txt
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

When relevant, also check:

```txt
package.json
lockfile
README.md
.env.example
config files
existing code
current plan or handoff
```

Use official documentation when the task depends on external technical facts.

## Workflow Header

Use this header:

```txt
Workflow:
- Role: Research Assistant
- Skill: docs-first-research
- Context: official docs + project files
- Mode: research / verification
```

If official docs are unavailable, use:

```txt
Workflow:
- Role: Research Assistant
- Skill: docs-first-research
- Context: project files; official docs unavailable
- Mode: degraded research mode
```

## Source Priority

Use sources in this order.

### Level 1: Official Sources

Prefer:

- Official documentation
- Official API reference
- Official migration guides
- Official release notes
- Official changelogs
- Official examples
- Official GitHub repository README or docs
- Official blog posts from the maintainers or project

Examples:

- Next.js: official Next.js docs
- React: official React docs
- Node.js: official Node.js docs
- pnpm: official pnpm docs
- Playwright: official Playwright docs
- Vitest: official Vitest docs
- Vite: official Vite docs
- GitHub Actions: official GitHub Docs

### Level 2: Project Sources

Project sources define how this project actually works.

Use:

- `.codex/project/project-guideline.md`
- `package.json`
- lockfile
- config files
- existing code
- README
- `.env.example`

Official docs explain how a technology should work. Project files explain how this project currently uses it.

### Level 3: High-Quality Secondary Sources

Use only when official sources are missing, unclear, or insufficient.

Examples:

- Maintainer comments in GitHub issues or discussions
- RFCs
- Well-known technical articles
- High-quality Stack Overflow answers
- Ecosystem examples from reputable projects

Clearly label these as non-official sources.

### Level 4: Model Knowledge

Model knowledge may be used only to:

- Explain concepts
- Generate hypotheses
- Suggest search directions
- Compare options after sources are checked

Model memory must not override official documentation or project reality for:

- API usage
- Configuration
- Version behavior
- Security guidance
- Deployment behavior
- Breaking changes
- Dependency compatibility

## Conflict Rules

If official documentation conflicts with model memory, official documentation wins.

If official documentation conflicts with project files, do not silently choose one.

Report the conflict:

```txt
Conflict:
- Official docs:
- Project current state:
- Likely reason:
- Recommended action:
```

A project may intentionally use older versions or special constraints. Verify before changing behavior.

## Research Depth

Choose the smallest useful research depth.

### Quick Check

Use for small technical confirmations.

Examples:

- Confirm an API option name
- Confirm a config key
- Confirm whether a version supports a feature
- Confirm a package script expectation

Output:

```txt
Docs Check:
- Official source:
- Project source:
- Conclusion:
```

### Standard Research

Use for implementation planning, dependency introduction, configuration changes, and non-trivial debugging.

Output:

```txt
Research Summary:
- Question:
- Official sources checked:
- Project files checked:
- Findings:
- Project impact:
- Recommendation:
- Uncertainty:
```

### Deep Research

Use for high-risk, architectural, migration, deployment, security, CI/CD, or dependency-replacement decisions.

Output:

```txt
Deep Research Summary:
- Decision to support:
- Official sources:
- Project current state:
- Options:
- Trade-offs:
- Risks:
- Migration impact:
- Recommendation:
- Open questions:
```

Do not write a long report when a quick check is enough.

## Source Reporting

Always list sources, but scale the detail to the research depth.

- Quick Check: 1-2 key sources
- Standard Research: official sources, project files, and key conclusion
- Deep Research: key sources, conflicts, trade-offs, risks, and uncertainty

If no official source was checked, say so.

Never imply that official documentation was checked when it was not.

## Degraded Research Mode

Use degraded research mode when official documentation cannot be accessed.

Degraded mode does not automatically block all work.

It blocks unconfirmed high-impact technical decisions.

### Required Declaration

State:

```txt
Research Access:
- Official docs: unavailable
- Project files: available | unavailable
- Mode: degraded research mode
- Risk:
```

### High-Impact Tasks

For high-impact tasks, stop and request confirmation before continuing.

High-impact tasks include:

- Adding or upgrading dependencies
- Changing framework configuration
- Changing build, test, lint, deploy, or CI/CD workflows
- Changing GitHub Actions
- Changing deployment or release behavior
- Changing database schema or migrations
- Changing authentication, security, or privacy-related logic
- Changing third-party API integration
- Performing architectural refactors

Use:

```txt
Official documentation cannot be verified in this environment.
This task may affect <area>.
I should not finalize or execute this high-impact change without confirmation.

Please confirm whether to continue based on project files and clearly marked uncertainty.
```

### Local Low-Impact Tasks

For local, low-impact work, the agent may recommend continuing after explaining why the impact is limited.

Examples:

- Reorganizing existing local project documentation
- Cleaning up project memory structure
- Formatting existing guidance
- Updating wording without introducing new technical facts
- Working from already-confirmed project files

Use:

```txt
Research Access:
- Official docs: unavailable
- Project files: available
- Mode: degraded research mode
- Impact: local documentation/workflow cleanup only

Official documentation is unavailable, but this task only reorganizes local project files and existing project rules.
It does not introduce new dependencies, external API usage, version-sensitive behavior, deployment changes, or architecture decisions.

Recommended: continue with project-file-based work.
```

### Project Memory Updates

Even in low-impact degraded mode, project memory must not be updated silently.

If `.codex/project/project-guideline.md`, `project-decisions.md`, or `lessons-learned.md` needs to change, use the `update-project-guideline` workflow and provide its required summary first.

## Interaction With Other Skills

### plan-with-context

If a plan involves technical judgment, run docs-first-research first or include its findings in the plan.

The plan should include:

```txt
Research basis:
- Official docs checked:
- Project files checked:
- Key conclusion:
```

### execute-plan

If execution encounters an unverified technical assumption, pause and use docs-first-research before writing code.

Do not implement version-sensitive or API-sensitive changes based only on the plan if the assumption was not verified.

### code-review

Use docs-first-research during review when reviewing:

- API correctness
- Configuration correctness
- Security-sensitive behavior
- Deployment behavior
- Version-specific behavior
- Official best practices

### publish-current-branch

Docs-first research is not normally required for publishing the current branch.

Use it if the task changes:

- GitHub Actions
- Release process
- Deployment configuration
- Package publishing rules
- Branch protection assumptions

### update-project-guideline

If long-term project memory will record external technical facts, official constraints, version limitations, or important risks, base the update on docs-first-research findings when possible.

## Project Memory Boundary

This skill does not directly update project memory.

At the end, report:

```txt
Project memory update needed: yes | no
Reason:
Suggested next workflow:
```

Suggest `update-project-guideline` if the research finds durable:

- Project facts
- Technical constraints
- Official limitations
- Version-specific requirements
- Important risks
- Decision rationale
- Deprecated APIs or migration requirements

Do not silently modify:

```txt
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

## Output Expectations

Every docs-first-research output should include:

- Research depth
- Sources checked
- Project files checked
- Findings
- Impact
- Recommendation
- Uncertainty
- Project memory update needed

Keep the output proportional to the task risk.
