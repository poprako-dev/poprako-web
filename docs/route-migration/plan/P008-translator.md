# P008 — 迁移完整翻校业务与编辑生命周期

计划状态：ready（设计）；实施状态：not-started。
前置工作包：P004

负责人：翻校负责人；独占translator/business、其动态route入口与相关测试支持文件。

## 目标与范围

BaseTranslator/WebTranslator及所有嵌套功能归同一route，保留Web保存协议、权限、布局和偏好。

## 依据与开始条件

- [S02](../spec/02-structure-and-dependency.md)
- [S03](../spec/03-routing-and-navigation.md)
- [S04](../spec/04-state-and-data.md)
- 基线无未识别变化；前置包的开始/完成门禁已经核实，新的失败有负责人与阻断范围。
- 用户已授权本次迁移；若执行者只接到文档任务，不得将本计划误当已开始的生产变更。

## 文件范围

BaseTranslator、WebTranslator全部子树，专用unit/project/preview/search/term契约，specialChars与快捷键、保存测试夹具。

精确输入与去向见 [file-map.csv](../migration/file-map.csv) 中 plan=P008 的行。后续收敛修改遵循本节明确范围。

<!-- FILE_TABLE_START -->

基线文件：108 项。附表生成自迁移清单；以 source 为责任身份。

