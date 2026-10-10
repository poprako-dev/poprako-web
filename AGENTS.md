# Repository guidance

## Highest-priority UI and UX requirements

- UI style MUST be consistent across the application. UX behavior and interaction
  logic MUST follow the same established patterns across equivalent workflows.
- Before developing or changing ANY component, inspect existing components,
  related screens, and their stories to find reusable implementations and
  applicable UI/UX references. This inspection is mandatory every time.
- When an existing reference is available, reuse it or strictly follow its
  visual style and interaction logic. Without explicit user permission, NEVER
  invent a different UI, redesign the interaction, or deviate from that reference.
- Independent creative interpretation is strictly prohibited. Do not introduce
  personal design choices for layout, spacing, typography, colors, controls,
  states, feedback, or navigation. Follow established project patterns.
- If no applicable reference exists, obtain explicit user direction or approval
  for the proposed UI and UX before implementing it. The absence of a reference
  does not authorize free-form design.
- These requirements take precedence over conflicting design guidance or skill
  defaults. Only explicit user authorization permits an exception.

Use Deno 2.9 for dependency installation and project tasks. `deno.json` and the
frozen `deno.lock` are authoritative. Do not use Bun, npm, pnpm, or Yarn as
package managers. Run `deno task prepare:dependencies` after clean installs;
normal checks must use their read-only counterparts.

## Architecture

PopRaKo Web remains a browser-based React application using its HTTP backend. It
is not a Tauri project. Follow [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) as
the current architecture source of truth.

- `src/Main.tsx` starts the app. `src/application/` assembles providers and
  routing.
- `src/route/` contains TanStack file routes and route-owned business modules. A
  route may use its own modules and ancestor business modules, never sibling
  route internals.
- `src/api/` is an independent HTTP/API boundary; it does not import route UI or
  session state.
- `src/shared/` contains route-independent UI, hooks, and utilities. Setting and
  utility routes are pathless groups under the authenticated route tree; they
  are not top-level source directories. `src/test-resource/` contains only test
  resources shared across modules; keep local fixtures beside their owner.
- The route tree is generated. Edit route inputs and use the documented
  generation task; never edit generated output directly.
- Business modules own request orchestration and raw-to-domain conversion. Reuse
  the established case conversion implementation; do not hand-map every field.

## Source conventions

- Use named exports for source modules and components. TanStack route files
  export the required named `Route`. Default exports are for framework-required
  configuration and Storybook metadata.
- Declare component props with a named `type Props`. Use `type` for data shapes
  and `interface` only for pure callable contracts.
- Top-level functions and components use function declarations. Keep source and
  tests at or below 400 physical lines by splitting cohesive responsibilities
  without deleting test assertions.
- Use PascalCase `.tsx` component/story filenames and kebab-case `.ts` modules.
  Place tests and stories near their subject. Put shared test-only fixtures in
  `src/test-resource/`.
- Retain Zustand and Storybook. The interface is light-only; do not add
  dark/system preferences or theme selection UI.
- Preserve useful error context, user-facing recovery, keyboard/IME behavior,
  and accessible labels. Fix findings in the relevant code instead of adding
  broad suppressions or disabling checks.

## Checks

Use the tasks documented in `deno.json`; the `check` aggregate is the required
local gate.
