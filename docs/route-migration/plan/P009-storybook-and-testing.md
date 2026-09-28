# P009 — 收拢就近测试与 Storybook 全套运行环境

计划状态：ready（设计）；实施状态：not-started。
前置工作包：P005、P006、P007、P008

负责人：测试负责人；独占.storybook、测试配置后续整合和跨route集成测试；页面stories改动协调原负责人。

## 目标与范围

所有有效测试与stories随业务归属，Storybook10.6.0在Deno与新工具链下可启动、构建、执行play。

## 依据与开始条件

- [S02](../spec/02-structure-and-dependency.md)
- [S06](../spec/06-storybook-and-testing.md)
- 基线无未识别变化；前置包的开始/完成门禁已经核实，新的失败有负责人与阻断范围。
- 用户已授权本次迁移；若执行者只接到文档任务，不得将本计划误当已开始的生产变更。

## 文件范围

旧src/stories全树、.storybook、vitest配置、storybook-deno启动代理、启动测试和浏览器安装脚本。

精确输入与去向见 [file-map.csv](../migration/file-map.csv) 中 plan=P009 的行。后续收敛修改遵循本节明确范围。

<!-- FILE_TABLE_START -->

基线文件：63 项。附表生成自迁移清单；以 source 为责任身份。

| 原文件 | 动作 | 最终去向 |
| --- | --- | --- |
| `.storybook/main.ts` | update | `.storybook/main.ts` |
| `.storybook/preview.ts` | update | `.storybook/preview.ts` |
| `.storybook/vitest.setup.ts` | update | `.storybook/vitest.setup.ts` |
| `scripts/storybook-deno.mjs` | move | `script/storybook-deno.mjs` |
| `scripts/storybook-deno.test.mjs` | move | `script/storybook-deno.test.mjs` |
| `scripts/test-storybook-start.sh` | move | `script/test-storybook-start.ts` |
| `src/api/poprakoRMigration.test.ts` | split | `src/routes/business/identity/account-contract.test.ts`<br>`src/routes/_authenticated/business/comic/comic-contract.test.ts`<br>`src/routes/_authenticated/business/chapter/chapter-contract.test.ts`<br>`src/routes/_authenticated/business/page/page-contract.test.ts`<br>`src/routes/_authenticated/translator/business/remote/unit-contract.test.ts`<br>`src/routes/_authenticated/_shell/workspace/business/workspace-contract.test.ts`<br>`src/routes/_authenticated/_shell/comic-playground/business/workset-contract.test.ts`<br>`src/routes/_authenticated/_shell/member-list/business/invitation-contract.test.ts`<br>`src/routes/_authenticated/_shell/business/mail/mail-contract.test.ts` |
| `src/stories/AppDialog.stories.tsx` | move | `src/shared/component/app-dialog/AppDialog.stories.tsx` |
| `src/stories/Button.stories.ts` | move | `src/shared/component/button/Button.stories.tsx` |
| `src/stories/Configure.mdx` | delete | 删除；理由见清单 |
| `src/stories/Paginator.stories.tsx` | move | `src/shared/component/paginator/Paginator.stories.tsx` |
| `src/stories/assets/accessibility.png` | delete | 删除；理由见清单 |
| `src/stories/assets/accessibility.svg` | delete | 删除；理由见清单 |
| `src/stories/assets/addon-library.png` | delete | 删除；理由见清单 |
| `src/stories/assets/assets.png` | delete | 删除；理由见清单 |
| `src/stories/assets/avif-test-image.avif` | move | `src/routes/_authenticated/_shell/utilities/business/test/avif-test-image.avif` |
| `src/stories/assets/context.png` | delete | 删除；理由见清单 |
| `src/stories/assets/discord.svg` | delete | 删除；理由见清单 |
| `src/stories/assets/docs.png` | delete | 删除；理由见清单 |
| `src/stories/assets/figma-plugin.png` | delete | 删除；理由见清单 |
| `src/stories/assets/github.svg` | delete | 删除；理由见清单 |
| `src/stories/assets/share.png` | delete | 删除；理由见清单 |
| `src/stories/assets/styling.png` | delete | 删除；理由见清单 |
| `src/stories/assets/testing.png` | delete | 删除；理由见清单 |
| `src/stories/assets/theming.png` | delete | 删除；理由见清单 |
| `src/stories/assets/tutorials.svg` | delete | 删除；理由见清单 |
| `src/stories/assets/youtube.svg` | delete | 删除；理由见清单 |
| `src/stories/features/AssignmentCard.stories.tsx` | delete | 删除；理由见清单 |
| `src/stories/features/AssignmentList.stories.tsx` | delete | 删除；理由见清单 |
| `src/stories/features/BaseTranslator.stories.tsx` | split | `src/routes/_authenticated/translator/business/BaseTranslator.stories.tsx`<br>`src/routes/_authenticated/translator/business/EditorPersistence.stories.tsx`<br>`src/routes/_authenticated/translator/business/test/translator-fixture.ts` |
| `src/stories/features/BaseTranslator/features/ShortcutPanel/ShortcutPanel.stories.tsx` | move | `src/routes/_authenticated/translator/business/shortcut/ShortcutPanel.stories.tsx` |
| `src/stories/features/ComicCreatorModal.stories.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/ComicCreatorModal.stories.tsx` |
| `src/stories/features/ComicDetailHost.stories.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/ComicDetailHost.stories.tsx` |
| `src/stories/features/ComicDetailModal.stories.tsx` | split | `src/routes/_authenticated/_shell/business/comic-detail/ComicDetailModal.stories.tsx`<br>`src/routes/_authenticated/_shell/business/comic-detail/ComicDetailWorkflow.stories.tsx`<br>`src/routes/_authenticated/_shell/business/comic-detail/test/detail-fixture.ts` |
| `src/stories/features/ComicList.stories.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/comic-list/ComicList.stories.tsx` |
| `src/stories/features/ComicProgressItem.stories.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/progress/ComicProgressItem.stories.tsx` |
| `src/stories/features/ComicTranslationList.stories.tsx` | move | `src/routes/_authenticated/_shell/business/comic-list/ComicTranslationList.stories.tsx` |
| `src/stories/features/CommentChatBox.stories.tsx` | move | `src/routes/_authenticated/_shell/workspace/business/comment/CommentChatBox.stories.tsx` |
| `src/stories/features/FilterHeader.stories.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/comic-list/FilterHeader.stories.tsx` |
| `src/stories/features/ImportTranslationDialog.stories.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/ImportTranslationDialog.stories.tsx` |
| `src/stories/features/InputComposition.stories.tsx` | move | `src/routes/_authenticated/translator/business/unit-list/InputComposition.stories.tsx` |
| `src/stories/features/KeyboardScope.stories.tsx` | move | `src/routes/_authenticated/translator/business/shortcut/KeyboardScope.stories.tsx` |
| `src/stories/features/LineBreakMarkers.stories.tsx` | move | `src/routes/_authenticated/translator/business/unit-list/LineBreakMarkers.stories.tsx` |
| `src/stories/features/MemberInvitorModal.stories.tsx` | split | `src/routes/_authenticated/_shell/member-list/business/MemberInvitorModal.stories.tsx`<br>`src/routes/_authenticated/_shell/member-list/business/InvitationInteraction.stories.tsx` |
| `src/stories/features/MemberList.stories.tsx` | move | `src/routes/_authenticated/_shell/member-list/business/MemberList.stories.tsx` |
| `src/stories/features/PageList.stories.tsx` | move | `src/routes/_authenticated/_shell/business/comic-detail/page/PageList.stories.tsx` |
| `src/stories/features/PageUnitStats.stories.tsx` | move | `src/routes/_authenticated/translator/business/page-statistic/PageUnitStats.stories.tsx` |
| `src/stories/features/StatusOptionBar.stories.tsx` | move | `src/routes/_authenticated/translator/business/StatusOptionBar.stories.tsx` |
| `src/stories/features/TermEditorDialog.stories.tsx` | move | `src/routes/_authenticated/translator/business/terminology/TermEditorDialog.stories.tsx` |
| `src/stories/features/TerminologyLookupBar.stories.tsx` | split | `src/routes/_authenticated/translator/business/terminology/TerminologyLookupBar.stories.tsx`<br>`src/routes/_authenticated/translator/business/terminology/test/terminology-fixture.ts` |
| `src/stories/features/ToolboxDropdown.stories.tsx` | move | `src/shared/component/toolbox-dropdown/ToolboxDropdown.stories.tsx` |
| `src/stories/features/UnitFlags.stories.tsx` | move | `src/routes/_authenticated/translator/business/unit-list/UnitFlags.stories.tsx` |
| `src/stories/features/UnitList.stories.tsx` | move | `src/routes/_authenticated/translator/business/unit-list/UnitList.stories.tsx` |
| `src/stories/features/UnitListLayout.stories.tsx` | move | `src/routes/_authenticated/translator/business/unit-list/UnitListLayout.stories.tsx` |
| `src/stories/features/UnitSearchTransformDialog.stories.tsx` | move | `src/routes/_authenticated/translator/business/search-transform/UnitSearchTransformDialog.stories.tsx` |
| `src/stories/features/Utilities.stories.tsx` | move | `src/routes/_authenticated/_shell/utilities/business/Utilities.stories.tsx` |
| `src/stories/features/WorkflowRecordList.stories.tsx` | split | `src/routes/_authenticated/_shell/business/comic-detail/WorkflowRecordList.stories.tsx`<br>`src/routes/_authenticated/_shell/business/comic-detail/test/workflow-fixture.ts` |
| `src/stories/features/WorksetCreatorModal.stories.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/WorksetCreatorModal.stories.tsx` |
| `src/stories/features/WorksetSidebar.stories.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/business/comic-list/WorksetSidebar.stories.tsx` |
| `src/stories/features/Workspace.stories.tsx` | move | `src/routes/_authenticated/_shell/workspace/business/Workspace.stories.tsx` |
| `src/stories/features/translatorKeyboardPlay.ts` | move | `src/routes/_authenticated/translator/business/test/translator-keyboard-play.ts` |
| `vitest.shims.d.ts` | update | `vitest.shims.d.ts` |
| `vitest.unit.config.ts` | update | `vitest.unit.config.ts` |

