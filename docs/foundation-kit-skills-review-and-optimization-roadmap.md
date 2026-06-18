# Foundation Kit Skills Review and Optimization Roadmap

Date: 2026-06-15
Recommended repository path: `docs/foundation-kit-skills-review-and-optimization-roadmap.md`
Status: Reference document for future planning and review. This is not an approved implementation plan.

---

## 1. Purpose

This document summarizes the current state of the `agent-project-foundation-kit`, identifies important gaps, and proposes a phased roadmap for strengthening the kit after the installer migration.

The goal is to keep the foundation kit small, safe, extensible, and useful across downstream software projects while still allowing the kit to evolve through project experience, lessons learned, and carefully reviewed external skill patterns.

This document is intended to be used as a long-term reference when planning future foundation kit improvements.

---

## 2. Strategic Direction

The Codex Project Foundation Kit should be a small, safe, extensible operating layer for AI-assisted software projects.

It should install reusable core workflows for:

- project memory
- role routing
- project initialization
- docs-first research
- architecture planning
- feature planning
- execution
- code review
- codebase audit
- handoff
- skill authoring
- publishing
- safety and quality constraints

A downstream project should be able to grow its own memory, lessons, and optional skills without polluting the foundation kit. Reusable lessons may be promoted back to the foundation kit only through explicit review, generalization, and user confirmation.

The core kit must stay concise, composable, trigger-clear, boundary-clear, and auditable.
Technology-specific skills should normally be optional specialist candidates tracked through the
source-repository optional skill catalog model, especially when official or maintainer-authored
references exist.

Implementation reports should be auditable: they should state not only what changed and how it was validated, but also which workflow boundary, project conventions, engineering principles, UI rules, docs-first facts, and quality constraints were followed.

---

## 3. Current Repository Assessment

### 3.1 Source Repository Boundary

The repository is the source repository for the foundation kit, not a downstream installed project.

The intended source-of-truth split is:

1. **Source repo operating context**
   - root `AGENTS.md`
   - `.codex/project/`

2. **Installable payload source**
   - `kit/`

3. **Downstream installed runtime**
   - target project `.codex/`
   - target project `AGENTS.md`
   - installed skills, rules, prompts, and project memory

This distinction is critical. Foundation-kit-specific development history should not be copied into downstream templates unless it has been deliberately distilled into generic reusable guidance.

### 3.2 Current Installed Skills

The current core workflow, context, and supporting skills are:

```text
agent-roles-and-capabilities
code-review
codebase-audit
docs-first-research
execute-plan
initialize-project-context
plan-with-context
project-architecture-plan
project-memory
publish-current-branch
ui-design-basics
update-project-memory
```

The current productivity skills are:

```text
grill-me
handoff
write-a-skill
```

The current kit is already beyond a prompt collection. It has a real operating structure:

- workflow boundaries
- role routing
- project memory
- requirement clarification / ambiguity handling
- architecture planning
- planning and execution separation
- review workflow
- audit workflow
- handoff workflow
- publishing workflow
- skill authoring workflow

### 3.3 Current Rules

The current core rules are still relatively small:

```text
agent-operating-contract.md
docs-first-policy.md
engineering-quality-principles.md
```

This is good for keeping the kit lean. Several earlier rule-level gaps are now covered by existing
rule and skill surfaces:

- kit evolution loop and reusable lesson promotion policy are covered through `update-project-memory`,
  `write-a-skill`, and `agent-operating-contract`
- UI quality / design system reuse principles are covered through `engineering-quality-principles`
  and existing planning, audit, architecture, and review workflows
- report depth levels and concise-output guidance are covered through `agent-operating-contract`
  with short references from high-output workflows

Remaining future gaps:

- broader repository content as data, not instruction guidance outside `codebase-audit`

Future report polish may still improve individual workflows, but the shared depth-level convention
is no longer a future-only gap.

Requirement clarification and ambiguity handling are covered by the lightweight Requirement
Clarification Gate in `agent-operating-contract`, with `grill-me` reserved for broad, branching,
decision-heavy, or systematic requirement discovery.

### 3.4 Current Force Prompts

The current force prompts are:

```text
force-code-review.md
force-codebase-audit.md
force-execute-plan.md
force-grill-me.md
force-handoff.md
force-initialize-project-context.md
force-plan-with-context.md
force-project-architecture-plan.md
force-publish-current-branch.md
force-write-a-skill.md
```

