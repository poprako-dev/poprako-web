# Native requirements → Web 迁移适用矩阵

依据：Native `74e14905431ae261919a1a74c742a2829edff2da:docs/REQUIREMENTS.md` 全文；Web `68cedc0943923843396f1120f44d9caeec8f160c`。本表是目标覆盖关系，**不是已实现或实测通过报告**。需求ID固定，不随实施顺序重编号。

状态定义：**采用**＝原要求适用于Web；**适配**＝保持其目的、替换Native专属机制；**例外**＝明确保留Web/用户决定；**不适用**＝依赖桌面或Rust前提，本次不引入对应系统。S01–S07分别对应spec文件编号；P001–P012对应plan索引。验收A01–A04、A70–A76定义在对应spec，其他验收场景由所引spec和P012具体化。

## §1 技术栈

| ID | Native条款/覆盖项 | Web决定及源码依据 | spec / plan / 验收 |
| --- | --- | --- | --- |
| R1-01 | Deno安装、统一任务、禁止混用 | 采用；Deno2.9.6，任务从package scripts集中deno.json；当前CI已固定2.9.6 | S01.2/S07.3；P001/P011；A01/A72 |
| R1-02 | Vite/TS/React；Tailwind4.1/shadcn/Lucide | 采用；全部精确对齐Native依赖，Web Vite7/TS5/React19.2/Tailwind4.3迁移 | S01.2–3；P001/P010；A02/A04 |
| R1-03 | TanStack文件路由 | 采用；删除react-router-dom和旧router装配 | S03；P003；路由全量场景 |
| R1-04 | React局部/Zustand跨组件；Query按需 | 采用；用户明确允许Zustand；现有store/app和translator状态按生命周期归位，本次不装Query | S04；P002/P008；状态兼容场景 |
| R1-05 | 前端ESLint/Prettier/Vitest/RTL | 采用；现有Web缺Prettier/RTL且版本不同 | S01.2/4/S06/S07.1；P001/P009/P010；A02/A03/A72 |
| R1-06 | Tauri2/Orchestra0.6/SQLx/SQLite/Specta/Rust工具 | 不适用；Web无src-tauri、Cargo、IPC，不引入桌面后端 | S01.1；P001；manifest无新增桌面依赖 |
| R1-07 | deno.lock/Cargo.lock/固定工具链、升级验证 | 适配；提交deno.lock，无Cargo.lock；精确版本与干净安装 | S01.2/5；P001/P012；A01/A02 |
| R1-08 | Orchestra registry、不依赖相邻构建目录、Specta预发布固定 | 不适用桌面包；采用“相邻Native仅参考”的限制，Web构建不可import相邻项目 | S01.1；P001/P011；独立checkout构建 |

## §2 架构