| 原文件 | 动作 | 最终去向 |
| --- | --- | --- |
| `src/features/BaseTranslator/components/business/BaseTranslator.tsx` | split | `src/routes/_authenticated/translator/business/BaseTranslator.tsx`<br>`src/routes/_authenticated/translator/business/editor/use-editor-session.ts`<br>`src/routes/_authenticated/translator/business/editor/EditorDialog.tsx`<br>`src/routes/_authenticated/translator/business/editor/EditorToolbar.tsx`<br>`src/routes/_authenticated/translator/business/editor/use-editor-navigation.ts` |
| `src/features/BaseTranslator/components/business/FloatingSpecialCharsBar.tsx` | move | `src/routes/_authenticated/translator/business/FloatingSpecialCharsBar.tsx` |
| `src/features/BaseTranslator/components/business/StatusOptionBar.tsx` | move | `src/routes/_authenticated/translator/business/StatusOptionBar.tsx` |
| `src/features/BaseTranslator/editedPageNavigation.test.ts` | move | `src/routes/_authenticated/translator/business/edited-page-navigation.test.ts` |
| `src/features/BaseTranslator/editedPageNavigation.ts` | move | `src/routes/_authenticated/translator/business/edited-page-navigation.ts` |
| `src/features/BaseTranslator/features/Canvas/components/business/Canvas.tsx` | move | `src/routes/_authenticated/translator/business/canvas/Canvas.tsx` |
| `src/features/BaseTranslator/features/Canvas/hook/useCanvasInteraction.ts` | move | `src/routes/_authenticated/translator/business/canvas/use-canvas-interaction.ts` |
| `src/features/BaseTranslator/features/Canvas/index.ts` | delete | 删除；理由见清单 |
| `src/features/BaseTranslator/features/Marker/components/business/Marker.tsx` | move | `src/routes/_authenticated/translator/business/canvas/Marker.tsx` |
| `src/features/BaseTranslator/features/Marker/index.ts` | delete | 删除；理由见清单 |
| `src/features/BaseTranslator/features/PageUnitStats/components/business/PageUnitStatsChart.tsx` | move | `src/routes/_authenticated/translator/business/page-statistic/PageUnitStatsChart.tsx` |
| `src/features/BaseTranslator/features/PageUnitStats/components/business/ReadOnlyPageActions.tsx` | move | `src/routes/_authenticated/translator/business/page-statistic/ReadOnlyPageActions.tsx` |
| `src/features/BaseTranslator/features/PageUnitStats/components/business/TranslatorPaginator.tsx` | move | `src/routes/_authenticated/translator/business/page-statistic/TranslatorPaginator.tsx` |
| `src/features/BaseTranslator/features/PageUnitStats/pageFlaggedStats.test.ts` | move | `src/routes/_authenticated/translator/business/page-statistic/page-flagged-stats.test.ts` |
| `src/features/BaseTranslator/features/PageUnitStats/pageFlaggedStats.ts` | move | `src/routes/_authenticated/translator/business/page-statistic/page-flagged-stats.ts` |
| `src/features/BaseTranslator/features/PageUnitStats/pageUnitStats.test.ts` | move | `src/routes/_authenticated/translator/business/page-statistic/page-unit-stats.test.ts` |
| `src/features/BaseTranslator/features/PageUnitStats/pageUnitStats.ts` | move | `src/routes/_authenticated/translator/business/page-statistic/page-unit-stats.ts` |
| `src/features/BaseTranslator/features/ShortcutPanel/components/business/ShortcutPanel.tsx` | move | `src/routes/_authenticated/translator/business/shortcut/ShortcutPanel.tsx` |
| `src/features/BaseTranslator/features/ShortcutPanel/index.ts` | delete | 删除；理由见清单 |
| `src/features/BaseTranslator/features/ShortcutPanel/types/types.ts` | move | `src/routes/_authenticated/translator/business/shortcut/base-translator-type.ts` |
| `src/features/BaseTranslator/features/SpecialCharPanel/components/business/SpecialCharPanel.tsx` | move | `src/routes/_authenticated/translator/business/special-character/SpecialCharPanel.tsx` |
| `src/features/BaseTranslator/features/SpecialCharPanel/index.ts` | delete | 删除；理由见清单 |
| `src/features/BaseTranslator/features/TerminologyLookup/components/business/InfiniteTerminologyList.tsx` | move | `src/routes/_authenticated/translator/business/terminology/InfiniteTerminologyList.tsx` |
| `src/features/BaseTranslator/features/TerminologyLookup/components/business/TermEditorDialog.tsx` | move | `src/routes/_authenticated/translator/business/terminology/TermEditorDialog.tsx` |
| `src/features/BaseTranslator/features/TerminologyLookup/components/business/TermPanel.tsx` | move | `src/routes/_authenticated/translator/business/terminology/TermPanel.tsx` |
| `src/features/BaseTranslator/features/TerminologyLookup/components/business/TermbaseEditorDialog.tsx` | move | `src/routes/_authenticated/translator/business/terminology/TermbaseEditorDialog.tsx` |
| `src/features/BaseTranslator/features/TerminologyLookup/components/business/TermbasePanel.tsx` | move | `src/routes/_authenticated/translator/business/terminology/TermbasePanel.tsx` |
| `src/features/BaseTranslator/features/TerminologyLookup/components/business/TerminologyDialogFrame.tsx` | move | `src/routes/_authenticated/translator/business/terminology/TerminologyDialogFrame.tsx` |
| `src/features/BaseTranslator/features/TerminologyLookup/components/business/TerminologyLookupBar.tsx` | move | `src/routes/_authenticated/translator/business/terminology/TerminologyLookupBar.tsx` |
| `src/features/BaseTranslator/features/TerminologyLookup/hook/pagination.test.ts` | move | `src/routes/_authenticated/translator/business/terminology/pagination.test.ts` |
| `src/features/BaseTranslator/features/TerminologyLookup/hook/pagination.ts` | move | `src/routes/_authenticated/translator/business/terminology/pagination.ts` |
| `src/features/BaseTranslator/features/TerminologyLookup/hook/termForm.test.ts` | move | `src/routes/_authenticated/translator/business/terminology/term-form.test.ts` |
| `src/features/BaseTranslator/features/TerminologyLookup/hook/termForm.ts` | move | `src/routes/_authenticated/translator/business/terminology/term-form.ts` |
| `src/features/BaseTranslator/features/TerminologyLookup/hook/useDebouncedValue.ts` | move | `src/routes/_authenticated/translator/business/terminology/use-debounced-value.ts` |
| `src/features/BaseTranslator/features/TerminologyLookup/hook/usePaginatedList.ts` | move | `src/routes/_authenticated/translator/business/terminology/use-paginated-list.ts` |
| `src/features/BaseTranslator/features/TerminologyLookup/index.ts` | delete | 删除；理由见清单 |
| `src/features/BaseTranslator/features/UnitList/components/business/AutoResizeTextarea.tsx` | move | `src/routes/_authenticated/translator/business/unit-list/AutoResizeTextarea.tsx` |
| `src/features/BaseTranslator/features/UnitList/components/business/BaseUnitItem.tsx` | move | `src/routes/_authenticated/translator/business/unit-list/BaseUnitItem.tsx` |
| `src/features/BaseTranslator/features/UnitList/components/business/LineBreakOverlay.tsx` | move | `src/routes/_authenticated/translator/business/unit-list/LineBreakOverlay.tsx` |
| `src/features/BaseTranslator/features/UnitList/components/business/ProofreadModeUnitItem.tsx` | move | `src/routes/_authenticated/translator/business/unit-list/ProofreadModeUnitItem.tsx` |
| `src/features/BaseTranslator/features/UnitList/components/business/ReadOnlyDiffUnitItem.tsx` | move | `src/routes/_authenticated/translator/business/unit-list/ReadOnlyDiffUnitItem.tsx` |
| `src/features/BaseTranslator/features/UnitList/components/business/SpecialCharsBar.tsx` | move | `src/routes/_authenticated/translator/business/unit-list/SpecialCharsBar.tsx` |
| `src/features/BaseTranslator/features/UnitList/components/business/TranslateModeUnitItem.tsx` | move | `src/routes/_authenticated/translator/business/unit-list/TranslateModeUnitItem.tsx` |
| `src/features/BaseTranslator/features/UnitList/components/business/UnitContributorTooltip.tsx` | move | `src/routes/_authenticated/translator/business/unit-list/UnitContributorTooltip.tsx` |
| `src/features/BaseTranslator/features/UnitList/components/business/UnitFlagButton.tsx` | move | `src/routes/_authenticated/translator/business/unit-list/UnitFlagButton.tsx` |
| `src/features/BaseTranslator/features/UnitList/components/business/UnitList.tsx` | move | `src/routes/_authenticated/translator/business/unit-list/UnitList.tsx` |
| `src/features/BaseTranslator/features/UnitList/hook/dragThreshold.test.ts` | move | `src/routes/_authenticated/translator/business/unit-list/drag-threshold.test.ts` |
| `src/features/BaseTranslator/features/UnitList/hook/dragThreshold.ts` | move | `src/routes/_authenticated/translator/business/unit-list/drag-threshold.ts` |
| `src/features/BaseTranslator/features/UnitList/hook/unitContributorCache.test.ts` | move | `src/routes/_authenticated/translator/business/unit-list/unit-contributor-cache.test.ts` |
| `src/features/BaseTranslator/features/UnitList/hook/unitContributorCache.ts` | move | `src/routes/_authenticated/translator/business/unit-list/unit-contributor-cache.ts` |
| `src/features/BaseTranslator/features/UnitList/hook/useUnitContributors.ts` | move | `src/routes/_authenticated/translator/business/unit-list/use-unit-contributors.ts` |
| `src/features/BaseTranslator/features/UnitList/hook/useUnitReorder.ts` | move | `src/routes/_authenticated/translator/business/unit-list/use-unit-reorder.ts` |
| `src/features/BaseTranslator/features/UnitList/index.ts` | delete | 删除；理由见清单 |
| `src/features/BaseTranslator/features/UnitList/textDiff.test.ts` | move | `src/routes/_authenticated/translator/business/unit-list/text-diff.test.ts` |
| `src/features/BaseTranslator/features/UnitList/textDiff.ts` | move | `src/routes/_authenticated/translator/business/unit-list/text-diff.ts` |
| `src/features/BaseTranslator/features/UnitSearchTransform/components/business/UnitSearchTransformDialog.tsx` | split | `src/routes/_authenticated/translator/business/search-transform/UnitSearchTransformDialog.tsx`<br>`src/routes/_authenticated/translator/business/search-transform/SearchResultList.tsx`<br>`src/routes/_authenticated/translator/business/search-transform/use-search-transform.ts` |
| `src/features/BaseTranslator/features/UnitSearchTransform/components/ui/CircleSelector.tsx` | move | `src/routes/_authenticated/translator/business/search-transform/CircleSelector.tsx` |
| `src/features/BaseTranslator/features/UnitSearchTransform/components/ui/HighlightedText.tsx` | move | `src/routes/_authenticated/translator/business/search-transform/HighlightedText.tsx` |
| `src/features/BaseTranslator/features/UnitSearchTransform/index.ts` | delete | 删除；理由见清单 |
| `src/features/BaseTranslator/features/UnitSearchTransform/searchTransform.test.ts` | move | `src/routes/_authenticated/translator/business/search-transform/search-transform.test.ts` |
| `src/features/BaseTranslator/features/UnitSearchTransform/searchTransform.ts` | move | `src/routes/_authenticated/translator/business/search-transform/search-transform.ts` |
| `src/features/BaseTranslator/hook/autoSaveSchedule.test.ts` | move | `src/routes/_authenticated/translator/business/persistence/auto-save-schedule.test.ts` |
| `src/features/BaseTranslator/hook/autoSaveSchedule.ts` | move | `src/routes/_authenticated/translator/business/persistence/auto-save-schedule.ts` |
| `src/features/BaseTranslator/hook/keyboardScope.ts` | move | `src/routes/_authenticated/translator/business/editor/keyboard-scope.ts` |
| `src/features/BaseTranslator/hook/unitDiff.test.ts` | move | `src/routes/_authenticated/translator/business/persistence/unit-diff.test.ts` |
| `src/features/BaseTranslator/hook/unitDiff.ts` | move | `src/routes/_authenticated/translator/business/persistence/unit-diff.ts` |
| `src/features/BaseTranslator/hook/unitFlags.test.ts` | move | `src/routes/_authenticated/translator/business/persistence/unit-flags.test.ts` |
| `src/features/BaseTranslator/hook/unitSaveController.test.ts` | move | `src/routes/_authenticated/translator/business/persistence/unit-save-controller.test.ts` |
| `src/features/BaseTranslator/hook/unitSaveController.ts` | move | `src/routes/_authenticated/translator/business/persistence/unit-save-controller.ts` |
| `src/features/BaseTranslator/hook/unitSaveMerge.ts` | move | `src/routes/_authenticated/translator/business/persistence/unit-save-merge.ts` |
| `src/features/BaseTranslator/hook/useDetachableSpecialCharsBar.ts` | move | `src/routes/_authenticated/translator/business/preference/use-detachable-special-chars-bar.ts` |
| `src/features/BaseTranslator/hook/usePageImagePreloader.test.ts` | move | `src/routes/_authenticated/translator/business/editor/use-page-image-preloader.test.ts` |
| `src/features/BaseTranslator/hook/usePageImagePreloader.ts` | move | `src/routes/_authenticated/translator/business/editor/use-page-image-preloader.ts` |
| `src/features/BaseTranslator/hook/useRelocationPreference.test.ts` | move | `src/routes/_authenticated/translator/business/preference/use-relocation-preference.test.ts` |
| `src/features/BaseTranslator/hook/useRelocationPreference.ts` | move | `src/routes/_authenticated/translator/business/preference/use-relocation-preference.ts` |
| `src/features/BaseTranslator/hook/useShortcutActions.ts` | move | `src/routes/_authenticated/translator/business/editor/use-shortcut-actions.ts` |
| `src/features/BaseTranslator/hook/useShortcuts.ts` | move | `src/routes/_authenticated/translator/business/preference/use-shortcuts.ts` |
| `src/features/BaseTranslator/hook/useUnitPersistence.ts` | move | `src/routes/_authenticated/translator/business/persistence/use-unit-persistence.ts` |
| `src/features/BaseTranslator/index.ts` | delete | 删除；理由见清单 |
| `src/features/BaseTranslator/layout/BaseTranslatorLayout.tsx` | move | `src/routes/_authenticated/translator/business/editor/BaseTranslatorLayout.tsx` |
| `src/features/BaseTranslator/types/access.test.ts` | move | `src/routes/_authenticated/translator/business/contract/access.test.ts` |
| `src/features/BaseTranslator/types/access.ts` | move | `src/routes/_authenticated/translator/business/contract/access.ts` |
| `src/features/BaseTranslator/types/preview.ts` | move | `src/routes/_authenticated/translator/business/contract/preview.ts` |
| `src/features/BaseTranslator/types/terminology.ts` | move | `src/routes/_authenticated/translator/business/contract/terminology.ts` |
| `src/features/BaseTranslator/types/type.ts` | move | `src/routes/_authenticated/translator/business/contract/type.ts` |
| `src/features/BaseTranslator/types/unitSearchTransform.ts` | move | `src/routes/_authenticated/translator/business/contract/unit-search-transform.ts` |
| `src/features/ComicPlayground/api/term.ts` | move | `src/routes/_authenticated/translator/business/terminology/term-request.ts` |
| `src/features/ComicPlayground/api/termbase.test.ts` | move | `src/routes/_authenticated/translator/business/terminology/termbase-request.test.ts` |
| `src/features/ComicPlayground/api/termbase.ts` | move | `src/routes/_authenticated/translator/business/terminology/termbase-request.ts` |
| `src/features/ComicPlayground/types/term.ts` | move | `src/routes/_authenticated/translator/business/terminology/term-input.ts` |
| `src/features/ComicPlayground/types/termbase.ts` | move | `src/routes/_authenticated/translator/business/terminology/termbase-input.ts` |
| `src/features/WebTranslator/api/translator.test.ts` | move | `src/routes/_authenticated/translator/business/remote/translator-request.test.ts` |
| `src/features/WebTranslator/api/translator.ts` | move | `src/routes/_authenticated/translator/business/remote/translator-request.ts` |
| `src/features/WebTranslator/components/business/WebTranslator.tsx` | split | `src/routes/_authenticated/translator/business/remote/WebTranslator.tsx`<br>`src/routes/_authenticated/translator/business/remote/use-translator-project.ts`<br>`src/routes/_authenticated/translator/business/remote/terminology-adapter.ts` |
| `src/features/WebTranslator/index.ts` | delete | 删除；理由见清单 |
| `src/features/WebTranslator/pageImage.test.ts` | move | `src/routes/_authenticated/translator/business/remote/page-image.test.ts` |
| `src/features/WebTranslator/pageImage.ts` | move | `src/routes/_authenticated/translator/business/remote/page-image.ts` |
| `src/hook/useSpecialChars.ts` | move | `src/routes/_authenticated/translator/business/preference/use-special-chars.ts` |
| `src/stories/features/unitSaveFixture.ts` | move | `src/routes/_authenticated/translator/business/test/unit-save-fixture.ts` |
| `src/types/project.ts` | move | `src/routes/_authenticated/translator/business/unit/project.ts` |
| `src/types/raw/term.ts` | move | `src/routes/_authenticated/translator/business/terminology/raw-term.ts` |
| `src/types/raw/termbase.ts` | move | `src/routes/_authenticated/translator/business/terminology/raw-termbase.ts` |
| `src/types/raw/unit.ts` | move | `src/routes/_authenticated/translator/business/unit/raw-unit.ts` |
| `src/types/term.ts` | move | `src/routes/_authenticated/translator/business/terminology/term.ts` |
| `src/types/termbase.ts` | move | `src/routes/_authenticated/translator/business/terminology/termbase.ts` |
| `src/types/translatorMode.ts` | move | `src/routes/_authenticated/translator/business/unit/translator-mode.ts` |
| `src/types/unit.test.ts` | move | `src/routes/_authenticated/translator/business/unit/unit.test.ts` |
| `src/types/unit.ts` | split | `src/routes/_authenticated/translator/business/unit/unit.ts`<br>`src/routes/_authenticated/translator/business/unit/unit-edit.ts`<br>`src/routes/_authenticated/translator/business/unit/unit-patch.ts` |

