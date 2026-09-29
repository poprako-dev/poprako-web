# Shared 与术语接口实施审查

此记录是 worker 的逐组件审查证据；全仓最终验收以执行记录为准。

## Props audit (final owned surface)

The baseline in `/tmp/poprako-p002-interface-baseline.json` was checked against definitions and repository callsites. Props are `type` aliases; optional fields below have a rendering default, are native extension slots, or represent a real state (create mode, unselected, no error, no caller callback).

| Component | Required contract | Optional props retained and reason | Caller coverage |
|---|---|---|---|
| `AppDialog` / `AppDialogAction` | title, children, onClose; action inherits native button props | description/footer are content slots; size/tone/locked/showClose/dismissal flags have defaults; body/content class hooks; action tone defaults neutral | All dialogs pass `onClose`; modal callers use optional slots only when needed; Storybook interaction and long-content checks pass. |
| `ConfirmDialog` | title, onCancel; confirm mode requires onConfirm; content mode requires an element child | description is optional text; confirm labels/loading/disabled/tone have defaults; confirm children are optional because the description can supply body text; content mode has no action footer | All confirm and content callsites checked (editor, settings, invitation, team, announcements, comic detail, translator); content dismissals pass onCancel. |
| `IconInputRow` | icon, value, onChange | mode defaults to text; placeholder and className are true presentation options | Login, password reset, comic/workset creation, filters, chapter/team forms now use the single mode API; all current callers pass value and change handler. |
| `Paginator` | mode, current/total indexes, previous/next handlers; index handler in input/list; pageStats in list | list-only open-change callback and custom footer are optional observer/content hooks | `TranslatorPaginator` uses list mode; all shared stories declare a mode, including focus-preservation input story. |
| `PagePicker` / `PageInput` | PagePicker current index/pages/onSelect; PageInput current/total/onChange | PagePicker children only add an optional footer | Used only through the list/input Paginator branches; their callbacks and page data are required. |
| `Button` | native button props | variant/size defaults, `asChild` defaults false; all are supported component behavior | Existing button callers retain standard HTML button props and get defaults. |
| `HoverSelect` | checked option id, options, onSelect | hint/maxHeight/isActive/className all have defaults; checked option id is always present (empty id means no selected option) | Existing selection callers provide the selected id and data; optional display settings stay optional. |
| `ToolboxDropdown` | readonly options | direction defaults down | Existing toolbox caller supplies options. |
| `LoadingCircle` | none | size defaults 24, default aria label, className optional | All loading callsites either rely on defaults or set size and an accessible task-specific label. |
| `MultiProgressBar` | bars | width, height and fullWidth have explicit defaults | Existing callers can choose fixed or full width; `BarArgs` is a pure data type. |
| `NotificationToast` | no public props; reads the toast store | not applicable | Mounted by the application shell once. |
| `UnitContributorTooltip` | contributors and children | none; empty contributors render the child without opening a tooltip | Unit list wraps contributor-marked content; no action fallback is used. |
| `SpecialCharPanel` | onClose | none; saved characters are owned by its hook | Its new story validates dialog and Escape dismissal. |
| `TerminologyLookupBar` | dataSource | none; query/selected/editor state is internal | Translator canvas mounts the bar with its data adapter. |
| `TermbasePanel` | dataSource, query/searchQuery, revision and all mutation/selection/error callbacks | selectedTermbase is optional only before a library is selected | Only TerminologyLookupBar owns it; it omits selectedTermbase when absent. |
| `TermPanel` | dataSource, selected termbase, query/revision and create/edit/error callbacks | none | Only TerminologyLookupBar owns it after selection. |
| `TermbaseRow` / `TermRow` | item identity, selected state where applicable, select handler | onEdit is omitted for team-owned read-only data; absence also removes long-press interaction | Only their panel renders them; comic-owned rows receive edit and team-owned rows do not. |
| `InfiniteTerminologyList` | children/count/loading flags/message/role/label/load/retry | error is optional because failure is a distinct state | Both terminology panels supply the complete scroll/list contract; empty/error/list states are browser-tested. |
| `TermbaseEditorDialog` / `TermEditorDialog` | onSave/onClose | entity is optional to represent create mode; onDelete exists only for editing an existing entity | TerminologyLookupBar opens both in create/edit states and supplies delete only in edit mode. |
| `TerminologyDialogFrame` | title, children, footer, locked, onClose | none; callers explicitly choose lock state and all action frames require a footer | Both editor dialogs supply the full frame contract. |

Callsite audit outcome: all 4 `IconInputRow` contracts used by login plus workspace/comic/member/settings/translator routes were updated to required value/change and mode semantics; all `AppDialog` calls have a close callback; all `ConfirmDialog` content/confirm variants provide the correct mode-specific action contract; the sole production Paginator caller explicitly uses list mode with its navigation callback and page stats. Current app TypeScript has no diagnostics in this owned component/terminology surface.
