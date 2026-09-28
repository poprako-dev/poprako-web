# 全量组件契约复核索引

最终源码共 172 个生产组件。此表记录组件接口决策；定义、继承字段与全部 JSX 调用点见 [类型检查器清单](component-inventory.json)。自动清单的 `needs-manual-review` 是发现工具的固定输出，不是本表的完成状态；该工具不自动声称语义正确。

已结合分组审查记录核对必需动作、调用点和保留空态。原生 HTML 属性遵循 DOM 可选契约，不机械改成必填。嵌套 DTO 的真实 API 可空值由 API 契约约束；此表审查组件边界，不把递归 DTO 中的每个字段当作组件 Prop。

## Application

定义：`src/Main.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## RoutePending

定义：`src/application/RoutePending.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ApplicationRoot

定义：`src/route/__root.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## AcknowledgementsFooter

定义：`src/route/_authenticated/_shell/(setting)/business/AcknowledgementsFooter.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## PasswordResetDialog

定义：`src/route/_authenticated/_shell/(setting)/business/PasswordResetDialog.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## SettingsPanel

定义：`src/route/_authenticated/_shell/(setting)/business/SettingsPanel.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## TeamSwitchModal

定义：`src/route/_authenticated/_shell/(setting)/business/TeamSwitchModal.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## UserAvatarUploadModal

定义：`src/route/_authenticated/_shell/(setting)/business/UserAvatarUploadModal.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## SettingsPage

定义：`src/route/_authenticated/_shell/(setting)/settings.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ArchiveFileList

定义：`src/route/_authenticated/_shell/(utility)/business/ArchiveFileList.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ArchiveOutput

定义：`src/route/_authenticated/_shell/(utility)/business/ArchiveOutput.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ArchiveTool

定义：`src/route/_authenticated/_shell/(utility)/business/ArchiveTool.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## BoundedCompressionTool

定义：`src/route/_authenticated/_shell/(utility)/business/BoundedCompressionTool.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ImageSizeInput

定义：`src/route/_authenticated/_shell/(utility)/business/ImageSizeInput.tsx`。调用点 3 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## Utilities

定义：`src/route/_authenticated/_shell/(utility)/business/Utilities.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## UtilitiesPage

定义：`src/route/_authenticated/_shell/(utility)/utilities.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## PresetAssignmentRoleSwitchGroup

定义：`src/route/_authenticated/_shell/business/assignment/PresetAssignmentRoleSwitchGroup.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

`activeMember`：当前用户可能不属于漫画团队；null 禁止团队管理动作，不伪造成员。

## ActionButton

定义：`src/route/_authenticated/_shell/business/comic-detail/ActionButton.tsx`。调用点 4 处，具体位置见清单同名同路径条目。

`danger`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `disabled`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。

## ArtworkUploadDialog

定义：`src/route/_authenticated/_shell/business/comic-detail/ArtworkUploadDialog.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## AssignmentAvatarStack

定义：`src/route/_authenticated/_shell/business/comic-detail/AssignmentAvatarStack.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`canRemove`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `isLoading`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `onRequestRemove`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `showEmpty`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。

## AvatarContent

定义：`src/route/_authenticated/_shell/business/comic-detail/AssignmentAvatarStack.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## AvatarTooltip

定义：`src/route/_authenticated/_shell/business/comic-detail/AssignmentAvatarStack.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## MemberAvatar

定义：`src/route/_authenticated/_shell/business/comic-detail/AssignmentAvatarStack.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`onRequestRemove`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。

## OverflowMembers

定义：`src/route/_authenticated/_shell/business/comic-detail/AssignmentAvatarStack.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`onRequestRemove`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。

## ActionButton

定义：`src/route/_authenticated/_shell/business/comic-detail/AssignmentGroup.tsx`。调用点 3 处，具体位置见清单同名同路径条目。

`danger`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `disabled`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。

## AssignmentGroup