<!-- FILE_TABLE_END -->

## 实施步骤

1. 迁入Canvas/Marker/UnitList/统计/快捷键/字符/术语/查找替换等全部能力，按职责使用kebab-case目录；Canvas等通用名仍属于翻校业务，不因名字通用移shared。
2. 拆分BaseTranslator大文件为入口装配、页面/图片协调、编辑操作、布局展示；Web adapter拆章节初始化、权限、HTTP数据源组装；UnitInfo纯操作与patch转换按职责拆分。
3. 保留unitSaveController/diff/merge/autoSaveSchedule深模块及现有interface，整理React同步/回调在route内的所有权；沿S04保留saveId、ID映射、失败重试和pendingAction。
4. unit/raw-unit/search/save相关契约同地，术语CRUD和术语展示全部translator内；使用authenticated共同Page/Chapter契约，不让共同父依赖translator私有类型。
5. 保留specialChars_v2/configurableShortcuts/relocation key及迁移，保存fixture转同业务测试支持；本包同时迁移helper消费者，避免unit tests导入storybook/test。
6. 与最新68cedc0对齐：独立特殊字符工具条、显式换行标记、textarea布局、IME scope、预览位置均纳入浏览器回归；不重写为Native整页快照保存。

## 接口与空值语义修正

逐个审查本包全部生产组件及实际调用方，按S02.8/S04-08修正不必要的optional/null、重复判空和无意义fallback。必需数据与动作收紧契约；合理默认值在所属边界集中；真实空状态与互斥模式显式建模。同步修改受影响的跨包调用方，由集成负责人协调共享文件，不保留临时宽接口。

