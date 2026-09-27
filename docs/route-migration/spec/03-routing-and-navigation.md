# S03 · 文件路由、导航与URL兼容

状态：目标 spec。依据现有 `src/router/index.ts`、`TranslatorPage.tsx`、`AppLayout.tsx`、`RootGuard.tsx`、`LoginCard.tsx` 和 `useComicDetailHost.ts`；本阶段未迁移运行代码。

## S03.1 路由表

| 文件（相对src/routes） | 公开URL | 行为 |
| --- | --- | --- |
| `__root.tsx` | 无新增段 | 根Outlet、统一错误/未找到呈现、会话生命周期装配 |
| `login/index.tsx` | `/login` | 登录/注册；成功replace到`/comic-playground` |
| `_authenticated/route.tsx` | 无路径 | 等待身份恢复，失败replace到`/login` |
| `_authenticated/_shell/route.tsx` | 无路径 | 侧栏/移动导航、首次引导、邮件预取 |
| `_authenticated/_shell/index.tsx` | `/` | replace到`/workspace` |
| `_authenticated/_shell/workspace/index.tsx` | `/workspace` | 工作台；query驱动详情 |
| `_authenticated/_shell/comic-playground/index.tsx` | `/comic-playground` | 漫画管理；query驱动详情 |
| `_authenticated/_shell/member-list/index.tsx` | `/member-list` | 成员管理 |
| `_authenticated/_shell/system-mail/index.tsx` | `/system-mail` | 系统邮件 |
| `_authenticated/_shell/utilities/index.tsx` | `/utilities` | 工具页 |
| `_authenticated/_shell/settings/index.tsx` | `/settings` | 设置；注销push到`/login` |
| `_authenticated/translator/route.tsx` | `/translator`布局段 | 全屏Outlet，不显示shell导航 |
| `_authenticated/translator/$chapterId/$pageId/index.tsx` | `/translator/:chapterId/:pageId` | 页参数装配WebTranslator |

缺少chapter/page的路径不会误进入编辑器；展示统一未找到页面。未知路径同样使用根notFound。错误页“返回首页”push到`/`，其index再replace到workspace。此前缺少参数的组件内提示不可作为有效route承诺，因为现有路径匹配本就要求两段参数。

## S03.2 生成与装配

配置唯一来源供Vite插件与独立generate命令共同读取：`routesDirectory: "./src/routes"`、`generatedRouteTree: "./src/route-tree.gen.ts"`、`routeFileIgnorePattern: "^business$"`、自动代码分割启用。Vite路由插件先于React插件；生成树受版本控制，check在临时目录生成比较，不能修改工作区。全局类型注册指向application router。

生成器使用框架规定的 `export const Route`；具名route内容函数留business或小型装配函数。禁止为保持default export创建旧React Router wrapper。路由pending使用现有LoadingCircle与全屏容器；lazy内容必须在样式尚未加载时也能正确居中。通知toast只挂载一次。

## S03.3 身份guard与副作用

`beforeLoad`调用根session的 `ensureSession`；同一凭据的并发调用共享进行中的身份加载。已有loginState可用时复用；没有时读取当前用户与其成员列表，再确定选中团队。恢复失败保持既有replace到login行为；错误元信息保留规范化日志，用户可重新登录。根session权威源和请求世代防护详见S04。

登录成功写入会话后使router context/guard失效重算，再执行原目标跳转。注销后清理身份相关状态，push到login，后续返回受保护页时guard应拒绝。route卸载不能将旧身份请求写入新身份，也不能重置正在后台运行的上传任务。

shell独占副作用包括首次注册引导与邮件预取。在线租约属于根会话，不随进入翻译器停止。翻译器始终经过相同authenticated guard，但不经过shell。不得把邮件预取与首次引导移至authenticated使其在直达翻译器时触发。

## S03.4 Search契约：保持原URL字符串

