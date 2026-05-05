# Web Translator Ops + Cand Order Migration Plan

## Goal
Migrate Web Translator from legacy `insert/patch/delete` save semantics to the
new Swagger contract for `POST /page/{page_id}/units` using `diff.ops` and
`diff.cand_order`, and align related page/unit loading endpoints.

## Scope
- In scope:
  - Save units flow (`saveUnits`) migration to ops + cand_order.
  - Units loading (`listUnits`) migration to page-scoped endpoint.
  - Pages loading (`listPages`) migration to chapter-scoped endpoint.
   - BaseTranslator save lifecycle updates (save-success reload, save-failure
      confirm flow for navigate/exit).
  - Type/raw wrapper updates for new unit fields and payloads.
- Out of scope:
  - Batch replace feature implementation.
  - Realtime collaborative merge UX.
  - Unrelated API modules.

## Confirmed Product Decisions
1. Save success always reloads current page to reconcile server-assigned IDs/order.
2. Save failure while navigating/exiting blocks action first, then shows a confirm with:
   - Retry: retry save, then continue pending action.
   - Discard and continue: continue navigation/exit, dropping unsaved edits.
3. Scope includes list units and list pages endpoint alignment.

## Step-by-step Execution

### Phase 1: Domain and contract model refactor
1. Update `src/types/unit.ts`:
   - Add unit identity support for local-created vs persisted units.
   - Add `lastTranslatorId` and `lastProofreaderId` fields.
   - Keep `index` as local/display ordering metadata.
2. Replace legacy diff type in `src/features/BaseTranslator/types/type.ts`:
   - Introduce ops-based structures.
   - Add `candOrder` in frontend model.
3. Add helper(s) to build save payload from current+baseline units:
   - CREATE op: `local_id`, full required geometry/is flags.
   - SAVE op: `id`, full required geometry/is flags + changed mutable field(s).
   - DELETE op: `id` only.
   - Build `cand_order` from current non-deleted units.

### Phase 2: Raw types and translator API migration
1. Update `src/types/raw/unit.ts`:
   - Unwrap list unit response compatible with current swagger `UnitVal` fields.
    - Add wrap/unwrap structures for `UnitOpVal`, `UnitDiffVal`,
       `SavePageUnitsRes`, and list-page-units envelope.
2. Update `src/features/WebTranslator/api/translator.ts`:
   - `listUnits`: `GET /page/{page_id}/units`.
   - `saveUnits`: `POST /page/{page_id}/units`.
   - `listPages`: `GET /chapter/{chapter_id}/pages`.

### Phase 3: WebTranslator state synchronization
1. Refactor `src/features/WebTranslator/components/business/WebTranslator.tsx`:
   - `handleLoadUnits` should receive units + per-page counters and sync project state.
   - `handleSaveUnits` should sync per-page counters from save response.
   - Recompute project aggregate counters from pages after updates.
2. Keep failure handling with toast + `console.error` for unrecoverable API errors.

### Phase 4: BaseTranslator save lifecycle rewrite
1. Refactor `src/features/BaseTranslator/components/business/BaseTranslator.tsx`:
   - Replace legacy diff builder with ops payload builder.
   - Remove persistence dependency on index patching.
2. On save success (`flushIfDirty`), reload current page immediately.
3. Add pending action confirm flow for failed save on navigate/exit:
   - Reuse `src/components/ui/ConfirmDialog.tsx`.
   - Preserve existing guardrail: do not silently continue without explicit confirmation.

### Phase 5: UI consumers and stories alignment
1. Ensure unit order display remains contiguous in:
   - `src/features/BaseTranslator/features/UnitList/components/business/BaseUnitItem.tsx`
   - `src/features/BaseTranslator/features/Canvas/components/business/Canvas.tsx`
2. Update relevant stories:
   - `src/stories/features/BaseTranslator.stories.tsx`

### Phase 6: Verification
1. Run `pnpm lint`.
2. Run `pnpm build` (if type surface changed broadly).
3. Run line length checker for each modified file:
   - `bun run scripts/check-line-length.ts <absolute-file-path>`
4. Manual checks:
   - create/edit/delete unit save path emits valid ops + cand_order;
   - save success reloads same page and reconciles IDs/order;
   - save failure while navigate/exit shows retry/discard confirm;
   - page/project counters remain synchronized after load/save.

## Risks and Mitigations
- Risk: missing required SAVE geometry fields triggers 400.
  - Mitigation: SAVE op builder always includes required geometry/is flags.
- Risk: invalid cand_order (duplicates/deleted ids).
   - Mitigation: deterministic cand_order construction from current buffer and
      validation helper in frontend before request.
- Risk: stale local IDs after save.
  - Mitigation: mandatory reload on save success.

## Rollout Strategy
1. Land contract/types + API changes first.
2. Land BaseTranslator lifecycle update.
3. Land UI/story updates.
4. Run lint/build/manual checks before merge.