定义：`src/route/_authenticated/_shell/business/comic-detail/AssignmentGroup.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`canJoinRole`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `canLeaveRole`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `canManageAssignments`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `canOperateWorkflow`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `isAssignmentsLoading`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `isRoleJoining`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `isRoleLeaving`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onAddAssignment`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onJoinRole`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onLeaveRole`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onRemoveAssignment`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `selectedChapter`：尚无章节或尚未选中；操作入口按章节存在性约束。

## ChapterCreatorModal

定义：`src/route/_authenticated/_shell/business/comic-detail/ChapterCreatorModal.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`activeMember`：当前用户可能不属于漫画团队；null 禁止团队管理动作，不伪造成员。

## ChapterModifierModal

定义：`src/route/_authenticated/_shell/business/comic-detail/ChapterModifierModal.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ChapterOption

定义：`src/route/_authenticated/_shell/business/comic-detail/ChapterOption.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`activeMember`：当前用户可能不属于漫画团队；null 禁止团队管理动作，不伪造成员。 `isLoading`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `onCreateChapter`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onDelete`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onLongPress`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `selectedChapter`：尚无章节或尚未选中；操作入口按章节存在性约束。

## ComicDetailContent

定义：`src/route/_authenticated/_shell/business/comic-detail/ComicDetailContent.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`chapterId`：章节未选中时显示空态，不请求空 ID。

## ViewButton

定义：`src/route/_authenticated/_shell/business/comic-detail/ComicDetailContent.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ComicDetailExportOptionsDialog

定义：`src/route/_authenticated/_shell/business/comic-detail/ComicDetailExportOptionsDialog.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ComicDetailHeader

定义：`src/route/_authenticated/_shell/business/comic-detail/ComicDetailHeader.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`activeMember`：当前用户可能不属于漫画团队；null 禁止团队管理动作，不伪造成员。 `onCreateChapter`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onDeleteChapter`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onLongPressChapter`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onLongPressTitle`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `selectedChapter`：尚无章节或尚未选中；操作入口按章节存在性约束。 `selectedChapterId`：无章节选择；禁止对应章节操作。

## ComicDetailLoadState

定义：`src/route/_authenticated/_shell/business/comic-detail/ComicDetailLoadState.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

`error`：没有请求错误；失败时展示真实错误。

## ComicDetailMainView

定义：`src/route/_authenticated/_shell/business/comic-detail/ComicDetailMainView.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`activeMember`：当前用户可能不属于漫画团队；null 禁止团队管理动作，不伪造成员。 `coverInputRef`：DOM ref 挂载前和卸载后允许 null。

## ComicDetailModal

定义：`src/route/_authenticated/_shell/business/comic-detail/ComicDetailModal.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

`initialChapterId`：首次打开未指定章节时，由详情加载结果选择业务默认章节。 `pinnedChapter`：漫画允许没有置顶章节。

## ComicDetailModalDialogs

定义：`src/route/_authenticated/_shell/business/comic-detail/ComicDetailModalDialogs.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`artworkChapter`：null 表示成品上传弹窗关闭。 `chapterToModify`：null 表示章节修改弹窗关闭。 `memberSelectorRole`：null 表示成员选择器关闭。 `pendingImport`：null 表示没有待确认导入。 `selectedChapterId`：无章节选择；禁止对应章节操作。

## ComicDetailModalLayout

定义：`src/route/_authenticated/_shell/business/comic-detail/ComicDetailModalLayout.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ComicDetailSidebar

定义：`src/route/_authenticated/_shell/business/comic-detail/ComicDetailSidebar.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`coverInputRef`：DOM ref 挂载前和卸载后允许 null。 `isImportingData`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `onExport`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onNavigateReadOnly`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `selectedChapter`：尚无章节或尚未选中；操作入口按章节存在性约束。

## ComicDetailWorkflowView

定义：`src/route/_authenticated/_shell/business/comic-detail/ComicDetailWorkflowView.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`chapterId`：章节未选中时显示空态，不请求空 ID。

## ComicModifierModal

定义：`src/route/_authenticated/_shell/business/comic-detail/ComicModifierModal.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ExportProgressDialog

