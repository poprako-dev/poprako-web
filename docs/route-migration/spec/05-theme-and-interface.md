# S05 — 主题与交互兼容规格

状态：ready（规范确定；运行验收待实施）。负责计划：P002、P006、P008、P009、P010、P012。

## S05.1 依据与范围

依据 Native `docs/REQUIREMENTS.md` §4.2、§5、§6.2，Web `src/index.css`、
`src/components/ui/AppDialog.tsx`、`src/features/BaseTranslator/layout/BaseTranslatorLayout.tsx`、
`src/lib/keyboard.ts` 和 `src/features/BaseTranslator/hook/keyboardScope.ts`。
样式归 `application/style.css`，通用展示归 `shared/component`，业务交互归所属 route 的
`business`。本次保留简体中文、Lucide、现有信息顺序、柔和绿色主色与紧凑工作界面，不重设计产品，
不引入国际化、卡片包装体系或新的业务操作。

当前已有 `:root` / `.dark` 变量，但大量白色、stone/slate 类及弹层颜色没有随主题改变；
当前没有完整的浅色、深色、跟随系统选择流程。因此主题选择和统一暗色覆盖是明确新增行为，
不能把现有暗色 CSS 视为已经完成该要求。

## S05.2 单一主题来源

1. `application/ThemeProvider.tsx` 在 router 之上装配主题，主题的业务无关实现归
   `shared/utility/theme.ts`。对外提供 `ThemePreference = "light" | "dark" | "system"`、
   当前 preference、解析后的 `"light" | "dark"` 以及设置 preference 的能力。
2. `localStorage["poprako:theme"]` 存储原始字符串；缺失、非法或不可读时采用 `system`。
   写入失败仅失去跨刷新持久化，当前会话仍生效；不得因此使界面崩溃或重复弹出业务错误。
3. 只在应用根节点管理 `document.documentElement` 的 `dark` class 和 `color-scheme`。
   `system` 响应 `prefers-color-scheme` 的 change；显式 light/dark 不被系统变化覆盖。
   监听器在卸载时清理，storage 事件同步其他标签页的合法选择。
4. `Main.tsx` 调用同一主题实现的同步初始化，在 React 首次绘制前设置根 class；禁止复制
   第二套解析规则到 HTML 字符串。Provider 与启动初始化共享读取/解析函数。
5. 设置页提供“浅色 / 深色 / 跟随系统”单选项，立即应用，无额外保存按钮。登录页、错误页、
   管理外壳、翻译器、toast 和 portal 自动继承，不各自订阅系统主题。
6. React 临时状态和 Zustand 都可继续使用；主题无需另建业务 store。会话和持久化职责见
   [S04](04-state-and-data.md)，主题不进入 `app-store`。

## S05.3 颜色与样式迁移

- 所有界面颜色使用语义变量。沿用已有 background、foreground、muted、popover、border、
  primary、destructive、sidebar、diff 和进度 token，并补全 light/dark 成对定义。
- 为现有 stone/slate 工作区定义 `surface-workspace`、`surface-panel`、`surface-hover`、
  `text-secondary`；为遮罩、成功、警告、信息、选择态、标注状态定义对应语义 token。
  明暗值集中在 `application/style.css`，业务文件不使用硬编码 hex/rgb/oklch 或颜色工具类
  绕过主题；灰阶和绿色旧值按实际用途迁移，不能机械把所有白色都映射为同一背景。
- 浅色保持当前视觉层级；深色采用低饱和中性背景和柔和绿色，不用深蓝/紫色作为大面积背景。
  翻校差异的删除、替换、插入维持可辨识含义，同时有文本/图标或内容差异辅助，不能仅靠颜色。
- 图片像素、漫画原稿和用户输出颜色属于内容，不随主题改写。动态坐标、缩放、拖拽尺寸允许
  inline style；主题颜色必须引用 token。不得借严格样式迁移改变图像计算或导出结果。
- 原有字体、圆角、间距和滚动规则保持；仅修正暗色可读性与可用性。`App.css` 等旧样式的
  有效规则迁入统一入口后删除，禁止保留并行主题表。
- portal 挂在 body 仍需继承根主题，遮罩也必须主题化；tooltip、下拉菜单、dialog、toast
  与主界面采用同一套主题值。

## S05.4 键盘、输入法与焦点

1. 保留 `isComposing || keyCode === 229` 的 IME 判定；后者按兼容理由保留定点弃用规则例外。
   输入法确认键不得触发保存、翻页、创建/删除单元或关闭弹层。
