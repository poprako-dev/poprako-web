# P007 — 迁移实用工具与浏览器 Worker 入口

计划状态：ready（设计）；实施状态：not-started。
前置工作包：P003

负责人：工具页负责人；utilities/business及与其直接相关浏览器验证脚本。shared压缩核心改动协调P002。

## 目标与范围

归档/图片压缩工具在新route与Vite8下完整运行，HTML字符串和Worker入口同步更新。

## 依据与开始条件

- [S02](../spec/02-structure-and-dependency.md)
- [S06](../spec/06-storybook-and-testing.md)
- [S07](../spec/07-quality-and-delivery.md)
- 基线无未识别变化；前置包的开始/完成门禁已经核实，新的失败有负责人与阻断范围。
- 用户已授权本次迁移；若执行者只接到文档任务，不得将本计划误当已开始的生产变更。

## 文件范围

Utilities、shared压缩调用方、test-bounded-browser/test-compress-browser/test-compress-interop等脚本与fixtures。

精确输入与去向见 [file-map.csv](../migration/file-map.csv) 中 plan=P007 的行。后续收敛修改遵循本节明确范围。

<!-- FILE_TABLE_START -->

基线文件：17 项。附表生成自迁移清单；以 source 为责任身份。

| 原文件 | 动作 | 最终去向 |
| --- | --- | --- |
| `scripts/test-bounded-browser.mjs` | move | `script/test-bounded-browser.mjs` |
| `scripts/test-compress-browser.mjs` | move | `script/test-compress-browser.mjs` |
| `scripts/test-compress-interop.mjs` | move | `script/test-compress-interop.mjs` |
| `src/features/Utilities/archive.test.ts` | move | `src/routes/_authenticated/_shell/utilities/business/archive.test.ts` |
| `src/features/Utilities/archive.ts` | move | `src/routes/_authenticated/_shell/utilities/business/archive.ts` |
| `src/features/Utilities/boundedCompression.ts` | move | `src/routes/_authenticated/_shell/utilities/business/bounded-compression.ts` |
| `src/features/Utilities/boundedImages.test.ts` | move | `src/routes/_authenticated/_shell/utilities/business/bounded-images.test.ts` |
| `src/features/Utilities/boundedImages.ts` | move | `src/routes/_authenticated/_shell/utilities/business/bounded-images.ts` |
| `src/features/Utilities/components/business/ArchiveFileList.tsx` | move | `src/routes/_authenticated/_shell/utilities/business/ArchiveFileList.tsx` |
| `src/features/Utilities/components/business/ArchiveOutput.tsx` | move | `src/routes/_authenticated/_shell/utilities/business/ArchiveOutput.tsx` |
| `src/features/Utilities/components/business/ArchiveTool.tsx` | move | `src/routes/_authenticated/_shell/utilities/business/ArchiveTool.tsx` |
| `src/features/Utilities/components/business/BoundedCompressionTool.tsx` | move | `src/routes/_authenticated/_shell/utilities/business/BoundedCompressionTool.tsx` |
| `src/features/Utilities/components/business/ImageSizeInput.tsx` | move | `src/routes/_authenticated/_shell/utilities/business/ImageSizeInput.tsx` |
| `src/features/Utilities/components/business/Utilities.tsx` | move | `src/routes/_authenticated/_shell/utilities/business/Utilities.tsx` |
| `src/features/Utilities/hook/useArchiveTool.ts` | move | `src/routes/_authenticated/_shell/utilities/business/use-archive-tool.ts` |
| `src/features/Utilities/hook/useBoundedCompression.ts` | move | `src/routes/_authenticated/_shell/utilities/business/use-bounded-compression.ts` |
| `src/features/Utilities/index.ts` | delete | 删除；理由见清单 |

新增文件 / 新职责（含从旧源提前提取的唯一目标）：

| 目标 | 职责 | 验证 |
| --- | --- | --- |
| `vite.browser-test.config.ts` | 压缩等浏览器脚本无route生成配置 | ST-06 |

<!-- FILE_TABLE_END -->

## 实施步骤

1. 迁移归档/限尺寸压缩界面、队列、输出与参数状态到utilities/business；通用算法与Worker留shared，不把工具页业务全部提升。
2. 完整检索脚本生成HTML、import URL、Worker new URL、测试资源路径和文档命令；改为新路径，给每处字符串入口建立回归检查。
3. 浏览器脚本独立启动Vite配置，不继承生产TanStack路由生成插件；使用统一受控Playwright Chromium而非本机channel:chrome。
4. 确定test:compress-browser/test:bounded-browser任务，验证真实图片/压缩Worker；将Unix ps内存采样和系统xz互操作明确归为有环境条件的诊断任务。
5. 保留取消、Blob释放、错误恢复和文件命名行为；大计算留Worker，进度不会冻结交互。

## 兼容要求

以 [兼容矩阵](../migration/compatibility-map.md) 和所引用 spec 为准；不改变本包未明确授权的后端协议、公开 URL 或用户数据格式。

## 验证

- [ ] archive/boundedImages/compress既有单元测试及归档格式互操作。
- [ ] 受控Chromium执行test:compress-browser与test:bounded-browser，验证真实导入、输出和取消。
- [ ] 扫描脚本/HTML/Worker内的src/features和src/lib旧入口；独立脚本运行不修改route-tree.gen.ts。

## 完成标准

- [ ] utilities业务完整迁移；scripts字符串源码入口全部在清单中处理。
- [ ] 通用跨平台测试不依赖系统Chrome或Unix ps；平台诊断前提写入文档。

## 风险与恢复

Vite8 Worker预打包与node-liblzma可能改变加载方式。先用现有fixture验证真实浏览器，不以bundle成功代替压缩功能通过。

## 协作与执行记录

前置依赖未满足时禁止开始本包。可按索引与其他业务包并行；shared、root、路由树或根配置修改交主负责人串行集成。

执行时在本节追加日期、实际提交、命令和退出码、发现/修复以及未完成项；不要预先勾选。

## 需求追踪

R2-01、R2-02、R2-05、R2-07、R2-08、R2-11、R3-01、R3-04、R4-01、R4-02、R4-04、R4-06、R5-01、R5-06、R5-08、R7-05。条款决定与验收证据见[需求矩阵](../requirements-matrix.md)和[覆盖审查](../review/coverage-matrix.md)。
