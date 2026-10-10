# Contributing

PopRaKo 使用 main-only 集成流程：

1. 功能和修复从独立分支发起 pull request，以 `main` 为目标分支。
2. 必需检查全部通过并解决 review threads 后才能合入；每次合入都会部署生产版本。

禁止直接 push、强推或删除 `main`。保持 pull request 聚焦，并使用 `feat:`、
`fix:`、`refactor:`、`test:`、`docs:`、`ci:` 或 `chore:` 等 conventional commit
类型。

## 必需检查

```sh
sh script/ci-check.sh
```

该入口会锁定安装依赖、执行 ESLint、运行单元测试、构建应用和 Storybook。
ESLint 检查全部 TypeScript/TSX 文件。完整检查还会分别检查应用、测试和 Storybook
TypeScript 程序，并运行结构依赖、生成路由、单元、集成、Storybook 和脚本检查。
本地运行 `deno task lint` 可单独运行 ESLint；完整检查与 CI 使用同一规则。

Deno 2.9 是受支持的运行时和包管理工具。`AGENTS.md` 与
`.agents/skills/` 中仍在使用的项目规则对所有变更生效。

生产部署脚本和 GitHub Actions 的修改必须通过 pull request 审核。不得提交凭据、
私钥、主机公钥或私有基础设施地址；公开域名和非敏感部署拓扑应记录在部署文档中。

## 编码规范

- 源码和组件使用具名导出；TanStack 路由导出具名 `Route`。默认导出仅用于框架要求的配置和 Storybook 元数据。
- 组件 props 使用具名 `type Props`；数据结构使用 `type`，`interface` 仅用于纯可调用契约。
- 顶层函数和组件使用函数声明。
- 所有自有函数、方法和回调最多 50 个物理行，覆盖测试、Storybook、fixture 和工具脚本。计数从签名至结尾，包含注释、空行和嵌套函数；嵌套函数也独立检查。
- PascalCase 且包含 JSX 的 TSX/JSX 组件函数，自身所有 return 的物理行范围合计最多 150 行；扣除这些行后最多 50 行。箭头组件的隐式返回也计入渲染部分，嵌套回调的 return 不独立从组件逻辑中扣除。
- 使用 `deno task lint:function-lines` 运行只读行数检测，超限返回非零退出码。当前作为独立存量审查任务，尚未接入必需 CI。按职责提取独立 hook、函数或组件；禁止压缩代码规避限制。
- 组件和 story 的 `.tsx` 文件使用 PascalCase，`.ts` 模块使用 kebab-case。
- 测试、story 和局部 fixture 就近放置；仅跨模块共享的测试资源放入 `src/test-resource/`。
- 保留 Zustand 和 Storybook。界面仅支持浅色，禁止添加深色、跟随系统或主题选择 UI。
- 保留键盘、IME 和无障碍行为；错误保留诊断上下文，界面提供必要的反馈和恢复方式。
- 在问题所属代码中修复检查错误；禁止扩大 suppressions 或关闭检查。

## 依赖边界

- 保持浏览器 React 应用与 HTTP 后端架构，不引入 Tauri。
- 路由只能使用自身和祖先路由的业务模块，禁止依赖兄弟路由内部实现。
- `src/api/` 不得导入路由 UI 或会话状态；`src/shared/` 不得依赖路由。
- 设置和工具路由放在已认证路由树的无路径分组中，不建立顶层源码目录。
- 业务模块负责请求编排和原始数据到领域类型的转换；复用现有大小写转换实现，禁止逐字段手工映射。
- 更新 API 调用时，在 API 边界将后端蛇形字段转换为业务模块的 camelCase 领域类型；禁止在业务模块间复制原始 API 结构。
- 后端契约快照使用 `docs/swagger.json`，禁止手工维护第二份 OpenAPI 快照。
- 路由树只能修改输入后运行 `deno task generate` 生成，禁止直接编辑生成文件。
- 依赖以 `deno.json` 和冻结的 `deno.lock` 为准。
