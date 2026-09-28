# P012 — 全仓清零与交付验收

计划状态：ready（设计）；实施状态：not-started。
前置工作包：P011

负责人：主集成负责人；独立审查agent复核结果，修正退回原工作包负责人。

## 目标与范围

证明整个项目迁移完成，无旧结构遗留；形成可核对的最终验证报告和回退说明。

## 依据与开始条件

- [S01](../spec/01-toolchain.md)
- [S02](../spec/02-structure-and-dependency.md)
- [S03](../spec/03-routing-and-navigation.md)
- [S04](../spec/04-state-and-data.md)
- [S05](../spec/05-theme-and-interface.md)
- [S06](../spec/06-storybook-and-testing.md)
- [S07](../spec/07-quality-and-delivery.md)
- 基线无未识别变化；前置包的开始/完成门禁已经核实，新的失败有负责人与阻断范围。
- 用户已授权本次迁移；若执行者只接到文档任务，不得将本计划误当已开始的生产变更。

## 文件范围

全仓只读审查、迁移file-map执行状态、review验收记录与必要修复；本包不承接未完成业务包。

精确输入与去向见 [file-map.csv](../migration/file-map.csv) 中 plan=P012 的行。后续收敛修改遵循本节明确范围。

<!-- FILE_TABLE_START -->

基线文件：6 项。附表生成自迁移清单；以 source 为责任身份。

| 原文件 | 动作 | 最终去向 |
| --- | --- | --- |
| `.agents/skills/frontend-design/LICENSE.txt` | retain | `.agents/skills/frontend-design/LICENSE.txt` |
| `.agents/skills/frontend-design/SKILL.md` | retain | `.agents/skills/frontend-design/SKILL.md` |
| `LICENSE` | retain | `LICENSE` |
| `docs/swagger.json` | retain | `docs/swagger.json` |
| `public/favicon.ico` | retain | `public/favicon.ico` |
| `skills-lock.json` | retain | `skills-lock.json` |

<!-- FILE_TABLE_END -->

## 实施步骤

1. 重新枚举git跟踪文件并与480项基线及新增文件清单核对，确认每项移动/拆分/合并/删除已执行且功能有去向。对迁移期间上游新增内容补映射，不能误删。
2. 执行旧目录清零、旧import/HTML/Worker/scripts/配置入口清零；全仓不存在features目录或旧路径兼容转发。对历史文档说明保留明确标记。
3. 在干净环境按锁文件安装，执行S07全部统一门禁、生产构建、Storybook启动/构建/play、Worker功能与部署回归。记录命令、版本、退出码和限制。
4. 按compatibility-map逐场景验收所有公开URL/query、旧storage、身份/团队、漫画详情、保存、上传、导出、移动布局与三态主题。按spec验收ID逐项挂证据。
5. 安排独立标准审查和功能覆盖审查；修复问题后只重跑受影响及必要综合门禁。最终检查git diff只含计划范围，生成结果一致且无相邻目录依赖。
6. 提交交付报告：版本基线、最终结构、全部检查结果、真实环境缺口、恢复路径；只有所有阻断门禁满足才允许标记迁移完成。

## 接口与空值语义修正

按IC-01至IC-04核对最终生产组件清单、调用方证据、修正结果及保留例外。抽查受控输入、确认动作、身份/团队边界、合法默认值和真实空状态。任何遗漏或仅移动文件而未修正已识别接口问题的情况退回负责包；未关闭前不得验收迁移完成。

结果写入[接口审查记录](../review/interface-audit.md)，逐项保留调用方与验证证据。

## 兼容要求

以 [兼容矩阵](../migration/compatibility-map.md) 和所引用 spec 为准；不改变本包未明确授权的后端协议、公开 URL 或用户数据格式。

## 验证

- [ ] S01–S07验收表与coverage-matrix逐条都有已执行证据或明确未达成状态。
- [ ] Windows/macOS开发检查、受支持浏览器交互和Linux交付脚本的环境要求分别落实。
- [ ] 回退保持旧存储/后端协议兼容，回退代码不会执行清库/清浏览器数据。

## 完成标准

- [ ] 本包接口审查和受影响调用方已完成；IC-01至IC-04在本包范围内无未处理项，不能仅以类型检查通过代替。
- [ ] P001–P011全部完成；本包不存在未关闭阻断项。
- [ ] 全项目features及旧入口清零，所有功能测试与门禁通过。
- [ ] 若最低版本或平台验证不可用，记录未验证并保持相应交付门禁未完成，不宣称全量验收通过。

## 风险与恢复

文件已搬完不代表迁移完成。不能以代码行数、测试数量或单次build通过替代兼容矩阵与完整门禁。

## 协作与执行记录

前置依赖未满足时禁止开始本包。此包涉及共同契约或全仓装配，按计划索引串行集成。

执行时在本节追加日期、实际提交、命令和退出码、发现/修复以及未完成项；不要预先勾选。

## 需求追踪

R4-06、R1-07、R6-15、R6-19、R6-20、R7-01、R7-02、R7-09、R7-10、R7-12、R7-13。条款决定与验收证据见[需求矩阵](../requirements-matrix.md)和[覆盖审查](../review/coverage-matrix.md)。
