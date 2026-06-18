# TanStack Router and Query Patterns

## Critical Contract

Use this skill only when it is installed or explicitly adopted and repository evidence confirms a
React project using TanStack Router or TanStack Query, or the user explicitly requests guidance
for one of those libraries.

This skill:

- is source-only optional guidance and is not installed by the foundation kit by default
- supports TanStack Router routing and URL-state work and TanStack Query server-state work inside
  the active planning, execution, or review workflow
- does not replace `plan-with-context`, `execute-plan`, `code-review`, or
  `project-architecture-plan`
- does not cover React component decomposition or local state; route those concerns to
  `react-component-patterns` when installed or explicitly adopted
- does not cover visual hierarchy or UI state presentation; route those concerns to
  `ui-design-basics`
- does not cover TanStack Table, Form, Virtual, Start, Store, DB, Pacer, AI, or other TanStack
  libraries
- does not cover Next.js, React Server Components, backend or API design, database modeling,
  authentication strategy, testing strategy, or full frontend architecture
- requires `docs-first-research` for version-specific or API-specific TanStack behavior

Project conventions, installed package versions, existing route structure, query-key patterns,
and established state ownership remain the local source of truth. Do not introduce a parallel
routing or server-state model.

## Purpose

Improve focused TanStack Router and TanStack Query usage without turning the foundation kit into a
broad TanStack or frontend-framework pack.

Use this skill for bounded work involving:

- route-tree structure and existing routing conventions
- file-based or code-based routing as detected in the project
- navigation, route params, validated search params, and URL-state ownership
- route loaders, loader dependencies, route context, and basic route lifecycle states
- server-state query keys, query functions, freshness, caching, and invalidation
- mutations and bounded optimistic updates
- Router loaders coordinating with an existing TanStack Query cache

## Required Context and Project Signals

For project-impacting work, pass the Project Memory Context Gate through `project-memory` first.

Inspect relevant local evidence before applying guidance:

```txt
package.json and lockfile
React and bundler or framework configuration
@tanstack/react-router and @tanstack/router-plugin versions when present
route files, route configuration, and generated route-tree files
@tanstack/react-query version when present
QueryClient creation, QueryClientProvider placement, and query option/key conventions
the active plan, diff, or review target
```

Valid Router signals include `@tanstack/react-router`, `@tanstack/router-plugin`, `createRouter`,
`createFileRoute`, route configuration, or generated route-tree files. Valid Query signals include
`@tanstack/react-query`, `QueryClient`, `QueryClientProvider`, query options, or established query
keys. An explicit user request may activate prospective guidance before installation, but do not
claim the library or configuration already exists.

Apply only the Router or Query section supported by the detected signal. Apply integration
guidance only when both libraries are confirmed or the user explicitly requests their joint
design.

## Workflow

### 1. Preserve detected project conventions

Identify the current route style, route file organization, generated-file ownership, QueryClient
placement, query-key conventions, and data-fetching boundaries before proposing changes.

TanStack Router supports file-based and code-based routing. Preserve the project's chosen style;
do not migrate routing styles merely because another style is preferred by current documentation.
Never hand-edit generated route-tree files unless project documentation explicitly identifies them
as maintained source.

### 2. Keep route structure aligned with URL and layout ownership

Use the route tree to express URL matching, nested layouts, and route-level lifecycle ownership.
Keep path params for resource identity or hierarchical URL segments. Use links for normal
navigation and imperative navigation only when navigation follows an event or completed action.

Do not use route structure as a substitute for component decomposition or product-wide frontend
architecture. Route those concerns to `react-component-patterns` or
`project-architecture-plan` as appropriate.

### 3. Treat search params as validated external URL state

Use search params for state that should be serializable, bookmarkable, shareable, or preserved
across refreshes, such as filters, sorting, paging, and selected views.

- validate and normalize search input at the route boundary
- preserve established validation-library and defaulting conventions
- keep transient component-only details in local React state
- use typed link or navigation APIs instead of manual URL string assembly
- include only search values actually consumed by a loader in `loaderDeps`

Do not place arbitrary local UI state or sensitive values in the URL.

### 4. Keep loaders and route context focused

Use loaders for route-critical data or work that should coordinate with navigation and preloading.
Declare only dependencies that affect the loader result. Keep pending, error, retry, and not-found
ownership at the nearest meaningful route boundary when the route lifecycle owns the operation.

Use router or route context for deliberate route dependencies such as an existing QueryClient.
Do not turn route context into an unstructured global service container or use it to hide unclear
ownership.

Visual treatment, copy, hierarchy, and accessibility of pending, error, empty, or not-found states
remain `ui-design-basics` concerns.

### 5. Keep TanStack Query limited to server state