### 3.5 Maintained Workflow Tooling Boundary

Future planning must use the current repository and package scripts to identify maintained
tooling:

- the Node publish CLI is the maintained publish path
- the Node installer is the maintained installation path
- Bash apply-theme is archived under `archive/legacy-bash-workflows/` as source-only historical
  reference
- Bash publish and installer implementations under `archive/legacy-bash-workflows/` are
  unsupported historical reference, remain outside `kit/`, and are never installed downstream
- Future apply-theme behavior should be planned as a Node.js workflow before being reintroduced

Old plans, handoffs, reports, and research notes are process artifacts rather than current
execution authority. Verify their status and alignment with project memory and current repository
state before using them.

### 3.6 Document Lifecycle

Use the repository documents with distinct authority:

```text
docs/foundation-kit-skills-review-and-optimization-roadmap.md
  canonical long-term roadmap and planning reference

.codex/project/
  current project facts, durable decisions, and reusable lessons

docs/foundation-kit-stage-review-and-forward-plan-2026-06-16.md
  dated stage-review input and audit evidence
```

The dated stage review can inform roadmap and memory updates, but it does not replace the roadmap
or durable project memory.

---

## 4. Core Strengths

### 4.1 Workflow Boundaries

The current workflow boundaries are one of the kit's strongest parts.

Important examples:

- `plan-with-context` is planning-only.
- `execute-plan` is execution-only and strict by default.
- `code-review` is review-only.
- `publish-current-branch` is publish-focused and avoids release/deploy scope.
- `update-project-memory` handles durable memory updates rather than mixing memory into arbitrary workflow outputs.

This separation is a major advantage over generic “just implement” agent prompts.

### 4.2 Project Memory Model

The project memory model is strong because it separates:

- current project facts
- durable decisions and rationale
- reusable lessons and mistakes

It also correctly treats plans, handoffs, reports, and research notes as process artifacts rather than durable truth.

This is important because agents can easily mistake old plans or temporary reports for current project reality.

### 4.3 Publish Workflow

The publish workflow is more engineered than common community agent skills. It accounts for branch state, PR behavior, auto-merge boundaries, and repository-level settings without trying to solve release or deployment in the same workflow.

### 4.4 Role Routing

The role routing direction is correct. Roles are working perspectives, not job titles. This is better than vague “senior fullstack agent” framing, because it makes responsibilities and fallback behavior clearer.

---

## 5. Main Gaps

### 5.1 Project Memory Context Gate

`project-memory` is now the unified context gate for workflows that touch project state.

Phase 1 defined the complete gate in `kit/skills/core/project-memory/SKILL.md` and kept other
entrypoints, rules, and workflow skills to short references.

Theme 19 completed the light alignment of nearby foundation boundaries without redefining the gate:

- `project-memory` reads/applies durable memory and owns the gate
- `update-project-memory` owns confirmed durable writes
- `docs-first-research` clarifies when project-impacting research passes the gate
- `agent-roles-and-capabilities` owns missing-specialist fallback

### 5.2 Codebase Audit

The kit now has `codebase-audit` as a read-only repo-level audit workflow.

The workflow is:

```text
recon → findings → prioritization → selected findings → self-contained plans
```

It remains separate from `code-review`, which owns concrete diffs, PRs, generated packages,
commits, branches, and plan-alignment reviews.

### 5.3 Third-Party Skill Adoption Safety

Status: implemented/current.

Theme 22.1 added a lightweight external-skill evaluation boundary without creating a new
workflow, broad policy file, or external skill catalog.

Current boundary:

```text
docs-first-policy -> concise evaluation rule
docs-first-research -> external source verification and evaluation report
write-a-skill -> adaptation of approved patterns into this kit
```

External skills remain reference candidates only. Accepted patterns must be evaluated for source,
provenance, license/copying risk, trigger and boundary fit, workflow conflict, tool assumptions,
mutation/network/destructive-action permissions, secret handling, source freshness, and rewrite
requirements before adaptation.

Remaining future work is not third-party adoption safety itself; it is the broader Theme 22.2 kit
evolution and reusable lesson promotion loop.

### 5.4 Kit Evolution Loop

