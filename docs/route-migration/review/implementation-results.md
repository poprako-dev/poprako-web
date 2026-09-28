# 实施结果与验收证据

2026-09-28，基线 `0fd3646`，分支 `refactor/routing`。R001–R007 已实施；R008 本机验收通过。未提交、推送或远程部署。

## 实际重构

- 源码以 `src/route/**/business` 归属业务，共同业务归共同父路由。独立 `src/api`，通用 `src/shared`，单数目录；没有 features、utilities 或复数业务分层。
- 85 个实际 API 操作进入独立 API 模块，无 route/store/React 反向依赖。传输注入 token、fetch 和身份版本；统一 `toCamelCase`/`toSnakeCase`，保留预签名 headers 原键与枚举值。HTTP/业务错误、超时、取消、文本导出和预签名上传有独立边界。基线生产调用按方法与路径核对，遗漏为零；其余 18 个服务端接口没有原 Web 生产调用，未擅自新增功能。
- 父认证路由建立 ready-session。页面直接消费有效身份；团队成员中的 team 必需。旧 `app-store` 持久化格式保留。会话代次隔离恢复、401、邮件、在线租约及上传；同 token 的新登录也不会被旧请求清除。
- 漫画详情公开入口收敛为六项 Props，`use-detail-resource` 自己负责查询、权限及修改；Workspace/ComicPlayground 不再分别注入整套加载/修改回调。详情内部核心动作改为必填。章节仅使用真实 `stages`，成员/分工使用真实 roles 位字段，删除虚构时间戳和双轨状态。
- 翻校编辑、保存、图像、术语和搜索边界独立。保存 saveId/临时 ID/skip-clear-assign 保留。列表使用显式 editing 能力，缺失权限或空列表不提供批量校对成功假象。
- 受控输入、确认框、分页和就绪页面收紧 Props；保留真实未选中、无成员权限、未加载及合法展示默认值。172 个组件的定义/调用点清单和契约复核见 [接口审查](interface-audit.md)。
- 仅浅色主题。删除主题选择、系统监听、主题存储和暗色分支；语义颜色统一，保留翻校标记的业务颜色。可访问性测试修复了详情滚动区域无法键盘聚焦的问题。
- Deno 2.9.6，Native 适用工具链规则，Zustand/Storybook 保留，Vitest 4.1.11 为用户批准的安全例外。目录、400 行、依赖方向、循环、API 边界、颜色和测试归属加入门禁。

## 最终本机验证

| 检查                              | 结果                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| `deno task check`                 | 退出码 0：格式、全部 TypeScript 工程、Lint、结构、生成一致性和下列测试                  |
| 单元测试                          | 62 文件，277 项通过                                                                     |
| React/路由/会话集成               | 5 文件，22 项通过；含真实 Zustand 持久化恢复和退出                                      |
| Storybook Chromium                | 39 文件，183 项通过；含只读校对能力及 a11y                                              |
| Deno 工程脚本测试                 | 30 项通过                                                                               |
| 测试发现                          | 116 个 test/spec/story 文件各属于唯一 runner                                            |
| `deno task build`                 | 通过                                                                                    |
| `deno task build-storybook`       | 通过                                                                                    |
| `deno task test:compress-browser` | 36 文件、794,784,216 字节，全部 SHA256 校验通过；取消、背压、截断检测和 Worker 回收通过 |
| `deno task test:bounded-browser`  | 通过                                                                                    |
| `sh script/test-deployment.sh`    | 本地发布包、幂等切换、健康检查和回滚夹具通过                                            |

原始本机日志：`/tmp/final-check.log`、`/tmp/final-build.log`、`/tmp/final-story-build.log`、`/tmp/final-compress.log`、`/tmp/final-bounded.log`、`/tmp/final-deploy.log`。

## 验证边界

本机为 macOS/Chromium 153。Windows/macOS CI 矩阵与 Linux 部署流程已配置，但没有触发远端 CI；Firefox/WebKit 和最低浏览器版本未在本次实测。关键页面懒加载已补正：主入口 905.90 → 303.18 KB（gzip 300.02 → 99.03 KB），无超大 chunk 提示；详见 [懒加载修复](route-lazy-loading.md)。浏览器测试使用本地 API 夹具，未连接真实账号/backend。

Vitest 4.1.11 安全例外见 D21；之前冻结审计结果无已知漏洞，本轮未重复联网审计，不将旧审计冒充当前重复验证。已有用户测试资源已保留。
