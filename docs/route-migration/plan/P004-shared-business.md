# P004 — 迁移跨 route 契约与漫画详情业务

计划状态：ready（设计）；实施状态：not-started。
前置工作包：P003

负责人：共享业务负责人；独占authenticated共同业务与shell漫画详情、上传、共享列表。

## 目标与范围

漫画/章节/分工/页面契约与详情实现按真实使用范围归位，两个入口不再借用兄弟route内部。

## 依据与开始条件

- [S02](../spec/02-structure-and-dependency.md)
- [S04](../spec/04-state-and-data.md)
- 基线无未识别变化；前置包的开始/完成门禁已经核实，新的失败有负责人与阻断范围。
- 用户已授权本次迁移；若执行者只接到文档任务，不得将本计划误当已开始的生产变更。

## 文件范围

ComicPlayground共享请求/类型、ComicDetailModal全子树、PageList、ComicCard/ComcList中共用列表、assignment契约及测试。业务私有部分留 P005/P008。

精确输入与去向见 [file-map.csv](../migration/file-map.csv) 中 plan=P004 的行。后续收敛修改遵循本节明确范围。

<!-- FILE_TABLE_START -->

基线文件：94 项。附表生成自迁移清单；以 source 为责任身份。

| 原文件 | 动作 | 最终去向 |
| --- | --- | --- |
| `src/api/assignment.ts` | move | `src/routes/_authenticated/business/assignment/assignment-request.ts` |
| `src/api/assignmentInvitation.ts` | move | `src/routes/_authenticated/business/assignment-invitation/assignment-invitation-request.ts` |
| `src/features/AppSidebar/index.ts` | delete | 删除；理由见清单 |
| `src/features/ComcList/components/business/ComicTranslationList.tsx` | move | `src/routes/_authenticated/_shell/business/comic-list/ComicTranslationList.tsx` |
| `src/features/ComcList/index.ts` | delete | 删除；理由见清单 |
| `src/features/ComcList/types/types.ts` | split | `src/routes/_authenticated/_shell/business/comic-list/comic-list.ts`<br>`src/routes/_authenticated/_shell/comic-playground/business/comic-list/comic-filter.ts` |
| `src/features/ComicCard/components/business/ComicTranslationCard.tsx` | move | `src/routes/_authenticated/_shell/business/comic-list/ComicTranslationCard.tsx` |
| `src/features/ComicCard/index.ts` | delete | 删除；理由见清单 |
| `src/features/ComicCard/types/types.ts` | move | `src/routes/_authenticated/_shell/business/comic-list/comic-card-type.ts` |
| `src/features/ComicPlayground/api/artwork.test.ts` | move | `src/routes/_authenticated/business/chapter/artwork-request.test.ts` |
| `src/features/ComicPlayground/api/artwork.ts` | move | `src/routes/_authenticated/business/chapter/artwork-request.ts` |
| `src/features/ComicPlayground/api/chapter.test.ts` | split | `src/routes/_authenticated/business/chapter/chapter-request.test.ts`<br>`src/routes/_authenticated/business/chapter/chapter-workflow.test.ts`<br>`src/routes/_authenticated/business/chapter/chapter-transfer.test.ts` |
| `src/features/ComicPlayground/api/chapter.ts` | move | `src/routes/_authenticated/business/chapter/chapter-request.ts` |
| `src/features/ComicPlayground/api/comic.ts` | move | `src/routes/_authenticated/business/comic/comic-request.ts` |
| `src/features/ComicPlayground/api/page.test.ts` | move | `src/routes/_authenticated/business/page/page-request.test.ts` |
| `src/features/ComicPlayground/api/page.ts` | move | `src/routes/_authenticated/business/page/page-request.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/api/detail.fixtures.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/detail-request-fixture.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/api/detail.test.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/detail-request.test.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/api/detail.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/detail-request.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/artworkUpload.test.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/upload/artwork-upload.test.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/artworkUpload.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/upload/artwork-upload.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/assignmentStage.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/assignment-stage.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/ActionButton.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/ActionButton.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/ArtworkUploadDialog.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/ArtworkUploadDialog.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/AssignmentAvatarStack.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/AssignmentAvatarStack.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/AssignmentGroup.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/AssignmentGroup.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/ChapterCreatorModal.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/ChapterCreatorModal.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/ChapterModifierModal.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/ChapterModifierModal.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/ChapterOption.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/ChapterOption.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/ComicDetailContent.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/ComicDetailContent.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/ComicDetailHeader.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/ComicDetailHeader.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/ComicDetailLoadState.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/ComicDetailLoadState.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/ComicDetailModal.tsx` | split | `src/routes/_authenticated/_shell/business/comic-detail/ComicDetailModal.tsx`<br>`src/routes/_authenticated/_shell/business/comic-detail/ComicDetailDialog.tsx`<br>`src/routes/_authenticated/_shell/business/comic-detail/use-detail-action.ts`<br>`src/routes/_authenticated/_shell/business/comic-detail/page/ChapterPagePanel.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/ComicDetailSidebar.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/ComicDetailSidebar.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/ComicModifierModal.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/ComicModifierModal.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/ExportProgressDialog.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/ExportProgressDialog.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/ImportDialog.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/ImportDialog.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/LazyImage.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/LazyImage.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/MemberSelectorModal.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/MemberSelectorModal.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/QuickWorkflowActions.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/QuickWorkflowActions.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/RoleTag.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/RoleTag.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/StatItem.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/StatItem.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/TransitionDialog.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/TransitionDialog.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/UserTag.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/UserTag.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/WorkflowPanel.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/WorkflowPanel.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/WorkflowRecordList.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/WorkflowRecordList.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/components/business/assignmentWorkflow.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/assignment-workflow.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/coverUrl.test.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/cover-url.test.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/coverUrl.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/cover-url.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/exportImageNames.test.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/export-image-names.test.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/exportImageNames.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/export-image-names.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/hook/useComicDetailAssignments.ts` | split | `src/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-assignments.ts`<br>`src/routes/_authenticated/_shell/business/comic-detail/assignment-selection.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/hook/useComicDetailChapters.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-chapters.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/hook/useComicDetailExport.ts` | split | `src/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-export.ts`<br>`src/routes/_authenticated/_shell/business/comic-detail/export-chapter.ts`<br>`src/routes/_authenticated/_shell/business/comic-detail/export-archive.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/hook/useComicDetailHost.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-host.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/hook/useComicDetailPages.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-pages.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/hook/useComicDetailWorkflowRecords.test.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-workflow-records.test.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/hook/useComicDetailWorkflowRecords.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-workflow-records.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/hook/useWorkflowRecordUsers.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/use-workflow-record-users.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/layout/ComicDetailModalLayout.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/ComicDetailModalLayout.tsx` |
| `src/features/ComicPlayground/features/ComicDetailModal/pageUpload.test.ts` | split | `src/routes/_authenticated/_shell/business/comic-detail/upload/page-upload-allocation.test.ts`<br>`src/routes/_authenticated/_shell/business/comic-detail/upload/page-upload-transfer.test.ts`<br>`src/routes/_authenticated/_shell/business/comic-detail/upload/page-upload-cancellation.test.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/pageUpload.ts` | split | `src/routes/_authenticated/_shell/business/comic-detail/upload/page-upload.ts`<br>`src/routes/_authenticated/_shell/business/comic-detail/upload/page-allocation.ts`<br>`src/routes/_authenticated/_shell/business/comic-detail/upload/page-transfer.ts`<br>`src/routes/_authenticated/_shell/business/comic-detail/upload/page-upload-progress.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/pageUploadStore.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/upload/page-upload-store.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/types.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/comic-detail-type.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/utils.test.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/utils.test.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/utils.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/utils.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/workflowRecord.test.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/workflow-record.test.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/workflowRecord.ts` | move | `src/routes/_authenticated/_shell/business/comic-detail/workflow-record.ts` |
| `src/features/ComicPlayground/types/chapter.ts` | move | `src/routes/_authenticated/business/chapter/chapter-input.ts` |
| `src/features/ComicPlayground/types/comic.ts` | move | `src/routes/_authenticated/business/comic/comic-input.ts` |
| `src/features/FirstRegistrationGuide/index.ts` | delete | 删除；理由见清单 |
| `src/features/LoginCard/components/business/LoginCard.tsx` | move | `src/routes/login/business/LoginCard.tsx` |
| `src/features/LoginCard/index.ts` | delete | 删除；理由见清单 |
| `src/features/PageList/components/business/PageCard.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/page/PageCard.tsx` |
| `src/features/PageList/components/business/PageList.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/page/PageList.tsx` |
| `src/features/PageList/index.ts` | delete | 删除；理由见清单 |
| `src/types/assignment.test.ts` | move | `src/routes/_authenticated/business/assignment/assignment.test.ts` |
| `src/types/assignment.ts` | move | `src/routes/_authenticated/business/assignment/assignment.ts` |
| `src/types/assignmentInvitation.ts` | move | `src/routes/_authenticated/business/assignment-invitation/assignment-invitation.ts` |
| `src/types/chapter.ts` | split | `src/routes/_authenticated/business/chapter/chapter.ts`<br>`src/routes/_authenticated/business/chapter/raw-chapter.ts` |
| `src/types/chapterWorkflowRecord.ts` | move | `src/routes/_authenticated/business/chapter/chapter-workflow-record.ts` |
| `src/types/comic.ts` | split | `src/routes/_authenticated/business/comic/comic.ts`<br>`src/routes/_authenticated/business/comic/raw-comic.ts` |
| `src/types/index.ts` | delete | 删除；理由见清单 |
| `src/types/page.ts` | move | `src/routes/_authenticated/business/page/page.ts` |
| `src/types/raw/assignment.ts` | move | `src/routes/_authenticated/business/assignment/raw-assignment.ts` |
| `src/types/raw/assignmentInvitation.ts` | move | `src/routes/_authenticated/business/assignment-invitation/raw-assignment-invitation.ts` |
| `src/types/raw/chapter.ts` | move | `src/routes/_authenticated/business/chapter/raw-chapter.ts` |
| `src/types/raw/chapterWorkflowRecord.ts` | move | `src/routes/_authenticated/business/chapter/raw-chapter-workflow-record.ts` |
| `src/types/raw/comic.ts` | move | `src/routes/_authenticated/business/comic/raw-comic.ts` |
| `src/types/raw/page.test.ts` | move | `src/routes/_authenticated/business/page/raw-page.test.ts` |
| `src/types/raw/page.ts` | move | `src/routes/_authenticated/business/page/raw-page.ts` |
| `src/types/raw/workset.ts` | move | `src/routes/_authenticated/business/workset/raw-workset.ts` |
| `src/types/workflow.ts` | move | `src/routes/_authenticated/business/chapter/workflow.ts` |
| `src/types/workset.ts` | split | `src/routes/_authenticated/business/workset/workset.ts`<br>`src/routes/_authenticated/business/workset/raw-workset.ts` |

