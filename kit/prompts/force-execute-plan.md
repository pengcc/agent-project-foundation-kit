# Force Execute Plan Prompt

Use this prompt when Codex or another coding agent is about to execute a generic plan but does not appear to use the installed `execute-plan` workflow.

This prompt does not replace the skill. It forces the agent to apply the skill.

## Prompt

Use the `execute-plan` workflow.

Approved plan:

```txt
<replace with plan path, usually dev_locals/plans/YYYY-MM-DD-topic.md>
```

Execution mode:

```txt
strict
```

Before changing files:

1. Read the approved plan.
2. Confirm the plan is complete and not marked `incomplete draft` or `blocked`.
3. Confirm the plan includes Goal, Scope, Non-Goals, Implementation Steps, Validation Plan, Risks and Rollback, and Execution Status.
4. Restate the workflow, approved plan, scope, execution mode, and stop conditions.
5. Do not execute vague tasks or unapproved plans.

Execution boundaries:

- Follow the approved plan only.
- Execute in small batches.
- Validate after each reasonable batch.
- Pause on scope drift, failed validation, missing credentials, missing permissions, unverified technical assumptions, or any dependency/configuration/architecture/security/deployment risk not covered by the plan.
- Use `docs-first-research` for unverified technical assumptions.
- Do not rely on model memory for APIs, versions, dependencies, configuration, deployment, CI/CD, database, auth/security/privacy, or external services.
- Do not update project memory directly.
- Do not push, create PR, merge, release, or deploy.

Commit boundary:

- Create a local commit only if the approved plan explicitly includes a commit step or I explicitly requested commit.
- Do not push.
- If publish is needed, recommend `publish-current-branch`.

At the end or when pausing, output the fixed Execution Summary.

Project memory update check must classify:

```txt
- project-guideline.md: yes | no
- project-decisions.md: yes | no
- lessons-learned.md: yes | no
```

Actual memory updates must use `update-project-memory`.

Do not treat generic Codex execution confirmation as sufficient. Use this named workflow explicitly.
