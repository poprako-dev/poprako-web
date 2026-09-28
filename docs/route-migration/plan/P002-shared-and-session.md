# P002 — 建立 shared 基础与根会话业务

计划状态：ready（设计）；实施状态：not-started。
前置工作包：P001

负责人：基础与会话负责人；独占 shared、根 routes/business、application 配置装配。

## 目标与范围

通用能力与根业务有明确位置，Zustand 会话和 HTTP adapter 可被新路由复用；原持久化数据兼容。

## 依据与开始条件

- [S02](../spec/02-structure-and-dependency.md)
- [S04](../spec/04-state-and-data.md)
- 基线无未识别变化；前置包的开始/完成门禁已经核实，新的失败有负责人与阻断范围。
- 用户已授权本次迁移；若执行者只接到文档任务，不得将本计划误当已开始的生产变更。

## 文件范围

原 components/ui、lib、utils、config、根 auth/user/member/team 共享类型和请求、store/app、身份相关 hooks。具体每个输入与目标以本包迁移清单为准；工具压缩能力迁 shared，业务工具页面仍归 P007。

精确输入与去向见 [file-map.csv](../migration/file-map.csv) 中 plan=P002 的行。后续收敛修改遵循本节明确范围。

<!-- FILE_TABLE_START -->

基线文件：68 项。附表生成自迁移清单；以 source 为责任身份。

