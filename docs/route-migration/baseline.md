# 调研基线与验证记录

## B01 来源

| 项目 | 固定提交 | 用途 |
| --- | --- | --- |
| Poprako Web | `68cedc0943923843396f1120f44d9caeec8f160c` | 全仓迁移输入，包含最新独立特殊字符工具条与换行标记 |
| Poprako Native | `74e14905431ae261919a1a74c742a2829edff2da` | requirements 与前端依赖基线 |

调研日期：2026-09-28；环境：macOS arm64，Deno 2.9.6。
源码读取基于相邻 `../poprako-native`，实施产物不得保留该相邻目录的运行依赖。
Native REQUIREMENTS 顶部关于“脚手架阶段”的说明不代表当前代码完成程度；本次分别核对规范和实际配置。

## B02 当前工程事实

- 本轮开始工作区干净；基线共有 480 个 git 跟踪文件，`src` 中 403 个 TS/TSX 文件。
- 17 个顶层 feature 目录；仍有嵌套 feature、独立 pages/layouts/router、全局请求/类型/状态分类。
- 路由使用 react-router-dom；当前包范围解析得到的版本与 package.json 最低值不完全相同。
- 例如锁文件实际是 Storybook 10.6.0、Vitest 4.1.11、React 19.2.8、Vite 7.3.6。
  目标版本以 S01 的精确清单为准。
- 单元测试只收集 `src/**/*.test.ts`，使用 Node 环境；Storybook 使用 Playwright browser mode。
- CI 当前执行 lint、单元测试、构建、部署脚本测试、Storybook 构建/启动，不执行 play 浏览器套件。
- 三个 Zustand store：应用状态、通知、页面上传任务；偏好另由 localStorage 管理。
- 普通 shell 与全屏 translator 各自执行身份恢复；`useRefreshLoginState` 还有同类请求编排。
- 默认导出、camelCase TS 文件、混合数据 interface、硬编码颜色和大文件需要全量迁移。

## B03 400 物理行检查

使用文件文本换行计数，包含空行与注释，末尾换行不多计一行。当前共 21 个 TS/TSX 文件超限。
它们包括 BaseTranslator、WebTranslator、Workspace、ComicPlayground、漫画详情及导出/上传/分工、
TeamOption、MemberInvitorModal、AnnouncementTable、UnitSearchTransformDialog、UnitInfo 操作集合，
以及 8 个大测试或 story 文件。完整来源和拆分目标见 file-map，不以本段摘要替代逐文件清单。
格式化会改变物理行数；实施时以 Prettier 后的全量计数验收，不只处理这 21 个基线文件。

## B04 本轮实际运行

| 检查 | 结果 | 适用范围 |
| --- | --- | --- |
| `deno --version` | 2.9.6 | 当前环境 |
| `deno task typecheck` | 退出码 0 | 当前 Web 基线、原始 tsconfig |
| `deno task test:unit` | 45 文件、240 测试通过；Vitest 4.1.11 | 当前 Web 原测试环境；不是目标 Vitest 4.1.7 验收 |
| `deno task lint` | 退出码 0 | 当前 Web 原始规则；不是目标 ESLint9 验收 |

本轮未执行依赖安装、更换工具链、目标 strict 类型检查、生产构建、Storybook 构建/play、
Windows/macOS 双平台任务、浏览器最低版本、部署或发布。它们是具体 plans 的实施门禁。
本轮文档检查包括链接、CSV 覆盖、plan ID 与依赖图，结果记录在 review/findings。

## B05 已确认的迁移风险

1. Unicorn 74 要求 ESLint >=10.4，与 Native ESLint 9.39.1 冲突，不能原样保留所有 Web 工具。
2. 目标仍为 React；参考 Native requirements 的前端约束，不复制其离线 Comic/Chapter 领域含义。
3. raw unit 类型当前反向依赖 BaseTranslator；全局请求测试跨多个业务概念，不能机械按生产依赖规则搬迁。
4. Storybook Deno 启动有真实代理适配；浏览器工具脚本在字符串内引用 `src/features` 和 `src/lib`。
5. 上传队列跨视图存活；按 route 归属移动时不能误设为页面卸载即取消。
6. 单独迁移全部 stories 后，原 controller 测试引用的保存夹具必须转为独立测试支持代码。

若实施前基线变化，先重跑清点并补充清单差异，禁止按旧清单删除新加入的业务或测试。
