# S02 · 全项目结构、归属与依赖

状态：目标 spec；本文件不表示迁移已实施。规范来源：Native `docs/REQUIREMENTS.md` §2.1、§3；用户明确要求复数 `routes`、彻底删除 `features`，允许 Zustand。

## S02.1 目标根结构

```text
src/
  Main.tsx
  application/                 # 启动、router、theme、样式与provider装配
  routes/
    __root.tsx
    business/                  # 会话、身份、业务请求装配、根错误呈现
    login/index.tsx
    login/business/
    _authenticated/
      route.tsx                # 无路径身份guard
      business/                # shell/translator共用领域契约与请求
      _shell/
        route.tsx              # 桌面侧栏、移动导航、首次引导
        index.tsx              # / → /workspace
        business/              # 管理界面共同业务
        workspace/{index.tsx,business/}
        comic-playground/{index.tsx,business/}
        member-list/{index.tsx,business/}
        system-mail/{index.tsx,business/}
        utilities/{index.tsx,business/}
        settings/{index.tsx,business/}
      translator/
        route.tsx              # 全屏outlet
        business/              # 全部翻校实现
        $chapterId/$pageId/index.tsx
  shared/{component,hook,utility}/
  route-tree.gen.ts
script/
docs/
.storybook/
```

只创建实际承载文件的目录。保留浏览器运行方式，不新增 Native 的 bridge、Tauri 或数据库目录。`application` 只装配，不另建业务状态或业务请求。现有顶层 `features/pages/layouts/router/api/types/store/hook/hooks/components/lib/utils/config/stories` 全部撤销，无兼容转发文件、旧路径别名或同义新 FDD 目录。工具公开目录以及本次用户指定 `routes` 是明确例外。

## S02.2 归属表

| 所有者 | 内容与依赖理由 |
| --- | --- |
| 根 `business/session` | `session-store.ts` 保留凭据、loginState、选中团队；`session.ts` 统一身份恢复；登录页和受保护route共同使用 |
| 根 `business/identity` | user/member/team/role/auth/image契约、raw转换和请求；成员CRUD在同一身份module供登录恢复与管理入口使用 |
| 根 `business/onboarding` | 登录注册与shell共用首次引导标记；界面仍归shell |
| 根 `business/request.ts` | 组装 HTTP 凭据读取、业务错误处理；`configuration.ts` 提供业务请求配置 |
| authenticated `business` | 按 `comic/chapter/page/assignment/assignment-invitation/workset` 概念组织类型、raw转换、被多个route使用的请求；不得再增加通用 `api/types` 桶 |
| shell `business/comic-detail` | 详情加载、章节动作、工作流、分工、导入导出与页面列表；`upload` 拥有上传任务和store |
| shell `business/comic-list` | Workspace和Playground共用 `ComicTranslationList`、漫画条目及其列表项类型 |
| shell `business/navigation/first-registration/mail` | 导航、首次引导与共享邮件cache/请求；邮件页呈现仍在system-mail |
| workspace `business` | 公告、留言、个人任务、在线用户列表、页面状态与对应请求 |
| comic-playground `business` | 作品集CRUD、创建/筛选漫画、进度列表、独占的ComicList/FilterHeader/WorksetSidebar |
| member-list `business` | 成员展示、筛选、详情和邀请；邀请契约只在此使用，不提升 |
| settings `business` | 账号设置、密码、头像、切换团队及注销界面；通过祖先会话接口触发失效，上传runtime自行取消 |
| utilities `business` | 压缩工具页面与其专用工作流；通用压缩算法不留这里 |
| translator `business` | 原 BaseTranslator/WebTranslator 和全部嵌套内容；`unit`、`editor`、`persistence`、`preference`、`canvas`、`unit-list`、`search-transform`、`terminology`、`remote`、`page-statistic`、`shortcut`、`special-character` 按职责内聚 |
| shared | 业务无关UI、toast、HTTP传输/Result、压缩与Worker、哈希、URL、长按与键盘工具 |

