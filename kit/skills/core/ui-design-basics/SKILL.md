# UI Design Basics

## Critical Contract

Use this skill as supporting UI guidance for concrete screens, pages, flows, forms, and UI-facing
changes.

This skill:

- does not replace `plan-with-context`, `execute-plan`, `code-review`, or
  `project-architecture-plan`
- does not approve implementation by itself
- is not a professional design, brand, or accessibility-audit skill
- does not install skills, MCP servers, CLIs, dependencies, or tooling
- treats the existing project UI system, components, tokens, styles, and conventions as the first
  source of truth

The default aesthetic is quiet, clean, practical, readable, and minimally polished. Do not default
to bold aesthetic risk, brand-heavy design, distinctive typography or color, complex animation, or
decorative visual noise.

## Purpose

Help agents make deliberate baseline UI decisions without pretending to be professional designers
or introducing a new design system.

Use this skill when planning, implementing, or reviewing:

- a concrete page, screen, flow, or form
- layout, hierarchy, actions, content grouping, or UI states
- a small UI cleanup where clarity and consistency matter
- UI in a project that may already use shadcn/ui

Do not use it for product-wide UI architecture, brand strategy, visual identity, professional
accessibility certification, or framework-specific API guidance.

## Required Context

For project-impacting work, pass the Project Memory Context Gate through `project-memory` first.

Inspect relevant project sources before proposing UI direction:

```txt
.codex/project/project-guideline.md
package.json and UI-related configuration
existing screens and routes
existing components and variants
global styles and theme files
design tokens or CSS variables
form, state, and validation patterns
components.json when present
```

Use `docs-first-research` for external framework, component API, accessibility-standard, shadcn/ui,
or tooling facts. Repository evidence and the project's established design language win over
generic preferences.

## Workflow

### 1. Inspect before designing

Identify the existing UI system, reusable components, tokens, spacing, typography, radius, borders,
shadows, icons, responsive patterns, and interaction conventions.

Do not introduce a parallel visual language when the project already has one.

### 2. Define the UI job

State:

```txt
Subject / product:
Audience:
Page / screen / flow goal:
Primary action:
Secondary actions:
Required content groups:
Relevant states:
```

Use one clear page goal. Copy, labels, helper text, validation messages, and empty/error messaging
are part of the design, not cleanup to defer automatically.

### 3. Establish hierarchy and composition

Prefer a simple hierarchy:

- clear title and concise description
- one visually dominant primary action when the flow has one
- secondary actions with lower emphasis
- content grouped by meaning rather than decoration
- focused reusable components with clear contracts
- responsive behavior appropriate to the existing project

Keep layout, spacing, density, radius, borders, and shadows consistent. Avoid stacking every
section into an identical rounded card or adding visual treatments that do not support the page
goal.

### 4. Use restrained semantic styling

Prefer existing semantic tokens over raw arbitrary colors. If the project has no established
palette, start with a neutral base and one primary accent, adding status colors only when meaning
requires them.

Do not use color as the only signal. Preserve readable contrast as a baseline:

- normal text: at least `4.5:1`
- large text: at least `3:1`
- relevant UI component and state visuals: at least `3:1` against adjacent colors

These are baseline checks, not a complete accessibility audit. Follow stricter project or product
requirements when they exist.

### 5. Cover interaction and content states

When relevant, account for:

- loading
- empty
- error
- disabled
- validation
- success

Use semantic controls, explicit labels, useful helper text, visible focus, and expected keyboard
paths. Reuse accessible project primitives instead of rebuilding their behavior casually.

### 6. Apply shadcn-aware behavior only when detected

Treat `components.json` as a likely shadcn/ui project signal, then confirm it against local
component paths, imports, aliases, and theme files.

When confirmed:

- inspect existing components, blocks, tokens, variants, theme, and aliases
- prefer installed components and blocks before custom replacements
- preserve semantic tokens and the project theme
- use official shadcn/ui documentation through `docs-first-research` when needed
- use an already installed official shadcn skill only as bounded supporting guidance

Require explicit user approval before installing the official shadcn skill, an MCP server, the
shadcn CLI, or additional tooling. Any command that downloads, installs, overwrites, migrates,
ejects, or changes files also requires the active approved workflow.

Do not make shadcn/ui mandatory when `components.json` is absent.

### 7. Return to the primary workflow

Apply this guidance inside the active workflow:

```txt
planning -> plan-with-context
approved implementation -> execute-plan
diff or PR review -> code-review
product-wide UI direction -> project-architecture-plan
```

Do not create a standalone implementation approval, executable plan, review verdict, or
architecture decision from this skill alone.

## Named Failure Modes

Stop and correct the direction if it is:

- ignoring an existing design system
- using arbitrary colors or one-off component styling
- proceeding without a clear page purpose or primary action
- omitting relevant UI states or form copy
- adding excessive decoration or generic templated UI
- silently installing or invoking unapproved tooling
- treating this skill as architecture planning, implementation approval, code review, or
  professional accessibility certification

## Output Behavior

Keep UI guidance concise and integrate it into the active workflow artifact. When UI decisions need
to be visible, report the page goal, existing system reused, hierarchy, states, accessibility
baseline, assumptions, and next workflow.

Stop and return to clarification or planning when the audience, page goal, primary action, design
system, brand direction, or required accessibility level is materially unclear.

## Final Self-Check

- Did I inspect the existing UI system, components, and tokens?
- Did I identify one clear page, screen, or flow goal?
- Is the hierarchy clear?
- Are colors semantic and restrained?
- Are key states covered?
- Is the result too generic, too decorative, or too complex?
