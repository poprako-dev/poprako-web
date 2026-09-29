# P003 — 切换 TanStack 文件路由与 shell 装配

计划状态：ready（设计）；实施状态：not-started。
前置工作包：P002

负责人：路由负责人；独占路由入口、application/router、生成配置、shell外壳、导航。

## 目标与范围

所有现有URL在TanStack下可达，auth/shell/translator布局层级正确，生成树与手写入口一致。

## 依据与开始条件

- [S02](../spec/02-structure-and-dependency.md)
- [S03](../spec/03-routing-and-navigation.md)
- [S04](../spec/04-state-and-data.md)
- 基线无未识别变化；前置包的开始/完成门禁已经核实，新的失败有负责人与阻断范围。
- 用户已授权本次迁移；若执行者只接到文档任务，不得将本计划误当已开始的生产变更。

## 文件范围

原 main/App/router/pages/layouts 与 AppSidebar、FirstRegistrationGuide 界面，新增 routes 文件、生成树与共享生成配置。业务内部由 P004–P008 迁移。

精确输入与去向见 [file-map.csv](../migration/file-map.csv) 中 plan=P003 的行。后续收敛修改遵循本节明确范围。

<!-- FILE_TABLE_START -->

基线文件：27 项。附表生成自迁移清单；以 source 为责任身份。

| 原文件 | 动作 | 最终去向 |
| --- | --- | --- |
| `components.json` | update | `components.json` |
| `index.html` | update | `index.html` |
| `src/App.tsx` | split | `src/routes/__root.tsx`<br>`src/routes/business/session/use-team-online-lease.ts` |
| `src/features/AppSidebar/components/business/AppSidebar.tsx` | move | `src/routes/_authenticated/_shell/business/navigation/AppSidebar.tsx` |
| `src/features/AppSidebar/components/business/NavItem.tsx` | move | `src/routes/_authenticated/_shell/business/navigation/NavItem.tsx` |
| `src/features/AppSidebar/components/business/SettingsFooter.tsx` | move | `src/routes/_authenticated/_shell/business/navigation/SettingsFooter.tsx` |
| `src/features/AppSidebar/components/business/TeamModifierModal.tsx` | move | `src/routes/_authenticated/_shell/business/navigation/TeamModifierModal.tsx` |
| `src/features/AppSidebar/components/business/TeamOption.tsx` | split | `src/routes/_authenticated/_shell/business/navigation/TeamOption.tsx`<br>`src/routes/_authenticated/_shell/business/navigation/TeamOptionMenu.tsx`<br>`src/routes/_authenticated/_shell/business/navigation/TeamAvatarDialog.tsx` |
| `src/features/AppSidebar/components/business/TitleHeader.tsx` | move | `src/routes/_authenticated/_shell/business/navigation/TitleHeader.tsx` |
| `src/features/AppSidebar/config/config.ts` | move | `src/routes/_authenticated/_shell/business/navigation/navigation-config.ts` |
| `src/features/AppSidebar/hook/useTeamConfigs.ts` | move | `src/routes/_authenticated/_shell/business/navigation/use-team-configs.ts` |
| `src/features/AppSidebar/layouts/AppSidebarLayout.tsx` | move | `src/routes/_authenticated/_shell/business/navigation/AppSidebarLayout.tsx` |
| `src/features/AppSidebar/types/types.ts` | move | `src/routes/_authenticated/_shell/business/navigation/app-sidebar-type.ts` |
| `src/features/FirstRegistrationGuide/components/business/FirstRegistrationGuideDialog.tsx` | move | `src/routes/_authenticated/_shell/business/first-registration/FirstRegistrationGuideDialog.tsx` |
| `src/layouts/AppLayout.tsx` | split | `src/routes/_authenticated/_shell/route.tsx`<br>`src/routes/_authenticated/_shell/business/navigation/MobileBottomNav.tsx`<br>`src/routes/_authenticated/_shell/business/mail/use-mail-prefetch.ts` |
| `src/main.tsx` | move | `src/Main.tsx` |
| `src/pages/ComicPlaygroundPage.tsx` | move | `src/routes/_authenticated/_shell/comic-playground/index.tsx` |
| `src/pages/ErrorPage.tsx` | move | `src/routes/business/RouteError.tsx` |
| `src/pages/LoginPage.tsx` | move | `src/routes/login/index.tsx` |
| `src/pages/MemberGlancePage.tsx` | move | `src/routes/_authenticated/_shell/member-list/index.tsx` |
| `src/pages/RootGuard.tsx` | merge | `src/routes/_authenticated/_shell/index.tsx` |
| `src/pages/SettingsPage.tsx` | move | `src/routes/_authenticated/_shell/settings/index.tsx` |
| `src/pages/SystemMailPage.tsx` | move | `src/routes/_authenticated/_shell/system-mail/index.tsx` |
| `src/pages/TranslatorPage.tsx` | split | `src/routes/_authenticated/translator/$chapterId/$pageId/index.tsx`<br>`src/routes/_authenticated/translator/business/translator-search.ts` |
| `src/pages/UtilitiesPage.tsx` | move | `src/routes/_authenticated/_shell/utilities/index.tsx` |
| `src/pages/WorkspacePage.tsx` | move | `src/routes/_authenticated/_shell/workspace/index.tsx` |
| `src/router/index.ts` | split | `src/application/router.ts`<br>`src/routes/__root.tsx`<br>`src/routes/_authenticated/route.tsx` |

