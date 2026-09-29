# 文档交叉审查与验证记录

审查日期：2026-09-28。范围为spec、逐文件清单、实施plans与基线证据。
下文前半部分保留文档阶段的历史验证结论。生产迁移现已进入实施与集成验证，实时证据见 [执行记录](../plan/execution.md)；历史结论不表示当前源码已经通过验收。

## 已收敛的问题

| ID | 发现 | 文档处理与责任 |
| --- | --- | --- |
| F01 | 仅提取复用逻辑不能解决整个FDD结构 | S02与480行file-map覆盖整个仓库；任意自有层级禁止features，不提供长期转发层 |
| F02 | Native规范含桌面/Rust要求，不能直接照搬 | requirements-matrix逐条标明采用、适配、例外、不适用；Web继续HTTP，保留Zustand、Storybook和MIT |
| F03 | Native ESLint9与Web Unicorn74的peer要求冲突 | S01固定移除Unicorn，由具体正确性规则承接；P001用精确版本验证安装，不宣称目标依赖已经运行 |
| F04 | P003移除旧路由依赖会令未迁移stories失效 | P001精确保留过渡依赖；P003清除生产调用；P009迁完MemoryRouter后移除依赖 |
| F05 | shared请求层读取业务store会反向依赖route | S04采用通用transport与根route业务装配，身份状态和请求契约不下沉shared |
| F06 | 目录位置容易被误当成组件挂载生命周期 | S04显式规定上传跨视图续存、登出取消、租约跨shell/translator；失效订阅由子业务依赖根会话 |
| F07 | 邮件状态与保存夹具的文件负责人不一致 | 邮件契约统一P002；unit保存夹具P008随测试消费者迁移；CSV和plan附表同步 |
| F08 | 共享漫画详情提取晚于共享动作验收 | P004提前提取use-detail-actions；P005只完成两个入口剩余私有业务；新文件清单标明同一目标职责 |
| F09 | 主题控件和Storybook装饰器早于ThemeProvider | 主题provider、设置选择和主题装饰器统一P010；P006/P009明确后续补主题场景 |
| F10 | 规范检查器的验收排在检查器实现之前 | P010实现check-style/check-dependency及正反fixture；P011接入总任务与CI；中间残留路径逐项登记 |
| F11 | 早期route包要求RTL测试，但环境到P009才创建 | vitest.integration.config.ts、application/test/setup.ts、test:integration及固定浏览器安装前移P001 |
| F12 | errorHandling测试搬到script后仍依赖Vitest环境 | P010迁移为Deno.test与Node严格断言，纳入test:script，避免P010门禁依赖P011 |
| F13 | 压缩/有界任务的真实浏览器脚本可能被单元测试掩盖 | S06/S07/P007/P012单独列出浏览器门禁；固定Playwright Chromium，系统Chrome和Unix诊断不充当跨平台基线 |
| F14 | 全局迁移测试和Storybook需要访问多个叶子 | S02/S06规定精确测试位置、测试配置范围和零生产消费者；不允许任意目录借test名称绕过依赖规则 |
| F15 | 单份计划缺失新增文件责任和执行依赖 | 12包分别列出480个输入与37项新建职责；覆盖表逐条链接需求/spec/计划/未来证据 |

## 本轮已执行的检查

原始Web基线的`deno task typecheck`和`deno task lint`退出码均为0；
`deno task test:unit`为45个文件、240个测试通过。环境与版本见[baseline](../baseline.md)。

文档检查命令：

```sh
deno run --allow-read --allow-env --allow-run=git docs/route-migration/review/check-documents.mjs
```

该命令核对固定基线480个跟踪文件、37项新职责、12个工作包、全部需求覆盖、
工作包附表、依赖无环、目标路径约束和Markdown文件链接；结果见本次命令输出。
它只读文件与Git，不修改源码、配置或文档。

本轮执行结果：退出码0，`errors: []`；480/480输入覆盖、37项新职责、83条需求、
12个工作包、498个本地链接均通过；基线之外的已跟踪非文档修改为0。
另核对`git status --short`，仅有未跟踪的`docs/route-migration/`，无其他工作区变更。

人工交叉审查覆盖工具链、结构归属、状态生命周期、测试环境、实施顺序及逐文件责任。
以上发现均已反映到对应文档；当前没有待决定的文档阻断项。

## 仍须在实施时取得的证据

- 目标精确依赖安装、升级后的strict类型/lint/Prettier、生产构建与生成一致性。
- 新结构的真实导航、旧search编码、旧storage数据、上传生命周期、翻校保存和失败恢复。
- Storybook构建/启动/全部play，Worker与压缩/有界任务的真实浏览器回归。
- 三态主题、移动布局、IME/快捷键/焦点和原翻译器布局对照。
- Windows/macOS开发任务、Chromium/Firefox/WebKit、真实最低浏览器版本和Linux部署脚本回归。
- frozen依赖审计、许可证、release元数据与只读总检查。

上述项目本轮均未作为目标系统验收运行。文档ready不意味着P001–P012完成，
也不能将原工具链240个测试通过写成升级后的兼容性证明。

## 复核限制

后续需求澄清发现：原R4-06仅写“Props尽量必选、逐调用方审查”，缺少逐包完成条件，
不足以保证清理原有可空与fallback问题。现补充S02.8、S04-08和IC-01至IC-04，
接入P002–P010及P012，并新增[接口审查记录](interface-audit.md)。已识别输入值/回调可选、
确认按钮动作缺失、互斥输入模式和就绪身份重复判空等具体案例；均标记待实施。
前述480文件/83需求基线不变，首次检查的498链接数和工作区状态属于首次文档交付时记录。
本次补充只修改文档；文档检查结果以复核命令当前输出为准，不沿用首次计数。

自动检查不验证Markdown锚点、不证明所有动态入口可运行，也不证明新依赖在本机或双平台兼容。
文件清单基于固定提交；实施前出现新文件、业务变更或依赖变化时，先更新基线和归属再执行。
本轮未改动生产源码、依赖、AGENTS、CI或部署；未创建提交、执行发布或连接真实后端。