定义：`src/route/_authenticated/_shell/business/comic-detail/ExportProgressDialog.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ImportTranslationDialog

定义：`src/route/_authenticated/_shell/business/comic-detail/ImportDialog.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## LazyImage

定义：`src/route/_authenticated/_shell/business/comic-detail/LazyImage.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

`alt`：装饰性图片默认空替代文本；需要说明的图片调用方传入文本。 `className`：可选样式扩展，缺省使用组件自身布局。 `placeholderClassName`：可选样式扩展，缺省使用组件自身布局。

## MemberSelectorModal

定义：`src/route/_authenticated/_shell/business/comic-detail/MemberSelectorModal.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

`isSubmitting`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。

## QuickWorkflowActions

定义：`src/route/_authenticated/_shell/business/comic-detail/QuickWorkflowActions.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

`selectedChapter`：尚无章节或尚未选中；操作入口按章节存在性约束。

## RoleTag

定义：`src/route/_authenticated/_shell/business/comic-detail/RoleTag.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

`canJoinSelf`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `canLeaveSelf`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `isJoiningSelf`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `isLeavingSelf`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `onAddUser`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onJoinSelf`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onLeaveSelf`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onRemoveUser`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。

## StatItem

定义：`src/route/_authenticated/_shell/business/comic-detail/StatItem.tsx`。调用点 4 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## TransitionDialog

定义：`src/route/_authenticated/_shell/business/comic-detail/TransitionDialog.tsx`。调用点 3 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## UserTag

定义：`src/route/_authenticated/_shell/business/comic-detail/UserTag.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`onRemove`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。

## WorkflowPanel

定义：`src/route/_authenticated/_shell/business/comic-detail/WorkflowPanel.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## RecordItem

定义：`src/route/_authenticated/_shell/business/comic-detail/WorkflowRecordList.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## TextParts

定义：`src/route/_authenticated/_shell/business/comic-detail/WorkflowRecordList.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## WorkflowRecordList

定义：`src/route/_authenticated/_shell/business/comic-detail/WorkflowRecordList.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

`chapterId`：章节未选中时显示空态，不请求空 ID。

## PageCard

定义：`src/route/_authenticated/_shell/business/comic-detail/page/PageCard.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`canReupload`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `enableClick`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `enableDelete`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `isReuploading`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `onClick`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onDelete`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onReupload`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `reuploadAccept`：缺省使用页面上传支持的文件类型。 `uploadError`：对应上传没有失败。 `uploadProgress`：上传尚未产生进度，不能当作完成。 `uploadStatus`：普通已上传页面没有本地上传任务。

## PageList

定义：`src/route/_authenticated/_shell/business/comic-detail/page/PageList.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`accept`：缺省使用控件支持的文件类型。 `canReuploadPage`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `enableClick`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `enableDelete`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `isPageReuploading`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `onAddPages`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onClickPage`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onDeletePage`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onReuploadPage`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `reuploadAccept`：缺省使用页面上传支持的文件类型。 `uploadErrorByPageId`：没有失败任务时不提供错误映射。 `uploadProgressByPageId`：没有本地上传任务时不提供进度映射。 `uploadStatusByPageId`：普通页面列表可以没有上传任务映射。

## ComicTranslationCard

定义：`src/route/_authenticated/_shell/business/comic-list/ComicTranslationCard.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`chapter`：漫画可能尚无章节；不构造空章节。

## DataTag

定义：`src/route/_authenticated/_shell/business/comic-list/ComicTranslationCard.tsx`。调用点 3 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ComicTranslationList

定义：`src/route/_authenticated/_shell/business/comic-list/ComicTranslationList.tsx`。调用点 3 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## FirstRegistrationGuideDialog

定义：`src/route/_authenticated/_shell/business/first-registration/FirstRegistrationGuideDialog.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## AppSidebar

定义：`src/route/_authenticated/_shell/business/navigation/AppSidebar.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## AppSidebarLayout

