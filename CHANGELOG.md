# Changelog

所有生产可见变更记录在此。项目遵循 Semantic Versioning，并按 Added、Changed、
Fixed、Security 和 Removed 分类。

## 1.0.0 待发布

### Added

- 团队工作区、漫画与章节管理、任务分配、成员管理和系统信箱。
- 浏览器翻译器、术语库与文本编辑，以及支持草稿恢复的审查标注和保存。
- 漫画 ZIP 归档导出和归档漫画浏览。
- 以完整 commit SHA 标识的不可变部署产物、原子切换、失败回滚和部署后核验。

### Changed

- 使用 React、TanStack Router、TypeScript 和 Vite，统一 Node.js 26 与 pnpm 工具链。
- 功能和修复通过 pull request 合入受保护的 main，并经 production 环境部署。
- 函数行数检查纳入本地完整检查与 CI；历史可访问性基线提供显式收缩入口。

### Fixed

- 部署文档与 workflow 使用相同的 API secret 名称，Release 构建采用生产 API 配置。
- Release 自动核验目标 SHA 的成功生产部署记录，缺失记录或核验失败时停止发布。

### Removed

- 失效的 API 配置、旧认证类型、未接入组件、无消费者的下载实现和测试 fixture。
- 导航示例团队、本机 PSD 实验的默认 Storybook 接入、一次性跨语言实验脚本和失效脚手架。
- 冗余直接依赖及 Storybook 初始化引导插件。
