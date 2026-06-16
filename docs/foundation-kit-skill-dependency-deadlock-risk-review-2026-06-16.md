# Foundation Kit Skill Dependency and Deadlock Risk Review

Date: 2026-06-16  
Repository: `pengcc/agent-project-foundation-kit`  
Review type: codebase-audit / plan-alignment style dependency review  
Status: Dated analysis report; not an implementation plan

---

## 1. Review Scope

This report reviews whether the current foundation-kit skill set creates hard deadlocks or soft-lock risks through workflow dependencies, required context gates, role routing, supporting skill invocation, and workflow transitions.

Primary question:

> Do the skills in `kit/skills` depend on each other in a way that can block execution, create circular workflow requirements, or cause agents to bounce between workflows without a safe exit?

Sources considered in the analysis:

- `AGENTS.md`
- `.codex/project/project-guideline.md`
- `.codex/project/project-decisions.md`
- `docs/foundation-kit-skills-review-and-optimization-roadmap.md`
- `kit/rules/agent-operating-contract.md`
- `kit/skills/core/project-memory/SKILL.md`
- `kit/skills/core/agent-roles-and-capabilities/SKILL.md`
- `kit/skills/core/plan-with-context/SKILL.md`
- `kit/skills/core/execute-plan/SKILL.md`
- `kit/skills/core/docs-first-research/SKILL.md`
- `kit/skills/core/grill-me/SKILL.md`
- `kit/skills/core/code-review/SKILL.md`
- `kit/skills/core/codebase-audit/SKILL.md`
- `kit/skills/core/write-a-skill/SKILL.md`
- `kit/skills/core/initialize-project-context/SKILL.md`
- `kit/skills/core/update-project-memory/SKILL.md`
- `kit/skills/core/publish-current-branch/SKILL.md`
- `kit/skills/core/project-architecture-plan/SKILL.md`

---

## 2. Executive Summary

No current hard deadlock was found.

The current dependency model is mostly healthy because the kit separates:

```text
project-memory = durable context reading / Project Memory Context Gate
update-project-memory = confirmed durable writes
agent-roles-and-capabilities = role routing / capability boundaries
workflow skills = bounded work
docs-first-research = external fact verification
grill-me = clarification dependency
publish-current-branch = publishing transition
```

The strongest architectural safeguard is that `project-memory` reads/applies durable memory and owns the gate, while `update-project-memory` owns confirmed writes. This prevents a read/write memory loop.

However, three soft-lock or future-deadlock risks were identified:

1. `execute-plan` currently maps `publishing -> publish-current-branch` as a supporting skill, while also saying `execute-plan` must not push, create PRs, or merge. This is not a hard deadlock, but it is a boundary ambiguity and should be clarified.
2. `agent-roles-and-capabilities` is safe today, but could become a future bootstrapping deadlock if someone later requires it to pass the Project Memory Context Gate before initial routing.
3. The supporting skill model is healthy, but should preserve the invariant that supporting skills are bounded substeps, not workflow replacement.

Recommended next action after the current PR review:

```text
Theme 22.0.x or Theme 22.1 pre-step:
Dependency Invariant and Publish Handoff Clarification
```

This can be a small docs-only skill-instruction hardening patch.

---

## 3. Current Dependency Model

### 3.1 Startup Chain

The intended startup chain is:

```text
AGENTS.md
→ project-memory
→ agent-roles-and-capabilities
→ routed workflow skill
```

This is safe because:

- `project-memory` owns the context gate and durable memory reading.
- `agent-roles-and-capabilities` routes role/workflow/capability but does not directly implement features.
- Workflow skills reference `project-memory` without redefining the full gate.
- Workflow skills reference `agent-roles-and-capabilities` for role routing but do not require it to mutate state.
- `update-project-memory` is the only confirmed durable write workflow.

### 3.2 Core Gate

The Project Memory Context Gate can return:

```text
passed | partial | blocked
```

The gate allows `initialize-project-context` and `update-project-memory` to continue from `partial` so they can diagnose or repair context. They must stop on `blocked`.

This is important because it prevents context-repair workflows from being blocked merely because the context is incomplete.

### 3.3 Supporting Skill Invocation

