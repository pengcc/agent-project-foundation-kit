# Diagnose

Use this skill when the main problem is an unknown cause behind a bug, failing test, regression,
unexpected behavior, production-like symptom, performance issue, flaky behavior, broken build, or
confusing error message.

This is an evidence-first investigation workflow. It identifies the likely root cause and may
recommend or route a fix; it does not silently become a broad implementation workflow.

## Role Routing Integration

If `agent-roles-and-capabilities` is installed, read or apply it before continuing.

Then output a concise Role Routing Header using this default routing:

```txt
Role Routing:
- Primary role: Debugging Engineer
- Supporting roles: Test Engineer, Performance Engineer, Security Reviewer, domain roles as needed
- Workflow: diagnose
- Maturity expectation: evidence-first investigation with senior-level judgment for risky symptoms
- Technical specialist skill: no technology-specific skill assumed; use repo facts and docs-first-research for framework/API/version/config claims
- Quality rule: engineering-quality-principles applies
```

Do not claim `agent-roles-and-capabilities` was used unless it was actually read or applied.

## Scope

Use `diagnose` to:

- establish the observed symptom and impact;
- reproduce the problem or identify the tightest available feedback loop;
- collect targeted evidence;
- form and test explicit hypotheses;
- identify the likely root cause with stated confidence;
- recommend the smallest justified fix and route it to the correct workflow; and
- validate a completed fix against the same feedback loop when implementation is already in scope.

## Non-Goals

This workflow must not:

- guess a fix before collecting evidence;
- treat a suspected cause as an observed fact;
- perform a broad refactor or unrelated cleanup;
- create an implementation plan by default;
- silently implement a multi-step, architectural, risky, or scope-changing fix;
- update project memory, publish, merge, release, or deploy; or
- weaken or remove a failing signal merely to make validation pass.

## Required Context

Before diagnosis, pass the Project Memory Context Gate defined in the `project-memory` skill and
include its report in the diagnosis context. Inspect the reported target, relevant code, tests,
configuration, logs, and recent task-relevant changes.

Use `docs-first-research` when diagnosis depends on external or version-specific technical facts.
Do not expose secrets, credentials, private data, production data, or sensitive log content in the
report.

## Workflow

### 1. Establish the Symptom

Record what was directly observed, where it occurred, expected behavior, actual behavior, impact,
and whether the problem is deterministic or intermittent.

Keep these separate:

```txt
Observed symptom:
Suspected cause:
```

If the report lacks enough detail to identify a useful signal, inspect available repository
evidence first. Then request only the missing reproduction, log, trace, screenshot, or context that
blocks progress.

### 2. Create or Identify a Feedback Loop

Before changing code, prefer the smallest red-capable signal available:

- failing test or command;
- visible reproduction route;
- error log or stack trace;
- screenshot, trace, or HAR;
- performance measurement;
- deterministic minimal reproduction; or
- a bounded observation that can distinguish failure from success.

Record the exact command, route, input, environment, or observation. If no red-capable loop is
available, state the limitation and define the strongest repeatable proxy.

### 3. Collect Evidence

Inspect narrowly around the failing path. Compare expected and actual values, control flow,
configuration, state transitions, dependency boundaries, and relevant recent changes.

Prefer direct evidence over broad speculation. Record negative evidence when it eliminates a
plausible cause.

### 4. Form Hypotheses

List explicit, falsifiable hypotheses. For each one, state:

```txt
Hypothesis:
Supporting evidence:
Contradicting evidence:
Next discriminating check:
```

Prioritize checks that distinguish several hypotheses cheaply.

### 5. Inspect or Instrument Narrowly

Use targeted inspection or temporary instrumentation only where it can confirm or reject a
hypothesis. Keep instrumentation local, avoid logging sensitive data, and remove temporary probes
unless they are approved durable observability improvements.

Do not change multiple variables at once when that would make the result ambiguous.

### 6. Identify the Likely Root Cause

State the causal path from trigger to symptom. Distinguish:

- confirmed root cause;
- likely root cause with remaining uncertainty; and
- contributing conditions that are not the primary cause.

If evidence remains inconclusive, report what was ruled out, what is still unknown, and the next
highest-value evidence needed. Do not manufacture certainty.

### 7. Recommend or Route the Fix

Recommend the smallest change justified by the evidence.

- Tiny, isolated, low-risk fix: route to `execute-plan` only when repository workflow and user
  authorization allow direct execution.
- Multi-step, architectural, security-sensitive, data-affecting, risky, or scope-changing fix:
  route to `plan-with-context`.
- Missing evidence: request the blocking reproduction, log, trace, or context.
- Completed fix needing review: route to `code-review` when risk or validation warrants it.

Diagnosis alone does not authorize implementation.

### 8. Validate

When a fix has been implemented within an approved workflow, rerun the same feedback loop that
demonstrated the symptom. Add broader regression checks only in proportion to the affected
boundary and risk.

Report whether the original signal changed from red to green, whether adjacent behavior remains
valid, and what remains unverified.

## Output Format

```md
# Diagnosis Report

## Symptom

## Reproduction / Feedback Loop

## Evidence Collected

## Hypotheses

## Likely Root Cause

## Recommended Fix

## Validation

## Follow-up
```

Keep the report concise, evidence-backed, and explicit about confidence and missing evidence.

## Workflow Relationships

Use `diagnose` before `execute-plan` when the main problem is an unknown cause, failing test,
regression, or production-like symptom. Route architectural, risky, multi-step, or durable behavior
changes to `plan-with-context`. Route completed fixes to `code-review` when review is warranted.
Route confirmed durable facts, decisions, or reusable debugging lessons to
`update-project-memory` rather than writing memory directly.

## Safety Notes

- Do not run destructive reproduction steps against production or irreplaceable data.
- Do not expose secrets or sensitive data from logs, traces, screenshots, HAR files, or dumps.
- Do not disable tests, checks, validation, or error handling to make the symptom disappear.
- Stop when reproduction requires external, destructive, costly, or security-sensitive action not
  already authorized.

## Final Self-Check

Before finalizing, verify that the report separates symptom from cause, names the feedback loop,
shows evidence for the root-cause conclusion, avoids speculative fixes, and routes implementation
through the correct workflow.
