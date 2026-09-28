# Translator route interface audit

| Exported UI component | Caller group | Retained optional inputs and their concrete meaning |
| --- | --- | --- |
| `WebTranslator` | Authenticated translator route | None. Auth identity, project, chapter/page loaders, persistence and capability dependencies are required at the ready boundary. Expired identity uses an explicit error state. |
| `BaseTranslator` | `WebTranslator`; editor stories | None. Editor dependencies are carried by required `EditorProps`. |
| `BaseTranslatorLayout` | `BaseTranslator` | None. Canvas and sidebar render regions are required. |
| `EditorCanvas`, `EditorSidebar`, `EditorDialog` | `BaseTranslator` | None. Each receives the required `EditorSession`. |
| `Canvas` | `EditorCanvas`; canvas stories | `imageSrc: string \| null` is required and nullable because a page can lack an image; `focusedUnitId: string \| undefined` means no unit is selected. Mutating and focus callbacks are required; read-only mode blocks mutation. |
| `Marker` | `Canvas` | None. Selection, completion, bubble and drag state are explicit required values. |
| `StatusOptionBar` | `EditorSidebar`; stories | None. Async save/image-quality callbacks are required and intentionally invoked through explicit `void` handlers. |
| `FloatingSpecialCharsBar`, `ShortcutPanel` | Editor dialog/sidebar; stories | None. Their close/change actions and current selection/config are required. |
| `UnitList` | `EditorSidebar`; stories | `focusedUnitId` is absent when the page has no selection. Focus/edit/reorder callbacks are absent only for read-only or static-preview callers. Special-character request/controller/callbacks are absent when insertion or detachable-bar capability is not mounted. |
| `TranslateModeUnitItem`, `ProofreadModeUnitItem` | `UnitList` | Optional focus/edit/reorder callbacks represent a caller without that capability (read-only/preview). Drag state is absent when the row is not part of a reorder operation. `translator`/`proofreader` are absent when attribution is unavailable. `specialCharInsertRequest` is absent when no insertion event is pending; bar controller and use/ack callbacks are absent when that capability is not mounted. Translation rows show either resolved contributor when present. |
| `ReadOnlyDiffUnitItem` | `UnitList` read-only branch; stories | Optional selection callbacks are absent for static previews; contributor records are absent when no user attribution is available. |
| `BaseUnitItem` | Translate/proofread/read-only unit rows | Optional index activation and pointer reorder handlers reflect a parent without selection/reorder capability. Drag visuals are absent outside an active drag; read-only flag defaults false only in editable item callers. A unit data identifier is omitted in static compositions that do not need list lookup. |
| `SpecialCharsBar` | Translate/proofread item; floating bar | Optional controller is absent when no detachable position state exists; callbacks are absent only in static/disabled displays. `isFloating` and `isDisabled` select presentation/availability explicitly. |
| `AutoResizeTextarea` | Translate/proofread unit rows | `value` is required as a string; row callers normalize absent translated/proofread text to `""` at the textarea boundary. Placeholder/class/readOnly/focus are optional presentation or native input behavior. `ref` is optional because parents only need imperative focus in selected editor states. |
| `UnitFlagButton` | Editable unit rows; stories | None. Disabled state and toggle handler are required, so read-only callers cannot receive an accidental no-op action. |
| `LineBreakOverlay` | `AutoResizeTextarea` | None. The target ref and layout key are required. |
| `UnitContributorTooltip` | `BaseUnitItem`; stories | None. Contributor set and rendered content are required; absent attribution is represented by an empty contributor list. |
| `TranslatorPaginator` | `EditorSidebar`; stories | `currentUnits` may be undefined while the current page has not loaded; flagged statistics are omitted when the backend does not provide them. Shared paginator uses `mode="list"`. |
| `PageUnitStatsChart` | Page statistics panel; stories | None. The statistics data are required, including explicit empty results. |
| `ReadOnlyPageActions` | Read-only sidebar; stories | None. Every action supported by the view has a required callback. |
| `UnitSearchTransformDialog` | `EditorDialog`; search stories | None. Search, refresh, navigation, exclusive-operation and close capabilities are required. |
| `SearchResultList` | `UnitSearchTransformDialog` | None. Empty/loading/error states are represented by the required discriminated `searchState`. |
| `CircleSelector` | `SearchResultList` | `disabled` is optional because selection remains available in the ordinary case; callers set it only when a specific item cannot currently be selected. |
| `HighlightedText` | `SearchResultList` | None. Text and match range are required. |
| `TerminologyLookupBar`, `TermPanel`, `TermbasePanel`, `InfiniteTerminologyList`, `TermEditorDialog`, `TermbaseEditorDialog`, `TerminologyDialogFrame`, `SpecialCharPanel` | Terminology UI and stories; shared worker owns this subtree | Shared worker is auditing these contracts. Their optional records correspond to create-vs-edit forms, unavailable selection, or absent optional row actions; `error` is absent until a request fails. |

## Module boundaries and behavior

- Route work stays within `translator/business`: editor/session, API adapter, units, persistence, terminology, page statistics, canvas and shortcuts each own their responsibility.
- Unit edit operations, patch representation, and comparison live in separate modules with callers importing their defining module directly; `unit.ts` owns only the model and its operations and stays below 400 lines.
- Canvas zoom and resize state lives in `use-canvas-viewport.ts`; drag/focus/context-menu behavior remains in `use-canvas-interaction.ts`.
- `translator-search.ts` provides the route entry with `parseTranslatorSearch`, `translatorStartMode`, and `translatorReturnDestination`; values are validated and return destinations are whitelisted by the route owner.
- Story fixtures use local deterministic data and a data-URI image. Sibling-route story scenes were moved to their owning routes.
