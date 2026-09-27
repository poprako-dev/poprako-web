# S04 — 状态、请求与数据契约

状态：ready（设计已确定；生产实现未开始）。基线见 [baseline](../baseline.md)。
负责计划：P002、P004、P005、P006、P008；验证由 P009、P012 汇总。

## S04-01 状态选择与归属

保留 Zustand 5.0.15。React 持有单处交互的临时状态，Zustand 持有需要跨组件订阅的客户端状态；
已有保存 controller 保持自己的状态机。本次不引入 TanStack Query，也不把全部 React 状态转换为 store。
目录决定知识归属，运行时生命周期由下面的表决定，不能用 route 卸载自动推断任务结束。

| 状态 | 目标所有者 | 生命周期与权威来源 |
| --- | --- | --- |
| accessToken、loginState、selectedTeamId | `routes/business/session/session-store.ts` | 应用会话；仅 token、team 选择持久化；成员和用户由登录态加载流程更新 |
| 身份初始化中的请求和代次 | `routes/business/session/session.ts` | 每次凭据代次一个初始化 promise；过时代次不得提交 |
| 系统信箱及 unread 派生值 | `_authenticated/_shell/business/mail/mail-store.ts` | 内存中按会话代次归属；导航期间保留，换身份清空；unread 从邮件推导 |
| 上传队列、任务进度、章节 revision | `_shell/business/comic-detail/upload/` | 应用进程中的当前身份；关闭弹窗或进入翻译器继续运行，退出登录时取消 |
| toast | `shared/component/notification-toast/toast-store.ts` | 应用级业务无关反馈；不持久化；不读取会话/路由 |
| 编辑草稿、baseline、保存批次、ID 映射 | `translator/business/persistence/` | 一个章节编辑实例；沿用保存 controller，销毁前遵守既有保存/放弃交互 |
| 当前页面、选中单元、编辑模式、面板开关 | `translator/business` | 翻校实例；展示读取 controller 的权威编辑快照，不另设独立持久化副本 |
| 特殊字符、快捷键、重定位偏好 | `translator/business/preference/` | 浏览器用户偏好；保留现有 key、序列化形状与加载迁移规则 |
| 主题选择 | `shared/utility/theme.ts` + `application/ThemeProvider.tsx` | `poprako:theme`，`light / dark / system`，默认 system |
| 首次引导标记 | `routes/business/onboarding/` | `poprako:first-registration`；登录与 shell 共用存储操作；引导界面在 shell |
| 在线租约 | `routes/business/session/` | 登录会话范围，包含全屏翻译器；不可缩短为 shell 生命周期 |
| 工作区在线成员展示 | `workspace/business` | 当前 team 的请求结果；team 变化使旧结果失效 |

表中缩写路径以 `src/routes/` 为根，`_shell` 指 `_authenticated/_shell`；完整路径以迁移清单为准。

## S04-02 会话 module 的 interface

`session-store.ts` 保存数据与同步状态操作，`session.ts` 组织请求和失效。
对 route 的使用 interface 固定为以下职责；使用具名导出的普通函数，并明确返回类型：

| 操作 | 输入 / 输出 | 必须隐藏的实现约束 |
| --- | --- | --- |
| `beginSession` | `accessToken: string` → `void` | 原子切换 token、清空旧 loginState、推进会话代次；保留待校验的团队选择 |
| `ensureSession` | 无参数 → `Promise<LoginState>` | 已就绪返回同一份数据；同代次并发初始化复用 promise；加载当前用户后再加载其成员 |
| `refreshSession` | 无参数 → `Promise<Result<LoginState>>` | 重读用户/成员；保留失败元信息；旧代次结果不得覆盖当前身份 |
| `selectTeam` | `teamId: string` → `void` | 只接受当前 memberInfos 中的团队；activeMember、activeTeam 由选择与成员表推导 |
| `clearSession` | 无参数 → `void` | 原子清空 token、loginState、selectedTeamId，推进代次，使订阅者失效 |

