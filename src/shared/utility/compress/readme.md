# 浏览器 TAR/Zstandard ↔ ZIP 流式工具

公共入口为 `@/shared/utility/compress`，供实用工具及嵌稿上传使用。

```ts
import { compressTarZst, decompressTarZstToZip } from "@/shared/utility/compress";

const archive = compressTarZst(
  files.map((blob) => ({ name: blob.name, blob })),
  { signal: abortController.signal, preset: 3, onProgress: updateProgress },
);
await archive.pipeTo(tarZstWritable);

const zip = decompressTarZstToZip(response.body, {
  signal: abortController.signal,
  extraFiles: [{ name: "translation.lp.txt", blob: new Blob([labelPlus]) }],
});
await zip.pipeTo(zipWritable);
```

目标 writable 可以是用户文件、OPFS 或有界上传 sink。等待 `pipeTo` 成功后才报告完成。
发生错误时必须丢弃未完成的文件；输出不汇集为整个归档的 Blob。

## 编解码与参数

- 使用已发布的 `simple-wasi-zstd@0.1.5` 预编译 WASM 和其公开流式函数；无需自建编译器。
  WASM 由依赖内嵌并随本地 Worker bundle 发布，没有运行时 CDN 请求。
- 按 2026-10-08 最终确定的参数，默认 **Zstandard level 3、256 MiB 窗口
  （windowLog=28）、LDM、帧校验和**。`preset` 保留为压缩等级选项，支持 1–6。
- 解码最大窗口为 256 MiB。输入和输出缓冲均为 64 KiB，每输出一块等待下游读取。
  字典、压缩上下文、Worker 和浏览器缓存还会占用内存；64 KiB 不是总内存上限。
- 每次操作独立创建 Worker/WASM 实例。完成、取消、写入失败和读取失败均终止 Worker。
  下载输入流在主线程桥接 AbortSignal，取消会停止上游读取。
- `modern-tar@0.8.4` 负责流式 TAR 打包和严格解析。
- `@zip.js/zip.js@2.11.1` 顺序写 ZIP64，使用 STORE，不再次压缩文件内容。

## 边界

- 接受单个 Zstandard 帧中的普通 TAR 文件和目录；拒绝截断、损坏、尾随垃圾和拼接帧。
  不再支持 XZ。实用工具输出 `.tar.zst`，解包结果为 `.zip`，上传 API 提交 `ext: "zst"`。
- 默认最多 1000 项、8 GiB 文件内容，可通过 `maxFiles` / `maxBytes` 调整；解包预算包含
  `extraFiles`。这不是浏览器 RSS 上限。
- 保留相对路径、中文名称和文件字节；拒绝绝对路径、`..`、反斜线、控制字符、链接以及
  NFC/大小写归一化后重名的路径。时间和权限不保证还原。
- 进度回调报告累计文件内容字节和完成条目数；完成归档仍须等待输出关闭。
- 依赖 Worker、可转移 ReadableStream、WebAssembly；OPFS 保存需浏览器支持。

## 验证

```sh
deno task test:unit src/shared/utility/compress/core.test.ts
deno run -A --unstable-sloppy-imports script/test-compress-interop.mjs
deno task test:compress-browser
deno task lint:function-lines
deno task check
```

单元测试检查 ZST 魔数、256 MiB 窗口和帧校验标识，并覆盖往返、中文/空文件、分片输入、
截断/损坏、非法路径、链接、重名、资源限制、输出背压和取消。
互操作脚本使用系统 `zstd`、TAR 和 Python，验证双向解码、长中文路径和 ZIP64。
浏览器测试使用生产 Vite bundle、真实 Worker 和 OPFS，验证 SHA-256、取消、主线程响应、
输出失败和 Worker 回收。生成数据留在被 Git 忽略的 `test-resource/generated/`。

此前 2026-10-08 的 47 页 PSD 浏览器实验，level 3＋256 MiB 窗口＋LDM 得到
220.39 MiB，打包压缩落盘约 14.54 秒、解包落盘约 6.14 秒。记录位于
`test-resource/generated/revision-performance-rar/zstd-budget/`，是历史原型测量，
不能当作当前 ZIP 输出路径或所有机器的性能承诺。旧 XZ 实测不再用于描述当前实现。
