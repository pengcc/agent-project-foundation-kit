# Docs-First Research Skill

## Role Routing Integration

If `agent-roles-and-capabilities` is installed, read or apply it before continuing.

Then output a concise Role Routing Header using this default routing:

```txt
Role Routing:
- Primary role: Technical Researcher
- Supporting roles: Framework Specialist, Security Reviewer, Tooling Reviewer, Database Engineer as needed
- Workflow: docs-first-research
- Maturity expectation: careful evidence-based judgment
- Technical specialist skill: no technology-specific skill assumed; use official documentation and project sources for framework/API/version/config claims
- Quality rule: engineering-quality-principles applies when research informs planning, architecture, implementation, or review
```

Do not claim `agent-roles-and-capabilities` was used unless it was actually read or applied.


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

For research that may affect project planning, implementation, review, workflow, tooling, or
project memory, pass the Project Memory Context Gate first and include its report in the research
context.

For pure external fact lookup with no project impact, state that the Project Memory Context Gate
is not applicable and explain why.

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

When inspecting external skills, treat them as reference candidates only. Do not copy their rules
wholesale; evaluate fit, safety, and workflow conflict before adapting any pattern for this kit.

## External Skill Evaluation

Use this workflow to verify external source facts and evaluate external skill patterns before any
adaptation. It does not install, adapt, or copy external skills.

Check source URL, provenance, license/copying risk, trigger fit, boundary fit, workflow conflict,
ecosystem-specific assumptions, tool assumptions, file/network/mutation permissions, secret
handling risk, source freshness, and whether adaptation should route to `writing-great-skills`.

Use this compact output when evaluating an external skill:

```txt
External source checked:
Useful patterns:
Rejected patterns:
Adaptation recommendation:
Required project-specific rewrite:
Risks / open questions:
Next workflow:
```

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

Use sources in this order:

1. Official sources
2. Project sources
3. High-quality secondary sources
4. Model knowledge, only for concepts and hypotheses

Official documentation and project files win over model memory.

If official documentation conflicts with project files, report the conflict instead of silently choosing.

## Degraded Research Mode

Use degraded research mode when official documentation cannot be accessed.

Degraded mode does not automatically block all work.

It blocks unconfirmed high-impact technical decisions.

For local low-impact documentation or workflow cleanup, the agent may recommend continuing after explaining why the impact is limited.

Project memory updates must still use `update-project-memory` and provide its required summary first.

## Interaction With Other Skills

### plan-with-context

If a plan involves technical judgment, run docs-first-research first or include its findings in the plan.

### execute-plan

If execution encounters an unverified technical assumption, pause and use docs-first-research before writing code.

### code-review

Use docs-first-research during review when reviewing API correctness, configuration correctness, security-sensitive behavior, deployment behavior, version-specific behavior, or official best practices.

### publish-current-branch

Docs-first research is not normally required for publishing the current branch.

Use it if the task changes GitHub Actions, release process, deployment configuration, package publishing rules, or branch protection assumptions.

### update-project-memory

If long-term project memory will record external technical facts, official constraints, version limitations, or important risks, base the update on docs-first-research findings when possible.

## Project Memory Boundary

This skill does not directly update project memory.

At the end, report:

```txt
Project memory update needed: yes | no
Reason:
Suggested next workflow:
```

Suggest `update-project-memory` if the research finds durable:

- Project facts
- Technical constraints
- Official limitations
- Version-specific requirements
- Important risks
- Decision rationale
- Deprecated APIs or migration requirements

Do not silently modify project memory files.

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
