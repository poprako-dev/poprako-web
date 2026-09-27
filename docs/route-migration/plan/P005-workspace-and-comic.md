# P005 — 迁移工作区与漫画广场全部私有业务

计划状态：ready（设计）；实施状态：not-started。
前置工作包：P004

负责人：workspace/comic-playground负责人；仅写这两个叶子business与对应路由装配。

## 目标与范围

工作区与漫画广场功能完整进入各自route，实现不依赖原features或兄弟私有代码。

## 依据与开始条件

- [S02](../spec/02-structure-and-dependency.md)
- [S03](../spec/03-routing-and-navigation.md)
- [S04](../spec/04-state-and-data.md)
- 基线无未识别变化；前置包的开始/完成门禁已经核实，新的失败有负责人与阻断范围。
- 用户已授权本次迁移；若执行者只接到文档任务，不得将本计划误当已开始的生产变更。

## 文件范围

Workspace全目录、ComicPlayground剩余私有workset/comic创建与filter、ComicProgressList、ComcList中仅广场使用的实现。

精确输入与去向见 [file-map.csv](../migration/file-map.csv) 中 plan=P005 的行。后续收敛修改遵循本节明确范围。

<!-- FILE_TABLE_START -->

基线文件：33 项。附表生成自迁移清单；以 source 为责任身份。

| 原文件 | 动作 | 最终去向 |
| --- | --- | --- |
| `src/api/announcement.ts` | move | `src/routes/_authenticated/_shell/workspace/business/announcement/announcement-request.ts` |
| `src/api/comment.ts` | move | `src/routes/_authenticated/_shell/workspace/business/comment/comment-request.ts` |
| `src/features/ComcList/components/business/ComicList.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/comic-list/ComicList.tsx` |
| `src/features/ComcList/components/business/FilterHeader.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/comic-list/FilterHeader.tsx` |
| `src/features/ComcList/components/business/WorksetSidebar.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/comic-list/WorksetSidebar.tsx` |
| `src/features/ComcList/layouts/ComicListLayout.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/comic-list/ComicListLayout.tsx` |
| `src/features/ComicPlayground/api/workset.ts` | move | `src/routes/_authenticated/_shell/comic-playground/business/workset/workset-request.ts` |
| `src/features/ComicPlayground/components/business/ComicCreatorModal.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/ComicCreatorModal.tsx` |
| `src/features/ComicPlayground/components/business/ComicPlayground.tsx` | split | `src/routes/_authenticated/_shell/comic-playground/business/ComicPlayground.tsx`<br>`src/routes/_authenticated/_shell/comic-playground/business/use-comic-playground.ts`<br>`src/routes/_authenticated/_shell/business/comic-detail/use-detail-actions.ts` |
| `src/features/ComicPlayground/components/business/PresetAssignmentRoleSwitchGroup.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/PresetAssignmentRoleSwitchGroup.tsx` |
| `src/features/ComicPlayground/components/business/WorksetCreatorModal.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/WorksetCreatorModal.tsx` |
| `src/features/ComicPlayground/components/business/WorksetModifierModal.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/WorksetModifierModal.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/index.ts` | delete | 删除；理由见清单 |
| `src/features/ComicPlayground/hook/useComicPlaygroundFilters.ts` | move | `src/routes/_authenticated/_shell/comic-playground/business/use-comic-playground-filters.ts` |
| `src/features/ComicPlayground/hook/useComicPlaygroundWorksets.ts` | move | `src/routes/_authenticated/_shell/comic-playground/business/use-comic-playground-worksets.ts` |
| `src/features/ComicPlayground/index.ts` | delete | 删除；理由见清单 |
| `src/features/ComicPlayground/types/workset.ts` | move | `src/routes/_authenticated/_shell/comic-playground/business/workset/workset-input.ts` |
| `src/features/ComicProgressList/components/ComicProgressItem.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/progress/ComicProgressItem.tsx` |
| `src/features/ComicProgressList/components/ComicProgressList.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/progress/ComicProgressList.tsx` |
| `src/features/ComicProgressList/components/WorkflowStepDropdown.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/progress/WorkflowStepDropdown.tsx` |
| `src/features/ComicProgressList/index.ts` | delete | 删除；理由见清单 |
| `src/features/Workspace/api/workspace.ts` | move | `src/routes/_authenticated/_shell/workspace/business/assignment/workspace-request.ts` |
| `src/features/Workspace/components/business/AnnouncementCreatorModal.tsx` | move | `src/routes/_authenticated/_shell/workspace/business/AnnouncementCreatorModal.tsx` |
| `src/features/Workspace/components/business/AnnouncementTable.tsx` | split | `src/routes/_authenticated/_shell/workspace/business/AnnouncementTable.tsx`<br>`src/routes/_authenticated/_shell/workspace/business/announcement/AnnouncementRow.tsx`<br>`src/routes/_authenticated/_shell/workspace/business/announcement/use-announcement.ts` |
| `src/features/Workspace/components/business/CommentChatBox.tsx` | move | `src/routes/_authenticated/_shell/workspace/business/CommentChatBox.tsx` |
| `src/features/Workspace/components/business/OnlineUserPopover.tsx` | move | `src/routes/_authenticated/_shell/workspace/business/OnlineUserPopover.tsx` |
| `src/features/Workspace/components/business/Workspace.tsx` | split | `src/routes/_authenticated/_shell/workspace/business/Workspace.tsx`<br>`src/routes/_authenticated/_shell/workspace/business/use-workspace.ts`<br>`src/routes/_authenticated/_shell/workspace/business/WorkspacePanel.tsx`<br>`src/routes/_authenticated/_shell/business/comic-detail/use-detail-actions.ts` |
| `src/features/Workspace/index.ts` | delete | 删除；理由见清单 |
| `src/features/Workspace/layouts/WorkspaceLayout.tsx` | move | `src/routes/_authenticated/_shell/workspace/business/WorkspaceLayout.tsx` |
| `src/types/announcement.ts` | move | `src/routes/_authenticated/_shell/workspace/business/announcement/announcement.ts` |
| `src/types/comment.ts` | move | `src/routes/_authenticated/_shell/workspace/business/comment/comment.ts` |
| `src/types/raw/announcement.ts` | move | `src/routes/_authenticated/_shell/workspace/business/announcement/raw-announcement.ts` |
| `src/types/raw/comment.ts` | move | `src/routes/_authenticated/_shell/workspace/business/comment/raw-comment.ts` |