Theme 21.1 introduced bounded supporting skill invocation during `execute-plan`:

```text
skill creation/refinement -> write-a-skill
external technical facts -> docs-first-research
durable memory write -> update-project-memory
concrete diff/PR/package review -> code-review
repo-wide audit -> codebase-audit
unclear requirements -> grill-me
publishing -> publish-current-branch
```

This model is mostly good because supporting skills are bounded and return to the primary workflow.

The only problematic mapping is publishing, because publishing is not an internal execution substep. It is a workflow transition after execution.

---

## 4. Deadlock Analysis by Dependency Pair

### 4.1 `project-memory` ↔ `update-project-memory`

Risk: Low

No hard deadlock found.

`project-memory` reads and applies durable project memory. It explicitly does not write durable memory. `update-project-memory` owns confirmed durable writes and depends on `project-memory` for context.

This is a healthy read/write split:

```text
project-memory -> read/context
update-project-memory -> confirmed write
```

The partial-gate continuation rule also prevents repair workflows from blocking when memory is missing or stale.

### 4.2 `project-memory` ↔ `agent-roles-and-capabilities`

Risk: Medium future-risk

Current state is safe.

`agent-roles-and-capabilities` does not currently require the Project Memory Context Gate before initial routing. This avoids a bootstrapping loop.

Potential future deadlock:

```text
Need agent-roles-and-capabilities to select workflow
→ agent-roles-and-capabilities requires project-memory gate
→ project-memory gate requires knowing the project-state workflow context
→ routing is blocked
```

Recommended invariant:

```text
agent-roles-and-capabilities may be used for initial routing without first passing the Project Memory Context Gate.
If routing depends on project-specific facts, use project-memory as supporting context before making project-state decisions.
```

### 4.3 `execute-plan` ↔ `plan-with-context`

Risk: Low

No deadlock found.

The relationship is a valid transition:

```text
No approved plan / invalid plan / material drift
→ stop execution
→ return to plan-with-context
```

This is not a circular execution loop because `execute-plan` does not try to create a new plan itself.

### 4.4 `execute-plan` ↔ `publish-current-branch`

Risk: Medium

This is the most important ambiguity.

`execute-plan` says:

```text
publishing -> publish-current-branch
```

inside Supporting Skill Activation.

But `execute-plan` also says it must not push, create PRs, merge, release, or deploy. Push/PR/merge require explicit `publish-current-branch`.

This is not a hard deadlock, but future agents may misread it as permission to run publishing as an internal bounded substep during execution.

Recommended wording change:

```text
publish readiness / publish handoff -> recommend publish-current-branch after execution
```

Add:

```text
Do not run publish-current-branch as an internal execution substep unless the user explicitly switches to that workflow after execution.
```

### 4.5 `plan-with-context` ↔ `grill-me`

Risk: Low

No deadlock found.

`plan-with-context` routes to `grill-me` only when clarification is required. `grill-me` explicitly resolves blocking ambiguity and routes back to planning, architecture, research, execution, review, memory, or publishing workflows.

`grill-me` also prohibits asking questions that can be answered from available project context.

### 4.6 `docs-first-research` ↔ project workflows

Risk: Low

No hard deadlock found.

`docs-first-research` distinguishes between:

```text
project-impacting research -> pass Project Memory Context Gate
pure external fact lookup -> gate not applicable
```

This prevents a universal docs-first → memory gate loop for simple external fact checks.

### 4.7 `code-review` ↔ `codebase-audit`

Risk: Low

No deadlock found.

The boundary is clear:

```text
codebase-audit = read-only repository survey
code-review = concrete diff / PR / package / commit / plan-alignment review
```

`codebase-audit` routes selected findings to `plan-with-context`, not to direct implementation. `code-review` routes non-trivial fixes to `plan-with-context` and tiny isolated fixes only to user-approved `execute-plan`.

### 4.8 `write-a-skill` ↔ `execute-plan`

Risk: Low

No deadlock found.

After Theme 21.1, `execute-plan` can apply `write-a-skill` as bounded supporting guidance when the approved plan includes skill creation/refinement.

`write-a-skill` itself says it does not replace planning, execution, review, handoff, research, publishing, or memory workflows.