结果写入[接口审查记录](../review/interface-audit.md)，逐项保留调用方与验证证据。

## 兼容要求

以 [兼容矩阵](../migration/compatibility-map.md) 和所引用 spec 为准；不改变本包未明确授权的后端协议、公开 URL 或用户数据格式。

## 验证

- [ ] 运行所有controller/diff/merge/flags/预加载/搜索变换/贡献者缓存原测试。
- [ ] SD-09保存中继续编辑、网络失败重试、刷新失败保留修改、翻页退出取消/放弃、只读、替换排他。
- [ ] 真实浏览器验证IME、全局快捷键scope、拖拽、textarea resize、字符工具条、换行标记及不同尺寸布局。

## 完成标准

- [ ] 本包接口审查和受影响调用方已完成；IC-01至IC-04在本包范围内无未处理项，不能仅以类型检查通过代替。
- [ ] 整个translator源/test/story均有目标，无嵌套features残留。
- [ ] 移动前后保存协议和controller测试语义一致；路由重挂载不会重复保存或丢草稿。
- [ ] 专用类型不泄漏到共享父module；所有超限源文件按职责拆分。

## 风险与恢复

编辑器是高频复杂区，禁止用文件行数驱动保存算法重写。对失败序列保留可重复fixture，再分别审查移动与时序改变。

## 协作与执行记录

前置依赖未满足时禁止开始本包。可按索引与其他业务包并行；shared、root、路由树或根配置修改交主负责人串行集成。

执行时在本节追加日期、实际提交、命令和退出码、发现/修复以及未完成项；不要预先勾选。

## 需求追踪

R1-04、R2-01、R2-02、R2-04、R2-05、R2-07、R2-08、R2-09、R2-11、R2-13、R2-14、R3-01、R3-04、R4-01、R4-02、R4-04、R4-06、R4-09、R5-01、R5-05、R5-06、R5-07、R5-08、R6-09、R6-12、R7-05、R7-12。条款决定与验收证据见[需求矩阵](../requirements-matrix.md)和[覆盖审查](../review/coverage-matrix.md)。
