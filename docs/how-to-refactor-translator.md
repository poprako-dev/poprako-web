# Translator 纯 Web 复刻指南

本文档是对现有 Tauri 桌面版 Translator 的完整分析，旨在指导如何在纯浏览器（Web）环境中将其复刻。

---

## 一、系统整体架构

Translator 是一个**漫画页翻校工具**，核心功能是：在漫画图片上定位翻译标记（Unit），并在侧边栏对每个标记的翻译文本进行编辑和校对。

整个系统分为五个层次：

```
┌─────────────────────────────────────────────────────────────────┐
│  LocalTranslator（数据容器层）                                    │
│  · 持有所有页面元数据                                              │
│  · 负责加载/保存 Unit 数据（与 IPC/后端交互）                      │
│  · 管理"当前页"和 dirty buffer                                    │
│  └─────────────────────────────────────────────────────────────┐│
│    Translator（UI 协调层）                                       ││
│    · 持有 UI 状态（mode、selectedUnitId、sidebarView...）        ││
│    · 协调 Stage 和侧边栏的联动                                    ││
│    · 管理快捷键绑定                                               ││
│    ├──────────────────────────────────────────────────────────┐ ││
│    │ Stage（画布层）                                            │ ││
│    │ · ImageLayer（图片 + 平移缩放）                             │ ││
│    │ · MarkerOverlay → Marker × N（标记点）                     │ ││
│    │ · UnitStatsBar（状态统计浮层）                               │ ││
│    └──────────────────────────────────────────────────────────┘ ││
│    ├──────────────────────────────────────────────────────────┐ ││
│    │ Sidebar（侧边栏，三种视图互斥切换）                          │ ││
│    │ · UnitList（单元列表）                                      │ ││
│    │ · Editor（单元文本编辑器）                                   │ ││
│    │ · SearchReplaceView（查找替换）                              │ ││
│    │ · VerticalStatusCard（项目状态/页面预览，阅览模式）           │ ││
│    └──────────────────────────────────────────────────────────┘ ││
│    └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、数据模型

### 2.1 核心类型（TypeScript）

```ts
// 翻校标记，一个漫画页上的一个定位点 + 文本
type Unit = {
  id: string;
  x: number; // [0, 1]，相对图片宽度的比例
  y: number; // [0, 1]，相对图片高度的比例
  indexInPage: number; // 在当前页的顺序（1-based）
  isInbox: boolean; // true=框内，false=框外
  translatedText?: string;
  isProoved: boolean;
  proovedText?: string; // undefined 表示"未校对"，空字符串表示"强制清空"
  comment?: string;
};

// 漫画页（只有元数据 + 图片 URL，不含 units）
type Page = {
  id: string;
  localImageUrl?: string;
  remoteImageUrl?: string;
};

