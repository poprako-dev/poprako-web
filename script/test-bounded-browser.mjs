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
import '/src/application/style.css';
import { runBoundedBrowserCheck } from '/src/test-resource/bounded-browser-check.ts';
const [{ Utilities }, { prepareBoundedArchive }, { ZipReader, BlobReader, BlobWriter }] = await Promise.all([
  import('/src/route/_authenticated/_shell/utilities/business/Utilities.tsx'),
  import('/src/route/_authenticated/_shell/utilities/business/bounded-compression.ts'),
  import('@zip.js/zip.js'),
]);
createRoot(document.getElementById('root')).render(React.createElement(Utilities));
const tools = { prepareBoundedArchive, ZipReader, BlobReader, BlobWriter };
globalThis.boundedTest = { ...tools, run: () => runBoundedBrowserCheck(tools) };
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
  const report = await page.evaluate(() => globalThis.boundedTest.run());
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
  if (process.argv.includes("--screenshot")) {
    await page.screenshot({ path: path.join(generated, "mobile.png") });
  }
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