| ID | Native条款/覆盖项 | Web决定及源码依据 | spec / plan / 验收 |
| --- | --- | --- | --- |
| R2-01 | 展示/交互/导航/状态；业务属于route、共享归共同父级 | 采用；当前features嵌套与顶层分类全部迁移 | S02/S04；P002–P008；file-map覆盖与A70 |
| R2-02 | shared业务无关、禁止FDD/features/entities及改名复制 | 采用；任意自有层级禁止features，而非仅删除顶层 | S02/S07.2；P002–P008/P011；A70/A72 |
| R2-03 | 禁止兄弟内部依赖和通用实现反向依赖业务 | 采用；AST/解析后依赖图检查，集成测试仅定点例外 | S02/S07.2；P004/P011；A70 |
| R2-04 | 单一权威状态、禁止Query→Zustand复制与派生冗余 | 采用；不新增Query，保留Zustand并厘清现有缓存/会话来源 | S04；P002/P008；登录/团队/草稿场景 |
| R2-05 | Rust处理HTTP/文件/系统；原生入口@/bridge | 例外；Web继续浏览器HTTP、文件API、Worker，统一transport+route业务装配；不新建空bridge | S01.1/S04；P002/P007/P008；HTTP/Worker兼容 |
| R2-06 | §2.2 Rust单crate职责、Orchestra契约与事务 | 不适用；bridge/usecase/model/part/implementation/harness/result、Run/Step/Context/Nucl/Level均不迁入Web | S01.1；P001；依赖/目录检查 |
| R2-07 | §2.2事务隔离、后置副作用、Future Send/生命周期 | 不适用Rust机制；Web异步取消/卸载清理按现有浏览器生命周期测试，不宣称数据库事务能力 | S04/S06；P007/P008/P009；取消/失败场景 |
| R2-08 | §2.2不预建事件总线/outbox/第二适配、多crate；不复制服务器技术 | 采用约束精神；本次仅迁移实际业务，不建通用框架或更换后端 | S02/S04；P002–P008；设计审查 |
| R2-09 | §2.3 Rust DTO唯一IPC来源、生成封装、手写与生成分开 | 不适用IPC；Web raw→domain转换留在业务请求处，HTTP协议不改造为Specta | S04；P002/P004/P008；请求契约回归 |
| R2-10 | §2.3生成契约变化校验、边界输入校验 | 适配；路由生成一致性必须检查；Web不能替代后端鉴权，前端转换不使用断言伪装正确 | S03/S04/S07.3；P003/P011；A71及请求测试 |
| R2-11 | §2.3稳定错误分类、安全提示、不显示内部诊断 | 采用；保留Result、用户Toast与脱敏console.error职责 | S04/S07.5；P002/P004–P008；失败反馈场景 |
| R2-12 | §2.3禁止空catch、丢Promise、断言掩盖错误 | 采用；TS ESLint严格规则、异步失败测试 | S01.4/S07.1；P010/P011；A03/A72 |
| R2-13 | §2.4 SQLite用户数据/缓存区分、应用数据目录、启动版本迁移、失败不删库 | SQLite不适用；适配现有浏览器持久化：保留storage key/shape/数据，不将失败恢复写成清空 | S04/S07.5；P002/P008；旧storage兼容 |
| R2-14 | §2.4备份恢复、部分升级、SQLx宏/.sqlx/QueryBuilder参数绑定与测试 | SQL不适用；不添加SQL生成或伪测试。浏览器数据转换如发生需验证失败不损坏旧值 | S04/S07.5；P002/P008；持久化失败场景 |

## §3 工程结构

| ID | Native条款/覆盖项 | Web决定及源码依据 | spec / plan / 验收 |
| --- | --- | --- | --- |
| R3-01 | 单数完整目录、TS kebab/Rust snake、不改外部符号 | 采用；Rust无适用源码；脚本改script、通用UI改component，禁止api/repo缩写分类复建 | S02/S07.2；P002–P011；A70 |
| R3-02 | 单数route命名 | 显式例外：用户要求**routes**；URL既有settings/utilities等保持，不为目录规则破坏URL | S02/S03；P003；URL兼容 |
| R3-03 | 工具目录例外src/node_modules/dist/docs等 | 采用；精确登记.storybook/.github及必要配置/生成路径，不广泛豁免手写源码 | S02/S07.2；P009/P011；A70 |
| R3-04 | @→src；application/route/business/shared/bridge布局 | 适配；application/routes/shared，无bridge；所有业务含tests/stories在所属business | S02；P002–P009；file-map/A70 |
| R3-05 | script单数、docs规范与决策 | 采用；迁移scripts及其CI/文档引用；正式规范与ADR在实施时同步 | S07.3–4；P011；A73 |
| R3-06 | 文件扫描路径、排除^business$、框架保留命名 | 适配为src/routes；routeFileIgnorePattern不变；route.tsx/index.tsx遵循框架语义 | S03/S07.2；P003；生成路由清单 |
| R3-07 | 生成树在扫描外；生成结果入库和一致性 | 采用route-tree.gen.ts；IPC/.sqlx不适用 | S03/S07.3；P003/P011；A71 |
| R3-08 | 不手改生成；命名/行数豁免但检查类型/契约 | 采用；仅确切生成路径例外，不按文件夹名绕过 | S07.1–3；P003/P011；A70/A71 |
| R3-09 | 可配置工具目录使用项目名；shadcn按手写维护 | 采用；shadcn aliases与命名/export/400行都更新；SQL migration目录不适用 | S01.3/S07.2；P002/P010；A70/A72 |

