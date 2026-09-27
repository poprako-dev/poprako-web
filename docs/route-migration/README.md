# Poprako Web 全项目 routes 迁移文档包

文档状态：ready（文档包已完成）；交叉审查结果见 [review/findings](review/findings.md)。
生产迁移状态：**尚未开始**。本目录是实施依据，不是已经完成改造的声明。

## 目的与固定约束

整套前端按 route 内聚组织，取消所有自有 `features` 目录及旧业务分类入口；
适用的技术栈、代码规范、状态规则、主题与工程门禁对齐 Poprako Native requirements。
本项目使用用户明确指定的 `routes`，保留 Zustand 和 Storybook，继续作为使用 HTTP 后端的 Web 产品。
这些决定来自本会话用户，不再把全项目迁移缩小为单个业务试点。

本轮只写文档、清点源码并运行迁移前只读检查；没有改动生产源码、依赖、构建配置、AGENTS 或部署系统。
此前单份方案与临时 HTML 报告仅作为调研材料；冲突时以本套文档的已决策条款为准。

## 阅读顺序

1. [baseline](baseline.md)：固定提交、现状、已运行与未运行的检查。
2. [requirements-matrix](requirements-matrix.md)：Native 条款的适用性与覆盖关系。
3. [decision-register](decision-register.md)：已确定的工程取舍及平台适配。
4. 按顺序阅读下面七份 spec，先理解目标，再看文件去向。
5. [迁移清单](migration/file-map.csv)、[依赖图](migration/dependency-map.md)、
   [兼容矩阵](migration/compatibility-map.md)、[新增文件](migration/new-files.csv)。
6. [实施计划入口](plan/README.md)：工作包、依赖、第一批可执行任务。
7. [覆盖审查](review/coverage-matrix.md)与[发现记录](review/findings.md)。

## Spec 索引

| Spec | 定义的事实与契约 |
| --- | --- |
| [S01 工具链](spec/01-toolchain.md) | 精确版本、兼容冲突、旧工具和规则去向 |
| [S02 结构与依赖](spec/02-structure-and-dependency.md) | 完整目标树、归属、文件命名与导入方向 |
| [S03 路由与导航](spec/03-routing-and-navigation.md) | 文件路由、布局、URL/search、guard、返回行为 |
| [S04 状态与数据](spec/04-state-and-data.md) | Zustand、会话、持久化、请求、保存与上传生命周期 |
| [S05 主题与交互](spec/05-theme-and-interface.md) | 三态主题、可访问性、键盘、反馈与视觉兼容 |
| [S06 Storybook 与测试](spec/06-storybook-and-testing.md) | 测试归属、夹具、Deno 启动、浏览器环境 |
| [S07 质量与交付](spec/07-quality-and-delivery.md) | 任务、静态门禁、生成一致性、CI 与部署 |

## 执行约定

- Spec 是目标契约，plan 是步骤；plan 不复制或私自修改协议定义。
- 文件清单的 `plan` 是主迁移负责人；后续 P009/P010/P011 可按明确步骤进行测试、规范和配置收敛。
- `ready` 表示计划已具备实施细节，不表示依赖工作已完成或测试已通过。
- `blocked` 表示开始条件尚未满足；执行进度另记在 plan 索引，不能以文档写完代替实现完成。
- 所有实现工作在同一隔离迁移分支集成；中间工作包是审查单元，最终 P012 之前不作为可发布版本。
- 新严格规则在迁移过程产生的存量诊断必须登记并分配给工作包，不使用排除源码或宽泛禁用假装通过。
- 用户已明确允许 subagent；并行任务遵守写入范围，共享文件由主负责人串行集成。
- 不依赖相邻 Native 仓库进行构建；本目录记录的基线与版本清单可独立使用。

## 全项目完成定义

生产迁移必须完成 P001–P012，满足所有适用 spec 验收，且不存在自有旧分类目录、旧源码导入、
字符串入口或兼容转发文件。文档清单、自动生成结果、源码和 CI 应互相一致。
保留既有 Web 功能、URL、保存协议和浏览器数据；新增主题行为按照 S05 验证。
完整交付需要实测目标工具链、Storybook、浏览器交互和部署回归；当前文档不会预先宣称这些结果通过。
