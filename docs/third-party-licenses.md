# 第三方许可核查

本次核查覆盖仓库中受 Git 跟踪的字体和静态资产、冻结依赖图中的生产依赖、
应用与 Storybook 构建及静态发布归档。它是工程层面的许可清单和来源核对，
不等于对全部历史贡献、商标或授权链的法律保证。

## 项目许可证

2026-10-26 按维护者明确指示，项目自有代码的许可证改为 GNU Affero General
Public License v3.0 only，SPDX 标识为 `AGPL-3.0-only`。`LICENSE`、`package.json`、
README 和静态附带声明使用同一标识；项目版权归 PopRaKo contributors。
正文采用 [SPDX 官方许可证文本](https://github.com/spdx/license-list-data/blob/main/text/AGPL-3.0-only.txt)。
第三方字体、依赖和内嵌原生代码继续按下列各自许可分发。

## 思源黑体

- 字体：Source Han Sans SC VF，2.005，65,535 个字形，`wght` 范围 250–900。
- 来源：[Adobe 官方发布树](https://github.com/adobe-fonts/source-han-sans/tree/a4f7cf94edfb9d7ffbdfc4841de276358bd7e0f2/Variable/WOFF2/TTF)。
- 原始文件：`SourceHanSansSC-VF.ttf.woff2`；本地仅更改文件名为
  `public/SourceHanSansSC-VF.woff2`，未修改内部名称或字体数据。
- SHA-256：`cfec773cdc2ea964de8713471c6fd20774bc40617f5567f92efeeccaca6604b0`。
- 版权：2014–2025 Adobe，保留名称 `Source`。
- 许可：[SIL OFL 1.1 全文](../public/SourceHanSansSC-LICENSE.txt)。

此前本地重新压缩版本与官方版的各字体表一致，仅 `head` 表中的修改时间和校验值
不同。本次改用官方原始二进制，避免依赖对重新压缩及保留名称规则的解释。

[官方 OFL FAQ](https://openfontlicense.org/ofl-faq/) 的 1.2、1.3、2.1、2.2.1
允许字体与其他许可证的软件捆绑及作为 Web 字体分发，并解释了 WOFF 转换规则。
因此可以与 AGPLv3 软件一起分发，但字体本身仍必须保持 OFL；这与将字体代码
重新许可为 AGPLv3 是两件事。版权及 OFL 全文随 `public/` 资源进入发布产物。

## 生产依赖与发布声明

使用 `pnpm licenses list --prod --json` 检查当前冻结安装图：116 个包版本，
涵盖 MIT、ISC、BSD-3-Clause、Apache-2.0、Unlicense、0BSD、
`MIT OR GPL-3.0-or-later` 和 `MIT AND Zlib`。未在这份生产图中发现强制
AGPL/GPL 单一许可的包；这不等于声称所有包内嵌代码都已独立审计。

- JSZip 3.10.1 明确选择 MIT 分支，保留包内完整双许可文件。
- Lucide 1.48.0 的 ISC 文件包含派生 Feather 图标的 MIT 声明，完整保留。
- pako 的包级 MIT 文件之外，保留 `lib/zlib/deflate.js` 中的 Zlib 声明。
- isarray 1.0.0 的 MIT 全文在 README 中，构建时提取该段。
- react-remove-scroll-bar 2.3.8 的 npm 包缺少 MIT 全文，补充上游版权与全文；
  来源固定到 `8ca9ba5ea52de03308fe8ced94f7b159a44d28ff`。
- Storybook 10.6.2 及其部分预览包缺少仓库级 MIT 全文，从官方 `v10.6.2`
  标签补充 `storybook-LICENSE.txt`，随静态资源发布。
- simple-wasi-zstd 0.1.5 的 MIT 不替代底层 Zstandard 许可；根据该版本的
  Git 子模块 `a488ba114ec17ea1054b9057c26a046fc122b3b6` 补充 BSD 全文。
- WASM 的 `producers` 元数据标记 clang 12.0.1，保留对应 LLVM 许可。
  同时附带截至包装层发布时间的 WASI libc 来源
  `a78cd329aec717f149934d7362f57050c9401f60` 中 Apache、LLVM 例外、MIT、
  musl 和 cloudlibc 的声明，作为运行库参考；不将时间接近视为准确版本证明。

每次构建生成 `RUNTIME-LICENSES.txt`，覆盖全部生产依赖及 Worker 使用的包，
保留许可证、NOTICE 和 AUTHORS。没有全文或出现未经核查的许可标识时，构建失败。
Vite 同时生成 `THIRD-PARTY-LICENSES.md`，保留实际打包模块的许可，覆盖 Storybook
预览中出现的额外依赖。项目自己的 AGPL-3.0 全文输出为 `LICENSE.txt`。
静态发布归档包含整个 `dist/`，因此这些声明与字体随站点一起发布。

构建内置许可收集不涵盖字体和作为二进制资产复制的 WASM，不能单独作为完整清单；
因此另有[静态附带声明](../public/THIRD-PARTY-NOTICES.txt)及字体、Zstandard 原文。

## 尚不能由仓库证明的事项

- `public/favicon.ico` 已由项目维护者确认属于自行创作或已获授权标志。
  这项依据是维护者声明，不是第三方授权文件的独立核验。
- simple-wasi-zstd 发布包自带预编译 WASM。已核实其包装层与 Zstandard 子模块，
  但上游构建只给出 `/opt/wasi-sdk/wasi-sysroot`，未固定完整 SDK 版本或发布二进制
  的构建证明。本次没有重建 WASM，不能据此证明静态链接的 libc、编译器运行库
  及其所有源文件的精确版本。上线前应补齐上游构建来源和对应运行库声明，或用
  有固定来源、许可证和可复现流程的 WASM 替换。
- `test-resource/` 被 Git 忽略，本次没有把其中的漫画、PSD、图片或压缩包加入
  提交或发布，也没有推定这些本地素材获得了公开分发授权。
- 对萌翻、LabelPlus 等项目的致谢不构成代码授权证明；本次未对所有历史提交
  做逐行来源比对。若曾复制代码，应按原文件许可另行确认，不能用致谢代替。

## 后续维护

新增字体、图像、WASM 或复制代码时，记录来源、版本、版权、许可和修改情况。
升级依赖后重新核对新增许可及包内附带声明；更新字体时同时更新许可与哈希。
不要只看包元数据的 SPDX 标签，也不要把依赖图检查视为完整法律审计。
