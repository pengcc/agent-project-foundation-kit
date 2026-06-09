# Force Plan With Context Prompt

Use this prompt when Codex or another coding agent enters a generic plan mode but does not appear to use the installed `plan-with-context` workflow.

This prompt does not replace the skill. It forces the agent to apply the skill.

## Prompt

Use the `plan-with-context` workflow.

Before creating the plan:

1. Apply the `project-memory` skill.
2. Read `AGENTS.md`.
3. Read `.codex/project/project-guideline.md`.
4. Read `.codex/project/project-decisions.md` and `.codex/project/lessons-learned.md` if they exist or are relevant.
5. Inspect relevant project files, docs, existing code, configuration, tests, package files, and previous local plans or handoffs when useful.
6. If this plan involves technical judgment, APIs, versions, dependencies, configuration, deployment, testing, external services, debugging, or best practices, use `docs-first-research`.
7. If the requirement is unclear, use `grill-me` before planning.
8. Do not ask me questions that can be answered by inspecting available project files, docs, code, config, tests, package files, or official documentation.

Planning boundaries:

- Do not modify production code.
- Do not install dependencies.
- Do not change configuration.
- Do not run destructive commands.
- Do not commit or push.
- Do not update project memory silently.
- Do not treat plan creation as approval to execute.

If the plan is multi-step, executable, cross-session, affects multiple files/modules, or I ask you to save it, save it under:

```txt
dev_locals/plans/YYYY-MM-DD-short-topic.md
```

The plan output must be truthful.

Do not claim that `project-memory`, `docs-first-research`, `grill-me`, or any other skill was used unless its required steps were actually performed.

If required context was not read, mark the plan as:

```txt
Plan status: incomplete draft
```

End with:

```txt
Execution:
- Status: waiting for user approval
- Next workflow: execute-plan
```

Task to plan:

```txt
<replace with task>
```