新增文件 / 新职责（含从旧源提前提取的唯一目标）：

| 目标 | 职责 | 验证 |
| --- | --- | --- |
| `src/route-tree.gen.ts` | 生成的类型化route树；只能generator写入 | generate:check及URL集成测试 |
| `src/routes/_authenticated/translator/route.tsx` | 全屏翻校Outlet布局 | 路由布局与深链 |
| `script/route-config.ts` | Vite/generate共同route配置 | business子树排除及tree一致 |
| `script/generate.ts` | generate及--check临时比较流程 | 无tracked修改及故意陈旧检测 |
| `src/application/test/router-fixture.ts` | 真实tree和memory history装配，无生产消费者 | URL与history验证 |
| `src/application/test/router.test.tsx` | 公开URL、guard及query编码矩阵 | ST-01;ST-02 |

<!-- FILE_TABLE_END -->

## 实施步骤

1. 配置 routesDirectory/ignorePattern/generatedRouteTree/autoCodeSplitting，生成配置单一来源；__root、_authenticated、_shell、login、全部叶子入口按S03建立。不要生成未使用的业务路由。
2. 受保护父路由调用根ensureSession；保留bootstrap失败/login、根/workspace跳转。shell放导航，全屏translator在其兄弟路径；错误和not-found状态采用原有用户反馈语义。
3. 实现S03确定的字符串search解析/序列化和类型校验；保留query详情、readOnly=true、returnTo/comicId/chapterId与浏览器replace/back行为，不使用默认JSON行为改变ID或布尔值。
4. 逐个替换Link/useNavigate/useParams/useSearchParams及Storybook中路由宿主之外的生产调用点；迁移期间叶子入口可临时直接引用尚未迁移的旧业务实现，登记在执行清单，由后续包清零。
5. 根Main初始化应用；移除pages薄入口与旧router装配。当前手工idle预加载改为TanStack显式预加载已存在路由且处理失败，不预加载会触发写操作的路径。
6. 生成并纳管route-tree.gen.ts；移除生产react-router-dom引用。Storybook MemoryRouter旧引用由P009统一迁移，依赖最终移除也由P009确认。

## 接口与空值语义修正

逐个审查本包全部生产组件及实际调用方，按S02.8/S04-08修正不必要的optional/null、重复判空和无意义fallback。必需数据与动作收紧契约；合理默认值在所属边界集中；真实空状态与互斥模式显式建模。同步修改受影响的跨包调用方，由集成负责人协调共享文件，不保留临时宽接口。

结果写入[接口审查记录](../review/interface-audit.md)，逐项保留调用方与验证证据。

## 兼容要求

以 [兼容矩阵](../migration/compatibility-map.md) 和所引用 spec 为准；不改变本包未明确授权的后端协议、公开 URL 或用户数据格式。

## 验证

- [ ] 使用memory history遍历S03全路径表与查询参数矩阵；验证reload、replace/back、未知URL和深链。
- [ ] 验证auth未就绪不启动受保护业务，shell与translator切换保持布局和会话租约。
- [ ] 生成两次结果一致，business中的test/story/worker不进入路由树；构建保留分包。

## 完成标准

- [ ] 本包接口审查和受影响调用方已完成；IC-01至IC-04在本包范围内无未处理项，不能仅以类型检查通过代替。
- [ ] 全部旧公开URL与动态参数可达，路由树只包含真正route文件。
- [ ] 旧pages/layouts/router目录删除；main与App职责已按目标装配。
- [ ] 暂存features调用仅列明待迁业务引用，不能记为最终完成。

## 风险与恢复

路径、search编码或父布局改变会破坏现有收藏和返回流程。用固定URL样本做前后回归；恢复时入口/生成配置/调用方一起回退。

## 协作与执行记录

前置依赖未满足时禁止开始本包。此包涉及共同契约或全仓装配，按计划索引串行集成。

执行时在本节追加日期、实际提交、命令和退出码、发现/修复以及未完成项；不要预先勾选。

## 需求追踪

R1-03、R2-01、R2-02、R2-08、R2-10、R3-01、R3-02、R3-04、R3-06、R3-07、R3-08、R4-01、R4-02、R4-04、R4-06、R6-07、R6-13。条款决定与验收证据见[需求矩阵](../requirements-matrix.md)和[覆盖审查](../review/coverage-matrix.md)。
