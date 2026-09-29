# Route business interface handoff

Scope: workspace, comic-playground, member-list, system-mail, settings, utilities business modules; the moved shell business role switch; plus the directly coordinated comic-detail presentational files listed in the handoff to luna_detail.

## Required contracts now enforced

- `Workspace` and `ComicPlayground` require the route-owned typed `search`, `onChangeSearch`, and `onNavigateToTranslator` props. `/workspace` and `/comic-playground` route entries provide each callback, and each component passes them to the shared detail host. This removes router coupling from those business components.
- `ComicCreatorModal.activeMember` is required as `MemberInfo | null`. `ComicPlayground` passes the active team member; its Storybook fixtures supply a concrete valid member. The role preset group is in shell-level `business/assignment` so the shared chapter-creation modal can use it without depending on the comic-playground leaf.
- `ComicDetailModal.activeMember` remains required and is passed through Workspace and ComicPlayground detail callsites. Optional `onNavigateReadOnly` and `onExport` callbacks in `ComicDetailSidebar` are rendered only when present; its `ActionButton.onClick` is required.
- `PageCard` remains usable as a display-only card because callers may omit navigation; click role, tab stop, keyboard handling, and pointer cursor now activate only when a callback exists, click is enabled, and the page is uploaded. `PageList` has both a display-only story and a callback-backed navigation story.
- `MemberInvitorModal.onDeleteInvitation` remains optional because deletion capability is permission-dependent; both the button and confirmation path are gated by its presence. Create/load/close callbacks remain required.
- `SettingsPanel` only opens team-scoped settings when a real active team exists; the no-team state is explicit. Theme selection uses `useTheme` from the shared hook, preserving provider synchronization.
- Workspace online state now carries loading/ready/error separately, so request failure cannot be presented as an authoritative empty-online-members result.

## Other seam/behavior notes

- `PasswordResetDialog` now calls the shared input contract with `mode="password"`; required values and change handlers remain required.
- Workset creation/modification and archive/compression inputs keep intentional optional descriptions, limits, and callbacks where the UI explicitly offers the operation without them. They do not use fake empty IDs or empty success results as fallbacks.
- Utility stories preserve the moved member search and archive pagination interactions; invitation network stories were split without dropping their assertions.
- Neutral surface, border, foreground, and muted colors in leaf business files now use theme tokens; brand/status colors and content image colors remain purpose-specific.

## Validation

- Focused ESLint (`--max-warnings 0`) passed for the leaf route business directories, assignment group, PageCard/PageList, WorkflowRecordList, and coordinated presentation files.
- `deno task project:check` passed.
- Utility and member activity unit tests passed: 3 files, 11 tests.
- Focused elevated Storybook runs passed: MemberInvitorModal and slow-network invitation scenarios, WorkflowRecordList (11 stories), and PageList (7 stories). Workspace/ComicList empty-state contrast is still in shared `business/comic-list/ComicTranslationList.tsx`, which is outside this leaf ownership.
- Full app typecheck passed in the latest root validation. Run the final formatter after the last source changes.

## Retained optional business props

- `comic-playground/business/comic-list/ComicList`: `initialMode`/`refreshKey` allow independent use with defaults or parent-controlled mode/refresh; `onUpdateWorkset`, `onCreateComic`, and `onComicClick` are optional because write/navigation actions vary by capability and embedding context; `activeFuzzyTitle` is optional when the filter is locally managed.
- `comic-playground/business/comic-list/FilterHeader`: `onCreateComic` exists only for users with create capability, `onToggleSidebar` only in compact layout, and `activeFuzzyTitle` allows the parent-controlled filter mode.
- `comic-playground/business/comic-list/WorksetSidebar`: description is optional domain data; update callback is absent for users without workset-management permission.
- `member-list/business/MemberList` and `EmbeddedMemberList`: `onMemberClick` is omitted for display-only embeds. `MemberCard.onClick` mirrors that interaction mode. `PendingInvitationCard.onDelete` is absent when the viewer cannot revoke invitations.
- `member-list/business/MemberInvitorModal`: delete operation is permission-dependent; load/create/close remain required. `InvitationInfo` optional `teamId`/`roles` reflect fields the backend may omit.
- `comic-detail/page/PageList` / `PageCard`: navigation, delete, upload, and reupload callbacks are omitted when those actions are unavailable. Progress/error fields are absent when no upload task exists. A missing click callback now guarantees display-only semantics even when `enableClick` defaults on.
- `WorksetCreatorModal` / workset request args: description is optional by product design. Chapter subtitle and comic/workset descriptions remain optional because those fields can be intentionally blank.
- Raw/domain announcement and comment user relations remain optional because list endpoints may omit included user data; view components show valid system fallbacks rather than fabricated identities.

The TypeScript `Props` declarations are `type Props` throughout the changed component files; retained optional fields above correspond to actual capability, embedding, or partial API-data states. This handoff records the specific contracts reviewed rather than claiming every repository contract was audited.
