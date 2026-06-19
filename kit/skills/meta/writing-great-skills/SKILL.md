# Writing Great Skills

Use this skill to create or refine reusable agent skills for this foundation kit.

This is a productivity workflow for skill authoring. It does not replace planning, execution, review, handoff, research, publishing, or project memory workflows.

## Role Routing Integration

If `agent-roles-and-capabilities` is installed, read or apply it before continuing.

Then output a concise Role Routing Header using this default routing:

```txt
Role Routing:
- Primary role: Skill Author
- Supporting roles: Documentation Writer, Project Memory Curator, Tooling Reviewer, Requirement Clarifier as needed
- Workflow: writing-great-skills
- Maturity expectation: concise, composable skill design with strong trigger and boundary discipline
- Technical specialist skill: no technology-specific skill assumed; use docs-first-research for external technical claims
- Quality rule: engineering-quality-principles applies when a skill affects engineering workflows, scripts, validation, review, or execution
```

Do not claim `agent-roles-and-capabilities` was used unless it was actually read or applied.

## Purpose

`writing-great-skills` helps turn repeated work, reusable workflows, or external skill patterns
into project-ready skills.

It should help define:

- when the skill should trigger
- what the skill does
- what the skill must not do
- what context it must inspect
- what output it should produce
- what project memory follow-up may be needed
- what metadata and prompt support it needs
- whether references, examples, or scripts are justified

## When to Use

Use this skill when:

- the user asks to create a new skill
- the user asks to refine an existing skill
- a repeated workflow should become reusable
- a future capability needs clear trigger and boundary documentation
- a skill needs metadata, prompt, reference files, examples, or scripts
- a skill should be adapted from an external reference into this foundation kit
- an agent needs to evaluate whether a proposed skill should exist

## When Not to Use

Do not use this skill when:

- a normal feature or theme plan is needed
- direct execution of an approved plan is needed
- code review is needed
- a handoff is needed
- project memory needs to be updated
- external technical facts need to be verified first
- requirements are unclear and should be clarified with `grill-me`
- the task is about writing general documentation rather than reusable skill behavior

Use the matching workflow instead.

## Workflow Boundary

This workflow must not:

- implement unrelated project changes
- execute feature plans
- silently update project memory
- commit changes
- push changes
- create or update pull requests
- merge pull requests
- release or deploy
- copy external skills wholesale
- invent unavailable tools or capabilities
- mix planning, execution, review, and publishing boundaries into one skill

## Required Context Check

Before writing or modifying a skill, pass the Project Memory Context Gate defined in the
`project-memory` skill and include its report in the authoring context. Do not redefine the gate
sequence or status meanings here.

Then inspect task-relevant sources as available:

```txt
kit/rules/agent-operating-contract.md
kit/rules/engineering-quality-principles.md
existing related skills under kit/skills/meta/ and kit/skills/core/
existing prompts under kit/prompts/
docs/foundation-design-log.md
```

Use an earlier plan or other local process artifact only when the user or active task identifies
it as relevant, and only after the Project Memory Context Gate freshness check.

If adapting from external material, inspect the external reference and rewrite it for this project instead of copying it.

If the skill depends on external technical facts, APIs, frameworks, versions, security guidance, or provider behavior, use `docs-first-research`.

## Requirement Gathering

Before drafting a new skill, resolve:

```txt
- What task or domain does this skill cover?
- What triggers should activate it?
- What should the skill explicitly not do?
- What workflow boundary does it belong to?
- What inputs does it need?
- What output format should it produce?
- Does it need project memory integration?
- Does it need docs-first-research?
- Does it need deterministic scripts?
- Does it need examples or references?
```

If any answer blocks safe skill design, route to `grill-me`.

Ask the smallest useful set of questions. Provide a recommended answer for each blocking question.

## Skill Design Rules

Skills should be:

```txt
small
composable
trigger-clear
boundary-clear
truthful
project-aware
validation-aware
easy to route
easy to review
```

Avoid:

```txt
giant all-purpose skills
vague descriptions
hidden destructive actions
silent project memory updates
copied external skills
unverified technical facts
mixing planning, execution, review, and publishing boundaries in one skill
```

Prefer narrowly useful skills over broad assistant personas.

## Taxonomy and Invocation

Apply `kit/rules/skill-invocation-and-dependency-boundaries.md` as the single source of truth for
category, invocation, dependency direction, and context-load design. Do not restate those shared
semantics in individual skills.

## Skill File Structure

Required files for an installable meta or core skill:

```txt
kit/skills/<category>/<skill-name>/SKILL.md
kit/skills/<category>/<skill-name>/metadata.yml
```

Optional support files:

```txt
kit/prompts/force-<skill-name>.md
kit/skills/<category>/<skill-name>/REFERENCE.md
kit/skills/<category>/<skill-name>/EXAMPLES.md
kit/skills/<category>/<skill-name>/scripts/
```

Rules:

- `<category>` must be `meta` or `core` and match `metadata.yml`.
- `SKILL.md` holds core runtime instructions.
- `metadata.yml` supports routing and discovery.
- `force-<skill-name>.md` triggers the skill without duplicating all runtime instructions.
- Reference files hold rarely used details.
- Examples should be concrete and project-relevant.
- Scripts should be deterministic and validated.

## Metadata Rules

Metadata should include:

```yaml
name:
description:
category:
invocation:
required:
depends_on:
version:
triggers:
```

Description rules:

- treat the description as invocation logic, not documentation
- front-load the main trigger and keep only distinct trigger branches
- keep model-invoked descriptions short and trigger-focused
- avoid synonyms that repeat the same meaning
- keep workflow detail in `SKILL.md`
- avoid claiming unavailable capabilities

Trigger rules:

- use user-facing phrases
- include common synonyms
- avoid overly broad generic triggers
- keep the trigger list short enough to review

## Prompt Rules

`force-<skill-name>.md` should:

- explicitly name the skill
- state the workflow objective
- state key boundaries
- avoid duplicating full `SKILL.md` content
- be concise

A force prompt is not a full skill.

## Progressive Disclosure Rules

Keep `SKILL.md` concise enough for frequent use.

Split into additional files when:

- content becomes too long
- advanced details are rarely needed
- examples are numerous
- scripts need usage documentation
- external reference summaries are too large

Do not split just for structure if it makes the skill harder to use.

Apply the no-op test to every instruction: if removing it would not change agent behavior, delete
it or replace it with a stronger leading word. Keep one source of truth for shared behavior and use
clear context pointers for branch-specific references.

## Script Rules

Add scripts only when:

- the operation is deterministic
- the same code would otherwise be generated repeatedly
- validation benefits from automation
- error handling must be explicit
- the script can be tested safely

Do not add scripts just because a task could be automated.

Scripts must follow project safety conventions and stay inside project boundaries unless explicitly approved.

Scripts that affect files should document:

```txt
purpose
inputs
outputs
dry-run behavior if available
rollback or cleanup
validation command
```

## External Reference Rules

When adapting external skills:

- require prior external skill evaluation through `docs-first-research` when source facts,
  provenance, license/copying risk, safety, or workflow fit are not already verified
- inspect the external reference
- extract patterns
- evaluate trigger and boundary fit
- preserve workflow separation between research, planning, execution, review, publishing, and
  memory updates
- reject ecosystem-specific assumptions that do not fit this kit
- rewrite for this kit
- do not copy wholesale
- preserve this project's operating contract and memory boundaries
- cite or mention the external reference in the plan or design log when relevant
- keep final runtime instructions auditable inside this repo
- treat external skill discovery platforms as research sources, not adoption or installation
  approval
- require explicit user approval before installing an external skill, plugin, MCP server, CLI, or
  other tooling

If license/provenance or copying risk is unclear, do not copy content verbatim.

## Project Experience Adaptation

When adapting project experience into a kit skill, rule, template, or documentation, start from a
confirmed reusable lesson candidate.

Remove project-specific history, project names, business context, secrets, customer data, and
one-off implementation details before writing generic kit guidance.

Do not copy project-specific history into installable templates or kit assets merely because it was
recorded in local memory. Reusable promotion needs generalization, user confirmation, and an
approved plan. Use `plan-with-context` for the kit change plan and `execute-plan` for approved
implementation.

## Optional Specialist Skill Authoring

Optional specialist skills and specialist packs require an approved `plan-with-context` plan before
creation or installation behavior changes.

When authoring an approved optional skill or pack, preserve:

```txt
- trigger clarity
- metadata and discovery wording
- workflow boundaries
- dependencies and conflicts
- required project signals
- non-goals
- validation notes
- external source / provenance
- license or copying-risk notes
```

Do not treat entries in `docs/optional-skill-catalog.md` as implementation approval. They are
planning candidates until a user approves a specific plan.

## Skill Authoring Verification

Before finalizing a new or refined skill, verify:

```txt
- critical runtime and safety contracts appear near the top of SKILL.md
- purpose, trigger, and when-not-to-use boundaries are clear
- required context, workflow steps, output, and stop conditions are explicit
- metadata description supports discovery through trigger / when-to-use wording
- metadata triggers are specific and not broader than the skill boundary
- prompt support, if present, stays concise and does not duplicate the full SKILL.md
- workflow separation is preserved for planning, execution, review, publishing, research, and memory updates
- external references were rewritten for this kit and not copied wholesale
- boundary-sensitive skills name likely failure modes
- output-sensitive skills include a short final self-check
```

For boundary-sensitive skills, add a misuse and rationalization check:

```txt
- What excuse might an agent use to invoke this skill outside its boundary?
- What shortcut might cause the skill to absorb another workflow's responsibility?
- What wording should close the loophole without bloating the skill?
```

Use static self-checks, manual scenario checks, or targeted review. Do not require mandatory
delegated-agent tests, test-driven authoring, or tool-specific process mechanics unless this
project explicitly adopts them later.

## Review Checklist

Before finalizing a skill, check:

```txt
- Is the trigger clear?
- Is the boundary clear?
- Is the workflow relationship clear?
- Does it avoid pretending future skills exist?
- Does it say when not to use the skill?
- Does it avoid silent memory updates?
- Does it avoid destructive actions?
- Are metadata triggers accurate?
- Is a force prompt needed?
- Are examples or references justified?
- Are scripts justified, deterministic, and validated?
- Does it preserve project root boundaries?
- Does it route durable facts, decisions, or lessons to update-project-memory?
- Does it pass the skill authoring verification checks?
- Do boundary-sensitive skills address likely misuse or rationalization paths?
```

## Output Format

For a skill authoring plan or draft, use:

```txt
Workflow:
- Role: Skill Author
- Skill: writing-great-skills
- Context:
- Mode:

Skill name:
Purpose:
Trigger summary:
Boundary summary:
Files to create/update:
External references checked:
Open questions:
Recommended structure:
Validation:
Project memory update needed:
```

For a completed skill package summary, use:

```txt
Skill package:
Files:
Key boundaries:
Validation:
Recommended next workflow:
Project memory update needed:
```

## Project Memory Follow-Up

If a new or refined skill creates durable project facts, long-term decisions, or reusable lessons, recommend `update-project-memory`.

Classify memory targets:

```txt
Current facts -> .codex/project/project-guideline.md
Long-term decisions -> .codex/project/project-decisions.md
Lessons and reusable patterns -> .codex/project/lessons-learned.md
```

Do not silently update memory.