## §4 代码风格

| ID | Native条款/覆盖项 | Web决定及源码依据 | spec / plan / 验收 |
| --- | --- | --- | --- |
| R4-01 | TS kebab、TSX Pascal、测试后缀、配置/路由例外 | 采用；stories的*.stories.*为工具例外，不豁免内容规范 | S02/S06/S07.2；P002–P010；A70 |
| R4-02 | 手写源码/测试400物理行、按职责拆分 | 采用；空行注释计入；生成/锁/文档例外，不能压缩排版 | S07.2；P002–P010；A70/A72 |
| R4-03 | 函数组合、按需抽象、Prettier/rustfmt | 采用前端；不预建框架/假接口；无Rust formatter任务 | S01.4/S07.1；P010/P011；A72 |
| R4-04 | 具名导出、顶层function、回调箭头、工具默认导出例外 | 采用；覆盖export default function而非只查ExportAssignment；原Web默认组件风格被新规范替代 | S07.2；P002–P010；A70 |
| R4-05 | 数据type、纯调用interface、Props永远type | 采用；专项AST检查，不用consistent-type-definitions一刀切 | S01.4/S07.2；P010/P011；A70 |
| R4-06 | Props必需性、空值语义与业务fallback | 采用；全量组件与调用方审查，收紧多余可空，集中合理默认，保留有依据的真实空状态；不用断言/占位值掩盖缺失 | S02.8/S04-08/S07；P002–P010/P012；IC-01至IC-04及接口审查记录 |
| R4-07 | import type、导出/边界返回类型、unknown收窄 | 采用；现有raw转换保留且严格化 | S01.4/S07.1；P010；A03/A72 |
| R4-08 | 禁any/危险断言/非空断言、禁无理由抑制和丢Promise | 采用；定点工具例外与原因，移除现有整文件disable | S01.4/S07.1–2；P010/P011；A03/A70 |
| R4-09 | Hooks、render纯净、清理和错误处理、派生不冗余Effect | 采用；翻校/上传/哈希/窗口事件保持生命周期测试 | S04/S06；P008/P009/P010；取消/卸载/快速切换 |
| R4-10 | Tailwind主题统一、允许动态几何style | 采用；不强行把canvas/拖拽几何常量改为主题token | S05；P010；主题和翻校布局 |
| R4-11 | §4.3全部Rust风格：模块、可见性、导入/定义顺序、分支、通道、英文注释、日志、unsafe/unwrap | 不适用；不能拿Rust规则扩大到TS（例如禁else、英文注释） | S01.1/S07.1；P011；检查范围审查 |

## §5 UI / UX

| ID | Native条款/覆盖项 | Web决定及源码依据 | spec / plan / 验收 |
| --- | --- | --- | --- |
| R5-01 | 简体中文、不引入i18n、任务与恢复文案 | 采用；保留现有中文业务名，不暴露内部迁移结构 | S05；P005–P010；错误/空状态文案 |
| R5-02 | 浅色/深色/系统，统一主题判断与变量 | 采用；现有index.css和分散颜色迁移，设置页提供选择 | S05；P010；A75 |
| R5-03 | 通用UI→shared/component，业务→route，shadcn/Lucide | 采用；Web muted视觉保持，不复制Native业务界面 | S02/S05；P002/P010；组件归属/视觉回归 |
| R5-04 | 键盘、可辨识名称、焦点、弹层恢复、状态不只颜色 | 采用；a11y lint及Storybook/交互测试 | S05/S06；P009/P010；焦点/键盘场景 |
| R5-05 | Windows/macOS快捷键差异、系统操作避让 | 采用；已有翻校快捷键与输入法逻辑迁移保留 | S04/S05；P008/P010；快捷键回归 |
| R5-06 | loading/empty/error/retry/done一致、防重复提交、失败保留输入 | 采用；所有route及上传/保存状态纳入清单 | S05/S06；P004–P010；关键状态矩阵 |
| R5-07 | 恢复提示、幂等重试，不全量自动重试 | 采用；HTTP写操作不隐式重发 | S04/S07.5；P002/P004/P008；失败重试 |
| R5-08 | 长任务不冻结、缩放/溢出/滚动 | 采用；保留Worker、移动导航和全屏翻校行为 | S04/S05/S06；P007/P008/P010；A04/A75 |