// 项目（统计数据 + 基本信息）
type Project = {
  id: string;
  author: string;
  title: string;
  localImageDir?: string;
  unitCount: number;
  translatedUnitCount: number;
  proovedUnitCount: number;
  pageCount: number;
  // ...省略其他计数字段
};
```

### 2.2 proovedText 字段的语义

这是一个容易踩坑的细节：

| `proovedText` 值 | 含义                                      |
| ---------------- | ----------------------------------------- |
| `undefined`      | 该 Unit 没有经过校对，使用 translatedText |
| `""` 空字符串    | 校对员强制清空了该 Unit 的文本            |
| 非空字符串       | 校对员提供了校对文本，优先使用            |

---

## 三、组件树与职责划分

### 3.1 LocalTranslator（数据容器）

对应文件：`src/components/project/LocalTranslator.tsx`

**职责：**

- 首次挂载时加载所有 `Page` 元数据（不含图片）
- 按需加载当前页的 `Unit[]`（切页时才加载）
- 用 `currentPageDirtyRef`（ref，非 state）标记是否有未保存变更
- 切页前/强制刷新时批量保存（`flushCurrentPage`）
- 将 Project、当前页、当前 units、所有回调 prop 注入 `<Translator/>`

**关键设计：dirty buffer**

并不是每次 `onUnitSave` 都立刻写数据库，而是：

1. 在内存 `currentUnits` 中做 upsert（patch 合并）
2. 将 `currentPageDirtyRef.current = true`
3. 只在切页/刷新时才触发 `savePageUnits(pageId, units[])`

这使得每次按键修改文本时不会频繁触发存储 IO。

**关键回调：**

- `onRequestPage(pageIndex)` → 先 flush 当前页，再加载新页
- `onUnitSave(patch)` → 内存 upsert，标记 dirty
- `onUnitRemove(unitId)` → 从内存 units 中删除
- `onFlush()` → 强制 flush 当前页
- `onUnitSelect(unitId)` → 更新 selectedUnitId
- `onRearrangeUnits(unitId, targetIndex)` → 调整 unit 顺序

### 3.2 Translator（UI 协调层）

对应文件：`src/components/project/Translator.tsx`

**持有的 UI 状态（useState）：**

- `localMode: TranslatorMode` — 当前模式（translate/proofread/read）
- `isRepositionMode: boolean` — 是否开启"重定位模式"（切换 unit 时自动居中画布）
- `pageInput: string` — 页码输入框的受控值
- `displaySidebarView: 'vsc' | 'editor' | 'search'` — 当前显示的侧边栏视图
- `animatingOut: boolean` — 侧边栏切换时的淡出动画控制
- `showMemo: boolean` — 快捷键说明弹窗
- `showSymbolCard: boolean` — 特殊符号弹窗
- `currentScale: number` — 画布当前缩放值（由 Stage 广播上来）

**持有的 ref：**

- `editorRef` — 指向 Editor 组件，用于程序化聚焦
- `stageRef` — 指向 Stage 组件，用于 `resetView()` / `centerUnit()`

**侧边栏视图的切换规则：**

```
effectiveMode === 'read'  →  displaySidebarView = 'vsc'
effectiveMode 非 read     →  displaySidebarView = 'editor'
用户点击搜索图标          →  displaySidebarView = 'search'（切换式）
从 search 切换 mode       →  先退出 search，再进入对应视图
```

切换时有 `220ms` 的淡出动画（`animatingOut` 控制 CSS class `fade-out`/`fade-in`）。

---

## 四、Stage（画布系统）

### 4.1 架构

Stage 是一个"画布容器"，内部包含两个绝对定位的层：

- **ImageLayer**：渲染图片，处理平移缩放
- **MarkerOverlay**：渲染所有标记点（绝对定位在 Stage 上，与 ImageLayer 坐标同步）

```
Stage (position: relative, overflow: hidden)
├── UnitStatsBar (position: absolute, top-left)
├── ImageLayer (position: absolute, 平移缩放变换应用于内部 img)
└── MarkerOverlay (position: absolute, inset: 0)
    └── Marker × N (position: absolute)