必须覆盖TanStack默认JSON search解析：在router选项提供 `parseSearch`/`stringifySearch`，以 `URLSearchParams` 处理标量字符串，禁止将数字ID转number或把`true`转boolean。

- parse：去掉可选`?`，逐键取得字符串；重复键保留首次值，与现有 `.get()` 一致；空值仍为空字符串。未知键保留以支持修改详情时保留其他query。
- stringify：省略undefined；已验证的string使用URLSearchParams编码，非空结果加`?`。route search数据不放对象、数组、数字或boolean。
- workspace/playground `validateSearch`保留字符串record并提供 `comicId?: string`、`chapterId?: string`；缺少/空comicId不开详情，chapterId只在有comicId时用于章节选择。
- translator search含 `returnTo?: string`、`comicId?: string`、`chapterId?: string`、`readOnly?: string`；仅`readOnly === "true"`请求只读，`"false"`/`"1"`/空值/缺省均为auto。
- 动态params保持string。ID如`00123`、超过JS安全整数长度的ID、中文/空格/编码字符不得被JSON解析或重新数值化。

共同详情search契约放shell/business；translator search/返回决定放translator/business。共享详情host不从叶子route导入 `Route` 对象：它接收已类型化search及本入口导航回调；workspace/playground各自用自身Route hook绑定。进入translator使用生成路由类型的 `to`+params+search，不字符串拼接pathname。

## S03.5 历史与返回语义

| 触发 | 目标与历史 |
| --- | --- |
| 打开漫画详情 | 保留其他query，set comicId；有chapter时set chapterId，否则删除chapterId；replace |
| 详情切章 | 更新chapterId；保留comicId及其他query；replace |
| 关闭详情 | 只删除comicId/chapterId，保留其余query；replace |
| 进入翻译器 | push；params为章节/页面；search写returnTo、comicId、chapterId，只有只读入口写readOnly=true |
| 从翻译器退出，有完整返回上下文 | 仅允许returnTo为`/workspace`或`/comic-playground`且两个ID非空；push到该入口，query仅写comicId/chapterId，与现有行为相同 |
| 返回上下文缺失/不允许 | router.history.back()；不额外发明fallback跳转 |
| 根`/`及身份失败 | replace，避免返回循环 |
| 桌面/移动导航 | push既有目标；按pathname匹配active，邮件角标读取共享cache |

翻译器的保存、未保存退出、翻页与异步失败处理继续由编辑器module拥有；路由只提供退出回调，不绕过保存controller。若直接开新标签页的history.back无前页，则保持当前浏览器行为，不在本迁移加入额外产品决定。

## S03.6 测试与验收

使用TanStack memory history构建真实路由树和注入会话fixture的integration harness；不得只mock navigate来证明路由迁移成功。

- 九个公开入口（含根、登录、翻译器及六个shell叶子）逐一直达；所有参数route的刷新通过Vite和部署Nginx SPA fallback验证。
- 身份已有/未恢复/失败、并发guard、注销后back、失效请求返回、团队选择fallback；shell与translator布局与副作用范围正确。
- 上表每种push/replace/back检查history栈；两个详情入口的打开/切章/关闭/编辑器返回完整往返。
- search测试 `readOnly=true/false/1`、数字形ID、超长ID、空值、未知键、重复键、URL编码及不允许returnTo；确认不出现JSON引号或数值转换。
- 不存在/缺参URL、错误页回首页、lazy pending、移动导航、首次引导到settings、邮件角标。
- Storybook decorator和play测试使用同样search编解码与memory路由；不保留react-router-dom依赖或browser-router兼容层。

官方参考：[文件命名](https://tanstack.com/router/latest/docs/framework/react/routing/file-naming-conventions)、[自定义search序列化](https://tanstack.com/router/latest/docs/framework/react/guide/custom-search-param-serialization)。实施前以S01固定版本校验类型；本spec规定行为，不以最新文档替代锁定版本实际签名。