| 原文件 | 动作 | 最终去向 |
| --- | --- | --- |
| `src/api/auth.ts` | move | `src/routes/business/identity/auth-request.ts` |
| `src/api/member.ts` | move | `src/routes/business/identity/member-request.ts` |
| `src/api/persist.ts` | merge | `src/routes/business/session/session.ts` |
| `src/api/sysMail.ts` | move | `src/routes/_authenticated/_shell/business/mail/sys-mail-request.ts` |
| `src/api/team.test.ts` | move | `src/routes/business/identity/team-request.test.ts` |
| `src/api/team.ts` | move | `src/routes/business/identity/team-request.ts` |
| `src/api/user.test.ts` | move | `src/routes/business/identity/user-request.test.ts` |
| `src/api/user.ts` | move | `src/routes/business/identity/user-request.ts` |
| `src/api/util.test.ts` | split | `src/shared/utility/http.test.ts`<br>`src/routes/business/request.test.ts` |
| `src/api/util.ts` | split | `src/shared/utility/http.ts`<br>`src/shared/utility/result.ts`<br>`src/routes/business/request.ts`<br>`src/routes/business/request-error.ts` |
| `src/components/ui/AppDialog.tsx` | move | `src/shared/component/AppDialog.tsx` |
| `src/components/ui/ConfirmDialog.tsx` | move | `src/shared/component/ConfirmDialog.tsx` |
| `src/components/ui/HoverSelect/HoverSelect.tsx` | move | `src/shared/component/hover-select/HoverSelect.tsx` |
| `src/components/ui/HoverSelect/index.ts` | delete | 删除；理由见清单 |
| `src/components/ui/HoverSelect/types.ts` | move | `src/shared/component/hover-select/hover-select-type.ts` |
| `src/components/ui/IconInputRow.tsx` | move | `src/shared/component/IconInputRow.tsx` |
| `src/components/ui/LoadingCircle.tsx` | move | `src/shared/component/LoadingCircle.tsx` |
| `src/components/ui/MultiProgressBar.tsx` | move | `src/shared/component/MultiProgressBar.tsx` |
| `src/components/ui/NotificationToast/NotificationToast.tsx` | move | `src/shared/component/notification-toast/NotificationToast.tsx` |
| `src/components/ui/NotificationToast/hooks.test.ts` | move | `src/shared/component/notification-toast/toast-store.test.ts` |
| `src/components/ui/NotificationToast/hooks.ts` | move | `src/shared/component/notification-toast/toast-store.ts` |
| `src/components/ui/NotificationToast/index.ts` | delete | 删除；理由见清单 |
| `src/components/ui/NotificationToast/types.ts` | move | `src/shared/component/notification-toast/notification-toast-type.ts` |
| `src/components/ui/Paginator.tsx` | move | `src/shared/component/Paginator.tsx` |
| `src/components/ui/button.tsx` | move | `src/shared/component/Button.tsx` |
| `src/config/config.ts` | move | `src/routes/business/configuration.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/pageHash.ts` | move | `src/shared/utility/hash/image-hash.ts` |
| `src/features/ComicPlayground/features/ComicDetailModal/pageHash.worker.ts` | move | `src/shared/utility/hash/image-hash-worker.ts` |
| `src/features/FirstRegistrationGuide/storage.test.ts` | move | `src/routes/business/onboarding/storage.test.ts` |
| `src/features/FirstRegistrationGuide/storage.ts` | move | `src/routes/business/onboarding/storage.ts` |
| `src/features/LoginCard/api/auth.ts` | move | `src/routes/business/identity/registration-request.ts` |
| `src/features/ToolboxDropdown/components/ui/ToolboxDropdown.tsx` | move | `src/shared/component/toolbox-dropdown/ToolboxDropdown.tsx` |
| `src/features/ToolboxDropdown/index.ts` | delete | 删除；理由见清单 |
| `src/features/ToolboxDropdown/types/types.ts` | move | `src/shared/component/toolbox-dropdown/toolbox-option.ts` |
| `src/hooks/useActiveTeam.ts` | move | `src/routes/business/session/use-active-team.ts` |
| `src/hooks/useLongPress.ts` | move | `src/shared/hook/use-long-press.ts` |
| `src/hooks/useRefreshLoginState.ts` | move | `src/routes/business/session/use-refresh-session.ts` |
| `src/hooks/useTeamOnline.ts` | split | `src/routes/business/session/use-team-online-lease.ts`<br>`src/routes/_authenticated/_shell/workspace/business/online/use-online-users.ts` |
| `src/lib/compress.ts` | move | `src/shared/utility/compress.ts` |
| `src/lib/compress/README.md` | move | `src/shared/utility/compress/readme.md` |
| `src/lib/compress/archive.worker.ts` | move | `src/shared/utility/compress/archive-worker.ts` |
| `src/lib/compress/core.test.ts` | move | `src/shared/utility/compress/core.test.ts` |
| `src/lib/compress/core.ts` | move | `src/shared/utility/compress/core.ts` |
| `src/lib/compress/streams.ts` | move | `src/shared/utility/compress/streams.ts` |
| `src/lib/compress/types.ts` | move | `src/shared/utility/compress/types.ts` |
| `src/lib/compress/xz.ts` | move | `src/shared/utility/compress/xz.ts` |
| `src/lib/consoleLog.ts` | move | `src/shared/utility/console-log.ts` |
| `src/lib/keyboard.test.ts` | move | `src/shared/utility/keyboard.test.ts` |
| `src/lib/keyboard.ts` | move | `src/shared/utility/keyboard.ts` |
| `src/lib/utils.ts` | move | `src/shared/utility/utils.ts` |
| `src/store/app.ts` | split | `src/routes/business/session/session-store.ts`<br>`src/routes/_authenticated/_shell/business/mail/mail-store.ts` |
| `src/types/auth.ts` | move | `src/routes/business/identity/auth.ts` |
| `src/types/image.ts` | move | `src/routes/business/identity/image.ts` |
| `src/types/loginState.ts` | move | `src/routes/business/identity/login-state.ts` |
| `src/types/member.ts` | move | `src/routes/business/identity/member.ts` |
| `src/types/raw/auth.ts` | move | `src/routes/business/identity/raw-auth.ts` |
| `src/types/raw/formatResp.ts` | move | `src/shared/utility/http-response.ts` |
| `src/types/raw/image.ts` | move | `src/routes/business/identity/raw-image.ts` |
| `src/types/raw/member.ts` | move | `src/routes/business/identity/raw-member.ts` |
| `src/types/raw/sysMail.ts` | move | `src/routes/_authenticated/_shell/business/mail/raw-sys-mail.ts` |
| `src/types/raw/team.ts` | move | `src/routes/business/identity/raw-team.ts` |
| `src/types/raw/user.ts` | move | `src/routes/business/identity/raw-user.ts` |
| `src/types/role.ts` | move | `src/routes/business/identity/role.ts` |
| `src/types/sysMail.ts` | move | `src/routes/_authenticated/_shell/business/mail/sys-mail.ts` |
| `src/types/team.ts` | split | `src/routes/business/identity/team.ts`<br>`src/routes/business/identity/raw-team.ts` |
| `src/types/user.ts` | move | `src/routes/business/identity/user.ts` |
| `src/types/utils/result.ts` | merge | `src/shared/utility/result.ts` |
| `src/utils/url.ts` | move | `src/shared/utility/url.ts` |

新增文件 / 新职责（含从旧源提前提取的唯一目标）：

