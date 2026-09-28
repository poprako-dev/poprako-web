# Session / routing worker handoff

## Routing contract

- `src/application/router.ts` exports `parseRouteSearch` / `stringifyRouteSearch` with legacy-compatible query behavior ; `script/route-config.ts` owns the shared generator/plugin configuration.
- Protected pages use `src/routes/_authenticated/route.tsx` for `beforeLoad` session restoration and online lease lifetime. The translator route remains outside the authenticated shell, but inside auth/lease boundaries.
- Workspace and comic-playground route entries pass the host contract owned by leaf: `search: ComicDetailSearch`, `onChangeSearch(comicId, chapterId)`, `onNavigateToTranslator(TranslatorDestination)` from `use-comic-detail-host`.
- Translator route uses `parseTranslatorSearch`, `translatorStartMode`, and `translatorReturnDestination` from `translator-search.ts`.
- `script/generate.ts` `--check` generates in a temporary copy and compares route inputs plus generated tree; `deno task generate:check` passes.

## Session / API behavior

- Session API: `beginSession(token)`, `ensureSession()`, `refreshSession()`, `selectTeam(id)`, `clearSession()` in `src/routes/business/session/session.ts`.
- Persisted session schema is intentionally restricted through `persistSessionData`: only `accessToken` and `selectedTeamId` persist; recovered user/member identity and generation do not.
- Authentication guard quietly redirects missing-token and obsolete-generation cases. A current-token restore failure reports via `showLocalCaughtError` (422 deduplicated) and one `console.error`, then redirects to login.
- `shared/utility/http.ts` holds pure HTTP response/error utilities. Request adapters own user-facing reporting (`createApiFailure`); custom detail transports route through the same 422 de-duplication policy.
- Original `src/api/util.test.ts` assertions are preserved in `src/routes/business/request.test.ts`. Added pure transport coverage in `src/shared/utility/http.test.ts`.

## Regression coverage

- `src/routes/business/session/session.test.ts`: concurrent restore deduplication, team fallback and membership validation, stale identity response protection, logout clearing, persisted field contract.
- `src/application/test/router.test.tsx`: guarded direct navigation and auth failure behavior with an in-memory store fixture (avoids Deno persistent-storage permissions).
- Upload behavior is split between `upload/page-upload-allocation.test.ts` and `upload/page-upload-runtime.test.ts`; both preserve allocation/serialization/callback tests and stale-generation queue protection.
- Identity/API compatibility assertions are under `src/routes/business/test/api-contract.test.ts` and `workflow-contract.test.ts`.

## Verification

Passed during handoff: app typecheck, test typecheck, project checker, generate check, scoped lint, router/session/HTTP/request/upload unit coverage. Latest focused run: 28 tests passed; latest session-only run after persistence contract addition: 4 tests passed.