Use TanStack Query for asynchronous data owned outside the client that may become stale and needs
fetching, caching, synchronization, or updates. Do not move local form, interaction, or derived
component state into the query cache.

- make query keys serializable and unique to the data
- include every changing variable used by a query function in its query key
- make query functions return data or throw/reject on failure; handle clients such as `fetch` that
  do not reject unsuccessful HTTP responses automatically
- distinguish initial pending state from background fetching when the distinction affects behavior
- preserve project query-option and key organization before introducing helpers

### 6. Configure freshness and retention deliberately

Inspect current defaults and project conventions before changing them. Use official terminology
for the installed version, including `staleTime` and `gcTime` where applicable.

Choose freshness from the data's real volatility and user expectations. Do not set global
infinite freshness, disable retries, or override refetch behavior as a generic preference. Do not
confuse data freshness with inactive-cache retention.

Use complete data for `initialData` because it populates the cache. Use `placeholderData` for
temporary or partial display data that must not become the cached result.

### 7. Keep mutations and invalidation bounded

Use mutations for server-side changes. After success, invalidate or update only the query families
affected by the mutation, following existing query-key conventions.

Prefer targeted invalidation when the server remains authoritative. Use direct cache updates only
when the mutation response provides sufficient authoritative data and the ownership is clear.

Use optimistic updates only when immediate feedback materially improves the interaction and the
workflow has a safe rollback or reconciliation path. Cancel conflicting work, snapshot previous
state, roll back on failure, and reconcile with the server. Do not add optimistic complexity to
low-value or high-conflict operations.

### 8. Coordinate Router and Query without duplicate ownership

When both libraries are confirmed, reuse one project QueryClient and make it available through the
project's established provider or router-context boundary.

Let a route loader coordinate critical query data through the existing Query APIs, such as the
project's query options and `ensureQueryData`, when current official docs and project conventions
support that pattern. Let the route component read and subscribe to the same cache rather than
creating a second fetch or route-owned copy.

Do not prescribe Suspense, hydration, SSR, or error-reset integration unless the project already
uses that model and official documentation has been checked. TanStack Start and full-stack
framework behavior remain out of scope.

### 9. Return to the primary workflow

Apply this skill only as bounded supporting guidance:

```txt
planning -> plan-with-context
approved implementation -> execute-plan
TanStack Router or Query diff/PR review -> code-review
product-wide frontend architecture -> project-architecture-plan
version-specific or adjacent-library behavior -> docs-first-research
```

The primary workflow owns scope, approval, implementation, review findings, and readiness
verdicts.

## Named Failure Modes

Stop and correct the direction if it is:

- invoked without a matching Router or Query signal or explicit user request
- migrating routing styles without an approved project need
- hand-editing generated route-tree output
- treating unvalidated search params as trusted application state
- returning an entire search object from `loaderDeps` when only part affects the loader
- using Query for local component or form state
- omitting query-key variables used by the query function
- duplicating Router loader data and Query cache ownership
- applying optimistic updates without rollback and reconciliation
- prescribing version-specific APIs from memory instead of official docs
- absorbing visual design, React local state, testing, architecture, backend, authentication,
  database, Next.js, React Server Components, TanStack Start, or another TanStack library
- implying that this source-only optional skill is installed by default

## Output Behavior

Keep guidance proportional to the active task. When decisions need to be visible, report the
detected project signals, route and URL-state ownership, loader dependencies, query-key and
freshness decisions, mutation/invalidation boundaries, Router/Query cache coordination, adjacent
concerns routed elsewhere, official docs checked, and the owning next workflow.

Do not create standalone implementation approval, architecture direction, or review verdicts.

## Misuse and Rationalization Check

- "The project uses React" does not activate TanStack guidance without a matching signal or
  explicit request.
- "TanStack is one ecosystem" does not bring Table, Form, Virtual, Start, Store, DB, Pacer, AI,
  or other libraries into scope.
- "The loader can fetch it" does not justify duplicate ownership when Query already owns the
  server-state cache.
- "The UI needs filters" does not put transient or sensitive component state in search params.
- "The skill exists in this repository" does not mean it is installed or approved downstream.

## Final Self-Check

- Is a Router or Query project signal confirmed or explicitly requested?
- Did existing route, generated-file, QueryClient, and query-key conventions remain authoritative?
- Are URL state, route lifecycle, server state, and local React state owned separately?
- Are search params validated and loader dependencies minimal?
- Do query keys include all changing query-function inputs?
- Are freshness, retention, invalidation, and optimistic behavior justified?
- Does Router/Query integration reuse one cache owner?
- Were React component, visual design, architecture, testing, backend, framework, and adjacent
  TanStack concerns routed outside this skill?
- Were version-specific claims checked against official documentation?
- Did the active workflow retain planning, execution, or review ownership?
