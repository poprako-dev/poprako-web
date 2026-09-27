# 迁移兼容映射

本表以 Web `68cedc0` 源码为依据；“保留”表示迁移验收承诺，不表示浏览器场景已经运行通过。
状态、请求和持久化细节以 [S04](../spec/04-state-and-data.md) 为权威，路由细节以
[S03](../spec/03-routing-and-navigation.md) 为权威。计划 ID 由 `plan/README.md` 统一索引。

## C01 — URL、查询参数与历史记录

源码依据：`src/router/index.ts`、`src/pages/TranslatorPage.tsx`、`src/pages/RootGuard.tsx`、
`src/features/ComicPlayground/features/ComicDetailModal/hook/useComicDetailHost.ts`。

| 现有入口/行为 | 处理 | 负责计划 | 验证 |
| --- | --- | --- | --- |
| `/login` | 保留公开登录入口、登录/注册流程与提示 | P002、P003 | 直达、刷新、登录成功与失败 |
| `/` | 保留根路由到 `/workspace` 的跳转及 auth 行为 | P003 | 首次访问、不额外增加 history |
| `/workspace` | 保留工作台及其详情入口 | P005 | 直接打开与 shell 导航 |
| `/comic-playground` | 保留漫画广场、作品集与筛选流程 | P005 | URL、列表、切换团队 |
| `/member-list` | 保留成员与邀请入口 | P006 | 直达、权限、提交失败 |
| `/system-mail` | 保留系统邮件入口与读取行为 | P006 | 列表、分页、读态 |
| `/utilities` | 保留工具页与本地文件操作 | P007 | 直达、浏览器能力不足提示 |
| `/settings` | 保留既有设置，新增主题选择为有意变更 | P006、P010 | 旧操作回归与三种主题 |
| `/translator/:chapterId/:pageId` | 保留全屏入口和动态参数；不渲染 shell 导航 | P003、P008 | 有/无身份、刷新、无效资源 |
| workspace / comic-playground 的 `comicId`、`chapterId` | 保留 query 驱动打开漫画/指定章节；关闭只删除这两个键，保留无关 query；open/close 使用 replace | P003、P004 | 深链接、关闭、后退与前进 |
| translator 的 `returnTo`、`comicId`、`chapterId` | 保留返回定位；仅 `returnTo=/workspace` 或 `/comic-playground` 且两个 ID 均存在时重建详情 URL，其余保持 history back | P003、P008 | 两入口返回；缺参数/无效 returnTo |
| translator 的 `readOnly=true` | 仅字面字符串 `true` 请求只读；其他值走权限自动模式，不授予额外能力 | P003、P008 | true/false/缺失/无权限 |
| 未匹配路径和路由加载失败 | 使用路由错误/未找到反馈，不静默渲染错误业务页面 | P003 | 未知路径、懒加载失败 |
| 浏览器刷新与静态托管回退 | 保留 Browser history 模式，服务器 SPA fallback 覆盖所有上述深链接 | P011、P012 | 生产构建直达深层 URL |

`_authenticated`、`_shell` 和 `business` 仅为组织和布局目录，不进入公开路径；生成 route ID
可以变化，既有外部链接不得要求使用者重写。

## C02 — 浏览器持久化

所有既有 key 和 payload 保留。调整代码所有权不能等同于删除数据或更换 key；新增主题为唯一
新增的持久化项目。存储读取失败的恢复行为由 S04/S05 定义，不引入自动清空全部 localStorage。

| key / 内容 | 当前依据 | 目标与有意变化 | 计划 / 验证 |
| --- | --- | --- | --- |
| `app-store` | `src/store/app.ts` 的 Zustand persist | 保留 `{state:{accessToken,selectedTeamId},version:0}` 既有 envelope；loginState、邮件缓存不持久化；store 移根业务 | P002；旧 JSON hydration、无成员/失效团队选择、刷新 |
| `specialChars_v2` | `src/hook/useSpecialChars.ts` | 保留 `{id,text,isFavorite}[]`；保留收藏、顺序与 `specialChars:change` 同页通知语义 | P008；旧值读取、编辑、多个消费者同步 |
| `configurableShortcuts` | `src/features/BaseTranslator/hook/useShortcuts.ts` | 保留现有快捷键对象数组与 action/key 表示，不因平台变更重写用户配置 | P008；自定义覆盖、重置、刷新、无效数据 |
| `translator:relocation-enabled` | `src/features/BaseTranslator/hook/useRelocationPreference.ts` | 保留字符串 `true`/`false`；缺失默认关闭，存储不可用时会话内可切换 | P008；偏好恢复与 storage 抛错 |
| `poprako:first-registration` | `src/features/FirstRegistrationGuide/storage.ts` | 保留字符串布尔值与首次注册引导；不因路由重挂载重复触发 | P003；首次注册、刷新、完成后重进 |
| 新增 `poprako:theme` | S05 新增契约 | 字符串 light/dark/system；默认 system，根 document 统一生效 | P010；首次、刷新、系统变化、非法值 |