<!-- FILE_TABLE_END -->

## 实施步骤

1. 迁移Workspace展示、公告、留言、在线列表及个人任务请求；业务类型与请求就近，数据共享通过P004契约。
2. 将Workspace大文件拆成route入口、详情入口集成、公告/留言/在线与列表展示；移除已经归详情业务的重复编排，保留移动滑动切tab与列表刷新。
3. 迁移广场workset加载/创建修改、漫画创建、筛选与进度列表；同一search/filter依赖的数据保持正确失效，默认选择与空列表语义保留。
4. 两route接入共享comic detail host；保留comicId/chapterId恢复、关闭仅清理详情参数、进入translator和返回指定章节。
5. 更新就近测试和对应stories路径；不得为导入方便把叶子状态再提升到根business。

## 兼容要求

以 [兼容矩阵](../migration/compatibility-map.md) 和所引用 spec 为准；不改变本包未明确授权的后端协议、公开 URL 或用户数据格式。

## 验证

- [ ] 角色可见性、公告发布/查看、留言失败输入保留、在线team切换、任务分页与刷新。
- [ ] workset空/加载失败/切换，全部workflow与上传筛选、漫画/作品集增改、详情返回恢复。
- [ ] 测试desktop/mobile布局和scroll容器，确认路由query与列表状态无联动回归。

## 完成标准

- [ ] 本包旧features/Workspace和ComicPlayground私有残留清零。
- [ ] 两个路由的单次业务变更可以在自身business定位，共用能力只来自祖先。

## 风险与恢复

移动端触摸与滚动分页依赖DOM尺寸，不以纯函数测试代替浏览器回归；撤回时保留用户后端数据，不回滚用户操作。

## 协作与执行记录

前置依赖未满足时禁止开始本包。可按索引与其他业务包并行；shared、root、路由树或根配置修改交主负责人串行集成。

执行时在本节追加日期、实际提交、命令和退出码、发现/修复以及未完成项；不要预先勾选。

## 需求追踪

R2-01、R2-02、R2-08、R2-11、R3-01、R3-04、R4-01、R4-02、R4-04、R4-06、R5-01、R5-06。条款决定与验收证据见[需求矩阵](../requirements-matrix.md)和[覆盖审查](../review/coverage-matrix.md)。
