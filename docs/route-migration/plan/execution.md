# 动态实施调度记录

执行方式：主agent负责调度、文件所有权、审查和集成；worker负责有明确产物与写入范围的任务。
本次用户明确授权动态worker pool，覆盖旧AGENTS对本次多agent协作的禁止。

## 起点

- 当前分支：`refactor/routing`，作为隔离迁移分支使用，不修改主分支。
- 启动HEAD：`cd80deb66655c8a1c3590f1b48f0e7c11f4c94b0`，生产源码仍为480项基线。
- Native参考：`74e14905431ae261919a1a74c742a2829edff2da`。
- 开始时存在已知文档修改：Props/空值语义增强及interface-audit；保留这些修改，不重置工作区。
- 设计依据：[计划图](README.md)、七份spec、逐文件清单和接口审查要求。

## 调度规则

1. 状态为waiting、ready、running、review、done、blocked；done要求证据与主agent复核。
2. 每次worker完成、发现阻断或文件锁释放后，重新计算可执行节点，不等待同批其他无关任务。
3. 按用户限时实施指令调整：契约已稳定且写入范围不冲突的工作包可并发实现；集成验收仍按依赖推进，不将并发开工记作前置验收通过。
4. 大工作包拆为有独立产物和唯一写入负责人的任务；跨包变更先同步契约，由对应负责人修改。最终验收不因限时或并发而放宽。
5. 根配置、lock、生成树、shared和跨包消费者同一时间只有一名写入负责人；需要改动时先交还或转移所有权。
6. worker报完成后进入review；检查diff、spec、调用方、测试结果和未处理诊断。返工只阻断实际依赖它的节点。
7. P001允许已登记的后续源码诊断，但工具启动和依赖兼容阻断必须解决；最终P012不接受这些遗留。
8. 不自动提交、发布或部署。每次交接记录实际命令、结果和可复核产物；禁止将worker自报当成全部验收。

## 当前队列

用户限时窗口：2026-09-28 02:27:39–03:57:39 UTC。后续明确要求实现worker全部使用GPT-6 Luna；已中断此前worker，保留已完成修改并交接给以下负责人。

| 工作范围 | 状态 | 唯一写入负责人 | 集成门禁 |
| --- | --- | --- | --- |
| P001 / P009配置 / P011 工具、脚本与CI | running | luna_toolchain | 严格类型、声明修复重放、脚本与专项检查 |
| P002共享与P010主题 | running | luna_shared | UI契约、合法默认值、shared依赖方向 |
| P002会话 / P003路由、HTTP、身份 | running | luna_session | 所有route入口、Main、生成器、会话竞态及导航兼容 |
| P004公共业务和漫画详情 | running | luna_detail | domain/raw方向、上传取消、详情与导出兼容 |
| P005/P006/P007叶路由业务 | running | luna_leaf | 业务Props、状态、设置主题与交互 |
| P008翻译器 | running | luna_translator | 编辑/保存映射、能力契约、快捷键与故事 |
| P009故事集成 / P010规范收敛 / P012 | waiting | 主集成检查，修复返还对应worker | 各包可执行后运行完整门禁，不预先声明通过 |

主agent只负责调度、审查、验证和迁移记录；业务实现交由Luna。376项保留源码已集中迁至目标目录；该机械迁移不等于责任拆分或功能验收完成。

## 事件与证据

- 已派发P001.a；worker不得修改仓库依赖、node_modules、源码或计划索引。
- 原`deno task typecheck`、`deno task lint`、`deno task build`退出码均为0。
- 原`deno task test:unit`退出码0：45文件、240测试，Vitest4.1.11。
- 原Storybook代理单测2项通过；首次真实启动被沙箱本地端口限制阻止。
  通过工具权限机制重试`deno task test:storybook-start`后退出码0，真实smoke成功；此项不归类为源码回归。
- 基线日志：`/tmp/poprako-baseline-{typecheck,lint,unit,build}.log`及
  `/tmp/poprako-baseline-storybook-retry.log`。日志为本机临时证据，不作为交付依赖。
