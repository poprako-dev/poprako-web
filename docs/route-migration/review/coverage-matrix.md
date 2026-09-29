# 文档覆盖审查

审查对象：本套迁移文档；不代表目标代码已经实现。需求的适用/适配/例外/不适用决定见[需求矩阵](../requirements-matrix.md)。每行给出完整负责工作包（范围已展开）、spec和未来证据；下表保留设计阶段的需求到证据映射；实施验证另见 [执行记录](../plan/execution.md)，尚未逐项完成最终验收。P012汇总所有适用项，不重复写入每行。

## 逐条需求

| 需求 | 定义 | 负责工作包 | 实施验收证据 |
| --- | --- | --- | --- |
| R1-01 Deno安装、统一任务、禁止混用 | [S01](../spec/01-toolchain.md)、[S07](../spec/07-quality-and-delivery.md) | [P001](../plan/P001-toolchain.md)、[P011](../plan/P011-quality-and-delivery.md) | A01/A72 |
| R1-02 Vite/TS/React；Tailwind4.1/shadcn/Lucide | [S01](../spec/01-toolchain.md) | [P001](../plan/P001-toolchain.md)、[P010](../plan/P010-style-and-theme.md) | A02/A04 |
| R1-03 TanStack文件路由 | [S03](../spec/03-routing-and-navigation.md) | [P003](../plan/P003-file-routing.md) | 路由全量场景 |
| R1-04 React局部/Zustand跨组件；Query按需 | [S04](../spec/04-state-and-data.md) | [P002](../plan/P002-shared-and-session.md)、[P008](../plan/P008-translator.md) | 状态兼容场景 |
| R1-05 前端ESLint/Prettier/Vitest/RTL | [S01](../spec/01-toolchain.md)、[S06](../spec/06-storybook-and-testing.md)、[S07](../spec/07-quality-and-delivery.md) | [P001](../plan/P001-toolchain.md)、[P009](../plan/P009-storybook-and-testing.md)、[P010](../plan/P010-style-and-theme.md) | A02/A03/A72 |
| R1-06 Tauri2/Orchestra0.6/SQLx/SQLite/Specta/Rust工具 | [S01](../spec/01-toolchain.md) | [P001](../plan/P001-toolchain.md) | manifest无新增桌面依赖 |
| R1-07 deno.lock/Cargo.lock/固定工具链、升级验证 | [S01](../spec/01-toolchain.md) | [P001](../plan/P001-toolchain.md)、[P012](../plan/P012-acceptance.md) | A01/A02 |
| R1-08 Orchestra registry、不依赖相邻构建目录、Specta预发布固定 | [S01](../spec/01-toolchain.md) | [P001](../plan/P001-toolchain.md)、[P011](../plan/P011-quality-and-delivery.md) | 独立checkout构建 |
| R2-01 展示/交互/导航/状态；业务属于route、共享归共同父级 | [S02](../spec/02-structure-and-dependency.md)、[S04](../spec/04-state-and-data.md) | [P002](../plan/P002-shared-and-session.md)、[P003](../plan/P003-file-routing.md)、[P004](../plan/P004-shared-business.md)、[P005](../plan/P005-workspace-and-comic.md)、[P006](../plan/P006-member-mail-settings.md)、[P007](../plan/P007-utilities.md)、[P008](../plan/P008-translator.md) | file-map覆盖与A70 |
| R2-02 shared业务无关、禁止FDD/features/entities及改名复制 | [S02](../spec/02-structure-and-dependency.md)、[S07](../spec/07-quality-and-delivery.md) | [P002](../plan/P002-shared-and-session.md)、[P003](../plan/P003-file-routing.md)、[P004](../plan/P004-shared-business.md)、[P005](../plan/P005-workspace-and-comic.md)、[P006](../plan/P006-member-mail-settings.md)、[P007](../plan/P007-utilities.md)、[P008](../plan/P008-translator.md)、[P011](../plan/P011-quality-and-delivery.md) | A70/A72 |
| R2-03 禁止兄弟内部依赖和通用实现反向依赖业务 | [S02](../spec/02-structure-and-dependency.md)、[S07](../spec/07-quality-and-delivery.md) | [P004](../plan/P004-shared-business.md)、[P011](../plan/P011-quality-and-delivery.md) | A70 |
| R2-04 单一权威状态、禁止Query→Zustand复制与派生冗余 | [S04](../spec/04-state-and-data.md) | [P002](../plan/P002-shared-and-session.md)、[P008](../plan/P008-translator.md) | 登录/团队/草稿场景 |
| R2-05 Rust处理HTTP/文件/系统；原生入口@/bridge | [S01](../spec/01-toolchain.md)、[S04](../spec/04-state-and-data.md) | [P002](../plan/P002-shared-and-session.md)、[P007](../plan/P007-utilities.md)、[P008](../plan/P008-translator.md) | HTTP/Worker兼容 |
| R2-06 §2.2 Rust单crate职责、Orchestra契约与事务 | [S01](../spec/01-toolchain.md) | [P001](../plan/P001-toolchain.md) | 依赖/目录检查 |
| R2-07 §2.2事务隔离、后置副作用、Future Send/生命周期 | [S04](../spec/04-state-and-data.md)、[S06](../spec/06-storybook-and-testing.md) | [P007](../plan/P007-utilities.md)、[P008](../plan/P008-translator.md)、[P009](../plan/P009-storybook-and-testing.md) | 取消/失败场景 |
| R2-08 §2.2不预建事件总线/outbox/第二适配、多crate；不复制服务器技术 | [S02](../spec/02-structure-and-dependency.md)、[S04](../spec/04-state-and-data.md) | [P002](../plan/P002-shared-and-session.md)、[P003](../plan/P003-file-routing.md)、[P004](../plan/P004-shared-business.md)、[P005](../plan/P005-workspace-and-comic.md)、[P006](../plan/P006-member-mail-settings.md)、[P007](../plan/P007-utilities.md)、[P008](../plan/P008-translator.md) | 设计审查 |
| R2-09 §2.3 Rust DTO唯一IPC来源、生成封装、手写与生成分开 | [S04](../spec/04-state-and-data.md) | [P002](../plan/P002-shared-and-session.md)、[P004](../plan/P004-shared-business.md)、[P008](../plan/P008-translator.md) | 请求契约回归 |
| R2-10 §2.3生成契约变化校验、边界输入校验 | [S03](../spec/03-routing-and-navigation.md)、[S04](../spec/04-state-and-data.md)、[S07](../spec/07-quality-and-delivery.md) | [P003](../plan/P003-file-routing.md)、[P011](../plan/P011-quality-and-delivery.md) | A71及请求测试 |
| R2-11 §2.3稳定错误分类、安全提示、不显示内部诊断 | [S04](../spec/04-state-and-data.md)、[S07](../spec/07-quality-and-delivery.md) | [P002](../plan/P002-shared-and-session.md)、[P004](../plan/P004-shared-business.md)、[P005](../plan/P005-workspace-and-comic.md)、[P006](../plan/P006-member-mail-settings.md)、[P007](../plan/P007-utilities.md)、[P008](../plan/P008-translator.md) | 失败反馈场景 |
| R2-12 §2.3禁止空catch、丢Promise、断言掩盖错误 | [S01](../spec/01-toolchain.md)、[S07](../spec/07-quality-and-delivery.md) | [P010](../plan/P010-style-and-theme.md)、[P011](../plan/P011-quality-and-delivery.md) | A03/A72 |
| R2-13 §2.4 SQLite用户数据/缓存区分、应用数据目录、启动版本迁移、失败不删库 | [S04](../spec/04-state-and-data.md)、[S07](../spec/07-quality-and-delivery.md) | [P002](../plan/P002-shared-and-session.md)、[P008](../plan/P008-translator.md) | 旧storage兼容 |
| R2-14 §2.4备份恢复、部分升级、SQLx宏/.sqlx/QueryBuilder参数绑定与测试 | [S04](../spec/04-state-and-data.md)、[S07](../spec/07-quality-and-delivery.md) | [P002](../plan/P002-shared-and-session.md)、[P008](../plan/P008-translator.md) | 持久化失败场景 |
| R3-01 单数完整目录、TS kebab/Rust snake、不改外部符号 | [S02](../spec/02-structure-and-dependency.md)、[S07](../spec/07-quality-and-delivery.md) | [P002](../plan/P002-shared-and-session.md)、[P003](../plan/P003-file-routing.md)、[P004](../plan/P004-shared-business.md)、[P005](../plan/P005-workspace-and-comic.md)、[P006](../plan/P006-member-mail-settings.md)、[P007](../plan/P007-utilities.md)、[P008](../plan/P008-translator.md)、[P009](../plan/P009-storybook-and-testing.md)、[P010](../plan/P010-style-and-theme.md)、[P011](../plan/P011-quality-and-delivery.md) | A70 |
| R3-02 单数route命名 | [S02](../spec/02-structure-and-dependency.md)、[S03](../spec/03-routing-and-navigation.md) | [P003](../plan/P003-file-routing.md) | URL兼容 |
| R3-03 工具目录例外src/node_modules/dist/docs等 | [S02](../spec/02-structure-and-dependency.md)、[S07](../spec/07-quality-and-delivery.md) | [P009](../plan/P009-storybook-and-testing.md)、[P011](../plan/P011-quality-and-delivery.md) | A70 |
| R3-04 @→src；application/route/business/shared/bridge布局 | [S02](../spec/02-structure-and-dependency.md) | [P002](../plan/P002-shared-and-session.md)、[P003](../plan/P003-file-routing.md)、[P004](../plan/P004-shared-business.md)、[P005](../plan/P005-workspace-and-comic.md)、[P006](../plan/P006-member-mail-settings.md)、[P007](../plan/P007-utilities.md)、[P008](../plan/P008-translator.md)、[P009](../plan/P009-storybook-and-testing.md) | file-map/A70 |
| R3-05 script单数、docs规范与决策 | [S07](../spec/07-quality-and-delivery.md) | [P011](../plan/P011-quality-and-delivery.md) | A73 |
| R3-06 文件扫描路径、排除^business$、框架保留命名 | [S03](../spec/03-routing-and-navigation.md)、[S07](../spec/07-quality-and-delivery.md) | [P003](../plan/P003-file-routing.md) | 生成路由清单 |
| R3-07 生成树在扫描外；生成结果入库和一致性 | [S03](../spec/03-routing-and-navigation.md)、[S07](../spec/07-quality-and-delivery.md) | [P003](../plan/P003-file-routing.md)、[P011](../plan/P011-quality-and-delivery.md) | A71 |
| R3-08 不手改生成；命名/行数豁免但检查类型/契约 | [S07](../spec/07-quality-and-delivery.md) | [P003](../plan/P003-file-routing.md)、[P011](../plan/P011-quality-and-delivery.md) | A70/A71 |
| R3-09 可配置工具目录使用项目名；shadcn按手写维护 | [S01](../spec/01-toolchain.md)、[S07](../spec/07-quality-and-delivery.md) | [P002](../plan/P002-shared-and-session.md)、[P010](../plan/P010-style-and-theme.md) | A70/A72 |
| R4-01 TS kebab、TSX Pascal、测试后缀、配置/路由例外 | [S02](../spec/02-structure-and-dependency.md)、[S06](../spec/06-storybook-and-testing.md)、[S07](../spec/07-quality-and-delivery.md) | [P002](../plan/P002-shared-and-session.md)、[P003](../plan/P003-file-routing.md)、[P004](../plan/P004-shared-business.md)、[P005](../plan/P005-workspace-and-comic.md)、[P006](../plan/P006-member-mail-settings.md)、[P007](../plan/P007-utilities.md)、[P008](../plan/P008-translator.md)、[P009](../plan/P009-storybook-and-testing.md)、[P010](../plan/P010-style-and-theme.md) | A70 |
| R4-02 手写源码/测试400物理行、按职责拆分 | [S07](../spec/07-quality-and-delivery.md) | [P002](../plan/P002-shared-and-session.md)、[P003](../plan/P003-file-routing.md)、[P004](../plan/P004-shared-business.md)、[P005](../plan/P005-workspace-and-comic.md)、[P006](../plan/P006-member-mail-settings.md)、[P007](../plan/P007-utilities.md)、[P008](../plan/P008-translator.md)、[P009](../plan/P009-storybook-and-testing.md)、[P010](../plan/P010-style-and-theme.md) | A70/A72 |
| R4-03 函数组合、按需抽象、Prettier/rustfmt | [S01](../spec/01-toolchain.md)、[S07](../spec/07-quality-and-delivery.md) | [P010](../plan/P010-style-and-theme.md)、[P011](../plan/P011-quality-and-delivery.md) | A72 |
| R4-04 具名导出、顶层function、回调箭头、工具默认导出例外 | [S07](../spec/07-quality-and-delivery.md) | [P002](../plan/P002-shared-and-session.md)、[P003](../plan/P003-file-routing.md)、[P004](../plan/P004-shared-business.md)、[P005](../plan/P005-workspace-and-comic.md)、[P006](../plan/P006-member-mail-settings.md)、[P007](../plan/P007-utilities.md)、[P008](../plan/P008-translator.md)、[P009](../plan/P009-storybook-and-testing.md)、[P010](../plan/P010-style-and-theme.md) | A70 |
| R4-05 数据type、纯调用interface、Props永远type | [S01](../spec/01-toolchain.md)、[S07](../spec/07-quality-and-delivery.md) | [P010](../plan/P010-style-and-theme.md)、[P011](../plan/P011-quality-and-delivery.md) | A70 |
| R4-06 Props必需性、空值语义与业务fallback | [S02](../spec/02-structure-and-dependency.md)、[S04](../spec/04-state-and-data.md)、[S07](../spec/07-quality-and-delivery.md) | [P002](../plan/P002-shared-and-session.md)、[P003](../plan/P003-file-routing.md)、[P004](../plan/P004-shared-business.md)、[P005](../plan/P005-workspace-and-comic.md)、[P006](../plan/P006-member-mail-settings.md)、[P007](../plan/P007-utilities.md)、[P008](../plan/P008-translator.md)、[P009](../plan/P009-storybook-and-testing.md)、[P010](../plan/P010-style-and-theme.md)、[P012](../plan/P012-acceptance.md) | IC-01至IC-04；[接口审查记录](interface-audit.md) |
| R4-07 import type、导出/边界返回类型、unknown收窄 | [S01](../spec/01-toolchain.md)、[S07](../spec/07-quality-and-delivery.md) | [P010](../plan/P010-style-and-theme.md) | A03/A72 |
| R4-08 禁any/危险断言/非空断言、禁无理由抑制和丢Promise | [S01](../spec/01-toolchain.md)、[S07](../spec/07-quality-and-delivery.md) | [P010](../plan/P010-style-and-theme.md)、[P011](../plan/P011-quality-and-delivery.md) | A03/A70 |
| R4-09 Hooks、render纯净、清理和错误处理、派生不冗余Effect | [S04](../spec/04-state-and-data.md)、[S06](../spec/06-storybook-and-testing.md) | [P008](../plan/P008-translator.md)、[P009](../plan/P009-storybook-and-testing.md)、[P010](../plan/P010-style-and-theme.md) | 取消/卸载/快速切换 |
| R4-10 Tailwind主题统一、允许动态几何style | [S05](../spec/05-theme-and-interface.md) | [P010](../plan/P010-style-and-theme.md) | 主题和翻校布局 |
| R4-11 §4.3全部Rust风格：模块、可见性、导入/定义顺序、分支、通道、英文注释、日志、unsafe/unwrap | [S01](../spec/01-toolchain.md)、[S07](../spec/07-quality-and-delivery.md) | [P011](../plan/P011-quality-and-delivery.md) | 检查范围审查 |
| R5-01 简体中文、不引入i18n、任务与恢复文案 | [S05](../spec/05-theme-and-interface.md) | [P005](../plan/P005-workspace-and-comic.md)、[P006](../plan/P006-member-mail-settings.md)、[P007](../plan/P007-utilities.md)、[P008](../plan/P008-translator.md)、[P009](../plan/P009-storybook-and-testing.md)、[P010](../plan/P010-style-and-theme.md) | 错误/空状态文案 |
| R5-02 浅色/深色/系统，统一主题判断与变量 | [S05](../spec/05-theme-and-interface.md) | [P010](../plan/P010-style-and-theme.md) | A75 |
| R5-03 通用UI→shared/component，业务→route，shadcn/Lucide | [S02](../spec/02-structure-and-dependency.md)、[S05](../spec/05-theme-and-interface.md) | [P002](../plan/P002-shared-and-session.md)、[P010](../plan/P010-style-and-theme.md) | 组件归属/视觉回归 |
| R5-04 键盘、可辨识名称、焦点、弹层恢复、状态不只颜色 | [S05](../spec/05-theme-and-interface.md)、[S06](../spec/06-storybook-and-testing.md) | [P009](../plan/P009-storybook-and-testing.md)、[P010](../plan/P010-style-and-theme.md) | 焦点/键盘场景 |
| R5-05 Windows/macOS快捷键差异、系统操作避让 | [S04](../spec/04-state-and-data.md)、[S05](../spec/05-theme-and-interface.md) | [P008](../plan/P008-translator.md)、[P010](../plan/P010-style-and-theme.md) | 快捷键回归 |
| R5-06 loading/empty/error/retry/done一致、防重复提交、失败保留输入 | [S05](../spec/05-theme-and-interface.md)、[S06](../spec/06-storybook-and-testing.md) | [P004](../plan/P004-shared-business.md)、[P005](../plan/P005-workspace-and-comic.md)、[P006](../plan/P006-member-mail-settings.md)、[P007](../plan/P007-utilities.md)、[P008](../plan/P008-translator.md)、[P009](../plan/P009-storybook-and-testing.md)、[P010](../plan/P010-style-and-theme.md) | 关键状态矩阵 |
| R5-07 恢复提示、幂等重试，不全量自动重试 | [S04](../spec/04-state-and-data.md)、[S07](../spec/07-quality-and-delivery.md) | [P002](../plan/P002-shared-and-session.md)、[P004](../plan/P004-shared-business.md)、[P008](../plan/P008-translator.md) | 失败重试 |
| R5-08 长任务不冻结、缩放/溢出/滚动 | [S04](../spec/04-state-and-data.md)、[S05](../spec/05-theme-and-interface.md)、[S06](../spec/06-storybook-and-testing.md) | [P007](../plan/P007-utilities.md)、[P008](../plan/P008-translator.md)、[P010](../plan/P010-style-and-theme.md) | A04/A75 |
| R6-01 可共同执行的最严格规则、源码/配置/测试全范围 | [S01](../spec/01-toolchain.md)、[S07](../spec/07-quality-and-delivery.md) | [P001](../plan/P001-toolchain.md)、[P010](../plan/P010-style-and-theme.md)、[P011](../plan/P011-quality-and-delivery.md) | A03/A72 |
| R6-02 TS完整strict矩阵、skipLibCheck=false | [S07](../spec/07-quality-and-delivery.md) | [P001](../plan/P001-toolchain.md)、[P010](../plan/P010-style-and-theme.md) | A02/A72 |
| R6-03 strictTypeChecked/stylistic、React/Hooks、全error零警告 | [S01](../spec/01-toolchain.md) | [P001](../plan/P001-toolchain.md)、[P010](../plan/P010-style-and-theme.md)、[P011](../plan/P011-quality-and-delivery.md) | A03 |
| R6-04 TS显式限制、类型导入/定义、穷尽、400行 | [S07](../spec/07-quality-and-delivery.md) | [P010](../plan/P010-style-and-theme.md)、[P011](../plan/P011-quality-and-delivery.md) | A70/A72 |
| R6-05 只读格式、排版冲突交Prettier、不关闭正确性 | [S07](../spec/07-quality-and-delivery.md) | [P011](../plan/P011-quality-and-delivery.md) | A71 |
| R6-06 Clippy all/pedantic/cargo/restriction/nursery及Rust专项 | [S01](../spec/01-toolchain.md) | [P011](../plan/P011-quality-and-delivery.md) | 配置审查 |
| R6-07 生成/SQL检查 | [S03](../spec/03-routing-and-navigation.md)、[S07](../spec/07-quality-and-delivery.md) | [P003](../plan/P003-file-routing.md)、[P011](../plan/P011-quality-and-delivery.md) | A71 |
| R6-08 工具升级复核，不整体降级/排除源码 | [S01](../spec/01-toolchain.md) | [P001](../plan/P001-toolchain.md)、[P010](../plan/P010-style-and-theme.md) | A03 |
| R6-09 最小作用域例外、禁止整文件禁用、生成不手改 | [S07](../spec/07-quality-and-delivery.md) | [P008](../plan/P008-translator.md)、[P010](../plan/P010-style-and-theme.md)、[P011](../plan/P011-quality-and-delivery.md) | A70 |
| R6-10 测试unwrap/expect定点例外 | [S07](../spec/07-quality-and-delivery.md) | [P009](../plan/P009-storybook-and-testing.md)、[P010](../plan/P010-style-and-theme.md) | A72 |
| R6-11 Vitest+RTL可观察行为、按风险、不设覆盖率数字 | [S06](../spec/06-storybook-and-testing.md) | [P009](../plan/P009-storybook-and-testing.md) | 行为矩阵 |
| R6-12 读写/创建/旧迁移/失败数据保留/事务/取消/锁/错误 | [S04](../spec/04-state-and-data.md)、[S06](../spec/06-storybook-and-testing.md) | [P002](../plan/P002-shared-and-session.md)、[P008](../plan/P008-translator.md)、[P009](../plan/P009-storybook-and-testing.md) | 数据与取消场景 |
| R6-13 多连接临时文件DB、动态查询、IPC生成运行验证 | [S03](../spec/03-routing-and-navigation.md)、[S06](../spec/06-storybook-and-testing.md) | [P003](../plan/P003-file-routing.md)、[P009](../plan/P009-storybook-and-testing.md) | 路由交互测试 |
| R6-14 缺陷回归、无真实数据/凭据/不可控远程 | [S06](../spec/06-storybook-and-testing.md) | [P009](../plan/P009-storybook-and-testing.md) | 测试无网络依赖 |
| R6-15 两桌面平台安装启动退出，浏览器不替代容器 | [S07](../spec/07-quality-and-delivery.md) | [P012](../plan/P012-acceptance.md) | A74/A75 |
| R6-16 dev/desktop/build/check/test/format/generate/package职责 | [S07](../spec/07-quality-and-delivery.md) | [P001](../plan/P001-toolchain.md)、[P011](../plan/P011-quality-and-delivery.md) | A72 |
| R6-17 避免Tauri前置递归、Cargo checks | [S07](../spec/07-quality-and-delivery.md) | [P011](../plan/P011-quality-and-delivery.md) | 任务图测试 |
| R6-18 check只读、临时生成比对、不操作用户DB | [S07](../spec/07-quality-and-delivery.md) | [P011](../plan/P011-quality-and-delivery.md) | A71 |
| R6-19 Windows/macOS辅助任务、不依赖开发者绝对路径 | [S07](../spec/07-quality-and-delivery.md) | [P011](../plan/P011-quality-and-delivery.md)、[P012](../plan/P012-acceptance.md) | A73/A74 |
| R6-20 计划→实施→复核、结果限制、规范和ADR同步 | [S07](../spec/07-quality-and-delivery.md) | [P011](../plan/P011-quality-and-delivery.md)、[P012](../plan/P012-acceptance.md) | coverage-matrix/findings |
| R7-01 Windows10 22H2 x64/macOS13.3 ARM、排除Linux/Web/mobile等 | [S01](../spec/01-toolchain.md)、[S07](../spec/07-quality-and-delivery.md) | [P011](../plan/P011-quality-and-delivery.md)、[P012](../plan/P012-acceptance.md) | A74/A75 |
| R7-02 系统/WebView能力分别验证、最低版本实测 | [S01](../spec/01-toolchain.md)、[S07](../spec/07-quality-and-delivery.md) | [P012](../plan/P012-acceptance.md) | A74 |
| R7-03 AGPL3一致标识及第三方许可 | [S01](../spec/01-toolchain.md)、[S07](../spec/07-quality-and-delivery.md) | [P011](../plan/P011-quality-and-delivery.md) | A76 |
| R7-04 Tauri CSP/窗口能力/AppManifest command权限 | [S07](../spec/07-quality-and-delivery.md) | [P011](../plan/P011-quality-and-delivery.md) | 部署审查 |
| R7-05 Rust输入/路径校验、网络超时/幂等重试、不关闭证书验证 | [S04](../spec/04-state-and-data.md)、[S07](../spec/07-quality-and-delivery.md) | [P002](../plan/P002-shared-and-session.md)、[P007](../plan/P007-utilities.md)、[P008](../plan/P008-translator.md) | 错误/文件场景 |
| R7-06 系统凭据存储、不存前端持久化、不整体加密DB | [S04](../spec/04-state-and-data.md)、[S07](../spec/07-quality-and-delivery.md) | [P002](../plan/P002-shared-and-session.md) | 旧登录数据兼容 |
| R7-07 本地脱敏日志、不重复、不记录凭据/敏感载荷 | [S04](../spec/04-state-and-data.md)、[S07](../spec/07-quality-and-delivery.md) | [P002](../plan/P002-shared-and-session.md)、[P010](../plan/P010-style-and-theme.md) | 失败提示/日志审查 |
| R7-08 不建遥测/崩溃上传，未来需用户选择与策略 | [S01](../spec/01-toolchain.md)、[S07](../spec/07-quality-and-delivery.md) | [P009](../plan/P009-storybook-and-testing.md)、[P011](../plan/P011-quality-and-delivery.md) | CI任务审查 |
| R7-09 统一检查/两平台构建/可复现包，不承诺字节一致 | [S07](../spec/07-quality-and-delivery.md) | [P011](../plan/P011-quality-and-delivery.md)、[P012](../plan/P012-acceptance.md) | A73/A76 |
| R7-10 受控工具链/锁/源码状态、all不代表架构验证 | [S01](../spec/01-toolchain.md)、[S07](../spec/07-quality-and-delivery.md) | [P012](../plan/P012-acceptance.md) | A01/A74/A76 |
| R7-11 签名/macOS公证、安装运行、密钥不入库 | [S07](../spec/07-quality-and-delivery.md) | [P011](../plan/P011-quality-and-delivery.md) | A73 |
| R7-12 升级保留本地数据、最低系统与架构证据 | [S04](../spec/04-state-and-data.md)、[S07](../spec/07-quality-and-delivery.md) | [P002](../plan/P002-shared-and-session.md)、[P008](../plan/P008-translator.md)、[P012](../plan/P012-acceptance.md) | A74/A75 |
| R7-13 不要求自动发布/自动更新，但步骤可自动化且不依赖未记录环境 | [S07](../spec/07-quality-and-delivery.md) | [P011](../plan/P011-quality-and-delivery.md)、[P012](../plan/P012-acceptance.md) | A73/A76 |