新增文件 / 新职责（含从旧源提前提取的唯一目标）：

| 目标 | 职责 | 验证 |
| --- | --- | --- |
| `src/routes/_authenticated/_shell/business/comic-detail/use-detail-actions.ts` | 从两个旧页面提前抽取共享分工与workflow动作；与file-map拆分目标同一文件 | 回退revert与admin保留 |
| `src/routes/_authenticated/_shell/business/comic-detail/upload/upload-session.test.ts` | 上传跨视图及身份失效 | SD-05;SD-06 |
| `src/routes/_authenticated/_shell/business/comic-detail/detail-actions.test.ts` | 两个入口共同分工/回退契约 | ST-02 |

<!-- FILE_TABLE_END -->

## 实施步骤

1. 按照消费图拆分原ComicPlayground目录：shell与translator共享的漫画/章节/页面/分工及workset数据契约放authenticated/business；workset CRUD/筛选留playground；术语只由translator使用则随P008迁入。
2. 详情UI、加载host、工作流、分工、导入导出、页面列表归shell/business/comic-detail，导航host使用P003的类型化search；两个入口引用共同祖先业务。
3. 按S02逐一拆分超限ComicDetailModal、useComicDetailExport、pageUpload、assignment等：展示、工作流编排、上传队列/文件准备/确认、导出收集/打包职责各自明确，保存公共行为。
4. 先从旧Workspace和ComicPlayground源中提取共同use-detail-actions.ts，并在旧源更新调用；这项前置提取属于P004，P005随后仅迁两份源的剩余叶子内容。将两个入口重复的分工与workflow映射收回详情业务；补现有Workspace回退误传advance的回归，以服务端advance/revert字段语义统一，保留admin角色。
5. 上传runtime与store按S04保持跨视图存活；订阅session代次自行取消登出任务，根session不能反向import上传；预签名上传与通用hash放正确位置。
6. 对跨业务原API测试按S06拆就近契约或转明确集成入口；更新两个未完全迁移页面与translator的调用路径。

