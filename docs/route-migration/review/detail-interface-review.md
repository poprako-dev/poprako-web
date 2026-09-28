# Comic detail interface handoff

`ComicDetailModal` takes `currentUserId: string | null` as a required prop. Both
Workspace and ComicPlayground provide the signed-in identity directly. `null` is
reserved for the supported session-hydration / unauthenticated read-only state;
role self-service controls remain unavailable until an identity is known. Do not
infer identity from `activeMember`: a signed-in user may have no membership in
the comic's team. The comic-scoped `activeMember: MemberInfo | null` is also
required and independently controls team permissions.

The host hook uses the typed `ComicDetailSearch` plus required
`onChangeSearch(comicId, chapterId)` and
`onNavigateToTranslator({ returnTo, comicId, chapterId, pageId, readOnly })`
callbacks. Route components own TanStack search parsing/navigation; the host
owns detail loading and state. `returnTo` is restricted to `/workspace` or
`/comic-playground`.

Callbacks for operations that may truly be unavailable remain optional on
`ComicDetailModalProps`; their associated controls are capability-gated. Data
loading, workflow transition, chapter import, active member, current identity,
and close behavior are required contracts.