## §6 工程质量

| ID | Native条款/覆盖项 | Web决定及源码依据 | spec / plan / 验收 |
| --- | --- | --- | --- |
| R6-01 | 可共同执行的最严格规则、源码/配置/测试全范围 | 采用；不通过排除存量代码假绿；迁移中间诊断明确登记 | S01.4/S07.1；P001/P010/P011；A03/A72 |
| R6-02 | TS完整strict矩阵、skipLibCheck=false | 采用；Web当前skipLibCheck=true必须修正 | S07.1；P001/P010；A02/A72 |
| R6-03 | strictTypeChecked/stylistic、React/Hooks、全error零警告 | 采用；ESLint9冲突处理固定见S01.4 | S01.4；P001/P010/P011；A03 |
| R6-04 | TS显式限制、类型导入/定义、穷尽、400行 | 采用；ESLint+项目AST，不以Prettier替代语义检查 | S07.1–2；P010/P011；A70/A72 |
| R6-05 | 只读格式、排版冲突交Prettier、不关闭正确性 | 采用；check不执行format --write | S07.1/3；P011；A71 |
| R6-06 | Clippy all/pedantic/cargo/restriction/nursery及Rust专项 | 不适用Rust；前端规则仍逐项评估避免矛盾 | S01.1/4；P011；配置审查 |
| R6-07 | 生成/SQL检查 | 适配为路由树及输入一致性；无IPC/SQL元数据 | S03/S07.3；P003/P011；A71 |
| R6-08 | 工具升级复核，不整体降级/排除源码 | 采用；Unicorn因peer冲突移除，必要正确性由具体规则承接，不保留假配置 | S01.4/5；P001/P010；A03 |
| R6-09 | 最小作用域例外、禁止整文件禁用、生成不手改 | 采用；现有BaseTranslator等整文件disable清理；生成路径例外集中记录 | S07.1–2；P008/P010/P011；A70 |
| R6-10 | 测试unwrap/expect定点例外 | 不适用Rust；不据此放宽TS测试any/断言规则 | S07.1；P009/P010；A72 |
| R6-11 | Vitest+RTL可观察行为、按风险、不设覆盖率数字 | 采用；保留纯逻辑tests和有效play，新增路由装配行为测试 | S06；P009；行为矩阵 |
| R6-12 | 读写/创建/旧迁移/失败数据保留/事务/取消/锁/错误 | 适配；Web覆盖HTTP读写/旧storage/保存取消/错误，SQLite事务/忙锁不适用 | S04/S06；P002/P008/P009；数据与取消场景 |
| R6-13 | 多连接临时文件DB、动态查询、IPC生成运行验证 | 不适用数据库；路由生成通过仍不能替代真实导航运行验证 | S03/S06；P003/P009；路由交互测试 |
| R6-14 | 缺陷回归、无真实数据/凭据/不可控远程 | 采用；fixtures和HTTP adapter明确，CI不调用真实后端 | S06；P009；测试无网络依赖 |
| R6-15 | 两桌面平台安装启动退出，浏览器不替代容器 | 不适用桌面包；适配Windows/macOS开发任务及浏览器运行验证，保留移动Web | S07.4/6；P012；A74/A75 |
| R6-16 | dev/desktop/build/check/test/format/generate/package职责 | 适配；保留Web任务，desktop/package/Cargo删除适用，不新增空命令 | S07.3；P001/P011；A72 |
| R6-17 | 避免Tauri前置递归、Cargo checks | 不适用；Webcheck/build/generate职责不形成任务递归 | S07.3；P011；任务图测试 |
| R6-18 | check只读、临时生成比对、不操作用户DB | 采用；临时复制输入和双向比较，禁止原地生成冒充check | S07.3；P011；A71 |
| R6-19 | Windows/macOS辅助任务、不依赖开发者绝对路径 | 采用开发脚本；Linux部署shell为部署目标明确例外 | S07.3–4；P011/P012；A73/A74 |
| R6-20 | 计划→实施→复核、结果限制、规范和ADR同步 | 采用；本包只规划，实施完成另记录验证证据，不把目标表当完成报告 | S07.6；P011/P012；coverage-matrix/findings |

