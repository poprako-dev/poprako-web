// Deno 2.9: deno run -A script/test-compress-browser.mjs [--large]
/// <reference lib="dom" />
/// <reference path="./browser-test-globals.d.ts" />
// All input/output data stays under test-resource. Production Vite bundle, real Chromium Worker.
import { build, preview } from "vite";
import { chromium } from "playwright";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const root = fileURLToPath(new URL("../", import.meta.url));
const generated = path.join(root, "test-resource/generated");
await mkdir(generated, { recursive: true });

async function createBrowserFixtures() {
  // The archive treats PSD inputs as opaque bytes; keep the standard CI case self-contained.
  const directory = path.join(generated, "browser-input");
  await mkdir(directory, { recursive: true });
  const paths = [];
  for (const [index, size] of [8, 2, 1].map((mib) => mib * 1024 ** 2).entries()) {
    const bytes = new Uint8Array(size);
    let state = index + 1;
    for (let offset = 0; offset < size; offset++) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      bytes[offset] = state & 255;
    }
    const file = path.join(directory, `sample-${String(index + 1)}.psd`);
    await writeFile(file, bytes);
    paths.push(file);
  }
  return paths;
}

const html = path.join(generated, "browser.html");
await writeFile(
  html,
  `<input type="file" multiple id="files"><script type="module">
import * as archive from '/src/shared/utility/compress.ts';
import { runCompressionCheck } from '/src/test-resource/compress-browser-check.ts';
import { ZipReader, BlobReader, BlobWriter } from '@zip.js/zip.js';
const tools = { ...archive, ZipReader, BlobReader, BlobWriter };
globalThis.testArchive = { ...tools, run: (large, preset) => runCompressionCheck(tools, large, preset) };
</script>`,
);
await build({
  configFile: false,
  root,
  logLevel: "warn",
  build: { outDir: path.join(generated, "browser-dist"), rollupOptions: { input: html } },
});
const server = await preview({
  configFile: false,
  root,
  logLevel: "warn",
  build: { outDir: path.join(generated, "browser-dist") },
  preview: { host: "127.0.0.1", port: 4178, strictPort: true },
});
// Persistent profile avoids incognito's smaller storage quota. Keep even OPFS test data here.
const context = await chromium.launchPersistentContext(path.join(generated, "chrome-profile"), {
  headless: true,
});
const browser = context.browser();
if (!browser) {
  throw new Error("Chromium context did not create a browser");
}
const profiling = process.argv.includes("--profile");
const session = profiling ? await browser.newBrowserCDPSession() : undefined;
/** @type {{ time: number; rssMiB: number }[]} */
const memorySamples = [];
let sampling = false;
const sampleMemory = async () => {
  if (!session || sampling) {
    return;
  }
  sampling = true;
  try {
    const { processInfo } = await session.send("SystemInfo.getProcessInfo");
    const { stdout } = await exec("ps", [
      "-o",
      "rss=",
      "-p",
      processInfo.map((info) => info.id).join(","),
    ]);
    memorySamples.push({
      time: Date.now(),
      rssMiB:
        stdout
          .trim()
          .split(/\s+/)
          .reduce((n, value) => n + Number(value), 0) / 1024,
    });
  } catch {
    /* A Worker/process may exit between enumeration and sampling. */
  } finally {
    sampling = false;
  }
};
if (profiling) await sampleMemory();
const memoryTimer = profiling ? setInterval(sampleMemory, 1000) : undefined;
try {
  const page = await context.newPage();
  page.on("console", (message) => console.log("browser:", message.text()));
  page.on("pageerror", (error) => console.error("pageerror:", error));
  await page.goto("http://127.0.0.1:4178/test-resource/generated/browser.html");
  await page.waitForFunction(() => Boolean(globalThis.testArchive));
  const paths = process.argv.includes("--large")
    ? (await readdir(path.join(root, "test-resource"), { recursive: true }))
        .filter((name) => name.toLowerCase().endsWith(".psd") && !name.startsWith("generated/"))
        .sort()
        .map((name) => path.join(root, "test-resource", name))
    : await createBrowserFixtures();
  if (paths.length === 0) {
    throw new Error("Large test requires PSD fixtures under test-resource/");
  }
  await page.locator("#files").setInputFiles(paths);
  const report = await page.evaluate(
    ({ large, preset }) => globalThis.testArchive.run(large, preset),
    {
      large: process.argv.includes("--large"),
      preset: Number(process.argv.find((arg) => arg.startsWith("--preset="))?.split("=")[1] ?? 3),
    },
  );
  await new Promise((resolve) => setTimeout(resolve, 200));
  // zip.js's independent verification reader keeps a reusable Worker pool alive.
  const archiveWorkers = page
    .workers()
    .filter((worker) => worker.url().includes("/archive.worker-"));
  if (archiveWorkers.length !== 0) {
    throw new Error("Archive Worker leaked after completion");
  }
  /** @type {any} */
  const completeReport = report;
  completeReport.remainingArchiveWorkers = archiveWorkers.length;
  completeReport.browserVersion = browser.version();
  if (profiling) {
    completeReport.memory = {
      scope: "Sampled whole Chromium process tree RSS, including verification",
      baselineMiB: memorySamples[0]?.rssMiB,
      peakMiB: Math.max(...memorySamples.map((sample) => sample.rssMiB)),
      samples: memorySamples,
    };
    await writeFile(
      path.join(
        generated,
        process.argv.includes("--large") ? "browser-large-report.json" : "browser-report.json",
      ),
      JSON.stringify(report, null, 2),
    );
  }
  const summary = {
    ...completeReport,
    ...(profiling ? { memory: { ...completeReport.memory, samples: undefined } } : {}),
  };
  console.log(JSON.stringify(summary, null, 2));
} finally {
  clearInterval(memoryTimer);
  await context.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