定义：`src/route/_authenticated/_shell/business/navigation/AppSidebarLayout.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## NavItem

定义：`src/route/_authenticated/_shell/business/navigation/NavItem.tsx`。调用点 3 处，具体位置见清单同名同路径条目。

`hasBadge`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。

## SettingsFooter

定义：`src/route/_authenticated/_shell/business/navigation/SettingsFooter.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## TeamModifierModal

定义：`src/route/_authenticated/_shell/business/navigation/TeamModifierModal.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## TeamAvatar

定义：`src/route/_authenticated/_shell/business/navigation/TeamOption.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`localAvatarUrl`：尚未选取本地图片，不创建虚假预览。 `uploadProgress`：上传尚未产生进度，不能当作完成。

## TeamOption

定义：`src/route/_authenticated/_shell/business/navigation/TeamOption.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`onUpdateTeam`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。

## TeamList

定义：`src/route/_authenticated/_shell/business/navigation/TeamOptionMenu.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`onLongPressTeam`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。

## TitleHeader

定义：`src/route/_authenticated/_shell/business/navigation/TitleHeader.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ComicCreatorModal

定义：`src/route/_authenticated/_shell/comic-playground/business/ComicCreatorModal.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`activeMember`：当前用户可能不属于漫画团队；null 禁止团队管理动作，不伪造成员。

## ComicPlayground

定义：`src/route/_authenticated/_shell/comic-playground/business/ComicPlayground.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## WorksetCreatorModal

定义：`src/route/_authenticated/_shell/comic-playground/business/WorksetCreatorModal.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## WorksetModifierModal

定义：`src/route/_authenticated/_shell/comic-playground/business/WorksetModifierModal.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ComicList

定义：`src/route/_authenticated/_shell/comic-playground/business/comic-list/ComicList.tsx`。调用点 5 处，具体位置见清单同名同路径条目。

`activeFuzzyTitle`：默认空字符串表示没有标题过滤。 `initialMode`：默认列表视图，调用者可选择初始视图。 `onCreateComic`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onUpdateWorkset`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `refreshKey`：缺省为初始刷新代次；变更时触发重新加载。

## ComicListLayout

定义：`src/route/_authenticated/_shell/comic-playground/business/comic-list/ComicListLayout.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## FilterHeader

定义：`src/route/_authenticated/_shell/comic-playground/business/comic-list/FilterHeader.tsx`。调用点 3 处，具体位置见清单同名同路径条目。

`activeFuzzyTitle`：默认空字符串表示没有标题过滤。 `onCreateComic`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onToggleSidebar`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。

## WorksetSidebar

定义：`src/route/_authenticated/_shell/comic-playground/business/comic-list/WorksetSidebar.tsx`。调用点 4 处，具体位置见清单同名同路径条目。

`onUpdateWorkset`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。

## ComicProgressItem

定义：`src/route/_authenticated/_shell/comic-playground/business/progress/ComicProgressItem.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ComicProgressList

定义：`src/route/_authenticated/_shell/comic-playground/business/progress/ComicProgressList.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## WorkflowStepDropdown

定义：`src/route/_authenticated/_shell/comic-playground/business/progress/WorkflowStepDropdown.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ComicPlaygroundPage

定义：`src/route/_authenticated/_shell/comic-playground/index.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## EmbeddedMemberList

定义：`src/route/_authenticated/_shell/member-list/business/EmbeddedMemberList.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

`onMemberClick`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。

## InvitationForm

定义：`src/route/_authenticated/_shell/member-list/business/InvitationForm.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## InvitationList

定义：`src/route/_authenticated/_shell/member-list/business/InvitationList.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## MemberDetailModal

定义：`src/route/_authenticated/_shell/member-list/business/MemberDetailModal.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## MemberGlance