## §7 安全与交付

| ID | Native条款/覆盖项 | Web决定及源码依据 | spec / plan / 验收 |
| --- | --- | --- | --- |
| R7-01 | Windows10 22H2 x64/macOS13.3 ARM、排除Linux/Web/mobile等 | 显式例外；产品保持独立浏览器和移动Web，CI/部署仍Linux；不声明桌面安装支持 | S01.1/S07.6；P011/P012；A74/A75 |
| R7-02 | 系统/WebView能力分别验证、最低版本实测 | 适配浏览器target Chrome111/Safari16.4；无环境明确未测发布门禁，不以较新Playwright替代 | S01.3/S07.6；P012；A74 |
| R7-03 | AGPL3一致标识及第三方许可 | 显式例外；保留Web当前MIT，第三方许可仍保留 | S01.1/S07.5；P011；A76 |
| R7-04 | Tauri CSP/窗口能力/AppManifest command权限 | 不适用；不复制Tauri配置；Web现有HTTP/部署安全语义保留 | S07.5；P011；部署审查 |
| R7-05 | Rust输入/路径校验、网络超时/幂等重试、不关闭证书验证 | 适配；后端鉴权不变，前端HTTP错误/取消/超时维护；Worker文件输入仍校验 | S04/S07.5；P002/P007/P008；错误/文件场景 |
| R7-06 | 系统凭据存储、不存前端持久化、不整体加密DB | 显式Web例外；现有token持久化契约不在结构迁移中改写；不声称等同系统密钥存储 | S04/S07.5；P002；旧登录数据兼容 |
| R7-07 | 本地脱敏日志、不重复、不记录凭据/敏感载荷 | 适配浏览器诊断；保留Toast+console.error，检查敏感数据暴露 | S04/S07.5；P002/P010；失败提示/日志审查 |
| R7-08 | 不建遥测/崩溃上传，未来需用户选择与策略 | 采用；不启用Chromatic上传或额外遥测任务，保留已有工具不等于授权上传 | S01.2/S07.4；P009/P011；CI任务审查 |
| R7-09 | 统一检查/两平台构建/可复现包，不承诺字节一致 | 适配Web受控构建与版本/锁/步骤可追溯；保留现有tar/provenance/SHA256SUMS | S07.4–5；P011/P012；A73/A76 |
| R7-10 | 受控工具链/锁/源码状态、all不代表架构验证 | 采用前半；无Tauri bundle targets，浏览器矩阵必须记录真实环境 | S01.2/S07.6；P012；A01/A74/A76 |
| R7-11 | 签名/macOS公证、安装运行、密钥不入库 | 桌面签名不适用；保留GitHub环境secrets和SSH host-key校验，不记录密钥 | S07.4–5；P011；A73 |
| R7-12 | 升级保留本地数据、最低系统与架构证据 | 适配Webstorage兼容和浏览器证据；不引入删数据恢复 | S04/S07.6；P002/P008/P012；A74/A75 |
| R7-13 | 不要求自动发布/自动更新，但步骤可自动化且不依赖未记录环境 | 例外保留已有main自动部署/tag release；不新增桌面更新；路径迁移不能破坏已有门禁 | S07.4；P011/P012；A73/A76 |

## 采用顺序与政策冲突

1. 用户确定的routes、Storybook、Zustand、Web运行方式和本轮范围优先。
2. Native固定提交规范是目标；其源代码只是实现证据，不能用Native尚未实现之处降低目标。
3. 本表明确Web适配/例外后，覆盖旧Web AGENTS中默认导出、旧目录和旧任务约定；P011必须同步旧文档，避免长期双重规范。
4. 每一需求在 `review/coverage-matrix.md` 链接负责工作包与证据。阻断项写入findings；未实测项保持未测，不转换为默认通过。
