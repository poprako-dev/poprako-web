// Deno 2.9: deno run -A script/test-bounded-browser.mjs
/// <reference lib="dom" />
/// <reference path="./browser-test-globals.d.ts" />
import { build, preview } from "vite";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createViteBase } from "../src/application/vite-base.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const generated = path.join(root, "test-resource/generated/bounded");
await mkdir(generated, { recursive: true });
const html = path.join(generated, "index.html");
await writeFile(
  html,
  `<div id="root" style="height:100dvh"></div><script type="module">
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Utilities } from '/src/route/_authenticated/_shell/(utility)/business/Utilities.tsx';
import { prepareBoundedArchive } from '/src/route/_authenticated/_shell/(utility)/business/bounded-compression.ts';
import { ZipReader, BlobReader, BlobWriter } from '@zip.js/zip.js';
import '/src/application/style.css';
createRoot(document.getElementById('root')).render(React.createElement(Utilities));
globalThis.boundedTest = { prepareBoundedArchive, ZipReader, BlobReader, BlobWriter };
</script>`,
);
const outDir = path.join(generated, "dist");
const base = createViteBase();
await build({
  ...base,
  configFile: false,
  root,
  build: { ...base.build, outDir, rollupOptions: { input: html } },
  logLevel: "warn",
});
const server = await preview({
  ...base,
  configFile: false,
  root,
  build: { ...base.build, outDir },
  preview: { host: "127.0.0.1", port: 4183, strictPort: true },
});
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:4183/test-resource/generated/bounded/index.html");
  await page.waitForFunction(() => Boolean(globalThis.boundedTest));
  const report = await page.evaluate(async () => {
    const { prepareBoundedArchive, ZipReader, BlobReader, BlobWriter } = globalThis.boundedTest;
    /** @param {unknown} condition @param {string} message */
    const assert = (condition, message) => {
      if (!condition) {
        throw new Error(message);
      }
    };
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context unavailable");
    }
    const pixels = ctx.createImageData(canvas.width, canvas.height);
    let seed = 42;
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      pixels.data[i] = seed & 255;
      pixels.data[i + 1] = (seed >>> 8) & 255;
      pixels.data[i + 2] = (seed >>> 16) & 255;
      pixels.data[i + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
    /** @type {Blob} */
    const png = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("PNG encoding failed"))),
        "image/png",
      ),
    );
    const items = ["10.png", "2.png", "1.png"].map((name) => ({
      id: name,
      file: new File([png], name, { type: "image/png" }),
      limitKiB: name === "10.png" ? "32" : null,
    }));
    const root = await navigator.storage.getDirectory();
    const before = [];
    for await (const key of root.keys()) {
      before.push(key);
    }
    /** @type {number[]} */
    const progress = [];
    /** @type {(count: number) => void} */
    const onProgress = (count) => {
      progress.push(count);
    };
    const result = await prepareBoundedArchive(
      items,
      "128",
      "64",
      new AbortController().signal,
      onProgress,
    );
    const reader = new ZipReader(new BlobReader(result.file));
    /** @type {any[]} */
    const entries = await reader.getEntries();
    assert(entries.map((entry) => entry.filename).join() === "1.webp,2.webp,10.webp", "sort");
    const sizes = [];
    for (const [i, entry] of entries.entries()) {
      const blob = await entry.getData(new BlobWriter());
      assert(blob.size <= [64, 128, 32][i] * 1024, "size limit");
      const header = new TextDecoder().decode((await blob.arrayBuffer()).slice(0, 12));
      assert(header.startsWith("RIFF") && header.endsWith("WEBP"), "WebP signature");
      const bitmap = await createImageBitmap(blob);
      assert(bitmap.width > 0 && bitmap.height > 0, "decodable image");
      bitmap.close();
      sizes.push(blob.size);
    }
    await reader.close();
    await result.dispose();
    canvas.width = 1;
    canvas.height = 1;
    const smallPng = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const small = await prepareBoundedArchive(
      [
        {
          id: "small",
          file: new File([smallPng], "small.png", { type: "image/png" }),
          limitKiB: null,
        },
      ],
      "1024",
      "512",
      new AbortController().signal,
      () => {},
    );
    const smallReader = new ZipReader(new BlobReader(small.file));
    const [smallEntry] = await smallReader.getEntries();
    const smallBlob = await smallEntry.getData(new BlobWriter());
    const smallHeader = new TextDecoder().decode((await smallBlob.arrayBuffer()).slice(8, 12));
    assert(smallHeader === "WEBP", "images already below the limit must still become WebP");
    await smallReader.close();
    await small.dispose();
    assert(progress.join() === "1,2,3", "progress");
    const controller = new AbortController();
    let cancelled = false;
    try {
      await prepareBoundedArchive(items, "128", "64", controller.signal, () => controller.abort());
    } catch {
      cancelled = true;
    }
    assert(cancelled, "cancellation");
    let corruptFailed = false;
    try {
      await prepareBoundedArchive(
        [{ id: "bad", file: new File(["bad"], "bad.png", { type: "image/png" }), limitKiB: null }],
        "128",
        "64",
        new AbortController().signal,
        () => {},
      );
    } catch {
      corruptFailed = true;
    }
    assert(corruptFailed, "corrupt input");
    const after = [];
    for await (const key of root.keys()) {
      after.push(key);
    }
    assert(before.sort().join() === after.sort().join(), "temporary file cleanup");
    return { sizes, png: [...new Uint8Array(await png.arrayBuffer())] };
  });
  await page.getByRole("button", { name: "定界压缩", exact: true }).click();
  await page.getByLabel("选择待压缩图片").setInputFiles(
    ["10.png", "2.png", "1.png"].map((name) => ({
      name,
      mimeType: "image/png",
      buffer: Buffer.from(report.png),
    })),
  );
  /** @param {string} name */
  const input = (name) => page.getByRole("spinbutton", { name, exact: true });
  if ((await input("1.png 压缩上限").inputValue()) !== "512") {
    throw new Error("cover default");
  }
  await input("2.png 压缩上限").fill("96");
  await input("默认正文大小").fill("128");
  if ((await input("2.png 压缩上限").inputValue()) !== "96") {
    throw new Error("custom limit");
  }
  if ((await input("10.png 压缩上限").inputValue()) !== "128") {
    throw new Error("body default");
  }
  await page.getByRole("button", { name: "移除 1.png", exact: true }).click();
  if ((await input("2.png 压缩上限").inputValue()) !== "96") {
    throw new Error("custom cover");
  }
  await page.getByRole("button", { name: "恢复 2.png 默认上限", exact: true }).click();
  if ((await input("2.png 压缩上限").inputValue()) !== "512") {
    throw new Error("reset cover");
  }
  await page.getByRole("button", { name: "开始压缩", exact: true }).click();
  await page.getByRole("link", { name: "下载 ZIP" }).waitFor({ timeout: 60000 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(generated, "mobile.png") });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  if (overflow) {
    throw new Error("mobile horizontal overflow");
  }
  console.log("Bounded compression browser checks passed", { sizes: report.sizes });
} finally {
  await browser?.close();
  /** @type {Promise<void>} */
  const serverClosed = new Promise((resolve, reject) =>
    server.httpServer.close((error) => (error ? reject(error) : resolve())),
  );
  await serverClosed;
}