定义：`src/route/_authenticated/_shell/member-list/business/MemberGlance.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## MemberInvitorModal

定义：`src/route/_authenticated/_shell/member-list/business/MemberInvitorModal.tsx`。调用点 8 处，具体位置见清单同名同路径条目。

`onDeleteInvitation`：缺少删除权限时不提供能力，按钮和确认路径一并关闭。

## MemberList

定义：`src/route/_authenticated/_shell/member-list/business/MemberList.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

`activeRole`：null 表示不按职位筛选。 `onMemberClick`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。

## MemberListFilterHeader

定义：`src/route/_authenticated/_shell/member-list/business/MemberListFilterHeader.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

`activeRole`：null 表示不按职位筛选。

## PendingInvitationCard

定义：`src/route/_authenticated/_shell/member-list/business/PendingInvitationCard.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`onDelete`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。

## MemberCard

定义：`src/route/_authenticated/_shell/member-list/business/member/MemberCard.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`onClick`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。

## RoleTag

定义：`src/route/_authenticated/_shell/member-list/business/member/MemberCard.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## MemberGlancePage

定义：`src/route/_authenticated/_shell/member-list/index.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## MobileBottomNav

定义：`src/route/_authenticated/_shell/route.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## Shell

定义：`src/route/_authenticated/_shell/route.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## MailItem

定义：`src/route/_authenticated/_shell/system-mail/business/SystemMailViewer.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## SectionLabel

定义：`src/route/_authenticated/_shell/system-mail/business/SystemMailViewer.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## SystemMailViewer

定义：`src/route/_authenticated/_shell/system-mail/business/SystemMailViewer.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## SystemMailPage

定义：`src/route/_authenticated/_shell/system-mail/index.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## AnnouncementCreatorModal

定义：`src/route/_authenticated/_shell/workspace/business/AnnouncementCreatorModal.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## AnnouncementTable

定义：`src/route/_authenticated/_shell/workspace/business/AnnouncementTable.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## CommentChatBox

定义：`src/route/_authenticated/_shell/workspace/business/CommentChatBox.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## OnlineUserPopover

定义：`src/route/_authenticated/_shell/workspace/business/OnlineUserPopover.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## Workspace

定义：`src/route/_authenticated/_shell/workspace/business/Workspace.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## WorkspaceLayout

定义：`src/route/_authenticated/_shell/workspace/business/WorkspaceLayout.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## SectionHeading

定义：`src/route/_authenticated/_shell/workspace/business/WorkspacePanel.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## TabButton

定义：`src/route/_authenticated/_shell/workspace/business/WorkspacePanel.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## WorkspacePanel

定义：`src/route/_authenticated/_shell/workspace/business/WorkspacePanel.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`selectedTeamId`：无选中团队时不可发送团队请求。 `team`：无团队时仅呈现个人内容与加入提示。

## AnnouncementDetailHeader

定义：`src/route/_authenticated/_shell/workspace/business/announcement/AnnouncementDetailHeader.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## AnnouncementRow

定义：`src/route/_authenticated/_shell/workspace/business/announcement/AnnouncementRow.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## WorkspacePage

定义：`src/route/_authenticated/_shell/workspace/index.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## AuthenticatedContents

定义：`src/route/_authenticated/route.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## AuthenticatedRoot

定义：`src/route/_authenticated/route.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## TranslatorPage

定义：`src/route/_authenticated/translator/$chapterId/$pageId/index.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## BaseTranslator

定义：`src/route/_authenticated/translator/business/BaseTranslator.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## FloatingSpecialCharsBar

定义：`src/route/_authenticated/translator/business/FloatingSpecialCharsBar.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`controller`：未使用可分离浮层定位能力。

## StatusOptionBar

定义：`src/route/_authenticated/translator/business/StatusOptionBar.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## Canvas

定义：`src/route/_authenticated/translator/business/canvas/Canvas.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`focusedUnitId`：当前页可以没有选中翻译单元。 `imageSrc`：页面图像可能未加载或缺失，保留真实空态。

## Marker