```

### 4.2 ImageLayer 的坐标系统

图片通过 CSS 的 `position: absolute` + `left`/`top`/`width`/`height` 来控制位置和尺寸。

核心状态：

- `fitScale`：初始适应容器的缩放比，图片加载完后计算一次（让图片以 90% 宽/87% 高的限制填满容器）
- `userScale`：用户通过滚轮或手势施加的额外缩放
- `userOffset`：用户通过拖拽施加的平移偏移（像素）

实际渲染参数：

```
renderWidth  = naturalWidth  * fitScale * userScale
renderHeight = naturalHeight * fitScale * userScale
left = containerWidth  / 2 - renderWidth  / 2 + userOffset.x
top  = containerHeight / 2 - renderHeight / 2 + userOffset.y
```

每次这四个参数变化时，ImageLayer 都会向上广播 `onRenderUpdate({ width, height, left, top, scale })`，Stage 将其保存为 `imageRenderInfo`，再传给 MarkerOverlay 用于定位 Marker。

**拖拽死区（DRAG_THRESHOLD = 8px）：** 鼠标移动距离超过 8px 才真正进入拖拽模式，避免点击被误判为拖拽。

**滚轮缩放（以鼠标为原点）：**

- 步进倍率 `ZOOM_STEP = 0.08`，每次乘以 `(1 ± 0.08)`
- 缩放时同步调整 `userOffset`，保持鼠标下的图片点不动

**图片加载：**

- Tauri 版通过 IPC 读取本地文件或代理远程图片，返回 base64 data URL
- Web 版可以直接用 `<img src={url} />` 加载远程 URL；本地图片需要通过 `<input type="file">` / File System Access API 获取 ObjectURL

### 4.3 Marker 的坐标计算

Unit 的 `x`/`y` 是在图片上的相对坐标（0-1），Marker 的屏幕位置计算公式：

```
pointScreenX = imageRenderInfo.left + unit.x * imageRenderInfo.width
pointScreenY = imageRenderInfo.top  + unit.y * imageRenderInfo.height
```

Marker 是一个"图钉"形状（上方圆圈 + 下方小点），其 containerLeft/Top 需要减去自身尺寸的偏移以使小点对准真实位置：

```
containerLeft = pointScreenX - circleSize / 2
containerTop  = pointScreenY - (circleSize + dotSize)
```

**Marker 颜色语义：**

- 背景：粉色（isInbox）/ 黄色（isOutbox）
- 边框绿色：translate 模式下有 translatedText，或 proofread 模式下 isProoved = true

**Marker 拖拽：**

- 与 ImageLayer 拖拽同款的死区逻辑（DRAG_THRESHOLD = 6px）
- 在 `window` 上注册 `mousemove`/`mouseup` 监听，在 mouseup 时计算相对坐标并回调 `onMoveEnd`
- 拖拽结束后抑制 click/contextmenu（`dragSuppressClickRef`）

### 4.4 新建 Unit

点击画布（非 Marker 区域）时触发：

- 左键 → `isInbox = true`
- 右键 → `isInbox = false`（通过 `onContextMenuCapture` 阻止浏览器默认菜单）

点击坐标换算：

```
relativeX = (clickX - imageRenderInfo.left) / imageRenderInfo.width
relativeY = (clickY - imageRenderInfo.top)  / imageRenderInfo.height
```

超出 [0,1] 范围时丢弃（点到图片外）。

---

## 五、侧边栏系统

### 5.1 UnitList

纯展示列表，每项有：

- 左侧彩色索引（粉=框内，黄=框外）
- 右侧状态点（灰=无文本，橙=有翻译未校对，绿=已校对）
- 主体：只读 `<textarea>` 展示文本（高度自适应内容）
- 校对模式下分层显示 translatedText（灰色）+ proovedText

当前选中的 unit 会通过 `scrollIntoView` 自动滚动到可见区。

列表末尾有「确认校对所有单元」按钮，点击后弹出 ConfirmDialogBox 二次确认。

### 5.2 Editor

单个 Unit 的编辑器，当 `selectedUnit && isMeProofreader` 时才渲染。

**输入文本的来源（initialText）：**

```ts
// 校对模式：
proovedText !== undefined ? proovedText : (translatedText ?? "");
// 翻译模式：
translatedText ?? "";
```

**功能区：**

- 头部：索引（可点击进入编辑，输入目标序号重新排序）
- 符号栏：自定义符号按钮（点击在光标处插入）
- textarea：主文本编辑区

**「复制」按钮（仅校对模式）：** 调用父组件 `onRestore()`，将 `proovedText` 置为 `undefined`，同时 Editor 内部将 textarea 切为 translatedText 显示。

### 5.3 SearchReplaceView

全项目跨页搜索替换，调用 IPC 接口（Web 版需自行实现服务端或前端遍历）。

主要流程：

1. 组件挂载时加载全项目所有 Page 元数据（建立 pageId → Page 映射）
2. 用户输入关键词，点击搜索 → 调用 `searchComicText(projectId, term)` 返回 `pageId[]`
3. 逐 page 加载 units 统计匹配数，展示结果列表
4. 点击某页结果跳转（调用 `onPageSelect(pageIndex)`）
5. 替换 → 二次确认弹窗 → 调用 `replaceComicText(projectId, pageIds, oldText, newText)`

### 5.4 VerticalStatusCard（阅览模式）

展示项目封面、进度条（翻译%/校对%）、框内/框外统计，以及导出相关操作。

在**纯 Web 版**中，导出逻辑需要换成服务端 API 或前端 JSZip 方案。

---

## 六、数据流与状态管理

### 6.1 主数据流向

```
LocalTranslator
   ├── currentUnits (state)  ←──────────────────────────┐
   │        ↓ prop                                      │
   │   Translator                                       │
   │        ↓ prop                                      │ onUnitSave(patch)
   │      Stage → Marker × N                           │
   │      Sidebar → UnitList / Editor                  │
   │                   ↑                               │
   │                   └── 用户操作 ─────────────────── ┘
   │
   └─→ 仅在切页/flush 时批量写入存储
