# Task Execution Classification

## Purpose

Choose the smallest planning and execution path that preserves correct context, user control,
reviewability, validation, rollback, and safety.

This rule is the canonical classification owner shared by `plan-with-context`, `execute-plan`, and
`to-work-items`. It does not replace those workflows or authorize mutation.

## Classification Inputs

Classify by the complete task boundary:

- whether repository mutation is needed;
- goal and acceptance clarity;
- allowed scope and explicit non-goals;
- verified context and technical assumptions;
- risk, side effects, and affected domains;
- known validation and rollback;
- one-pass reviewability versus independent slices; and
- explicit user authorization.

Line count, file count, and example categories are supporting evidence only. They must not decide
the outcome or override risk, ambiguity, side effects, validation, or reviewability.

## Outcomes

Apply these outcomes in order.

### 1. Direct Answer / No Mutation

Use when the task only answers, explains, reviews, recommends, or advises and requires no file or
external-state mutation.

Do not create an implementation artifact merely to add ceremony. If investigation discovers that
mutation is required, reclassify before changing state.

### 2. Scoped Task Execution Brief

Use only when every scoped-brief gate passes:

- the user explicitly authorizes the exact scoped task;
- there is one clear outcome and acceptance condition;
- allowed files or narrow file areas and allowed mutation are explicit;
- non-goals are explicit;
- relevant project context is verified;
- no material technical assumption remains unverified;
- focused validation is known and sufficient for the behavior boundary;
- risks and side effects are understood and low or well-contained;
- rollback is simple and explicit;
- STOP conditions are explicit;
- the task is understandable in one focused review pass;
- no hard exclusion applies; and
- there is no hidden second task or silent decomposition.

A scoped brief is a lightweight planning artifact and strict execution contract, not planless
execution. It may be saved by `plan-with-context` or assembled inline by `execute-plan` only from
explicit authorization and verified repository facts. It must be visible before mutation.

Use this minimum structure:

```md
# Scoped Task Execution Brief: <title>

## Goal

## Authorization

## Allowed Scope

## Non-Goals

## Validation

## Risk and Rollback

## STOP Conditions

## Execution Status
```

Potentially qualifying examples include focused documentation, local project-memory alignment,
local notes/design logs, non-behavioral wording, test-only corrections, and narrow code/script
fixes with already established intended behavior. Examples never bypass the complete gate.

The following never qualify for a scoped brief, regardless of apparent size:

- feature implementation, architecture changes, broad refactors, or multiple independent outcomes;
- installer apply, overwrite, backup, preserve, or migration behavior;
- publish, merge, release, or deployment workflow behavior;
- package scripts, dependencies, runtime requirements, or CI/CD behavior;
- prompts or metadata behavior;
- authentication, secrets, permissions, authorization, or security-sensitive behavior;
- data models, persistence, or migrations;
- external-service integration or production behavior;
- destructive filesystem or network side effects;
- downstream-template behavior; or
- unclear requirements, unknown validation/rollback, material side-effect uncertainty, or
  unverified technical assumptions.

### 3. Full Saved Plan

Use the complete `plan-with-context` saved-plan structure for one coherent implementation unit that
does not qualify for a scoped brief, including normal features, workflow changes, architecture,
meaningful multi-step work, high-risk domains, or work requiring fuller reasoning and review
context.

A full plan still needs a reviewability decision. If it cannot remain one focused review unit,
classify it as Work Items.

### 4. Work Items

Use `to-work-items` for broad, multi-slice, cross-cutting, or review-hostile approved work,
including work with independent outcomes, incompatible validation loops, multiple ownership or
safety boundaries, or a change set that cannot be reviewed safely as one unit.

`to-work-items` owns decomposition. Classification does not create work items, and decomposition
does not authorize execution.

## Escalation and Reclassification

Use the safer path whenever a gate is false, unclear, unverified, or becomes false:

- unclear intent, scope, acceptance, risk, validation, or rollback -> clarification or
  `plan-with-context`;
- unverified external or technical facts -> `docs-first-research`, then reclassify;
- broad or review-hostile approved work -> `to-work-items`;
- durable project-memory writes -> `update-project-memory` inside the approved scope; and
- scope, risk, assumption, side-effect, or validation drift -> STOP and reclassify before mutation
  continues.

Do not average uncertainty into a score, silently split work, or downgrade a task to fit a lighter
artifact.

## Validation and Rollback

Every mutation outcome must define validation appropriate to the complete behavior boundary and a
rollback path proportionate to risk. A lighter planning artifact never lowers applicable testing,
review, safety, or reporting requirements.

Project Memory Context Gate, clarification, docs-first research, project-memory ownership, commit,
publish, release, deployment, destructive-action, secret, and global-tooling boundaries remain
owned by their existing skills and rules.