- P001.a首次空缓存安装因registry.npmjs.org DNS解析失败退出1；worker保持原精确清单，正在申请工具网络权限重试。
- 网络重试后隔离安装退出0；目标Vite8生产构建、Vitest4.1.7的Node/RTL共2项测试已成功。
  strict类型检查发现Storybook10.6.0声明内TS2578/TS2344；已派独立复核，P001.b及所有后继保持未解锁。
- P002只读准备完成：UI、通用工具、HTTP、身份/会话可分配独占范围；根配置、消费者改动与全仓import由集成者串行负责。
  身份请求相关约64个生产引用需统一处理，不让多个worker各自修改。
- 类型阻断及限定修复候选已记入[P001验证记录](../review/P001-toolchain-validation.md)，
  当前继续验证，不把临时实验修改当成项目已修复。
- 主集成选择D19/D20：保留固定版本，精确修复上游声明排版并分离测试类型环境；
  P001.c在独立目录完成清洁安装重放，原验证目录及缓存hash保持不变。
- 已解锁并派发P001.b。worker独占package/deno/lock、tsconfig、ESLint/Vite/Vitest/PostCSS/Prettier、
  application构建共同配置/测试setup和依赖准备脚本；主集成独占docs，其他业务源码无写入任务。
  新增文件及最终诊断清单在worker交付后同步迁移库存；不以临时fixture成功代替完整项目结果。

本记录持续更新；没有done的工作包不得对外声明实现完成。

### 2026-09-28 03:05 UTC 并发收敛

- P002共享范围严格lint已通过；luna_shared承接翻译器5个明确组件的类型/Props/颜色修正，luna_translator排除这些文件。
- 路由/会话负责人luna_session完成本范围lint及会话/路由测试后，承接P004上传runtime与allocation测试拆分；luna_detail已明确交还写入锁。
- 已复核：一次全仓unit快照46文件/249测试通过；Vite生产bundle通过；真实Chromium压缩36文件约795MB，SHA256往返、取消、背压、Worker清理通过；部署stub回归通过。
- 用户批准D21后Vitest族升级4.1.11，冻结审计退出0、无已知漏洞。后续仍须在最终源码快照重跑完整门禁。
- 发现并返工：批量返回类型标注的参数插入位置错误已修复；静态checker的默认函数导出、ambient注册例外、root业务反向依赖及非字面量动态导入检查须补齐。不会把初版checker通过等同于全部规则落实。

## 03:25 UTC 集成快照

- D21 已执行：Vitest、browser-playwright、coverage-v8 统一 4.1.11；冻结审计无已知漏洞。
- 路由、会话、叶子业务、翻校主体与 shared 均已落地；源码不再以 features/pages 布局组织。
- 最近全仓单测为 51 文件 / 255 测试通过；路由集成 13 测试通过。此处记录快照，不代替最终重跑。
- Chromium 压缩与有界压缩回归通过，Storybook 真实 HTTP 启动探测通过；shared/术语 23 条浏览器交互通过。
- 剩余阻断：全仓严格类型、ESLint、400 行和命名规则收敛，完整 Storybook 浏览器回归、格式化及接口逐项审查记录。
- ComicDetailModal 已拆为 320 行，上传运行时拆分后 13 条回归通过。保留真实空状态，禁止空 ID 伪造就绪状态。
- 实施 worker 均为 GPT-6 Luna；动态转交故事拆分、编辑器规范与详情展示层，避免同文件并发写入。

## 03:55 UTC 最终本机交付快照

- 停止源码写入后统一 Prettier；完整 `deno task check` 最终退出 0。
- 54 文件 / 261 单测、14 路由集成、39 文件 / 182 Chromium Storybook 测试、11 工程脚本测试全部通过。
- 全部类型程序、Lint、400 行及架构边界、生成一致性通过；生产 build 和 Storybook build 退出 0。
- 基线 480 文件在 implementation-map.csv 记录实际入口或删除，入口不存在项为 0；临时运行时 import 环检查为 0。
- 重复安全审计被自动审批拒绝（依赖元数据将发送至 npm registry）；保留此前 4.1.11 冻结审计成功结果，不记本次为通过。
- 未完成边界：跨平台/最低浏览器实际运行，及逐组件完整人工审查记录。详见实施报告，不能将本机自动门禁通过扩大为全部需求完成。