测试环境使用独立 profile，逐项恢复上述键及对应 Zustand 内存状态；不以真实用户存储作为夹具。

## C03 — 会话、团队与业务权限

| 行为 | 处理 | 负责计划 | 验证 |
| --- | --- | --- | --- |
| token 自动加入业务请求 | 保留 Bearer 和公开请求免鉴权语义；shared HTTP 通过根业务装配凭据，不反向 import store | P002 | util 请求契约测试 |
| AppLayout / TranslatorPage 独立 bootstrap | 有意合并为共同父 route 会话 bootstrap；保留失败回 `/login`，不引入新的认证产品流程 | P002、P003 | 并发进入、失败、已加载、logout 后迟到结果 |
| selectedTeamId | 保留已选择且属于当前成员列表的团队，否则首个成员团队或 null；切换后不能显示旧团队响应 | P002、P005、P006 | 多团队、零成员、移除权限、迟到请求 |
| 在线租约 | 根会话 scope 持有，shell 与 translator 切换不人为中断；注销清理 | P002 | 导航、卸载和取消 |
| 漫画详情当前成员 | 根据漫画所属团队确定身份，不能直接将全局选中团队权限套到另一漫画 | P004 | 跨团队深链接与分工查询 |
| 工作流推进/回退 | 有意修正两入口的回退差异：推进发送 advance，回退发送 revert；不将工作台错误的 advance 载荷当作兼容承诺 | P004 | 两入口分别执行推进/回退并断言真实请求载荷 |
| translate / proofread / readOnly | 保留校对优先、翻译次之、始终可选只读的模式顺序，权限决定可写能力 | P008 | access 现有测试及实际按钮/输入禁用 |
| 系统邮件缓存 | 迁到共同 shell 的 mail store；非持久化并按会话身份隔离 | P002、P006 | 重进页面保留、换账号不泄漏、标记已读 |
| 上传存活范围 | 队列跨 shell→translator 导航存活；logout/身份变化由 runtime 订阅根会话自行取消，根不能反向 import 子业务 | P002、P004 | 导航不中断、注销后停止与旧回调抑制 |

## C04 — 翻译保存与导航协议

依据 `src/features/WebTranslator/api/translator.ts`、`src/features/BaseTranslator/hook/unitSaveController.ts`、
`unitSaveMerge.ts`、`unitDiff.ts`、`editedPageNavigation.test.ts` 和相关现有单测。

| 协议/行为 | 保留约束 | 负责计划 / 验证 |
| --- | --- | --- |
| 保存路径与载荷 | `POST /pages/{pageId}/units/save?save_id={saveId}`，继续 `wrapUnitDiff` 的增量操作 wire shape，不换成本地项目全量保存 | P008；HTTP adapter 契约 |
| 每批 saveId | 每个待确认批次 ID 稳定，失败重试复用；不是每次重试重新生成 UUID | P008；失败后重试与重复响应 |
| 批量限制 | 保留 controller 每批最多 100 操作及顺序语义 | P008；跨批创建/引用/删除 |
| 创建映射 | `created_unit_ids` 的 local_id/unit_id 必须有效且覆盖预期创建；未确认身份不能继续发送错误引用 | P008；漏项、非法映射和冲突 |
| 编辑中返回响应 | 合并已保存基线与继续编辑的草稿，不能用服务器响应覆盖用户后续输入 | P008；AutoSaveRace、controller 竞态 |
| 保存成功后刷新失败 | 区分写入失败与刷新失败，不重放已经确认成功的写入 | P008；refreshError 与重试路径 |
| 翻页、退出、完成阶段 | 按既有 pending/dirty 协调先处理保存，保留失败提示与输入；迟到旧页响应不覆盖新页 | P008；导航生命周期集成测试 |
| 保存测试夹具 | 抽离 Storybook runtime 但保留 saveId 收据与 ID 映射，不能用无条件成功 mock 替代 | P009；纯 Node controller 测试 |

