# 依赖声明补丁维护记录

核验日期：2026-10-25。当前补丁实现为
[prepare-dependencies.ts](../script/prepare-dependencies.ts)，回归测试为
[prepare-dependencies.test.ts](../script/prepare-dependencies.test.ts)。本记录不授权升级依赖。

项目保持 `strict: true`、`exactOptionalPropertyTypes: true` 和 `skipLibCheck: false`，
见 [tsconfig.base.json](../tsconfig.base.json)。以下补丁仅修改本地安装中的声明文件，
不修改依赖运行时代码。版本、目标路径及整个文件的 SHA-256 均被固定；未知内容或版本
必须失败并人工复核，不能直接更新哈希绕过保护。

## Storybook React 10.6.2

- 解析入口：项目本地 `@storybook/react-vite/package.json`，再解析其使用的
  `@storybook/react/package.json`，要求版本为 `10.6.2`。
- 目标文件：`@storybook/react/dist/chunk-ojHmM-yX.d.ts`。
- 修补内容：把 `ReactMeta` 的 `@ts-expect-error` 从接口签名内部移动到接口前一行；
  把 `story()` 的同类注释从参数内部移动到方法签名前一行。保留原有类型签名和注释内容。
- 原文件 SHA-256：`38cd16dff5398eb4ea0ec7286ad2923b51631672dc3cd3a224048e8482820c79`。
- 修补后 SHA-256：`fdfbabf470c56421cf57f998b542c495824c4b91a51cf57aa7f08244a60d7763`。

保留原因：锁定发布包中的注释位置无法覆盖对应的声明错误。官方
[issue #36452](https://github.com/storybookjs/storybook/issues/36452)
报告了 10.6.0 中同一文件、同一两处内联注释产生的 TS2578 和 TS2344，精确匹配此补丁
处理的声明形态；当前 10.6.2 的原始内容由脚本固定哈希确认。该 issue 核验时仍开放。

官方 [PR #36501](https://github.com/storybookjs/storybook/pull/36501)
于 2026-10-01 合并到 `next`，重写 CSF 类型并移除 preview 实现中的相关错误抑制注释。
这是可跟踪的上游改动，不代表当前锁定的 10.6.2 已包含修复，也不能仅凭 PR 合并删除补丁。

退出条件：在独立依赖升级中核验候选**发布包**的声明，确认两处注释位置已正确或对应类型
已重写；移除本项补丁后，保持上述严格选项，运行完整类型检查、Storybook 测试及构建通过。
同时删除本项版本/路径/哈希、变换及对应 fixture 逻辑；保留 Radix 尚需使用的准备流程。

## Radix Select 2.3.7

- 解析入口：项目本地 `radix-ui/package.json`，再解析其使用的
  `@radix-ui/react-select`，要求版本为 `2.3.7`。
- 目标文件：`@radix-ui/react-select/dist/index.d.mts`。
- 修补内容：把 `SelectPopperPositionProps` 的父类型 `PopperContentProps` 改为
  `Omit<PopperContentProps, "onPlaced">`，继续继承 `SelectPopperPrivateProps`。
- 原文件 SHA-256：`a0fa43b27364a340ea7639ff5fdffbcd375ecf49e6ed5df3eec73b3d74a84d58`。
- 修补后 SHA-256：`0e1ba18639e5838a7393eb9ca588f8832a4968f96f52bd8cd55ae2dce90a44d0`。

保留原因：两个父类型对 `onPlaced` 的声明不一致，在项目严格可选属性检查下发生继承冲突。
当前安装中 `PopperContentProps` 声明为 `onPlaced?: () => void`，而
`SelectPopperPrivateProps` 为 `onPlaced?: PopperContentProps['onPlaced']`；后者索引类型
包含 `undefined`。补丁让私有定位契约成为该字段的唯一来源，不改变回调的运行时实现。

上游精确 issue／修复：待补定位。本次未确认可精确匹配此版本和继承冲突的官方 issue
或已发布修复，不能将类似的 Select 类型问题视为同一问题。官方维护入口为
[Radix Primitives 仓库](https://github.com/radix-ui/primitives)、
[Select 源码](https://github.com/radix-ui/primitives/blob/main/packages/react/select/src/select.tsx)
与 [发布记录](https://github.com/radix-ui/primitives/releases)。

相关但不足以确认本项退出的上游证据：当前 Select 源码的私有回调已显式包含
`undefined`；[PR #4173](https://github.com/radix-ui/primitives/pull/4173)
处理全库可选属性的严格类型兼容；
[Select changelog](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/select/CHANGELOG.md)
在 2.4.0 记录了可选类型显式接受 `undefined`。这些证据不能替代对具体发布包及其 Popper
依赖的核验，本次没有验证升级后该双继承冲突是否消失。

退出条件：取得可核验的上游修复或候选发布包，确认 `onPlaced` 继承冲突在
`exactOptionalPropertyTypes: true` 下消失；移除本项补丁后，完整类型检查和现有 Select
相关组件、Storybook 测试及构建通过。同步删除本项版本/路径/哈希、变换及对应 fixture
逻辑；保留 Storybook 尚需使用的准备流程。

## 应用与只读校验

全新安装完成后显式运行写入任务：

```sh
pnpm run prepare:dependencies
```

常规验证使用只读入口；它检查两项补丁，尽管成功输出仅显示 Storybook 哈希：

```sh
pnpm run prepare:dependencies:check
pnpm run test:script script/prepare-dependencies.test.ts
pnpm run typecheck
```

现有测试覆盖本地安装解析、原子替换、幂等、检查模式不写入，以及 Storybook 未知内容和
版本变动时拒绝继续；fixture 同时包含 Radix 目标。不能据此宣称所有 Radix 失败分支均有
独立测试。脚本使用临时文件和重命名替换声明，不直接写入原有硬链接，测试确认缓存中的
原文件保持不变。

两项补丁都退出后，再删除准备脚本、测试及 package/CI/开发任务的调用入口，并在全新
冻结安装上运行 `pnpm run check` 和应用、Storybook 构建，确认不再依赖本地修补状态。