具体每个已跟踪文件见 [file-map.csv](../migration/file-map.csv)。CSV 是迁移库存，不是用代码批量替换路径即可完成的指令。

重要归属决定：

- `ComicInfo` 引用 `WorksetInfo`，因此 workset 值与 raw 转换归 authenticated；作品集 CRUD/input 属于 playground，避免共享漫画类型反向依赖叶子。
- 现有 `src/types/raw/unit.ts` 直接引用 BaseTranslator 的 diff/search 类型。将这组类型、转换与保存协议整体放 translator，不能把 raw 留父route再反向依赖 translator。
- 术语与术语库请求虽然当前位于 ComicPlayground，其唯一生产调用方是 WebTranslator；整体迁至 translator/terminology。
- ComicList 自身仅由 Playground 使用并引用进度列表；不能将 ComicList 提升 shell 后继续 import Playground 的进度实现。共同呈现仅保留实际被两入口使用的部分。
- `pageHash.ts` 与 Worker 只计算内容哈希，可归 shared；`pageUpload` 含章节分配、权限与进度，必须留业务。

## S02.3 依赖规则和 module interface

生产导入的所有权由最近的 `business` 祖先确定。允许同一所有者内的职责目录相互引用，允许子route引用祖先 `business`，允许业务引用 `shared`。禁止兄弟route内部导入、祖先业务导入子route、shared导入业务/application。

- route文件只装配本route/祖先业务及Outlet、guard和search；不容纳网络编排。
- `Main`、application router、根route及生成树属于**装配例外**：可引用需要挂载的route定义、provider与明确生命周期启动器，不能据此把祖先业务反向引用子业务合法化。
- 子route不通过祖先的 barrel 间接穿透兄弟route。纯type import、再导出、动态import同样受约束。
- 根HTTP module 的 interface 接收传输配置并返回现有请求能力；shared传输通过参数接收凭据，不读取会话store。业务HTTP adapter 拥有错误规范化。这条 seam 已有浏览器请求与fixture两种使用情境，应保留。
- BaseTranslator保留已有编辑器 interface；WebTranslator作为同一route内的远程 adapter。目录迁移提高 locality，保存controller的 depth 不因拆文件而丢失。
- 仅按使用者数量提升所有权，不为“可能复用”创建新抽象。删除旧barrel通过 deletion test：移除后调用方直接定位所有者，不能新增同样浅的转发树。
- 最近共同父route提供的 module 是共享业务的唯一权威源；对多个入口的 leverage 来自共同契约与行为，不是把每个小函数提升根目录。

## S02.4 状态生命周期与文件位置

归属不等于挂载寿命。会话Zustand仍是模块级权威源，持久化保持 `app-store` 和既有字段；邮件store不持久化。上传runtime在首次创建任务时注册会话失效订阅；普通route卸载不销毁任务，退出登录/身份更换取消，不能由根session反向import上传实现。settings仅clearSession；上传runtime观察失效并自行取消任务。根session下的在线租约保持跨shell/translator导航有效。细节以 S04 为准。

## S02.5 文件命名与拆分

TS使用kebab-case，TSX使用PascalCase；工具路由文件、`.stories.*`、测试后缀和生成文件按登记例外。禁止仅改扩展名规避400行限制。业务内部不重复套 `components/business`、`features`，文件名表达职责；不新建全局type或请求barrel。

扫描基线有21个手写TS/TSX文件超过400行；CSV的 `split` 行记录准确目标和职责。包括编辑器协调/导航/弹窗、详情弹窗/页面/动作、上传分配/传输/进度、成员邀请表单/列表/动作、公告与工作台状态、单元值/编辑/patch，以及超限测试与stories。每个目标格式化后≤400物理行；测试断言不能通过删除场景缩短。后续格式化造成的新超限，按同样职责规则在所属工作包内处理，更新CSV。

## S02.6 测试、stories与检查范围

生产规则和验证规则分开执行：