`LoginState`、用户、成员、团队和角色数据契约放根 `business/identity`；它们被会话恢复和受保护业务共同使用。
`Result` 与不含业务数据的错误元信息放 `shared/utility/result.ts`。
会话代次是内存实现细节，不写入 localStorage，不使用 token 内容作为日志或缓存标签。

登录成功由 `beginSession` 建立新代次；受保护父 route 调用 `ensureSession`。
迁移保留现有初始化失败跳转 `/login` 的外部行为，错误不能被吞掉或伪造为成功。
定时续租和上传的异步失败必须完成各自的诊断与恢复反馈。

刷新成功后：原 selectedTeamId 仍在成员表中则保留，否则选第一项，无成员则为 null。
不同入口不再各自执行用户→成员初始化，不在 React Effect 中复制可直接推导的 activeTeam。

## S04-03 生命周期、失效与依赖方向

上传 runtime 首次创建时订阅根会话的失效代次；一旦身份变化，取消 queued/running 任务、abort 请求、
停止提交确认结果并清空对应进度。上传 module 自行处理失效，根会话不能 import shell 上传代码。
晚到回调必须检查所属代次；不能在新用户界面写入上一身份的任务结果。

邮件 store 同样持有所属代次，身份变化清空；首次进入 shell 初始化，整个会话的 shell 导航复用。
订阅注册不得每次渲染累积；模块级订阅提供测试清理机制。测试/Storybook 每例创建或重置独立状态。

登出沿用既有远端 logout 调用；无论远端成功与否，最终清理本地身份并导航 `/login`。
本地 clearSession 触发子业务自行取消和清理，保证根依赖方向不倒置。远端错误仍有可理解提示及诊断。
浏览器刷新后上传文件对象与在途任务不恢复；不得将 File、AbortController 或待确认提交写入 persist。

## S04-04 持久化兼容

| key | 迁移要求 |
| --- | --- |
| `app-store` | 保留 Zustand persist 外层格式及现有版本值；`state` 仍仅持久化 accessToken、selectedTeamId |
| `specialChars_v2` | 保留字符 id/text/isFavorite 列表、排序及收藏语义 |
| `configurableShortcuts` | 保留 action/label/keys 兼容读取与已有旧记录迁移逻辑 |
| `translator:relocation-enabled` | 保留字符串 true/false 语义与默认关闭 |
| `poprako:first-registration` | 保留现有标记读写语义；不因换目录重新显示首次引导 |
| `poprako:theme` | 新增独立偏好；缺失或非法值使用 system，不覆盖其他 key |

本次只改代码存放方式，不删除用户存储来规避兼容问题。对未知 JSON 使用 unknown 收窄；
坏数据采用对应现有默认值，不能让整个应用启动失败。存储不可用时保持本次会话内可用的偏好状态。
Windows/macOS 与跨标签页事件处理由同一实现负责，不依赖开发者路径。

凭据继续采用 Web 当前的 Bearer + 浏览器持久化方案，作为 Native 系统凭据存储要求的显式平台适配；
迁移不改变服务器会话协议或添加桌面凭据依赖。日志不记录 token、密码或完整请求载荷。

## S04-05 HTTP module 与业务 adapter

通用传输在 `shared/utility/http.ts`：负责 fetch、查询序列化、超时/取消传递、响应 envelope、HTTP 元信息。
其 interface 接收请求地址、headers、signal 等传输数据；不 import session、route 或业务类型。
调用方注入鉴权 header；`credentials: omit`、默认 `/api/v1`、重复 incl 参数与 null 处理保留现有契约。

`routes/business/request.ts` 是业务 HTTP adapter：读取当前会话凭据、应用 VITE_API_BASE_URL、
集中处理现有 422 提示去重策略。具体漫画/章节/工作区请求放所属业务目录。
共享 transport 只返回结构化失败；显示策略由业务 adapter/调用入口完成，避免重复 toast。