定义：`src/route/_authenticated/translator/business/canvas/Marker.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## BaseTranslatorLayout

定义：`src/route/_authenticated/translator/business/editor/BaseTranslatorLayout.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## EditorCanvas

定义：`src/route/_authenticated/translator/business/editor/EditorCanvas.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## EditorDialog

定义：`src/route/_authenticated/translator/business/editor/EditorDialog.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## EditorSidebar

定义：`src/route/_authenticated/translator/business/editor/EditorSidebar.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## PageUnitStatsChart

定义：`src/route/_authenticated/translator/business/page-statistic/PageUnitStatsChart.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ReadOnlyPageActions

定义：`src/route/_authenticated/translator/business/page-statistic/ReadOnlyPageActions.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## TranslatorPaginator

定义：`src/route/_authenticated/translator/business/page-statistic/TranslatorPaginator.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

`currentUnits`：当前页尚未加载，不能把未知统计伪装成零。

## WebTranslator

定义：`src/route/_authenticated/translator/business/remote/WebTranslator.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## CircleSelector

定义：`src/route/_authenticated/translator/business/search-transform/CircleSelector.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

`disabled`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。

## HighlightedText

定义：`src/route/_authenticated/translator/business/search-transform/HighlightedText.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## SearchResultList

定义：`src/route/_authenticated/translator/business/search-transform/SearchResultList.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## UnitSearchTransformDialog

定义：`src/route/_authenticated/translator/business/search-transform/UnitSearchTransformDialog.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ShortcutPanel

定义：`src/route/_authenticated/translator/business/shortcut/ShortcutPanel.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## SpecialCharPanel

定义：`src/route/_authenticated/translator/business/special-character/SpecialCharPanel.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## InfiniteTerminologyList

定义：`src/route/_authenticated/translator/business/terminology/InfiniteTerminologyList.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

`error`：没有请求错误；失败时展示真实错误。

## TermEditorDialog

定义：`src/route/_authenticated/translator/business/terminology/TermEditorDialog.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`onDelete`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `term`：缺省表示创建术语，提供实体表示编辑。

## TermPanel

定义：`src/route/_authenticated/translator/business/terminology/TermPanel.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## TermRow

定义：`src/route/_authenticated/translator/business/terminology/TermPanel.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`onEdit`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。

## TermbaseEditorDialog

定义：`src/route/_authenticated/translator/business/terminology/TermbaseEditorDialog.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`onDelete`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `termbase`：缺省表示创建术语库，提供实体表示编辑。

## TermbasePanel

定义：`src/route/_authenticated/translator/business/terminology/TermbasePanel.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`selectedTermbase`：尚未选择术语库。

## TermbaseRow

定义：`src/route/_authenticated/translator/business/terminology/TermbasePanel.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`onEdit`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。

## TerminologyDialogFrame

定义：`src/route/_authenticated/translator/business/terminology/TerminologyDialogFrame.tsx`。调用点 4 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## TerminologyLookupBar

定义：`src/route/_authenticated/translator/business/terminology/TerminologyLookupBar.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## AutoResizeTextarea

定义：`src/route/_authenticated/translator/business/unit-list/AutoResizeTextarea.tsx`。调用点 3 处，具体位置见清单同名同路径条目。

`className`：可选样式扩展，缺省使用组件自身布局。 `onFocus`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `placeholder`：呈现/输入配置具有组件默认值；互斥模式及模式专属动作由类型约束。 `readOnly`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `ref`：未挂载时 DOM ref 为空；不提供 ref 的调用方无需命令式聚焦。

## BaseUnitItem

定义：`src/route/_authenticated/translator/business/unit-list/BaseUnitItem.tsx`。调用点 3 处，具体位置见清单同名同路径条目。

`canToggleBubble`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `dataUnitId`：静态行无需列表定位用的 DOM data 属性。 `enableReadOnly`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `isDragDimmed`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `isDragging`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `onIndexActivate`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onIndexPointerDown`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `showDropIndicator`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。