## 接口与空值语义修正

逐个审查本包全部生产组件及实际调用方，按S02.8/S04-08修正不必要的optional/null、重复判空和无意义fallback。必需数据与动作收紧契约；合理默认值在所属边界集中；真实空状态与互斥模式显式建模。同步修改受影响的跨包调用方，由集成负责人协调共享文件，不保留临时宽接口。

结果写入[接口审查记录](../review/interface-audit.md)，逐项保留调用方与验证证据。

## 兼容要求

以 [兼容矩阵](../migration/compatibility-map.md) 和所引用 spec 为准；不改变本包未明确授权的后端协议、公开 URL 或用户数据格式。

## 验证

- [ ] 详情按漫画所属team加载，与selectedTeamId不同仍正确；用现有detail.test场景回归。
- [ ] 推进/回退、增删角色、admin保留、创建章节preset、页上传/重试/取消、导入导出与封面行为测试通过。
- [ ] SD-05/06：导航不终止上传，登出迟到确认不回写，取消清理不重复报错；SD-04邮件由P002/P006负责。

## 完成标准

- [ ] 本包接口审查和受影响调用方已完成；IC-01至IC-04在本包范围内无未处理项，不能仅以类型检查通过代替。
- [ ] 漫画详情不在comic-playground内部；所有消费者只依赖祖先共享业务。
- [ ] 所有本包超限源/test职责已拆分，无存量源遗漏到features。
- [ ] save/export/upload外部协议保留，唯明确回退修正有回归证据。

## 风险与恢复

后台任务和对象URL生命周期最易因拆分变化。用可控请求延迟/取消fixture验证；恢复本包时禁止把已确认上传当作未提交自动重发。

## 协作与执行记录

前置依赖未满足时禁止开始本包。此包涉及共同契约或全仓装配，按计划索引串行集成。

执行时在本节追加日期、实际提交、命令和退出码、发现/修复以及未完成项；不要预先勾选。

## 需求追踪

R2-01、R2-02、R2-03、R2-08、R2-09、R2-11、R3-01、R3-04、R4-01、R4-02、R4-04、R4-06、R5-06、R5-07。条款决定与验收证据见[需求矩阵](../requirements-matrix.md)和[覆盖审查](../review/coverage-matrix.md)。
