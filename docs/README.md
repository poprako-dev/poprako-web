# 文档索引

根目录保留项目入口、治理与工具链配置；此目录维护需要持续查阅的详细说明。
文件分工见[仓库规范](repository-conventions.md)。

## 业务与开发

- [领域术语](../CONTEXT.md)
- [贡献指南及依赖边界](../CONTRIBUTING.md)
- [Agent 规则](../AGENTS.md)
- [后端 OpenAPI 契约快照](swagger.json)
- [压缩工具边界与验证](../src/shared/utility/compress/readme.md)

## 发布与部署

- [发布策略](../RELEASE.md)
- [变更记录](../CHANGELOG.md)
- [1.0.0 发行说明](release/1.0.0.md)，当前待发布
- [部署配置与回滚](frontend-deploy.md)
- [1.0.0 审计与清理记录](release-1.0.0-repo-audit.md)，包含初次审计历史和后续处理进度

## 持续维护

- [维护与需求待办](maintenance-follow-ups.md)
- [依赖声明兼容补丁及退出条件](dependency-workarounds.md)
- [第三方许可清单](third-party-licenses.md)
- [依赖安全审计例外](security-audit-exceptions.md)
- [历史实验索引](archive/README.md)

故障反馈、安全漏洞和行为问题分别按根目录的[支持说明](../SUPPORT.md)、
[安全策略](../SECURITY.md)和[行为准则](../CODE_OF_CONDUCT.md)处理。