```

### 6.2 Unit 的 upsert 逻辑

```ts
// LocalTranslator.handleUnitSave
setCurrentUnits((prev) => {
  const index = prev.findIndex((u) => u.id === patch.id);
  if (index >= 0) {
    // patch 合并
    const next = [...prev];
    next[index] = { ...prev[index], ...patch };
    return next;
  } else {
    // 新增
    return [...prev, patch as Unit];
  }
});
markCurrentPageDirty();
```

### 6.3 selectedUnitId 的流向

```
LocalTranslator.selectedUnitId (state)
  └─→ Translator → UnitList (高亮) / Stage (Marker 高亮)
                 → Editor (key={selectedUnit.id} 保证切换时重置)
用户操作:
  Marker 左键 → onUnitClick → LocalTranslator.setSelectedUnitId
  UnitList 点击 → onUnitClick → LocalTranslator.setSelectedUnitId
  Tab/Shift+Tab 快捷键 → 在 currentUnits 数组中前后循环
```

---

## 七、三种工作模式

| 模式      | 图标   | Editor 占位文字 | Marker 边框绿色条件 | 侧边栏默认视图 |
| --------- | ------ | --------------- | ------------------- | -------------- |
| translate | 铅笔   | "请输入翻译..." | 有 translatedText   | editor         |
| proofread | 对勾圆 | "请输入校对"    | isProoved = true    | editor         |
| read      | 眼睛   | 无 Editor       | 不显示 Marker       | vsc            |

模式切换通过 `Ctrl+M` 循环，顺序：translate → proofread → read → translate。

切换到 read 模式前会触发 `onFlush()`（保存当前页）。

---

## 八、快捷键系统

快捷键通过 `window.addEventListener('keydown', ...)` 绑定于整个 Translator 层，不依赖特定 DOM 元素的 focus。

关键实现注意：

1. **每次渲染都需重新注册**（因回调依赖 `selectedUnitId`、`currentUnits` 等闭包变量），通过 `useEffect` + cleanup 实现。
2. **阻止 Tab 的默认行为**（`event.preventDefault()`），防止浏览器焦点跳转。
3. **Ctrl modifier 键的匹配逻辑**：要求 `ctrlKey` 与配置完全匹配（配置为无 ctrl 但用户按了 ctrl，则不匹配），避免 `Ctrl+Tab` 触发普通 Tab 逻辑。

```ts
const match = (shortcut: ShortcutConfig, e: KeyboardEvent) =>
  e.key === shortcut.key &&
  (shortcut.ctrl ? e.ctrlKey : !e.ctrlKey) &&
  (shortcut.shift ? e.shiftKey : !e.shiftKey) &&
  (shortcut.alt ? e.altKey : !e.altKey);
