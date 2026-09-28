# 浏览器 TAR/XZ ↔ ZIP 流式工具

公共入口是 `@/shared/utility/compress`，目前不接入页面或 OSS API。

```ts
import { compressTarXz, decompressTarXzToZip } from "@/shared/utility/compress";

// files 是文件选择器提供的 File[]；无需 arrayBuffer()。
const archive = compressTarXz(
  files.map((blob) => ({ name: blob.name, blob })),
  { signal: abortController.signal, preset: 3, onProgress: updateProgress },
);
await archive.pipeTo(tarXzWritable);

// response.body 是 OSS 下载响应的流；检查 response.ok / body 后传入。
const zip = decompressTarXzToZip(response.body, {
  signal: abortController.signal,
  extraFiles: [{ name: "translation.lp.txt", blob: new Blob([labelPlus]) }],
});
await zip.pipeTo(zipWritable);
```

`tarXzWritable` / `zipWritable` 由调用方提供，可以是用户选择的文件或 OPFS
文件的可写流。等待 `pipeTo` 成功后才报告完成。出现错误时，`pipeTo` 会中止目标；
自定义上传/文件 sink 应在 `abort` 中丢弃未完成的数据。
这里不生成下载链接，也不把所有输出收集为 Blob。需要 Blob 的调用方可以自行收集，
但内存/存储占用将随最终文件大小增长。

## 实现选择

- `modern-tar@0.8.4`：使用 `createTarPacker` / `createTarDecoder`；不使用汇集整个
  归档的 `packTar` / `unpackTar` 便捷接口。
- `node-liblzma@5.1.1`：使用公开 WASM 增量绑定。输入和输出的编解码块均限制在
  64 KiB，每产生一块输出就等待下游读取。库自带的 TransformStream 会在一次
  transform 中排出当前输入的全部解压结果，因此没有直接使用。
- `@zip.js/zip.js@2.11.1`：顺序写入 ZIP64，使用 STORE，避免下载时再次进行
  大量压缩计算。文件内容不会一次性保留在 JSZip 中。
- 每次操作创建一个独立 Worker；完成、取消、目标写入失败、源读取失败都会终止
  Worker，释放整个 WASM 实例。传入的下载流有主线程 AbortSignal 桥接，避免仅
  终止 Worker 后网络流继续读取。Worker 的输出采用逐块请求/响应背压。
- WASM 由 Vite 的 `?url` 作为本地静态资源发布，没有运行时 CDN 请求。
  `node-liblzma/inline` 在所测版本中初始化失败，已避免使用。
- 原先的 `tar-xz` 依赖已移除：它的浏览器接口会先汇集完整归档。

## 边界与接入约定

- 默认 XZ preset 为 3，可设置 0–6；解码器字典等工作内存上限为 64 MiB。
  总浏览器内存还包括 Worker、JS、ZIP/TAR 元数据及浏览器文件缓存。
- 默认最多 1000 个归档条目、8 GiB 文件内容，可通过 `maxFiles` / `maxBytes`
  修改。解压时限制包含 `extraFiles`。这些是文件内容预算，不是浏览器进程 RSS 限额。
- `onProgress` 在一个文件完成后回调，包含累计文件内容字节和完成条目数；进度回调
  不等于整个归档已经完成，仍须等待输出流关闭。
- 保留相对路径、中文文件名及文件字节。拒绝绝对路径、`..`、反斜线、控制字符、
  符号链接、硬链接，以及 NFC/大小写归一化后重名的路径。文件时间/权限不保证还原。
- 目标是本工具生成的单个 XZ 流及普通文件/目录的 TAR；不支持拼接的多个 XZ 流、
  XZ 尾部填充或任意第三方归档格式。TAR 元数据解析交由 modern-tar。
- `extraFiles` 可以加入翻译文本、JSON、图源等，最终仍只有一个 ZIP。无需提供已有
  JSZip 对象；这样才能让大文件输出保持流式。
- OSS 上传适配器应消费流并使用有界分片上传，或先写本地文件后上传。不能假设浏览器
  Fetch 的流式 PUT 在所有浏览器及 OSS 接口都可用。本模块不实现 OSS 协议。
- 测试环境为 macOS / Chrome。依赖 Worker、可转移 ReadableStream、WebAssembly；
  未验证 Safari/Firefox。文件保存方式及兼容性回退由 UI 层决定。

## 可复现验证

使用 Deno 2.9；真实 PSD 放在 `test-resources/` 任意子目录下。测试代码位于
`src/shared/utility/compress/core.test.ts` 和 `script/`，所有生成样本、报告、浏览器配置都在
被 Git 忽略的 `test-resources/generated/`。不会修改原 PSD。

```sh
deno task test:unit src/shared/utility/compress/core.test.ts
deno run -A --unstable-sloppy-imports script/test-compress-interop.mjs
deno run -A script/test-compress-browser.mjs --preset=3
deno run -A script/test-compress-browser.mjs --large --preset=3
sh script/ci-check.sh
```

浏览器测试使用已安装的 Google Chrome、生产 Vite bundle、真实 Worker 和 OPFS。
使用独立的持久化测试配置，避免无痕浏览器较小的存储配额；仍需要足够的浏览器配额
和磁盘空间同时容纳 XZ 与 ZIP。测试结束删除 OPFS 中的归档。
压力测试把一个真实 PSD 的 20 MiB 切片重复作为 200 个不同名称的逻辑文件，
总计 4,194,304,000 字节；它用于检验规模与字节正确性，不代表 200 个独立 PSD
的压缩率，也不保证切片自身是有效 PSD。

单元测试覆盖二进制/中文/空文件往返、分片输入、损坏或截断的 XZ/TAR、非法路径、
链接、重名、文件数/体积限制，以及高压缩率数据的逐块输出和上游取消。
互操作测试使用系统 TAR/XZ 和 Python tarfile/zipfile，覆盖长中文路径和 ZIP64。
浏览器测试逐文件校验 SHA-256，并检查背压、主线程响应、取消、输出失败与 Worker 回收。
`browser-*-report.json` 记录实际耗时；内存采样为整个 Chrome 进程树 RSS，包含校验阶段，
不能当作压缩器独占内存，也不是所有机器的固定上限。

## 本次实测（2026-09-06）

macOS，Chrome 152.0.7977.82，生产构建，默认 preset 3：

| 数据                   |      输入字节 |    XZ 字节 |    压缩 | 解压并写 ZIP | SHA-256      |
| ---------------------- | ------------: | ---------: | ------: | -----------: | ------------ |
| 36 个真实 PSD          |   794,784,216 | 45,873,688 | 16.2 秒 |       4.9 秒 | 36/36 一致   |
| 200 个 20 MiB 逻辑文件 | 4,194,304,000 | 73,200,356 | 37.5 秒 |      20.4 秒 | 200/200 一致 |

第二行重复使用同一 PSD 切片，其压缩率不应外推到真实章节。
两个测试的 Chrome 进程树 RSS 采样峰值分别约 1430 / 1918 MiB，基线均约 826 MiB；
包含 ZIP 读取校验和浏览器自身开销，不是纯 Worker 堆或编解码工作内存测量。
停止消费、中途取消、写入失败、截断尾部检查均通过，结束时模块 Worker 数量为 0。
完整报告为 `browser-report.json`、`browser-large-report.json`，互操作报告为
`interop-report.json`，均位于 `test-resources/generated/`。
