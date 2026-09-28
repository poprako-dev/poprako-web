# PopRaKo Web Engineering Requirements

This document is the current source of truth for the Web architecture migration.
It adapts applicable shared engineering conventions from
`../poprako-native/docs/REQUIREMENTS.md` to the browser application; it does not
make this repository a Tauri app. Migration specs and R-plans provide
implementation detail and evidence, not alternate rules.

## 1. Scope and technology

PopRaKo Web remains a browser application using HTTP and existing server
contracts. Use Deno 2.9 for dependency installation, tasks, checks, and scripts;
Vite, TypeScript, React, TanStack Router file routing, Tailwind, shadcn/ui,
Lucide, Zustand, Storybook 10.6, and Vitest 4.1.11 remain the selected stack.
Keep the frozen lockfile. Do not add native bridges, Tauri, Rust, SQLite,
desktop release paths, or TanStack Query as part of this migration.

Preserve existing public URLs, browser storage contracts, API authentication and
error behavior, translator edit/save semantics, upload behavior, and deployment
behavior unless a requirement below explicitly changes them. Stories and tests
use local fixtures and must not require real accounts or a live API.

## 2. Source ownership and structure

Use route-owned business modules and remove the FDD `features` hierarchy. Target
structure:

```text
src/
  Main.tsx
  application/       # boot, router/provider assembly, styles
  route/             # TanStack file routes and route-owned business modules
    business/        # root-route shared business
    <route>/business/
  api/               # independent HTTP/API boundary; explicit shared exception
  shared/            # business-independent components, hooks, utilities
  test-resource/     # shared test-only fixtures and harness resources
  route-tree.gen.ts  # generated
script/              # repository tooling
```

The source roots are singular, full words, and kebab-case. `route` and
`test-resource` are deliberate project names; `api` is a deliberate independent
boundary. Setting and utility route groups live below the authenticated route
tree and are pathless groups, not top-level source roots. Do not create
`features`, `entities`, `pages`, `layouts`, `components`, `hooks`, `types`, or
compatibility barrels as alternate business layers. Keep route-specific helpers,
tests, and stories with their owning route. Use `test-resource` only for
resources shared by multiple tests; route-local fixtures stay under that route's
`business/test`.

A route may depend on its own implementation, ancestor route business, `api`,
and `shared` modules. It may not depend on a sibling route. `shared` and `api`
may not depend on route UI or application assembly. `application` assembles
modules; it does not own business logic. Test harnesses may assemble multiple
routes only in explicitly test-only modules. Generated route files are not
edited by hand.

## 3. API boundary and data conversion

Keep `src/api` independent of route ownership. It owns HTTP transport and shared
API response handling; route-owned modules own domain request orchestration,
auth/application policy, and raw-to-domain boundaries. Transport must not import
a session store. Preserve current Bearer authentication, base URL, `Result<T>`
metadata, 204/non-JSON handling, cancellation, and user-facing error behavior.

Reuse the established `toCamelCase` and `toSnakeCase` conversion implementations
from `../porpako-native-sv` and `../poprako-ws` as reviewed migration
references. Do not manually map every API field between snake_case and
camelCase. Convert complete payloads at the API boundary, then
validate/normalize exceptional semantic values there. Request payloads use the
inverse converter. Keep explicit DTO/domain typing and test nested objects,
arrays, nulls, dates, and exceptional fields. Record any intentional exceptions
instead of silently reintroducing hand-written field-by-field casing.

## 4. State and lifecycle

Use React state for local view state and retain Zustand for cross-route/session
state. Keep one authoritative owner for each value; derive values where possible
rather than duplicating synchronized state. Preserve the existing persisted
session keys and data format. Upload tasks survive route unmount/navigation and
are cancelled on session identity invalidation according to existing behavior.
Async responses must not overwrite state belonging to a newer route, identity,
or request generation.

## 5. Appearance and interaction

The product is light-only. Remove dark mode, system theme selection,
`prefers-color-scheme` behavior, and stored theme preference mechanisms. Keep
one light token system and maintain readable contrast, visible focus, keyboard
operation, IME safeguards, and consistent loading/empty/error states. Do not add
theme selection UI. This is an explicit scope correction to earlier migration
drafts that proposed light/dark/system modes.

Preserve the existing visual hierarchy and product interactions. Use shared
semantic tokens and components; do not add card wrappers or broad redesign.
Stories must keep meaningful assertions and use controlled fixtures.
Accessibility violations are fixed in the relevant component or fixture; do not
set a global a11y `todo` or suppress a whole rule.

## 6. Code and quality rules

Use named exports for source modules and components. TanStack route files export
the required named `Route`; registered tool configs and Storybook metadata may
use framework-required default exports. Use PascalCase `.tsx` component/story
files and kebab-case `.ts` modules. Props are named `type Props`; data shapes
use `type`, pure callable contracts may use `interface`. Prefer required props
and explicit real empty/error states over placeholder IDs, no-op callbacks,
non-null assertions, or broad optionality.

Top-level functions and components use function declarations. Keep handwritten
TS/TSX and tests to at most 400 physical lines, splitting by responsibility
without removing assertions. Use strict TypeScript and strict typed lint; do not
disable `skipLibCheck`, relax project strictness, or add broad lint/type
suppressions. Format with Prettier. Use positive and negative checker fixtures
for naming, file size, exports, and dependency direction.

## 7. Test and delivery policy

Run the project aggregate checks and real acceptance workflows. Required
evidence includes each TypeScript project, lint, formatter, route generation
consistency, unit/integration tests, Storybook browser plays, production build,
and deployment/static-server regression. Browser tests run in Chromium.
Cross-platform task setup is exercised in CI on Linux, macOS, and Windows;
deployment is gated on required checks. Keep generated resources and untracked
user test resources unless the user explicitly requests their removal.

No plan is complete from source movement alone. Each R-plan records owner,
dependencies, interfaces, deletions, tests, and evidence. Use `planned`,
`in-progress`, `review`, `blocked`, or `done` honestly; `done` requires recorded
checks and review. No commits or publishing are implied by this document.

## Route bundle regression guard

Route entry modules export only `Route` at runtime. Keep page functions private:
exporting a component used in the route configuration prevents TanStack's
automatic component splitting. Put reusable exports in route-owned business
modules. `project:check` rejects extra route runtime exports. Production builds
also inspect emitted module ownership and reject any of the eight page
implementations leaking into the entry's transitive static dependency graph.
