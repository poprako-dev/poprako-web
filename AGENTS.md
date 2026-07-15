# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Build / Dev Commands

| Command | What |
|---------|------|
| `pnpm dev` | Start Vite dev server (HMR, proxies `/api` → `localhost:8888`) |
| `pnpm build` | Type-check (`tsc -b`) then bundle (`vite build`) |
| `pnpm lint` | Run ESLint |
| `pnpm storybook` | Start Storybook on port 6006 |
| `pnpm dlx shadcn@latest add <comp>` | Add a shadcn/ui component |

Tests use Vitest with Playwright (browser mode) via `@storybook/addon-vitest`. There is no standalone `pnpm test` script — tests run through the Storybook test integration. See `.storybook/vitest.setup.ts`.

**Always use `pnpm`**. Never npm, yarn, or bun for package management.

## Architecture Overview

**Poprako W (白杨子 W)** — manga/comic translation management platform.

```
src/
  main.tsx           # Entry: renders App + NotificationToast
  App.tsx            # Just wraps <RouterProvider>
  router/index.ts    # All routes + lazy-loading pattern
  store/app.ts       # Global zustand store (auth token, login state, selected team)
  index.css          # Tailwind + shadcn + custom color tokens
  api/util.ts        # Centralized fetch wrapper (Result<T> pattern, auto Bearer token)
  components/ui/     # Shared UI (Button, LoadingCircle, NotificationToast, etc.)
  features/          # Feature modules (see below)
  pages/             # Route-level page components
  layouts/           # AppShell layouts
  types/             # Domain types (camelCase) + raw API types (snake_case)
```

### Feature Module Convention

Each `src/features/<Name>/` follows this structure:
- `components/business/` — the actual components
- `layouts/` — optional layout wrapper
- `api/` — feature-specific API calls
- `types/` — feature-local types
- `hook/` — feature-local hooks
- `index.ts` — re-exports default component

### Data Flow

1. **API**: `src/api/util.ts` exports `api.get/post/put/delete/patch` — each returns `Result<T>` (`{ success, data } | { success, error }`). Auth Bearer token is read from `useAppStore.getState().getAccessToken()` automatically. Set `needAuth: false` for public endpoints.

2. **Raw → Domain types**: API responses use `snake_case` types in `src/types/raw/`. Each has an `unwrapRaw*()` function that converts to the `camelCase` domain type in `src/types/`. Always unwrap as close to the API boundary as possible.

3. **Auth**: `useAppStore` persists `accessToken` + `selectedTeamId` via zustand/persist. `loginState` (derived, not persisted) holds `{ userInfo, memberInfos }`. Both `AppLayout` and `TranslatorPage` independently fetch user + member data on mount and redirect to `/login` on failure. No centralized auth middleware — each protected route handles its own guard.

4. **Notifications**: `NotificationToast` is mounted once in `main.tsx`. Call `useToastStore().showToast(message, type)` anywhere. For unrecoverable errors: call `showToast()` for user-facing message AND `console.error()` for developer details.

5. **Translation engine**: `BaseTranslator` (core UI) expects a project abstraction via callback props (`onLoadUnits`, `onSaveUnits`, `onLoadPageImage`). `WebTranslator` is the API adapter — it fetches from the backend and delegates rendering to `BaseTranslator`. The `UnitDiff` type carries batched edit operations.

### Routing

```
/login                          — LoginPage
/translator/:chapterId/:pageId  — TranslatorPage (full-screen, no sidebar)
/                               — AppLayout (sidebar + mobile bottom nav)
  /workspace                    — WorkspacePage
  /comic-playground             — ComicPlaygroundPage
  /member-list                  — MemberGlancePage
  /settings                     — SettingsPage
```

AppLayout requires auth; TranslatorPage requires auth + chapterId + pageId. Root `/` redirects to `/workspace`.

## Coding Style (from copilot-instructions.md)

- Components: `export default function Foo()`, NOT `React.FC`
- Props: separate `type Props = { ... }` declaration — never inline in function params
- Component-level closures: `function`. Inner closures: arrow functions `() =>`
- Styles go INSIDE the `return` block; never extract styles to module-level variables
- Line length max 100 characters; use `clsx` to group Tailwind classes
- Color tokens defined in `index.css` — reuse them, don't hardcode colors
- Check `src/components/ui/` for reusable components before creating new ones
- No "card-style" wrapper components — this degrades visual quality
- Overall aesthetic: muted, easy on the eyes; avoid purple, deep blue, neon colors
- Storybook stories go in `src/stories/` matching the source structure
- Toast + console.error for unrecoverable errors (see Notifications above)