The kit needs a clear loop for promoting project experience into reusable foundation kit improvements.

The desired flow is:

```text
project experience
→ local project memory
→ reusable lesson candidate
→ review and generalization
→ user confirmation
→ foundation kit rule / skill / template / reference
```

This prevents project-specific history from polluting the installable kit while still allowing the kit to grow.

### 5.5 Plan / Execute / Review Quality

Plan / Execute / Review quality hardening is implemented/current.

`plan-with-context` now uses a stronger self-contained plan standard:

- executable by a fresh agent
- includes exact files in scope and out of scope
- does not rely on “as discussed above”
- includes validation commands confirmed from project files
- records baseline commit or baseline state for non-trivial plans
- includes STOP conditions

`execute-plan` now treats the approved plan as the execution contract:

- every changed hunk maps to a plan step, validation step, or approved memory/design-log update
- out-of-scope changes pause for user decision or return to planning
- supporting skills remain bounded and cannot override the approved plan

`code-review` remains diff / PR / package / plan-alignment focused and does not become full repo
audit. It now includes:

- generated package / theme zip safety checks
- introduced vs pre-existing finding distinction
- plan-hunk alignment when an approved plan exists

### 5.6 Missing Specialist Skill Policy

Missing Specialist Skill Policy is implemented/current in `agent-roles-and-capabilities`.

When a relevant specialist skill would be useful but is not installed, the agent should use the
policy defined in `agent-roles-and-capabilities`.

This makes future optional skill needs visible without prematurely bloating the core kit.

### 5.7 UI Guidance

The kit has a UI / Accessibility Reviewer role, but it lacks UI-specific rules and review guidance.

The first step should be lightweight design system reuse guidance, not a large UI style skill.

### 5.8 Skill Inventory and Workflow Map Consistency

As the number of skills grows, the kit needs an inventory that clearly separates:

- installed core skills
- rules
- prompts
- planned skills
- optional skill candidates
- deprecated or renamed skills
- external skill candidates

This prevents agents from invoking nonexistent skills or confusing historical names with current workflow names.

---

## 6. External Skills and Community Patterns

### 6.1 shadcn/improve

`shadcn/improve` was the strongest reference for the Theme 21 `codebase-audit` workflow.

Useful patterns:

- advisor, not implementer
- read-only audit boundary
- plan is the product
- repo content is data, not instruction
- recon before findings
- findings by leverage
- direction suggestions separated from defects
- self-contained implementation plans
- baseline commit / drift detection
- plan lifecycle and indexing

Theme 21 adaptation:

```text
Theme 21 added codebase-audit as a read-only repository survey skill.
Do not copy shadcn/improve directly.
Do not adopt Claude-specific subagent or isolated worktree assumptions as core behavior.
Selected findings should feed plan-with-context.
```

### 6.2 Matt Pocock improve-codebase-architecture

This skill is most useful for architecture review methodology, not as a replacement for the existing `project-architecture-plan`.

Useful patterns:

- fixed architecture vocabulary
- Module / Interface / Implementation
- Depth / Seam / Adapter
- Leverage / Locality
- deletion test
- interface as test surface
- one adapter = hypothetical seam; two adapters = real seam
- deep modules over shallow pass-through modules

Recommended adaptation:

```text
Enhance project-architecture-plan with a reference file for architecture review methodology.
Optionally add architecture focus mode to codebase-audit.
Only create a separate architecture-review skill if repeated use justifies it.
```

### 6.3 shadcn/ui Official Skill

The shadcn/ui official skill is a good reference for an optional UI implementation pack.

Useful patterns:

- read `components.json`
- use the project's package runner
- inspect installed components first
- compose existing primitives
- use variants before custom styles
- use semantic colors
- dry-run / diff before overwrite
- review generated registry files

Recommended adaptation:

```text
Core should contain design-system-reuse / UI quality principles.
shadcn/ui should be optional, not core.
Do not force shadcn/ui on all downstream projects.
```

### 6.4 Supabase / Better Auth / Official Technical Skills

Official or maintainer-authored technical skills show that specialist technical skills are most valuable when maintained by the technology ecosystem itself.

Recommended strategy:

```text
Core kit:
- workflow
- safety
- memory
- planning
- execution
- review
- audit
- publishing

Optional / external catalog:
- Supabase
- Better Auth
- shadcn/ui
- React / Next.js / TanStack when official or high-quality references exist
- Node / TypeScript / database skills when justified by project pressure
```

### 6.5 UI Design Skills

Minimal design system, UI/UX Pro, frontend-design, and taste-skill style references are useful, but should be handled cautiously.

Useful patterns:

- design tokens
- spacing and typography rhythm
- hierarchy
- component consistency
- avoid generic AI UI
- accessibility and responsive state checklists

Risks:

- over-stylization
- conflict with existing design systems
- excessive token cost
- unclear trigger scope
- turning engineering guidance into aesthetic prompt packs

Recommended adaptation:

```text
Core should focus on UI quality and design system reuse.
Aesthetic direction belongs in optional skills or project-specific guidance.
```

---

## 7. Project Memory Context Gate

### 7.1 Goal

Unify project memory as the context gate for all project-state workflows.

### 7.2 Core Rule

```text
Any workflow that touches project state must pass the Project Memory Context Gate before producing plans, modifying files, reviewing changes, auditing the codebase, publishing, handing off work, or evolving skills.
```

### 7.3 Trigger Scope

Phase 1 applies the gate to:

```text
initialize-project-context
project-architecture-plan
plan-with-context
execute-plan
code-review
handoff
publish-current-branch
write-a-skill
update-project-memory
```

Future workflows must integrate with the gate when their own implementation phase is approved.
They are not part of Phase 1.

### 7.4 Canonical Definition

The complete gate sequence, source selection, reporting interface, continuation rules, and status
meanings belong only in `kit/skills/core/project-memory/SKILL.md`. Entrypoints, rules, and workflow
skills should contain short references and must not create competing definitions.

### 7.5 Implementation Approach

Use central definition plus short references.

#### Central Definition

Add the full definition to:

```text
kit/skills/core/project-memory/SKILL.md
```

#### Global Operating Reference

Add short entries to:

```text
AGENTS.md
kit/project-templates/AGENTS.md
kit/rules/agent-operating-contract.md
```

#### Workflow Short References

Add short references to relevant workflow skills:

```text
kit/skills/core/plan-with-context/SKILL.md
kit/skills/core/execute-plan/SKILL.md
kit/skills/core/code-review/SKILL.md
kit/skills/core/project-architecture-plan/SKILL.md
kit/skills/core/initialize-project-context/SKILL.md
kit/skills/core/update-project-memory/SKILL.md
kit/skills/core/handoff/SKILL.md
kit/skills/core/publish-current-branch/SKILL.md
kit/skills/core/write-a-skill/SKILL.md
```

#### Source-Repository Memory and Design Record

Record the completed Phase 1 capability and durable decision in this repository's
`.codex/project/` memory, with lessons updated only if a reusable lesson is discovered. Record the
accepted design in `docs/foundation-design-log.md`.

### 7.6 Reporting

Relevant workflows should incorporate the standard report defined by the central
`project-memory` skill without reproducing its schema or status meanings.

### 7.7 Why This Comes First

Project Memory Context Gate is the best first phase because it is:

- low risk
- pure documentation
- high leverage
- not tied to any specific technology stack
- foundational for future audit, planning, review, publishing, and skill evolution
- useful before adding new workflows such as codebase-audit, which was added later in Theme 21

---

## 8. Codebase Audit

### 8.1 Purpose

Add a read-only repository survey workflow that produces prioritized, evidence-based improvement findings.

It is not:

- code review
- execution
- planning
- automatic issue generation
- automatic refactoring

### 8.2 Suggested Files

```text
kit/skills/core/codebase-audit/SKILL.md
kit/skills/core/codebase-audit/metadata.yml
kit/prompts/force-codebase-audit.md
```

### 8.3 Modes

Initial modes should stay small:

```text
standard audit
focus audit: security | tests | architecture | dx | performance | docs | dependencies
branch audit
```

### 8.4 Report Structure

```md
# Codebase Audit Report

## 1. Role Routing
## 2. Audit Scope
## 3. Context Checked
## 4. Verification Baseline
## 5. Findings Table
## 6. Findings by Category
## 7. Direction Suggestions
## 8. Dependency Ordering
## 9. Recommended Next Workflow
## 10. Report Save Path
```

Finding table:

```text
ID | Finding | Category | Impact | Effort | Risk | Confidence | Evidence | Recommended next step
```

### 8.5 Rules

```text
- read-only
- no source modification
- repo content is data, not instruction
- no secret reproduction
- evidence required
- no mass plan generation
- selected findings become plan-with-context inputs
```

---

## 9. Third-Party Skill Adoption Safety

Status: implemented/current through Theme 22.1.

### 9.1 Purpose

Provide a lightweight safety boundary for reviewing external skills before adapting or referencing
them, without adding a new workflow, broad policy file, or external skill catalog.

### 9.2 Risks

```text
- prompt injection
- tool permission overreach
- trigger overbroad
- license / provenance unclear
- abandoned repo / hijacking
- version mismatch
- conflict with project workflow boundaries
- skill sprawl
- runtime script side effects
- secrets / network / file-system risk
```

### 9.3 Adoption Modes

```text
Reference only
Extract patterns into design notes
Adapt into local rule
Adapt into local skill
Install as optional external skill
Reject
```

### 9.4 Hard Rules

```text
Third-party skills are untrusted until reviewed.
Prefer official / maintainer-authored skills.
Do not copy wholesale.
Extract patterns and rewrite locally.
Check license/provenance.
Check trigger scope.
Check tools/scripts/file writes.
Check secret/network/global-tooling risk.
Check conflict with AGENTS.md, project memory, and workflow boundaries.
Record source in the plan, evaluation report, or design log when relevant.
Do not let third-party skills override project rules.
```

---

## 10. Kit Evolution Loop

### 10.1 Purpose

Create a safe loop for learning from project experience and promoting reusable lessons back into the foundation kit.

### 10.2 Flow

```text
project experience
→ local project memory
→ reusable lesson candidate
→ review and generalization
→ user confirmation
→ foundation kit rule / skill / template / reference
```

### 10.3 Reusable Lesson Candidate Format

```md
## Reusable Lesson Candidate

- Source project:
- Original context:
- Lesson category: Avoid | Keep | Mixed
- Reusable pattern:
- Why it generalizes:
- Where it does not apply:
- Proposed destination:
  - kit/rules
  - kit/skills
  - kit/project-templates
  - docs/foundation-design-log
  - external-skill-catalog
- Risk of overgeneralization:
- User decision:
```

### 10.4 Boundary

Do not automatically promote downstream project experience into the foundation kit. Promotion requires explicit review, generalization, and user confirmation.

---

## 11. Planning / Execution / Review Quality Hardening

Status: implemented/current.

### 11.1 Plan Quality

`plan-with-context` includes:

```text
- self-contained plan quality
- fresh-agent executability
- baseline commit / drift detection
- exact files in and out of scope
- confirmed validation commands
- STOP conditions
```

### 11.2 Execution Quality

`execute-plan` includes:

```text
- approved plan as execution contract
- every changed hunk maps to plan step
- out-of-scope changes must pause or be reverted
- Quality / Constraints Followed completion field
```

### 11.3 Review Quality

`code-review` includes:

```text
- generated package safety checklist
- introduced vs pre-existing findings
- plan-hunk alignment
```

Generated package checklist should include:

```text
- new files
- overwritten files
- deleted files
- mature files touched
- line count drops
- rename / migration risk
- source repo vs installable payload separation
- memory / template pollution risk
- script behavior change
```

---

## 12. UI Quality Foundation

Status: implemented/current through Phase 5.

Phase 5 added lightweight UI quality and design-system reuse guidance without creating a new UI
workflow, rule file, component library, design system package, or technology-specific UI skill.

Practical baseline UI guidance for concrete pages, screens, flows, forms, layout clarity, UI
states, and existing-system reuse is now covered by the framework-agnostic core supporting skill
`ui-design-basics`.

### 12.1 Implemented Surface

Canonical guidance now lives in:

```text
kit/rules/engineering-quality-principles.md
kit/skills/core/ui-design-basics/SKILL.md
```

Short workflow references live in:

```text
- kit/skills/core/project-architecture-plan/SKILL.md
- kit/skills/core/code-review/SKILL.md
- kit/skills/core/codebase-audit/SKILL.md
```

### 12.2 UI Quality Principles

Current core UI quality guidance covers:

```text
- user flow clarity
- visual hierarchy
- responsive behavior
- accessibility basics
- loading / empty / error / disabled / success states
- interaction feedback
- content clarity
- existing design system or UI library reuse
- frontend maintainability
- avoiding over-design and speculative redesign
```

### 12.3 UI Review Skill

A future `ui-review` skill can be added if repeated use justifies it.

It should be:

- review-only
- not a replacement for `code-review`
- not tied to shadcn/ui
- not a full professional accessibility audit
- focused on design-system reuse, accessibility, responsive behavior, and UI state quality

### 12.4 Optional UI Packs

Optional future packs may include:

```text
shadcn-ui-patterns
tailwind-design-system
frontend-design-direction
```

These should not be core by default.

---

## 13. Architecture Review Refinement

Status: implemented/current through Phase 6.

The existing `project-architecture-plan` provides architecture planning. Phase 6 refined
architecture review through the existing `code-review` Plan Alignment Review mode, with short
relationship notes in `project-architecture-plan` and `codebase-audit`.

Implemented surface:

```text
- kit/skills/core/code-review/SKILL.md
- kit/skills/core/project-architecture-plan/SKILL.md
- kit/skills/core/codebase-audit/SKILL.md
```

Architecture review now covers:

```text
- scope / decision under review
- current architecture context
- proposed direction
- boundary impact
- dependency direction and data-flow impact
- coupling / cohesion impact
- cross-cutting concerns
- security / privacy impact
- testing / validation impact
- migration / rollback impact
- runtime / deployment assumptions
- ownership / maintainability impact
- alternatives considered
- fit with project memory and accepted plans
- risks / tradeoffs
- recommendation
- next workflow
```

Only create a separate `architecture-review` skill or `project-architecture-plan/REFERENCE.md` if
repeated usage later proves that the compact existing-surface guidance is insufficient.

---

## 14. Optional Skill Catalog and Specialist Packs

Status: implemented/current through Phase 7.

Phase 7 added source-repository planning documentation for optional specialist candidates:

```text
docs/optional-skill-catalog.md
```

The catalog is not an installer manifest, package registry, marketplace, generated package
workflow, or downstream-installed runtime file. It defines vocabulary, metadata shape, candidate
status, and workflow routing for future optional specialist packs.

The first approved source-only optional specialist package is:

```text
optional-skills/react-component-patterns/
```

It provides focused React component and local-state implementation guidance. It is not part of the
default `kit/` payload and does not add installer behavior.

Track candidate metadata such as:

```text
- id
- name
- category
- maturity: stable | experimental | reference
- install default: never | prompt | project-template-specific
- dependencies
- conflicts
- required project signals
- trigger examples
- non-goals
- validation notes
- source / provenance
- license / copying risk
- adaptation status
- recommended next workflow
```

Current boundary:

```text
- source-only optional skills remain outside kit/ and require explicit project adoption
- react-component-patterns is experimental and install-default never
- no optional pack is installed by default
- no installer behavior exists yet
- Next.js, React Server Components, TanStack, shadcn/ui, Tailwind, testing, architecture, and data fetching remain separate
```

---

## 15. Phased Roadmap

### Phase 0: Process Artifact Lifecycle and Maintained Tooling Boundary

Prerequisite:

```text
Confirm that future phases use current project memory, repository files, and package scripts.
Do not target archived Bash publish or installer implementations.
Treat old plans, handoffs, reports, and research notes as process artifacts that require
freshness and source-of-truth verification.
```

This phase is documentation-only. It does not change the Node publish CLI, Node installer,
archived files, or any Phase 1-7 implementation.

### Phase 1: Project Memory Context Gate

Goal:

```text
Unify project memory as the context gate for all project-state workflows.
```

Scope:

```text
Add central gate definition:
- kit/skills/core/project-memory/SKILL.md

Add required entrypoint references:
- root AGENTS.md
- kit/project-templates/AGENTS.md

Add global operating reference:
- kit/rules/agent-operating-contract.md

Add short references:
- kit/skills/core/initialize-project-context/SKILL.md
- kit/skills/core/plan-with-context/SKILL.md
- kit/skills/core/execute-plan/SKILL.md
- kit/skills/core/code-review/SKILL.md
- kit/skills/core/project-architecture-plan/SKILL.md
- kit/skills/core/update-project-memory/SKILL.md
- kit/skills/core/handoff/SKILL.md
- kit/skills/core/publish-current-branch/SKILL.md
- kit/skills/core/write-a-skill/SKILL.md

Add context-repair special handling:
- initialize-project-context may report incomplete or stale memory while diagnosing context
- update-project-memory may proceed to repair confirmed memory gaps without treating the gap
  itself as a permanent workflow block
```