```

---

## 九、纯 Web 环境的适配要点

现有代码中所有 Tauri 特有部分集中在 `src/ipc/` 层，通过 `invoke()` 调用 Rust 后端。Web 版需要替换这些调用。

### 9.1 数据持久化（替换 SQLite IPC）

| 当前 IPC                           | Web 替换方案                               |
| ---------------------------------- | ------------------------------------------ |
| `getProjects()`                    | REST API `/api/projects`                   |
| `getProjectPages(id)`              | REST API `/api/projects/:id/pages`         |
| `getPageUnits(pageId)`             | REST API `/api/pages/:id/units`            |
| `savePageUnits(pageId, units[])`   | REST API `PUT /api/pages/:id/units`        |
| `searchComicText(projectId, term)` | REST API `GET /api/projects/:id/search?q=` |
| `replaceComicText(...)`            | REST API `POST /api/projects/:id/replace`  |

数据库迁移参考 `src-tauri/migrations/` 目录下的 SQL，保持相同的表结构即可。

### 9.2 图片加载（替换本地文件 IPC）

| 当前方式                                         | Web 替换方案                                                    |
| ------------------------------------------------ | --------------------------------------------------------------- |
| 本地绝对路径 → `proxyLocalImage(path)` → base64  | 服务端提供 `/api/images/local?path=` 代理接口，返回图片二进制流 |
| 远程 HTTP URL → `proxyRemoteImage(url)` → base64 | 直接 `<img src={url}>` 即可；若 CORS 受限，走服务端代理         |

ImageLayer 中的 `isAbsoluteOsPath` 判断和 IPC 调用可以替换为统一的 `fetch('/api/images/proxy?url=...')` 逻辑。

图片缓存逻辑（LRU，10 条上限，URL.createObjectURL）完全复用，无需修改。

### 9.3 特殊符号存储（替换 IPC 持久化）

| 当前                                           | Web 替换                                            |
| ---------------------------------------------- | --------------------------------------------------- |
| `getSpecialSymbols()` / `saveSpecailSymbols()` | `localStorage` 直接读写，或 IndexedDB，或服务端接口 |

### 9.4 导出功能（替换 Rust 导出逻辑）

当前 `exportProject()` 调用 Rust 后端生成文件并返回路径。Web 替换：

- 纯前端：用 `jszip` 库打包，`URL.createObjectURL` + `<a download>` 触发下载
- 服务端：调用服务端导出 API，返回文件流

### 9.5 窗口/系统操作

`openProjectDir()` 等 Tauri 特有的系统调用在 Web 环境中无对应能力，可以隐藏相关按钮。

---

## 十、重建时的组件复用优先级

以下组件**完全不依赖 Tauri**，可以直接复用（仅需处理 prop 接口）：

- `Translator.tsx` — 主 UI 协调层（去掉 Tauri 相关的 `isOffline` 等 prop 即可）
- `Stage.tsx` — 画布容器
- `ImageLayer.tsx` — **需要替换图片加载逻辑**（去掉 IPC 调用，改为直接 URL or fetch）
- `MarkerOverlay.tsx` — 完全复用
- `Marker.tsx` — 完全复用
- `UnitList.tsx` — 完全复用
- `Editor.tsx` — 完全复用
- `UnitStatsBar.tsx` — 完全复用
- `SpecialSymbolCard.tsx` — 完全复用
- `ConfirmDialogBox.tsx` — 完全复用

以下组件**需要重写数据源**：

- `LocalTranslator.tsx` — 将 `store/project.ts` 的 IPC 调用替换为 REST fetch
- `SearchReplaceView.tsx` — 将 `ipc/project/unit.ts` 中的搜索替换接口替换为 REST
- `VerticalStatusCard.tsx` — 导出/预览逻辑改造

---

## 十一、推荐重建顺序

1. **搭建 REST API 服务**，复用 SQLite 数据库 schema（参考 `src-tauri/migrations/`）
2. **创建新的数据层** `src/api/project.ts`，提供与现有 `store/project.ts` 相同的函数签名，内部改用 `fetch`
3. **重写 ImageLayer 图片加载部分**（约 30 行），将 IPC 替换为 `/api/images/proxy` 接口
4. **复制 Translator / Stage / UnitList / Editor 等纯 UI 组件**，无需修改
5. **创建 WebTranslator**（对应 LocalTranslator），驱动数据层与 Translator UI 层对接
6. **处理特殊符号存储**（改用 localStorage）
7. **处理导出功能**（改用 jszip 或服务端接口）