## LineBreakOverlay

定义：`src/route/_authenticated/translator/business/unit-list/LineBreakOverlay.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

`targetRef`：DOM ref 挂载前和卸载后允许 null。

## ProofreadModeUnitItem

定义：`src/route/_authenticated/translator/business/unit-list/ProofreadModeUnitItem.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

`canToggleBubble`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `dataUnitId`：静态行无需列表定位用的 DOM data 属性。 `enableReadOnly`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `isDragDimmed`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `isDragging`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `onIndexActivate`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onIndexPointerDown`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onModifyUnit`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onSelect`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onSpecialCharInserted`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onSpecialCharUse`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `proofreader`：贡献者未记录或尚未解析，不伪造用户。 `showDropIndicator`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `specialCharInsertRequest`：当前没有待消费的特殊字符插入事件。 `specialCharsBar`：未挂载可分离特殊字符栏能力。 `translator`：贡献者未记录或尚未解析，不伪造用户。

## ReadOnlyDiffUnitItem

定义：`src/route/_authenticated/translator/business/unit-list/ReadOnlyDiffUnitItem.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`dataUnitId`：静态行无需列表定位用的 DOM data 属性。 `onIndexActivate`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onSelect`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `proofreader`：贡献者未记录或尚未解析，不伪造用户。 `translator`：贡献者未记录或尚未解析，不伪造用户。

## SpecialCharsBar

定义：`src/route/_authenticated/translator/business/unit-list/SpecialCharsBar.tsx`。调用点 3 处，具体位置见清单同名同路径条目。

`controller`：未使用可分离浮层定位能力。 `isDisabled`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `isFloating`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `onUseChar`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。

## TranslateModeUnitItem

定义：`src/route/_authenticated/translator/business/unit-list/TranslateModeUnitItem.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

`canToggleBubble`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `dataUnitId`：静态行无需列表定位用的 DOM data 属性。 `enableReadOnly`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `isDragDimmed`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `isDragging`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `onIndexActivate`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onIndexPointerDown`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onModifyUnit`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onSelect`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onSpecialCharInserted`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onSpecialCharUse`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `proofreader`：贡献者未记录或尚未解析，不伪造用户。 `showDropIndicator`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `specialCharInsertRequest`：当前没有待消费的特殊字符插入事件。 `specialCharsBar`：未挂载可分离特殊字符栏能力。 `translator`：贡献者未记录或尚未解析，不伪造用户。

## ContributorAvatar

定义：`src/route/_authenticated/translator/business/unit-list/UnitContributorTooltip.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## UnitContributorTooltip

定义：`src/route/_authenticated/translator/business/unit-list/UnitContributorTooltip.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## UnitFlagButton

定义：`src/route/_authenticated/translator/business/unit-list/UnitFlagButton.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## UnitList

定义：`src/route/_authenticated/translator/business/unit-list/UnitList.tsx`。调用点 5 处，具体位置见清单同名同路径条目。

`editing`：null 表示没有编辑权限；存在时必须提供修改动作，排序是单独能力。 `enableReadOnly`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `focusedUnitId`：当前页可以没有选中翻译单元。 `onFocusUnit`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onSpecialCharInserted`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `onSpecialCharUse`：可选交互能力/观察回调；未提供时对应交互不启用，核心提交、加载和关闭动作另有必填契约。 `specialCharInsertRequest`：当前没有待消费的特殊字符插入事件。 `specialCharsBar`：未挂载可分离特殊字符栏能力。

## ApiProvider

定义：`src/route/business/ApiProvider.tsx`。调用点 6 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## RouteError

定义：`src/route/business/RouteError.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## RouteNotFound

定义：`src/route/business/RouteError.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## ReadySessionProvider

定义：`src/route/business/session/ReadySessionProvider.tsx`。调用点 7 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## LoginCard

定义：`src/route/login/business/LoginCard.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## LoginPage

定义：`src/route/login/index.tsx`。调用点 0 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## AppDialog