Non-goals:

```text
- no codebase-audit
- no third-party-skill-adoption-policy
- no kit-evolution-loop
- no UI skill
- no installer changes
- no scripts changes
- no publish CLI behavior or package script changes
- no validation-command changes
- no architecture-review
- no React/Node/DB optional skills
- no Phase 2-7 work
```

Source-repository updates:

```text
- .codex/project/project-guideline.md
- .codex/project/project-decisions.md
- .codex/project/lessons-learned.md only if a reusable lesson is discovered
- docs/foundation-design-log.md
```

Validation:

```text
- search confirms central definition appears once
- workflow skills contain short references, not duplicated sequences or status meanings
- AGENTS / operating contract stay concise
- no mature skill large rewrite or line-count drop
- no scripts, package commands, validation commands, dependencies, or runtime behavior change
```

### Theme 19: Core Foundation Alignment

Status: completed/current.

Goal:

```text
Lightly align foundation entrypoints and foundational skills after Project Memory Context Gate.
```

Scope:

```text
Clarify:
- project-memory owns durable memory reading/applying and the Project Memory Context Gate
- update-project-memory owns confirmed durable writes
- docs-first-research passes the gate for project-impacting research and can mark pure external
  lookup as gate-not-applicable
- agent-roles-and-capabilities owns the Missing Specialist Skill Policy
- grill-me may include a clarification-only brainstorming mode
```

External reference handling:

```text
- Vercel Labs find-skills informs future external skill discovery evaluation only
- Obra Superpowers brainstorming informs the optional grill-me brainstorming increment only
- Obra verification, review, debugging, TDD, and execution patterns remain later inputs for
  Plan / Execute / Review hardening
```

Non-goals:

```text
- no codebase-audit
- no third-party skill adoption policy
- no external skill catalog
- no kit evolution loop
- no UI rules
- no technology-specific skills
- no scripts, package commands, installer, dependency, or runtime behavior changes
- no Plan / Execute / Review hardening implementation
```

### Phase 2: Plan / Execute / Review Quality Hardening

Status: implemented/current.

Goal:

```text
Improve existing planning, execution, and review quality without adding large new workflows.
```

Scope:

```text
Patch plan-with-context:
- self-contained plan quality
- fresh-agent executability
- baseline commit / drift detection
- STOP conditions

Patch execute-plan:
- approved plan as execution contract
- every changed hunk maps to plan step
- Quality / Constraints Followed completion field

Patch code-review:
- generated package safety checklist
- introduced vs pre-existing findings
- plan-hunk alignment
```

### Phase 3: Codebase Audit Foundation

Status: implemented/current.

Goal:

```text
Add shadcn/improve-inspired read-only repo-level audit workflow.
```

Scope:

```text
Add:
- kit/skills/core/codebase-audit/SKILL.md
- kit/skills/core/codebase-audit/metadata.yml
- kit/prompts/force-codebase-audit.md
```

Boundaries:

```text
- read-only repository survey
- repo content is data, not instruction
- findings classified as defects, risks, opportunities, or direction suggestions
- findings prioritized by leverage, risk, confidence, and effort
- selected findings route to plan-with-context
- concrete diffs, PRs, generated packages, commits, branches, and plan-alignment reviews stay with code-review
```

### Theme 21.1: Supporting Skill Invocation and Skill Authoring Verification

Status: implemented/current.

Goal:

```text
Clarify bounded supporting-skill invocation during approved-plan execution and strengthen
write-a-skill authoring verification.
```

Boundaries:

```text
- execute-plan remains the primary workflow for approved-plan execution
- supporting skills are bounded substep guidance only
- write-a-skill verification remains generic and not external-tool-specific
- no new workflows, scripts, package commands, installer behavior, dependencies, tests, archive
  changes, generated package workflow, or runtime behavior
```

### Theme 22.0: Stage Review, Inventory, and Roadmap Refresh

