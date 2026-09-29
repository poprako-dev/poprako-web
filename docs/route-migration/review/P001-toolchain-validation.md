# P001 隔离工具链验证

状态：隔离基础运行与类型修复验证成功，P001.b已开始将工具链落入项目；完整项目验收尚未完成。

环境为Deno2.9.6、macOS arm64。所有目标依赖按S01精确版本安装于
`/tmp/poprako-toolchain-8c6e144def78c753`，DENO_DIR也在该目录，未覆盖项目node_modules。
完整manifest、安装日志和最小复现保存在该临时验证目录；后续实施需要将可复现修复和证据纳入仓库。

## 已取得证据

| 检查 | 结果 | 限制 |
| --- | --- | --- |
| 原Web typecheck/lint/build | 各退出0 | 原工具链与旧规则 |
| 原Web unit | 45文件、240测试通过 | Vitest4.1.11 |
| 原Web Storybook启动 | 代理2项测试与真实smoke通过 | 沙箱端口限制后获工具权限重试 |
| 目标隔离安装 | 重试后退出0，无必选peer警告 | 首次DNS、第二次连接中断属于环境失败 |
| 目标Vite8+React19.1生产fixture | 退出0 | 不等于完整Web应用升级后构建 |
| 目标Vitest4.1.7 Node与RTL/jsdom | 2项fixture通过 | 不等于全仓回归 |
| 目标ESLint9插件组合 | 退出0 | 不等于存量源码lint通过 |
| 目标Storybook10.6启动/静态构建 | 各退出0 | 浏览器全部play尚未运行 |
| 目标strict类型检查 | 失败 | 下列两类依赖声明问题尚未解除 |

## 阻断一：Storybook已有抑制注释的发布排版

原发布包`@storybook/react@10.6.0/dist/chunk-ojHmM-yX.d.ts`中，
ReactMeta与story overload的两条已有`@ts-expect-error`被排在同一行声明前。
TypeScript报告两处TS2578和两处TS2344；只导入相关Storybook类型即可复现，
不能归属为待迁移的Web业务源码诊断。

独立复核确认存在真实泛型约束不一致：ComponentAnnotations的默认Args与T['args']、
AddMocks后的参数与未加mock的ReactStory约束不等价。真正修复需联动Preview→Meta→Story推导，
不能通过随意加交叉类型、any或删除约束声称修复。

当前候选方案仅将发布包原有两条抑制注释恢复到声明的上一行，保持原泛型和运行代码不变。
这恢复上游意图，**不证明其CSF factory泛型已经正确**。若采用，必须精确限定版本、文件与原始内容hash，
记录可逆diff、修复后hash、清洁安装重放与过期检测；不得新增源码抑制或关闭skipLibCheck。
独立worker与主集成均复跑排版修复probe，diagnostics为0；错误Meta/StoryObj参数反例仍被拒绝。
主集成选择该限定方案（D19）；P001.c已验证清洁安装重放，项目安装步骤由P001.b落地。

原文件SHA256：`38cd16dff5398eb4ea0ec7286ad2923b51631672dc3cd3a224048e8482820c79`；
限定排版修复后：`fdfbabf470c56421cf57f998b542c495824c4b91a51cf57aa7f08244a60d7763`。
安装时可写，typecheck/check仅检查修复已正确准备；既不是自动忽略未知错误，也不允许检查时悄悄改依赖。

曾为验证注释位置在隔离node_modules做临时改写，已恢复原文件并对比原文；
原包保存在`reproduction/storybook-original.d.ts`，实验副本与diff分别保存。
独立复核使用原始deno-cache副本，不把实验文件当成发布内容。

官方[发布列表](https://github.com/storybookjs/storybook/releases)当前显示稳定版10.6.0，
后续为11.0.0预发布；未发现可直接采用的稳定修复版本证据。

## 阻断二：不同测试环境的matcher全局声明冲突

最小输入同时导入`@testing-library/jest-dom/vitest`和`vitest/config`，
触发AsymmetricMatchersContaining的TS2320：TestingLibraryMatchers<any,any>与<void,void>扩展不一致。
来源是jsdom测试扩展与Vitest浏览器matcher进入同一TypeScript程序。

候选处理：独立tsc程序检查jsdom测试和工具/browser配置，保证全部生产源码、测试、stories和配置
各有负责的严格检查程序。不能仅将冲突文件排除后不再检查，也不能用skipLibCheck绕过。
生产和浏览器侧不得导入jsdom setup；集成测试不得导入工具配置来获取运行设置。

## 调度决定

P001.a基础隔离验证已有证据，但P001整体尚未验收。
P001.c已完成：独立目录`/tmp/poprako-toolchain-fix-d6791a785b9acbb6`的app/integration/storybook/tools
四个strict程序均退出0；同一最终配置下原声明退出2、限定排版修复后退出0。
首次准备、重复准备、只读verify、恢复通过，未知hash返回1且不写入；原目录和registry cache保持原hash。
详细本机报告为该目录的`RESULT-C.md`。据此解锁P001.b实际项目配置更新，进入新的项目级验收。
P002及后继实现未解锁，已有P002消费者清点仅为只读准备。