定义：`src/shared/component/AppDialog.tsx`。调用点 12 处，具体位置见清单同名同路径条目。

`bodyClassName`：可选样式扩展，缺省使用组件自身布局。 `closeOnBackdrop`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `closeOnEscape`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `contentClassName`：可选样式扩展，缺省使用组件自身布局。 `description`：没有辅助说明文本时省略。 `footer`：调用方没有底部操作区时省略。 `locked`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `showClose`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `size`：呈现/输入配置具有组件默认值；互斥模式及模式专属动作由类型约束。 `tone`：呈现/输入配置具有组件默认值；互斥模式及模式专属动作由类型约束。

## AppDialogAction

定义：`src/shared/component/AppDialog.tsx`。调用点 31 处，具体位置见清单同名同路径条目。

`tone`：呈现/输入配置具有组件默认值；互斥模式及模式专属动作由类型约束。

## Button

定义：`src/shared/component/Button.tsx`。调用点 17 处，具体位置见清单同名同路径条目。

`asChild`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `size`：呈现/输入配置具有组件默认值；互斥模式及模式专属动作由类型约束。 `variant`：呈现/输入配置具有组件默认值；互斥模式及模式专属动作由类型约束。

## ConfirmDialog

定义：`src/shared/component/ConfirmDialog.tsx`。调用点 17 处，具体位置见清单同名同路径条目。

`children`：可选正文/页脚槽位；必需内容模式由判别联合约束。 `description`：没有辅助说明文本时省略。 `mode`：呈现/输入配置具有组件默认值；互斥模式及模式专属动作由类型约束。

## IconInputRow

定义：`src/shared/component/IconInputRow.tsx`。调用点 20 处，具体位置见清单同名同路径条目。

`className`：可选样式扩展，缺省使用组件自身布局。 `mode`：呈现/输入配置具有组件默认值；互斥模式及模式专属动作由类型约束。

## LoadingCircle

定义：`src/shared/component/LoadingCircle.tsx`。调用点 14 处，具体位置见清单同名同路径条目。

`aria-label`：呈现/输入配置具有组件默认值；互斥模式及模式专属动作由类型约束。 `className`：可选样式扩展，缺省使用组件自身布局。 `size`：呈现/输入配置具有组件默认值；互斥模式及模式专属动作由类型约束。

## MultiProgressBar

定义：`src/shared/component/MultiProgressBar.tsx`。调用点 2 处，具体位置见清单同名同路径条目。

`fullWidth`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `height`：呈现/输入配置具有组件默认值；互斥模式及模式专属动作由类型约束。 `width`：呈现/输入配置具有组件默认值；互斥模式及模式专属动作由类型约束。

## Paginator

定义：`src/shared/component/Paginator.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## HoverSelect

定义：`src/shared/component/hover-select/HoverSelect.tsx`。调用点 6 处，具体位置见清单同名同路径条目。

`className`：可选样式扩展，缺省使用组件自身布局。 `hintText`：呈现/输入配置具有组件默认值；互斥模式及模式专属动作由类型约束。 `isActive`：正常呈现有明确默认值；调用方仅在需改变可用性、加载或展示行为时覆盖。 `maxHeight`：呈现/输入配置具有组件默认值；互斥模式及模式专属动作由类型约束。

## NotificationToast

定义：`src/shared/component/notification-toast/NotificationToast.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## PageInput

定义：`src/shared/component/paginator/PageInput.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

已复核：无额外可空业务入口；数据、动作或布局插槽为必填，纯路由/状态组件无外部 Props。

## PagePicker

定义：`src/shared/component/paginator/PagePicker.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`children`：可选正文/页脚槽位；必需内容模式由判别联合约束。

## ToolboxDropdown

定义：`src/shared/component/toolbox-dropdown/ToolboxDropdown.tsx`。调用点 1 处，具体位置见清单同名同路径条目。

`direction`：呈现/输入配置具有组件默认值；互斥模式及模式专属动作由类型约束。
