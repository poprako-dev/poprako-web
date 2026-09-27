# P011 — 落地不可回退的工程门禁与交付文档

计划状态：ready（设计）；实施状态：not-started。
前置工作包：P010

负责人：工程集成负责人；独占script、CI、AGENTS、工程文档与最终配置装配。

## 目标与范围

新架构由自动检查守护，所有本地/CI/发布任务和文档使用真实新路径，check只读。

## 依据与开始条件

- [S02](../spec/02-structure-and-dependency.md)
- [S06](../spec/06-storybook-and-testing.md)
- [S07](../spec/07-quality-and-delivery.md)
- 基线无未识别变化；前置包的开始/完成门禁已经核实，新的失败有负责人与阻断范围。
- 用户已授权本次迁移；若执行者只接到文档任务，不得将本计划误当已开始的生产变更。

## 文件范围

scripts→script、.github工作流、AGENTS、README/部署文档/shadcn配置、项目规范、生成与静态规则脚本。

精确输入与去向见 [file-map.csv](../migration/file-map.csv) 中 plan=P011 的行。后续收敛修改遵循本节明确范围。

<!-- FILE_TABLE_START -->

基线文件：29 项。附表生成自迁移清单；以 source 为责任身份。

| 原文件 | 动作 | 最终去向 |
| --- | --- | --- |
| `.env.example` | update | `.env.example` |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | update | `.github/ISSUE_TEMPLATE/bug_report.yml` |
| `.github/ISSUE_TEMPLATE/config.yml` | update | `.github/ISSUE_TEMPLATE/config.yml` |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | update | `.github/ISSUE_TEMPLATE/feature_request.yml` |
| `.github/pull_request_template.md` | update | `.github/pull_request_template.md` |
| `.github/workflows/ci.yml` | update | `.github/workflows/ci.yml` |
| `.github/workflows/release.yml` | update | `.github/workflows/release.yml` |
| `.gitignore` | update | `.gitignore` |
| `AGENTS.md` | update | `AGENTS.md` |
| `CHANGELOG.md` | update | `CHANGELOG.md` |
| `CLAUDE.md` | update | `CLAUDE.md` |
| `CODE_OF_CONDUCT.md` | update | `CODE_OF_CONDUCT.md` |
| `CONTRIBUTING.md` | update | `CONTRIBUTING.md` |
| `README.md` | update | `README.md` |
| `RELEASE.md` | update | `RELEASE.md` |
| `SECURITY.md` | update | `SECURITY.md` |
| `SUPPORT.md` | update | `SUPPORT.md` |
| `deploy/poprako-web/nginx.conf` | update | `deploy/poprako-web/nginx.conf` |
| `docs/frontend-deploy.md` | update | `docs/frontend-deploy.md` |
| `docs/security-audit-exceptions.md` | update | `docs/security-audit-exceptions.md` |
| `docs/todo.md` | update | `docs/todo.md` |
| `justfile` | update | `justfile` |
| `scripts/ci-audit.sh` | move | `script/ci-audit.sh` |
| `scripts/ci-build.sh` | move | `script/ci-build.sh` |
| `scripts/ci-check.sh` | move | `script/ci-check.sh` |
| `scripts/ci-deploy-production.sh` | move | `script/ci-deploy-production.sh` |
| `scripts/ci-release.sh` | move | `script/ci-release.sh` |
| `scripts/ga-remote-deploy.sh` | move | `script/ga-remote-deploy.sh` |
| `scripts/test-deployment.sh` | move | `script/test-deployment.sh` |

新增文件 / 新职责（含从旧源提前提取的唯一目标）：

| 目标 | 职责 | 验证 |
| --- | --- | --- |
| `script/check.ts` | 只读串行全门禁 | A71 |
| `docs/REQUIREMENTS.md` | Web正式工程规范及适配例外 | 规范与实际任务一致 |

<!-- FILE_TABLE_END -->

## 实施步骤

1. 接通并复核P010已实现的S02依赖/目录检查：解析alias、relative、type-only、再导出和静态dynamic import；拒绝兄弟私有/共享反向引用/生产引用测试；测试集成例外按精确入口判定。
2. 另扫字符串、生成HTML、Worker URL、脚本、配置和有效文档链接中的旧路径，区分本迁移文档中的历史证据，不用全仓文本禁止features一词。
3. 接通P010已实现的命名、具名导出、type/interface语义和400物理行检查；route/generated/story metadata工具例外集中清单化，保留类型与生成一致性检查。
4. route生成check复制route输入到临时目录，比较route-tree与被生成器可能改写的入口；check不改tracked文件。script采用跨平台Deno，Linux远程部署保持显式平台职责。
5. 接通S07统一任务和CI：精确Deno、冻结锁、格式/类型/lint/专项/generate/test、构建、Storybook与Worker真实浏览器、部署脚本回归及安全审计。
6. 更新AGENTS/REQUIREMENTS、shadcn alias、部署/发布命令及辅助文档；记录本次routes/Storybook/平台例外和用户已授权的迁移协作方式。旧FDD规范必须删除。

## 兼容要求

以 [兼容矩阵](../migration/compatibility-map.md) 和所引用 spec 为准；不改变本包未明确授权的后端协议、公开 URL 或用户数据格式。

## 验证

- [ ] 复核P010工程checker的正反fixture并补交付场景：相对路径越界、type-only越界、动态入口、合法route整合测试、生成文件例外。
- [ ] 在运行check前后比较git diff，证明生成与格式任务只读；验证Windows/macOS开发任务和Linux部署职责分离。
- [ ] test:script/test:storybook-start/test:compress-browser/test:bounded-browser、build/build-storybook、deno audit按S07执行。

## 完成标准

- [ ] 旧scripts路径、旧AGENTS模板和shadcn别名全部更新；所有命令文档可直接使用。
- [ ] 架构回退可被自动检测，规则没有靠排除手写源码获得通过。
- [ ] 不触发真实生产部署或发布；只验证脚本和构建，生产动作另遵现有流程。

## 风险与恢复

部署脚本字符串遗漏会让源码成功但CI发布失败。用现有部署mock测试验证路径、环境变量和release产物，不向生产发送探测性写入。

## 协作与执行记录

前置依赖未满足时禁止开始本包。此包涉及共同契约或全仓装配，按计划索引串行集成。

执行时在本节追加日期、实际提交、命令和退出码、发现/修复以及未完成项；不要预先勾选。

## 需求追踪

R1-01、R1-08、R2-02、R2-03、R2-10、R2-12、R3-01、R3-03、R3-05、R3-07、R3-08、R4-03、R4-05、R4-08、R4-11、R6-01、R6-03、R6-04、R6-05、R6-06、R6-07、R6-09、R6-16、R6-17、R6-18、R6-19、R6-20、R7-01、R7-03、R7-04、R7-08、R7-09、R7-11、R7-13。条款决定与验收证据见[需求矩阵](../requirements-matrix.md)和[覆盖审查](../review/coverage-matrix.md)。