2. 保留事件 `defaultPrevented`、`composedPath`、dialog/alertdialog 和可编辑元素判断。
   单元编辑器内现有快捷键可用，搜索框、术语输入框、设置输入框和 portal 内的按键不能触发
   翻译器全局操作。不要把监听器从受控 scope 升级成无条件 window 捕获。
3. 不改写已保存的 `configurableShortcuts` 或默认快捷键含义。Windows Control 与 macOS Meta
   按现有匹配约定处理；修饰键显示与匹配一致。用户显式配置可以覆盖浏览器快捷键，未匹配键
   不调用 `preventDefault`，避免额外抢占系统操作。
4. 可点击图标具有名称；按钮、链接、输入具有可见焦点。dialog 保留 Radix 焦点圈定与语义，
   Escape 和背景关闭遵守 `locked`、`closeOnEscape`、`closeOnBackdrop` 及 IME 限制。
   关闭后回到触发控件；触发控件已被导航移除时回到目的页面的合理焦点位置。
5. 弹层内部滚动、键盘 Tab 和长内容必须可用；不把可访问性错误统一降级为全局 `todo`。
   既有被测故事中的缺陷逐项修正；工具误报仅允许定点、有原因的例外。

## S05.5 加载、错误与恢复

- 页面加载、空列表、无权限、失败是不同状态；保持现有用户可见文案与动作，无内容不能
  自动解释为成功的空列表。路由懒加载 fallback 仍在样式分块未到达时占满视口且可见。
- 进行中的提交有反馈，重复点击不启动重复写入。不可恢复错误仍同时给出安全中文提示与
  `console.error` 诊断；传播层不重复 toast，日志不记录凭据和完整用户载荷。
- 失败保留输入；只对明确支持重试的操作显示重试。保存重试复用原 saveId，上传重试遵循
  既有分阶段策略，不把写入统一改成自动重试。详细协议见 S04 与兼容映射。
- 页面/会话切换后过期响应不能覆盖新状态；取消任务必须清理监听、Object URL、Worker 或
  临时文件。长任务通过进度和取消反馈保持交互，不能换成主线程同步计算。

## S05.6 翻译器最新布局不得回退

基线包含 `68cedc0` 合并的 translator-layout 变更，迁移必须保留：

- 全屏 `h-dvh`；横屏 sidebar 为 1/3 且最小 95 个 Tailwind spacing 单位，画布可收缩；
  竖屏上下排列，sidebar 使用当前 2/5 高度和 `sm:portrait:h-50` 规则。
- 画布图像最大高度仍按容器高度 `0.95` 计算；缩放、拖拽和标记坐标不随主题迁移变化。
- 可分离的特殊字符工具栏、聚焦/选区插入与暂停条件；显式换行标记、窄侧栏正文排列、
  译文/校对编辑区 resize、复制、只读模式、重定位偏好及完成阶段动作。
- 小屏侧栏和页面列表的独立滚动；主题迁移不隐藏工具、不扩大最小宽度或让正文产生横向溢出。

## S05.7 验收

| 验收 ID / 场景 | 验证方式 | 负责计划 |
| --- | --- | --- |
| UI-01 首次系统主题、显式选择、刷新、系统变化、非法存储、存储禁用、多标签页 | DOM 集成测试 + Provider 单元测试 | P010 |
| UI-02 light/dark 登录、shell、翻译器、设置、错误页、dialog/tooltip/toast | 真实浏览器截图与人工对照基线，检查 portal 根主题 | P010、P012 |
| UI-03 IME Enter/Escape、术语输入、搜索输入、dialog、普通单元编辑快捷键 | 迁移 InputComposition、KeyboardScope、translatorKeyboardPlay 的现有 play 测试 | P008、P009 |
| UI-04 Tab 焦点圈定、关闭恢复、锁定弹层、图标名称 | RTL 用户交互 + Storybook 浏览器交互 | P002、P009 |
| UI-05 330/360/420 侧栏、横竖屏、内容 resize、特殊字符工具栏 | UnitListLayout 现有场景及浏览器布局检查 | P008、P012 |
| UI-06 网络失败、重试、空态、进行中重复操作、页面切换 | 故障夹具，不连接真实后端 | P004—P009 |

以上均为实施验收条件；本文编制阶段仅完成源码检查，未声明这些场景已经运行通过。