HTTP 失败仍以 `Result<T>` 携带 `error` 与 `httpStatus`。需要抛出时使用保留元信息的请求错误，
禁止 `throw new Error(result.error)` 丢掉分类。204、非 JSON、非零业务 code、超时和 abort 均有明确分支。
继续支持已有调用者的 Result 与 throwing adapter；本次不把所有请求强制转换成一种交互方式。
不可恢复错误保留用户提示和脱敏诊断，已报告错误向上传递时不重复记录同一载荷。

Raw snake_case 在具体请求返回处转换为业务 camelCase。转换器与所属协议同地；
业务数据类型不反向 import raw 转换器。合并现有 `ComicInfo → raw/comic → ComicInfo` 的双向关系：
数据声明只依赖数据声明，请求 adapter 单向依赖两者并执行转换。

预签名 URL 上传单独使用上传 transport，不携带业务 Bearer、应用 base URL 或默认 JSON header。
哈希与通用文件处理可以复用 shared，页面分配、任务确认及团队权限仍留业务 implementation。

## S04-06 翻校与后台任务约束

保留 `UnitDiff` 的 create/patch/delete、Patch skip/clear/assign、saveId 幂等重试、临时 ID→服务端 ID 映射、
保存后 reload/merge、编辑中继续输入、失败保留草稿和只读权限判断。Native 的整页快照保存协议不移植到 Web。

controller 是保存快照的权威来源；React 展示镜像只能由 controller 的通知更新，禁止另一条独立编辑写入路径。
自动保存、翻页、退出、批量替换都经过现有保存/排他流程。拆分大文件按职责进行，不能借拆分重写保存算法。
翻译/校对权限取章节 assignment；详情操作权限取漫画所属团队，不能以 selectedTeamId 替代。

页面加载与图片预加载保留取消、generation 检查及原图降级行为。Worker 返回、上传确认、保存刷新均检查资源身份，
不能让上一章节/上一会话的迟到结果更新当前展示。Blob/object URL 在其现有消费者释放后回收。

## S04-07 验收矩阵

| 编号 | 场景 | 预期 |
| --- | --- | --- |
| SD-01 | 旧 app-store 启动、直达翻译器 | 读取原凭据/团队，一次初始化，URL 与全屏保持 |
| SD-02 | 两次并发 ensureSession，期间更换身份 | 旧请求不提交，新身份独立就绪 |
| SD-03 | 当前团队被移除、无成员、手动切换团队 | 保留合法选择/回退第一项/null，派生状态一致 |
| SD-04 | 邮件已读、shell 导航、退出再登录另一身份 | 已读同步，正常导航保留，身份变化无旧邮件 |
| SD-05 | 上传时关闭详情、进入翻译器、再返回 | 原任务继续，进度可重新订阅，无重复启动 |
| SD-06 | 上传期间登出，确认响应随后返回 | 所有任务取消，旧确认不更新新会话 |
| SD-07 | 旧偏好、坏 JSON、存储不可写 | 兼容旧数据；失败时可恢复，不清空无关 key |
| SD-08 | 422、204、非 JSON、超时、预签名上传 | 提示不重复、元信息保留、上传无 Bearer 泄漏 |
| SD-09 | 保存中编辑/重试/翻页/退出/只读/替换 | 现有 controller 与用户可见行为回归通过 |
| SD-10 | 翻译器停留超过续租周期 | 在线租约仍运行；登出后停止并清理监听 |

已有证据：`src/store/app.ts`、`src/api/util.ts`、`src/hooks/useTeamOnline.ts`、
`src/features/Settings/SettingsPanel.tsx`、`src/features/BaseTranslator/hook/useUnitPersistence.ts`、
`src/features/ComicPlayground/features/ComicDetailModal/pageUpload.ts`。
这些是迁移前路径；目标查 [file-map](../migration/file-map.csv)，外部兼容查 [compatibility-map](../migration/compatibility-map.md)。