1. 就近单元测试、stories、fixture沿用所属business归属；fixture可引用同级/祖先业务，不能靠测试文件为生产引入新依赖。
2. 多route集成测试放最近共同父 `business/test`，允许它直接引用被集成的子route及其fixture；精确限定 `.test.*`/fixture文件与目录，禁止把整个父business加入豁免。
3. Storybook全局decorator、memory-router测试装配可引用application和根route定义，是测试装配例外。具体stories不得读取真实凭据或依赖真实账户。
4. 生产文件禁止import `.stories.*`、`.test.*`、测试fixture；普通单元测试不import stories，原 `unitSaveFixture` 和keyboard play分别迁到translator测试辅助。
5. 跨route协议回归测试拆分到对应所有者；若一个测试确实验证跨route行为，则提升到共同父测试目录，不把生产依赖规则强加到合法集成测试。

门禁解析TypeScript AST与模块解析结果，覆盖别名、相对路径、再导出、type import、静态dynamic import。还必须检查 `new URL(..., import.meta.url)`、HTML script/src、脚本内嵌HTML/import字符串、Vite/Storybook glob、shell脚本和配置旧路径。动态拼接无法静态解析时，必须在检查实现的有限入口清单中显式说明并由浏览器/构建验证；不能静默跳过。

文档中的历史路径仅允许在本迁移包的source inventory/证据中出现；活动说明、配置及执行脚本不能仍指向旧入口。node_modules、.git、dist和第三方vendor不属于自有features清零范围。

## S02.7 验收

- CSV source集合与基线 `git ls-files` 的480个文件完全相等；每行唯一主工作包。文档包新增文件是本阶段产物，不作为旧文件迁移库存。
- 目标源码只落上述入口，所有旧分类根与所有自有features目录删除。
- 逐条依赖正反例、大小写/别名绕过、测试合法引用、Worker/HTML字符串旧路径都有门禁测试。
- 已迁移文件可在目标route直接定位；shared中不存在漫画、章节、分工、会话等业务实现。

## S02.8 组件接口收敛是迁移完成条件

迁移必须同时修正原有接口问题。每个生产组件及其调用方由文件主负责人审查；
P002–P008随业务迁移完成，P009同步stories，P010全量复核，P012查验结果。
不得将“原样移动后能编译”视为该组件已经完成迁移。

| 情况 | 必须采用的处理 |
| --- | --- |
| 所有合法调用都需要的数据或动作 | Props必选且非空；同时更新全部调用方，删除无意义的可选链和重复判空 |
| 缺省有明确业务意义 | 在拥有该语义的边界统一给默认值，内部使用确定值；例如普通输入模式、默认按钮文案、system主题 |
| 缺失表示真实业务状态 | 保留明确状态，或使用判别联合；就绪分支的数据和动作必选，不能让每个子组件重复防御未就绪状态 |
| 多个字段只在某种模式下成立 | 将模式与必需字段绑定；去除互斥布尔值组合、显示操作却缺少处理器的非法状态 |
| 调用方确实可省略的展示扩展 | 可保留optional，如无附加className或无说明文字；记录省略行为，不要求调用方到处传空值 |

“可选”与“值可为空”分别审查：`field?: T`、`T | undefined`、`T | null`、
显式`?: T | undefined`、`Partial`及继承/交叉类型带来的可选字段都在范围内。
对children等框架允许的空值按真实用途判断，不机械禁用框架类型。
禁止为了通过类型检查增加空函数、假ID、非空断言或无业务含义的默认对象。
合法空文本、真实空列表和0不是禁用值，但必须与未加载/错误/未知区分。

接口收敛结果记入[接口审查记录](../review/interface-audit.md)：组件、调用方证据、
字段决定、默认值归属、保留空值的业务原因及验证。AST与类型检查只能帮助穷举，
不能自动判断默认值是否有业务意义；该项需要语义审查。

验收ID **IC-01**：生产组件和调用方审查全覆盖，无未处理字段；
**IC-02**：必需数据/动作不能缺省，互斥模式不能组合出非法状态；
**IC-03**：合法fallback集中且可解释，未就绪/失败不被当成正常值；
**IC-04**：保留optional/null的理由和真实调用方式可核对。