This is healthy as long as the primary workflow remains `execute-plan`.

---

## 5. Deadlock Risk Matrix

| Area | Current Risk | Finding |
|---|---:|---|
| `project-memory` ↔ `update-project-memory` | Low | Read/write ownership is separated; partial repair workflows can continue |
| `project-memory` ↔ `agent-roles-and-capabilities` | Medium future-risk | Safe now, but future edits could create initial-routing bootstrapping loop |
| `execute-plan` ↔ `plan-with-context` | Low | Clear transition on missing/invalid approved plan or drift |
| `execute-plan` ↔ `publish-current-branch` | Medium | Wording may imply publishing can be internal supporting substep |
| `plan-with-context` ↔ `grill-me` | Low | Clarification resolves ambiguity and returns |
| `docs-first-research` ↔ project workflows | Low | Pure external lookup can skip memory gate |
| `code-review` ↔ `codebase-audit` | Low | Concrete change review vs repo-wide audit boundary is clear |
| `write-a-skill` ↔ `execute-plan` | Low | Supporting skill model is bounded and returns to primary workflow |
| `project-architecture-plan` ↔ `plan-with-context` | Low | Lifecycle architecture planning vs feature planning boundary is clear |

---

## 6. Recommended Dependency Invariants

These invariants should be recorded or lightly patched into the relevant files:

```text
1. project-memory owns the Project Memory Context Gate and durable memory reading/applying.
2. update-project-memory owns confirmed durable project memory writes.
3. agent-roles-and-capabilities may perform initial role/workflow routing without first passing the Project Memory Context Gate.
4. If routing depends on project-specific facts, use project-memory as supporting context before project-state decisions.
5. A primary workflow remains active while a supporting skill is used for a bounded substep.
6. Supporting skills do not override, expand, or replace the primary workflow boundary.
7. execute-plan may recommend publish-current-branch after execution but must not run push/PR/merge as an internal execution substep.
8. codebase-audit produces selected findings for plan-with-context, not executable fix plans.
9. code-review reviews concrete diffs/PRs/packages/commits and does not become a repo-wide audit.
10. docs-first-research verifies external facts and can be gate-not-applicable for pure external lookup.
```

---

## 7. Recommended Follow-Up Theme

After the current new PR is reviewed/handled, add a small follow-up theme:

```text
Theme 22.0.x: Dependency Invariant and Publish Handoff Clarification
```

Suggested scope:

- `kit/skills/core/execute-plan/SKILL.md`
- `kit/skills/core/agent-roles-and-capabilities/SKILL.md`
- `.codex/project/project-guideline.md`
- `.codex/project/project-decisions.md`
- `docs/foundation-design-log.md`
- Optionally `docs/foundation-kit-skills-review-and-optimization-roadmap.md`

Suggested edits:

1. In `execute-plan`, replace:

   ```text
   publishing -> publish-current-branch
   ```

   with:

   ```text
   publish readiness / publish handoff -> recommend publish-current-branch after execution
   ```

2. Add a sentence to `execute-plan`:

   ```text
   Do not run publish-current-branch as an internal execution substep. Push, PR, and merge require an explicit workflow switch after execution.
   ```

3. In `agent-roles-and-capabilities`, add:

   ```text
   This skill may be used for initial role/workflow routing without first passing the Project Memory Context Gate. If routing depends on project-specific facts, use project-memory as supporting context before making project-state decisions.
   ```

4. Record a concise durable decision:

   ```text
   Initial role routing must remain bootstrap-safe. Supporting skills are bounded substeps, not workflow replacement.
   ```

Non-goals:

- No new workflow
- No skill deletion
- No broad rewrite
- No scripts/package/installer/tests/runtime changes
- No third-party adoption policy
- No kit evolution loop

---

## 8. Final Verdict

```text
No current hard deadlock found.
```

The kit’s dependency model is currently safe enough to continue work.

The main recommended improvement is not structural deletion, but wording hardening:

```text
- clarify publish-current-branch as a post-execution workflow transition
- prevent future memory-gate bootstrapping deadlock in agent-roles-and-capabilities
- record dependency invariants so future skills do not accidentally create cycles
```
