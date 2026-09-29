# P010 — 全仓代码规范收敛与统一三态主题

计划状态：ready（设计）；实施状态：not-started。
前置工作包：P009

负责人：规范负责人；全仓串行收敛，期间不与业务文件改动并行。

## 目标与范围

全量手写源码、测试、stories和配置符合Native适用规范，所有界面统一主题且保留现有交互。

## 依据与开始条件

- [S01](../spec/01-toolchain.md)
- [S02](../spec/02-structure-and-dependency.md)
- [S05](../spec/05-theme-and-interface.md)
- [S07](../spec/07-quality-and-delivery.md)
- 基线无未识别变化；前置包的开始/完成门禁已经核实，新的失败有负责人与阻断范围。
- 用户已授权本次迁移；若执行者只接到文档任务，不得将本计划误当已开始的生产变更。

## 文件范围

全部已迁移源/test/story/script/config；application/style.css、ThemeProvider、shared主题偏好及settings选择控件。

精确输入与去向见 [file-map.csv](../migration/file-map.csv) 中 plan=P010 的行。后续收敛修改遵循本节明确范围。

<!-- FILE_TABLE_START -->

基线文件：3 项。附表生成自迁移清单；以 source 为责任身份。

| 原文件 | 动作 | 最终去向 |
| --- | --- | --- |
| `src/App.css` | delete | 删除；理由见清单 |
| `src/api/errorHandling.test.ts` | move | `script/check-error-handling.test.ts` |
| `src/index.css` | move | `src/application/style.css` |

新增文件 / 新职责（含从旧源提前提取的唯一目标）：

| 目标 | 职责 | 验证 |
| --- | --- | --- |
| `src/application/ThemeProvider.tsx` | 应用唯一主题provider | UI-01;UI-02 |
| `src/shared/utility/theme.ts` | 主题读取/更新/初始化 | UI-01 |
| `src/shared/utility/theme.test.ts` | 主题key容错与模式解析 | UI-01 |
| `src/application/test/ThemeProvider.test.tsx` | 系统变化/多标签/provider清理 | UI-01;UI-02 |
| `src/routes/_authenticated/_shell/settings/business/ThemeSelector.tsx` | 设置页三态选择控件 | UI-01 |
| `script/check-style.ts` | 声明命名行数专项 | A70 |
| `script/check-style.test.ts` | 专项有效/无效fixture | A70 |
| `script/check-dependency.ts` | 导入与字符串入口规则 | A70 |
| `script/check-dependency.test.ts` | alias/type/reexport/dynamic/测试例外 | A70 |

<!-- FILE_TABLE_END -->

## 实施步骤

1. 首先实现S07的check-style/check-dependency及其正反fixture，并将原errorHandling.test.ts迁为script/check-error-handling.test.ts且从Vitest断言改为Deno.test与Node严格断言以纳入test:script，明确TS/TSX/JS检查范围；生成检查复用P003。然后先Prettier格式化，再全仓统计物理行数；按file-map预定职责及实际格式化后新超限点继续拆分，禁止合并多语句压行或将测试移出扫描范围。
2. 全部TS改kebab-case、TSX改PascalCase，具名导出、普通顶层function、type数据与Props/interface纯调用契约、import type及返回类型按S02；工具强制例外精确限定。
3. 逐项清除P001存量诊断和宽泛eslint-disable；修正Hook依赖/清理、未知输入收窄、Promise处置、可推导状态，不用新断言掩盖错误。
4. 所有颜色统一到应用CSS主题变量，建立light/dark/system与poprako:theme；ThemeProvider同步根class/系统变化，Settings在本包新增选择控件；Storybook在本包加入相同provider/decorator和主题新用例；P009只提供测试基础设施。
5. 逐页、弹窗、canvas、tooltip和toast复核主题与对比、键盘焦点和IME；保留柔和视觉、移动布局和最新翻校布局，不引入card式重设计。

## 接口与空值语义修正

全仓复核生产组件及Props清单，覆盖继承/交叉类型/Partial引入的optional/null和全部实际调用方；对照逐包审查记录补漏，并检查本包新增主题组件。逐项确认保留可空的业务理由、fallback归属、非法模式和冗余状态已处理。语义正确性由审查确认，不能用AST扫描或lint通过替代。

结果写入[接口审查记录](../review/interface-audit.md)，逐项保留调用方与验证证据。

## 兼容要求

以 [兼容矩阵](../migration/compatibility-map.md) 和所引用 spec 为准；不改变本包未明确授权的后端协议、公开 URL 或用户数据格式。

## 验证

- [ ] format:check、typecheck（含skipLibCheck:false及JS）、lint --max-warnings0、命名/导出/400行/源码依赖专项通过。全仓运行专项并记录P011尚未迁移的CI/脚本/活动文档路径诊断，P011负责清零；不得豁免扫描。
- [ ] UI-01..UI-06：三态主题持久化与系统变化，所有route/portal一致，焦点恢复、键盘与错误反馈。
- [ ] 重新执行相关unit/integration/play，保证为规范修正的Hook和Promise行为可验证。

## 完成标准

- [ ] 本包接口审查和受影响调用方已完成；IC-01至IC-04在本包范围内无未处理项，不能仅以类型检查通过代替。
- [ ] P001诊断账目全部关闭，无整文件忽略或测试目录宽泛豁免。
- [ ] 所有手写受检文件<=400物理行（精确工具生成文件除外）。
- [ ] 主题系统唯一，硬编码业务界面颜色全部已映射或有具体非主题几何/内容理由。

## 风险与恢复

格式化大diff会掩盖行为变化。机械重命名/格式化与Hook/主题行为修正分提交审查；保留映射记录便于追踪原文件。

## 协作与执行记录

前置依赖未满足时禁止开始本包。此包涉及共同契约或全仓装配，按计划索引串行集成。

执行时在本节追加日期、实际提交、命令和退出码、发现/修复以及未完成项；不要预先勾选。

## 需求追踪

R1-02、R1-05、R2-12、R3-01、R3-09、R4-01、R4-02、R4-03、R4-04、R4-05、R4-06、R4-07、R4-08、R4-09、R4-10、R5-01、R5-02、R5-03、R5-04、R5-05、R5-06、R5-08、R6-01、R6-02、R6-03、R6-04、R6-08、R6-09、R6-10、R7-07。条款决定与验收证据见[需求矩阵](../requirements-matrix.md)和[覆盖审查](../review/coverage-matrix.md)。
