# React Component Patterns

## Critical Contract

Use this skill only when it is installed or explicitly adopted and repository evidence confirms a
React project or the user explicitly requests React component guidance.

This skill:

- is source-only optional guidance and is not installed by the foundation kit by default
- supports React component and local state implementation inside the active planning, execution,
  or review workflow
- does not replace `plan-with-context`, `execute-plan`, `code-review`, or
  `project-architecture-plan`
- does not handle screen hierarchy or visual design; route those concerns to `ui-design-basics`
- does not cover Next.js, React Server Components, server/client boundaries, TanStack Query,
  TanStack Router, shadcn/ui, Tailwind, form libraries, state-management libraries, testing,
  frontend architecture, or data-fetching strategy
- requires `docs-first-research` for React version-specific or API-specific claims

Project conventions, established components, and the existing UI system remain the local source of
truth. Do not introduce a parallel component style or abstraction model.

## Purpose

Improve common React component and state implementation quality without turning the foundation kit
into a broad frontend framework pack.

Use this skill for focused work involving:

- component decomposition and composition
- props and local state boundaries
- single-source-of-truth decisions and derived-state avoidance
- controlled and uncontrolled component boundaries
- event handlers and state update clarity
- Effect necessity and synchronization boundaries
- refs as escape hatches
- custom Hook extraction
- justified use of `memo`, `useMemo`, or `useCallback`
- basic semantic and accessibility-friendly component structure

## Required Context and Project Signals

For project-impacting work, pass the Project Memory Context Gate through `project-memory` first.

Before applying this guidance, inspect relevant local evidence:

```txt
package.json and lockfile
React version and framework configuration
existing JSX or TSX components
component, prop, state, and Hook conventions
existing UI primitives and accessibility patterns
the active plan, diff, or review target
```

Valid project signals include a React dependency, established JSX or TSX React source, or an
explicit user request targeting React code. If React is absent and not explicitly requested, do
not invoke this skill.

Use official React documentation through `docs-first-research` when behavior depends on a React
version, Hook API, compiler behavior, dependency semantics, or another changing framework fact.

## Workflow

### 1. Identify the component responsibility

State what the component renders, what interactions it owns, what data it receives, and what state
it must remember.

Decompose when responsibilities or data-model boundaries differ, not to satisfy an arbitrary line
count. Keep closely related rendering and interaction logic together when extraction would obscure
the flow.

Prefer composition and explicit props over a speculative generic component, mode flags, or a large
configuration object created before real variation exists.

### 2. Minimize and place state deliberately

Treat props as inputs and state as the minimal changing information the component must remember.

- derive values from current props and state during rendering when practical
- do not duplicate props in state without a real synchronization requirement
- keep one owner for each piece of state
- colocate state with the components that use it; lift it to the closest common owner when
  coordination requires it
- keep self-contained details local when parent control adds no value
- expose controlled props and explicit change handlers when a parent must coordinate behavior

Do not treat all state as global, lift state preemptively, or introduce a state-management library
through this skill.

### 3. Keep events and state updates explicit

Put user-action logic in the corresponding event handler. Use names that describe the interaction
or intent rather than the implementation detail.

Remember that each render observes a state snapshot. When the next state depends on the previous
state, use the updater form supported by the applicable React API. Replace arrays and objects
rather than mutating state in place.

Avoid chained state changes that represent one derivable value or that rely on an Effect to repair
state after rendering.

### 4. Use Effects only for external synchronization

An Effect is appropriate when a component must synchronize with a system outside React, such as a
browser API, imperative widget, subscription, or other external resource.

Before adding or retaining an Effect, ask:

- Can this value be calculated during rendering?
- Is this logic caused by a specific user event?
- Can state ownership, a key, or component composition express the behavior directly?
- What external system is being synchronized?
- What cleanup is required?

Do not use Effects to transform render data, mirror props into state, or handle a known user action.
Use official React guidance for dependency and lifecycle details rather than inventing exceptions.

### 5. Keep refs as escape hatches

Use refs for mutable information that must persist across renders but is not used to render the UI,
or for approved imperative integration such as focus or DOM access.

Use state when a change must update the rendered output. Do not use refs to bypass normal data flow,
hide render-relevant state, or create an informal global store.

### 6. Extract custom Hooks around reusable stateful logic

Extract a custom Hook when cohesive stateful behavior repeats or when a named domain operation makes
component intent materially clearer.

- name the Hook for its purpose, not its lifecycle timing
- keep inputs and returned values explicit
- remember that each Hook call owns independent state unless shared state is lifted or provided
- keep rendering and visual composition in components
- do not create generic lifecycle wrappers such as `useMount` to hide Effect behavior

Do not extract a Hook only to shorten one component or speculate about future reuse.

### 7. Add memoization only for a demonstrated reason

Treat `memo`, `useMemo`, and `useCallback` as performance tools, not correctness mechanisms or
default style.

Use them only when project evidence, profiling, an expensive calculation, or a concrete referential
stability requirement justifies the added complexity. The component must remain correct without
memoization.

Prefer simpler state placement, pure rendering, local state, and stable composition before adding
manual memoization.

### 8. Preserve semantic component structure

Use semantic elements, explicit labels, predictable keyboard behavior, visible focus conventions,
and existing accessible primitives where they fit the approved component scope.

This is a basic implementation boundary, not a visual design workflow or professional
accessibility audit. Route screen clarity, hierarchy, styling, responsive composition, and UI state
presentation to `ui-design-basics`.

### 9. Return to the primary workflow

Apply this skill only as bounded supporting guidance:

```txt
planning -> plan-with-context
approved implementation -> execute-plan
React diff or PR review -> code-review
architecture or framework strategy -> project-architecture-plan or docs-first-research
```

The primary workflow owns scope, approval, implementation, review findings, and readiness verdicts.

## Named Failure Modes

Stop and correct the direction if it is:

- invoked without a React project signal or explicit React request
- duplicating props or derived values in state without a synchronization need
- using an Effect for render-time derivation or a known user event
- using a ref for information that controls rendering
- extracting a generic Hook or component before repeated cohesive behavior exists
- applying memoization without a concrete performance or identity reason
- overriding established project components or conventions
- absorbing visual design, architecture, routing, server state, data fetching, testing, or adjacent
  framework responsibilities
- implying that this source-only optional skill is installed by default

## Output Behavior

Keep guidance proportional to the active task. When React decisions need to be visible, report the
component responsibility, props/state ownership, derived values, event/Effect boundaries, ref or
Hook rationale, memoization evidence, project conventions preserved, and the owning next workflow.

Do not create a standalone executable plan, implementation approval, architecture decision, or
review verdict.

## Misuse and Rationalization Check

- "The project uses React" does not authorize Next.js, routing, server-state, or architecture
  guidance.
- "This component may become reusable" does not justify an abstraction before real variation.
- "The linter accepts it" does not prove an Effect, ref, or memoization layer is necessary.
- "The skill exists in this repository" does not mean it is installed or approved for a downstream
  project.

## Final Self-Check

- Is React confirmed or explicitly requested?
- Is each component responsibility clear?
- Is state minimal, non-duplicated, and owned in one place?
- Could any Effect be replaced by rendering, an event handler, state placement, or composition?
- Are refs and custom Hooks used within their boundaries?
- Is memoization justified by concrete evidence?
- Did visual design and adjacent framework concerns stay outside this skill?
- Did the active workflow retain planning, execution, or review ownership?