新增文件 / 新职责（含从旧源提前提取的唯一目标）：

| 目标 | 职责 | 验证 |
| --- | --- | --- |
| `vitest.storybook.config.ts` | 独立browser project | ST-08 |
| `vite.storybook.config.ts` | 独立Storybook构建配置 | ST-08 |

<!-- FILE_TABLE_END -->

## 实施步骤

1. 按file-map迁移所有有效stories与assets；纯占位脚手架删除并记录，真实交互断言不得随展示迁移丢失；default meta和stories后缀登记为工具例外。
2. 将跨route契约测试拆为就近单元或明确integration入口，实施生产/测试两套依赖检查；集成入口可以装配真实route，但生产代码不得引用测试。
3. 就近抽取保存/用户/图片fixture与测试辅助；替换Unsplash/Dicebear等外部资源为本地资源；恢复每例localStorage、store、timers、listener和object URL，未匹配请求明确失败。
4. 将react-router-dom MemoryRouter改为TanStack memory history，保证真实search/history语义；清理最后旧router引用后移除react-router-dom依赖与lock条目。
5. 保留并迁移Deno package manager代理，独立Storybook Vite配置复用基础React/样式/alias并隔离route生成；复用P001已建立的unit/integration与浏览器安装任务，补齐storybook/script/frontend聚合。
6. 固定Playwright浏览器安装入口；CI与开发执行同一fixture策略，浏览器play进入真实门禁而非仅build-storybook。