## 跨文档完整性

| 对象 | 文档证据 | 本轮结论 |
| --- | --- | --- |
| 全仓输入 | [file-map](../migration/file-map.csv)：固定提交480个跟踪文件，每个source唯一 | 全覆盖；保留文件也由P012核实，不要求制造修改 |
| 新建职责 | [new-files](../migration/new-files.csv)：37项，包含生成、测试、脚本和新主题 | 每项有主负责人、spec和验证要求；提取职责可与旧文件拆分目标重合 |
| 生产边界 | [dependency-map](../migration/dependency-map.md)、[S02](../spec/02-structure-and-dependency.md) | shared无业务、共同父route、兄弟不互引；集成夹具无生产消费者 |
| 结构验收 | S02.7；A70 | 清零旧目录/字符串入口/兼容转发，类型和生成不能替代架构检查 |
| 导航验收 | [S03.6](../spec/03-routing-and-navigation.md)；ST-01/ST-02 | URL、原search编码、push/replace/back、guard和全屏布局逐项规定 |
| 数据验收 | [S04](../spec/04-state-and-data.md)：SD-01至SD-10 | 身份代次、旧持久化、邮件、上传续存、保存协议、在线租约都有场景 |
| 主题/交互 | [S05](../spec/05-theme-and-interface.md)：UI-01至UI-06 | 三态主题在P010统一实现；旧布局、IME、快捷键和焦点有回归门禁 |
| 测试环境 | [S06](../spec/06-storybook-and-testing.md)：ST-01至ST-08 | P001先建集成环境；P009整合Storybook；浏览器压缩/有界任务单独运行 |
| 工具与交付 | [S01](../spec/01-toolchain.md)：A01至A04；[S07](../spec/07-quality-and-delivery.md)：A70至A76 | 原基线通过和未来目标验收严格区分，平台缺证据如实记未测 |
| 实施顺序 | [plan索引](../plan/README.md)：12个工作包 | 每包有输入/输出、步骤、验证、完成条件和失败处理；依赖图无环 |

## 如何复核

在仓库根目录执行：

```sh
deno run --allow-read --allow-env --allow-run=git docs/route-migration/review/check-documents.mjs
```

该检查只读取Git、CSV和Markdown，验证输入覆盖、plan分配、目标目录/TS命名、附表同步、需求追踪、依赖图、文件链接和尾部空白。它不验证Markdown锚点、运行时兼容性或设计的业务正确性；这些由人工交叉审查及后续实施门禁承担。结果见[findings](findings.md)。
