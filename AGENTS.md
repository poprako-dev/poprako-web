# Repository guidance

Use Deno 2.9 to install, run, and audit JavaScript dependencies. Do not use Bun, npm,
pnpm, Yarn, or other package managers. `deno.json` and the frozen `deno.lock` are the
sources of package and task configuration. Run `deno task prepare:dependencies` after a
clean dependency install; ordinary development and read-only checks use the corresponding
`:check` task.

Parallel agents are opt-in: keep work with one focused owner by default. When the user
explicitly authorizes parallel work, follow that authorization and agree on file ownership
before concurrent edits.

## Commands

| Command | Purpose |
| --- | --- |
| `deno task dev` | Start Vite with HMR and the `/api` proxy to `localhost:8888` |
| `deno task build` | Run all TypeScript programs and create the production bundle |
| `deno task typecheck` | Check app, unit, Storybook, tool, and Deno script programs separately |
| `deno task lint` | Run strict ESLint checks |
| `deno task test:unit` | Run Node-environment unit tests |
| `deno task test:integration` | Run integration tests |
| `deno task test:storybook` | Run Storybook play tests in Chromium |
| `deno task test:script` | Test repository tooling and dependency patches |
| `deno task project:check` | Check naming, module boundaries, exports, and the 400-line limit |
| `deno task generate:check` | Verify generated route files without writing to the workspace |
| `deno task storybook` | Start Storybook on port 6006 |
| `deno task build-storybook` | Build the static Storybook site |
| `sh script/ci-check.sh` | Run the CI acceptance checks and browser smoke tests |

The complete frontend check order is format, typecheck, lint, project structure, route
generation, and tests. `deno task check` is the local aggregate. `script/ci-check.sh` is
the CI entry point; `justfile` is a convenience wrapper.

## Architecture

PopRaKo Web is a React application for manga translation and team workflow management.
The source is organized around route ownership and a small application/shared layer:

- `src/Main.tsx` starts the application and mounts global theme and notification providers.
- `src/application/` contains the router, root-level providers, pending UI, CSS, and shared
  Vite base configuration.
- `src/routes/` contains TanStack file routes. Route files export the named `Route` value;
  route components and route-specific modules live beside their route.
- `src/routes/**/business/` contains domain logic used by that route and its descendants.
  Cross-route business modules belong in `src/routes/business/`.
- `src/shared/` contains reusable UI, hooks, and utilities that do not depend on a route or
  application assembly.
- `src/route-tree.gen.ts` is generated. Change route inputs and run `deno task generate`;
  never edit the generated tree directly.

Keep imports within these boundaries: shared modules cannot depend on routes or application
assembly; routes cannot depend on `src/application/`; route business modules cannot depend
on route UI; and a route can depend only on its own package and ancestor business modules.
Integration tests may assemble multiple routes when their path is explicitly a test module.

API access lives in `src/routes/business/request.ts` and returns the shared
`Result<T>` shape. Route business modules translate raw API payloads into camelCase domain
types at the API boundary. Session state is in `src/routes/business/session/`; notifications
are provided by `src/shared/component/notification-toast/`.

## Source conventions

- Use named exports for source modules and components. Route files export `Route`.
  Default exports are reserved for registered tooling configuration and Storybook metadata.
- Declare component props as a named `type Props`; data shapes use `type`, while interfaces
  are reserved for pure callable contracts.
- Use named function declarations for top-level functions. Keep files to 400 physical lines
  or fewer and split cohesive helpers when a file grows beyond that limit.
- Use lowercase kebab-case filenames for utilities and domain modules; component and story
  files use PascalCase. Place tests and stories next to the module they cover. Reusable
  route-local test fixtures go under the relevant `business/**/test/` directory.
- Prefer shared design tokens and existing shared components. Keep the visual language muted
  and readable; verify text contrast in stories. Use `clsx` to compose conditional classes.
- Keep API errors useful to people and developers: report a clear user-facing error through
  the notification system and preserve diagnostic details in application logs.

ESLint, typecheck, the project checker, and Storybook accessibility tests enforce these
rules. Fix the source or fixture that violates a rule; do not bypass checks with blanket
ignore patterns or broad exceptions.