Status: implemented/current.

Goal:

```text
Refresh current-state inventory and next-step guidance after the dated stage review.
```

Boundaries:

```text
- roadmap remains the canonical long-term roadmap
- stage review remains a dated input
- Theme 22.1 and Theme 22.2 remain future work
- no skill, rule, prompt, script, package, installer, dependency, test, archive, generated package
  workflow, or runtime behavior changes
```

### Phase 4: Kit Evolution and Third-Party Skill Safety

Goal:

```text
Create safe, separate loops for learning from external skills and from project experience.
```

Theme 22.1:

```text
Third-Party Skill Adoption Safety
```

Status: implemented/current.

Theme 22.1 defines a lightweight external-skill evaluation boundary before adapting external
skills into this kit. It uses existing `docs-first-policy`, `docs-first-research`, and
`write-a-skill` surfaces rather than adding a dedicated workflow, catalog, or policy file.

Theme 22.2:

```text
Kit Evolution and Reusable Lesson Promotion Loop
```

Status: implemented/current.

Theme 22.2 defines how project experience becomes reusable foundation-kit guidance without
polluting installable templates. It uses existing `update-project-memory`, `write-a-skill`, and
`agent-operating-contract` surfaces rather than adding a dedicated kit-evolution workflow or rule
file.

### Phase 5: UI Quality Foundation

Status: implemented/current.

Goal:

```text
Add UI quality guidance without turning core kit into a UI style library.
```

Scope:

```text
Implemented through:
- kit/rules/engineering-quality-principles.md
- short references in project-architecture-plan, code-review, and codebase-audit

Future only if repeated use justifies it:
- kit/skills/core/ui-review/SKILL.md
```

### Phase 6: Architecture Review Refinement

Status: implemented/current.

Goal:

```text
Enhance existing project-architecture-plan with architecture review methodology.
```

Scope:

```text
Implemented through:
- code-review Plan Alignment Review architecture checklist
- short relationship references in project-architecture-plan and codebase-audit

Future only if repeated use justifies it:
- kit/skills/core/project-architecture-plan/REFERENCE.md
- kit/skills/core/architecture-review/
```

### Phase 7: Optional Skill Catalog and Specialist Packs

Goal:

```text
Prepare optional specialist skill strategy without bloating core.
```

Scope:

```text
Add or expand:
- docs/optional-skill-catalog.md

Do not add real optional specialist packs, technology-specific skill directories, installer
mapping, marketplace behavior, or auto-install behavior in this phase.
```

---

## 16. Recommended Next Step

Theme 22.0 Stage Review, Inventory, and Roadmap Refresh is complete.

Theme 22.0.1 Dependency Invariant and Publish Handoff Clarification is complete.

Theme 22.1 Third-Party Skill Adoption Safety is complete. It remained lightweight:

```text
- evaluate external skills as reference candidates only
- verify source, provenance, license/copying risk, fit, safety, and workflow conflict
- route adaptation through write-a-skill after docs-first source evaluation
- do not copy external skills wholesale
- avoid scripts, package commands, installer, dependency, runtime, tests, and archive changes
- avoid a broad external marketplace or catalog
```

Theme 22.2 Kit Evolution and Reusable Lesson Promotion Loop is complete. It stayed within existing
memory, skill-authoring, and operating-contract surfaces.

Phase 5 UI Quality Foundation is complete. It stayed within existing engineering-quality,
architecture, review, and audit surfaces.

Phase 6 Architecture Review Refinement is complete. It stayed within existing architecture,
review, and audit surfaces.

Phase 7 Optional Skill Catalog and Specialist Packs is complete. It added source-repository
planning documentation for future optional specialist candidates. A later approved React component
patterns update adds the first source-only optional package without adding installer, marketplace,
or auto-install behavior.

The next recommended implementation areas remain future work and require separate plans:

```text
technology-specific skills
release workflow
deployment workflow
```

Do not execute technology-specific skill, release workflow, or deployment workflow work without a
separate plan and approval.

---

## 17. Recommended Commit Scope

If this document is committed, use a docs-only commit.

Suggested destination:

```text
docs/foundation-kit-skills-review-and-optimization-roadmap.md
```

Suggested commit message:

```text
docs: add foundation kit skills review roadmap
```