| 目标 | 职责 | 验证 |
| --- | --- | --- |
| `src/routes/business/session/session.test.ts` | 单次身份恢复与代次隔离 | SD-01;SD-02;SD-03 |
| `src/routes/business/session/session-persistence.test.ts` | app-store兼容载入/写入 | SD-01;SD-07 |
| `src/routes/business/session/online-lease.test.tsx` | 租约跨布局与清理 | SD-10 |
| `src/routes/_authenticated/_shell/business/mail/mail-store.test.ts` | 会话绑定及已读状态 | SD-04 |
| `src/shared/utility/http.test.ts` | 纯transport无业务依赖的HTTP边界 | SD-08 |

<!-- FILE_TABLE_END -->

## 实施步骤

1. 按 S02 移动通用 UI、压缩/哈希/键盘/URL 工具及业务无关 hook，使用具名导出与规范名称；保留必要的 worker 相对地址和资源导入。迁移每批立即改所有调用点，不创建旧路径转发文件。
2. 拆开通用 transport 与根 request adapter：shared 接受请求配置，不读会话；根 adapter 读取 token、base URL 和处理422策略。保留 Result/HTTP元信息、incl重复参数、204、超时和预签名上传语义。
3. 根 identity 持有用户、成员、团队、角色数据和 raw 转换；去掉业务数据声明反向调用 raw mapper 的关系。用实际消费图决定根契约，不能将所有类型搬入根identity。
4. 实现 S04 指定 beginSession/ensureSession/refreshSession/selectTeam/clearSession；Zustand 保留 app-store key与payload，初始化promise按会话代次去重，迟到结果不覆盖新会话。
5. 将 sysMail 请求、raw/值类型和非持久化 mail store 一次迁入 shell/business/mail，更新全部消费者；P003负责预取/角标装配，P006负责viewer。将 toast store 与通用通知 UI 放 shared；会话身份失效提供可订阅数据变化，根不导入上传或邮件实现。首次引导存储操作放根，界面等待 P003。
6. 在线租约放根会话业务，保留翻译器内续租和清理；工作区在线列表保留到 P005。逐个替换既有 getState/selectors 引用，保留未迁移业务可使用新路径。

## 接口与空值语义修正

逐个审查本包全部生产组件及实际调用方，按S02.8/S04-08修正不必要的optional/null、重复判空和无意义fallback。必需数据与动作收紧契约；合理默认值在所属边界集中；真实空状态与互斥模式显式建模。同步修改受影响的跨包调用方，由集成负责人协调共享文件，不保留临时宽接口。

结果写入[接口审查记录](../review/interface-audit.md)，逐项保留调用方与验证证据。

## 兼容要求

以 [兼容矩阵](../migration/compatibility-map.md) 和所引用 spec 为准；不改变本包未明确授权的后端协议、公开 URL 或用户数据格式。

## 验证

- [ ] 运行 SD-01/02/03/07/08/10 对应 unit/RTL测试：旧persist载入、代次隔离、角色与团队推导、422去重、无Bearer预签名上传。
- [ ] 运行通用压缩/keyboard/toast现有测试；检查source/stories/scripts字符串入口中的路径同步。
- [ ] 执行typecheck与新目标目录lint；全仓剩余诊断继续关联后续工作包。

## 完成标准

- [ ] 本包接口审查和受影响调用方已完成；IC-01至IC-04在本包范围内无未处理项，不能仅以类型检查通过代替。
- [ ] 旧顶层共享目录中本包负责的文件已移除，无旧路径兼容桶。
- [ ] shared无route依赖；根身份不依赖受保护子路由。
- [ ] 旧凭据、团队选择、首次引导格式无需清空即可读取。

## 风险与恢复

鉴权transport拆分或storage格式变化影响全部路由。先保留输入输出契约测试，再切换导入；恢复时成组撤回调用点与存储实现，不清除用户数据。

## 协作与执行记录

前置依赖未满足时禁止开始本包。此包涉及共同契约或全仓装配，按计划索引串行集成。

执行时在本节追加日期、实际提交、命令和退出码、发现/修复以及未完成项；不要预先勾选。

## 需求追踪

R1-04、R2-01、R2-02、R2-04、R2-05、R2-08、R2-09、R2-11、R2-13、R2-14、R3-01、R3-04、R3-09、R4-01、R4-02、R4-04、R4-06、R5-03、R5-07、R6-12、R7-05、R7-06、R7-07、R7-12。条款决定与验收证据见[需求矩阵](../requirements-matrix.md)和[覆盖审查](../review/coverage-matrix.md)。