## 接口与空值语义修正

按已收敛的生产契约更新stories、fixture与测试装配；不为旧story的缺参放宽生产Props，不用空函数掩盖待测动作。检查默认值、合法空态、只读/交互模式的代表性场景；仅为实际行为风险补充回归。

结果写入[接口审查记录](../review/interface-audit.md)，逐项保留调用方与验证证据。

## 兼容要求

以 [兼容矩阵](../migration/compatibility-map.md) 和所引用 spec 为准；不改变本包未明确授权的后端协议、公开 URL 或用户数据格式。

## 验证

- [ ] ST-01..ST-06与ST-08：干净Deno安装后的storybook启动、编译、既有play、Node/jsdom、router宿主和隔离性。ST-07中的新增三态主题/主题decorator与完整界面主题矩阵由P010实现验收，P009不提前要求。
- [ ] 前后断言清单比对，240基线测试能力保留或有明确合并去向，不以测试数量机械要求相等。
- [ ] Storybook启动/测试/构建不修改route生成文件、不访问真实后端，不需用户凭据。

## 完成标准

- [ ] 本包接口审查和受影响调用方已完成；IC-01至IC-04在本包范围内无未处理项，不能仅以类型检查通过代替。
- [ ] src/stories与其features目录删除，所有有效内容都有目标或有理由的删除记录。
- [ ] 测试无业务生产反向依赖；全部真实play可自动运行。
- [ ] 旧react-router-dom、旧stories引用和远程夹具依赖清零。

## 风险与恢复

play顺序共享store会造成偶发失败。先建立每例setup/cleanup和请求隔离，再启用CI，不能简单重试掩盖污染。

## 协作与执行记录

前置依赖未满足时禁止开始本包。此包涉及共同契约或全仓装配，按计划索引串行集成。

执行时在本节追加日期、实际提交、命令和退出码、发现/修复以及未完成项；不要预先勾选。

## 需求追踪

R1-05、R2-07、R3-01、R3-03、R3-04、R4-01、R4-02、R4-04、R4-06、R4-09、R5-01、R5-04、R5-06、R6-10、R6-11、R6-12、R6-13、R6-14、R7-08。条款决定与验收证据见[需求矩阵](../requirements-matrix.md)和[覆盖审查](../review/coverage-matrix.md)。