## C05 — 上传、导入导出与 Worker

| 行为 | 保留与迁移要求 | 计划 / 验证 |
| --- | --- | --- |
| 页面上传队列 | 保留默认并发 4、PUT/mark 各最多 3 次尝试、章节分配顺序和同页任务顺序；去重/取消/进度/失败反馈语义保持 | P004；pageUpload 现有单测 + 导航存活 |
| 页面哈希 | `new Worker(new URL("pageHash.worker.ts", import.meta.url))` 更新为新 kebab-case 路径，构建产物真实执行 | P004；批量上传与生产 Worker |
| 压缩 Worker | `src/lib/compress.ts` 的相对 archive Worker URL 随 shared utility 迁移；node-liblzma/WASM 资源、优化排除和加载策略保留功能 | P001、P007；真实生产构建压缩/解压 |
| 工具页本地文件 | 保留 ZIP/TAR.XZ/定界压缩输入限制、文件排序、命名与输出格式；不把本地处理上传后端 | P007；archive/boundedImages 单测与浏览器脚本 |
| OPFS 临时文件 | 保留浏览器不支持时的说明、取消清理与下载 URL 撤销；不把临时文件当持久项目数据 | P007；成功/失败/取消与多次操作 |
| 漫画/翻译导入导出 | 保留现有格式、图像命名与缓存规避参数 `_download_bust`，失败不能给出成功文件 | P004、P008；现有导出命名测试及导入场景 |
| 脚本内嵌入口 | 更新 test-bounded-browser.mjs 生成 HTML 中 `/src/features/...`、test-compress-browser.mjs 中 `/src/lib/compress.ts` 和旧 CSS；静态 import 扫描不足 | P007、P011；旧路径文本检查与真实构建 |

## C06 — 布局、链接与部署

| 项目 | 处理 | 计划 / 验证 |
| --- | --- | --- |
| 最新 translator 布局 | 保留比例 sidebar、竖屏高度、0.95 图像上限、可分离特殊字符条、显式换行和编辑区 resize，详见 S05.6 | P008、P010、P012；330/360/420 和横竖屏 |
| 主题 | 有意新增设置选择并补齐暗色；保留现有层级、布局和柔和美学 | P010；S05 主题矩阵 |
| 教程与致谢外链 | 保留 `https://tutorial.poprako.com` 和 Settings/AcknowledgementsFooter 中有效项目/作者链接及新窗口安全属性 | P003、P006；链接 DOM 属性 |
| Storybook 外部图片 | 有意将 Unsplash/Dicebear 测试夹具替换为本地资源；产品真实图片来源不受影响 | P009；无远程夹具网络 |
| `VITE_API_BASE_URL` | 保留变量名称、构建时注入和缺省 `/api/v1`；本地 `/api` 代理到 localhost:8888 的既有行为 | P001、P011；环境装配与请求路径 |
| 发布/部署环境 | 保留 DEPLOY_HOST/USER/PORT/ROOT/SHA/HEALTHCHECK_URL/SSH_PRIVATE_KEY/KNOWN_HOSTS，RELEASE_DIR/SHA/TAG；生产 API 地址校验仍为 `https://api.poprako.com/api/v1` | P011；已有 deployment 脚本测试，不实际部署 |
| 脚本路径 | `scripts`→`script` 是有意变更，同步 package/deno tasks、CI、发布脚本和文档；不保留旧兼容转发文件 | P011；全仓引用和 dry-run |
| 静态发布和许可证 | 保留 Web dist、静态站点发布流程、现有 MIT；不引入 Tauri 打包、SQLite、IPC 或 Native AGPL 许可替换 | P011、P012；产物结构、元数据与文档 |

## C07 — 关闭兼容清单的证据

P012 对每行记录执行命令或操作、结果、产物位置和未覆盖原因。仅有类型检查不能关闭 URL、
持久化、Worker、焦点或浏览器布局条目。实施时如需改变本表的“保留”承诺，必须先更新
decision-register 与相关 spec、plan，不以重构附带变化的方式默默改变产品。
