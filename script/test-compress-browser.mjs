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
import { ZipReader, BlobReader, BlobWriter } from '@zip.js/zip.js';
globalThis.testArchive = { ...archive, ZipReader, BlobReader, BlobWriter };
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
    async ({ large, preset }) => {
      const { compressTarXz, decompressTarXzToZip, ZipReader, BlobReader, BlobWriter } =
        globalThis.testArchive;
      /** @param {unknown} condition @param {string} message */
      const assert = (condition, message) => {
        if (!condition) {
          throw new Error(message);
        }
      };
      const inputElement = document.querySelector("#files");
      if (!(inputElement instanceof HTMLInputElement) || !inputElement.files) {
        throw new Error("Archive input fixture is missing");
      }
      const files = [...inputElement.files].map((blob) => ({ name: `测试/${blob.name}`, blob }));
      const directory = await navigator.storage.getDirectory();
      const storageEstimate = await navigator.storage.estimate();
      console.log(`Storage quota: ${storageEstimate.quota} bytes`);
      /** @type {string[]} */
      const handles = [];
      /** @param {string} name @param {ReadableStream<Uint8Array>} stream */
      const save = async (name, stream) => {
        handles.push(name);
        const handle = await directory.getFileHandle(name, { create: true });
        await stream.pipeTo(await handle.createWritable());
        return handle.getFile();
      };
      /** @param {Blob} blob */
      const hash = async (blob) => {
        const bytes = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
        return [...new Uint8Array(bytes)].map((n) => n.toString(16).padStart(2, "0")).join("");
      };
      /** @param {string} name @param {ReadableStream<Uint8Array>} stream */
      const negative = async (name, stream) => {
        let failed = false;
        try {
          await stream.pipeTo(new WritableStream());
        } catch {
          failed = true;
        }
        assert(failed, `${name} should fail`);
      };
      try {
        // Cancellation before work, during compression, and while a fetch-like source stalls.
        const abort = new AbortController();
        abort.abort();
        await negative("pre-abort", compressTarXz(files, { signal: abort.signal }));
        let progressCount = 0;
        const cancelReader = compressTarXz(files, {
          onProgress: () => progressCount++,
        }).getReader();
        await cancelReader.read();
        await new Promise((resolve) => setTimeout(resolve, 100));
        const pausedCount = progressCount;
        await new Promise((resolve) => setTimeout(resolve, 300));
        assert(progressCount === pausedCount, "Stopped consumer must stop input progress");
        await cancelReader.cancel();
        const midway = new AbortController();
        const activeReader = compressTarXz(files, { signal: midway.signal }).getReader();
        await activeReader.read();
        midway.abort();
        let aborted = false;
        try {
          await activeReader.read();
        } catch (error) {
          aborted = error instanceof Error && error.name === "AbortError";
        }
        assert(aborted, "Mid-operation abort should reject with AbortError");
        let sinkFailed = false;
        try {
          await compressTarXz(files).pipeTo(
            new WritableStream({
              write() {
                throw new Error("Disk full");
              },
            }),
          );
        } catch (error) {
          sinkFailed = error instanceof Error && error.message === "Disk full";
        }
        assert(sinkFailed, "Output failure should cancel the worker pipeline");
        let cancelled = false;
        const stalled = new ReadableStream({
          cancel() {
            cancelled = true;
          },
        });
        const stalledReader = decompressTarXzToZip(stalled).getReader();
        const pending = stalledReader.read();
        await stalledReader.cancel();
        await pending;
        await new Promise((resolve) => setTimeout(resolve, 100));
        assert(cancelled, "Cancelled worker must cancel transferred source");

        const largeFile = files.find((file) => file.blob.size >= 20 * 1024 ** 2);
        const largeBlob = largeFile?.blob;
        const input = large
          ? (() => {
              if (!largeBlob) {
                throw new Error("Large test requires a 20 MiB source file");
              }
              return Array.from({ length: 200 }, (_, index) => ({
                name: `大批量/${String(index).padStart(3, "0")}.psd`,
                blob: largeBlob.slice(0, 20 * 1024 ** 2),
              }));
            })()
          : files;
        const inputBytes = input.reduce((n, file) => n + file.blob.size, 0);
        console.log(`Testing ${input.length} files, ${inputBytes} bytes`);
        let ticks = 0;
        const timer = setInterval(() => ticks++, 50);
        const start = performance.now();
        let lastLog = 0;
        const archive = await save(
          "roundtrip.tar.xz",
          compressTarXz(input, {
            preset,
            /** @param {{ completedFiles: number; processedBytes: number }} progress */
            onProgress(progress) {
              if (performance.now() - lastLog > 5000) {
                console.log(`Compressed ${progress.completedFiles}/${input.length}`);
                lastLog = performance.now();
              }
            },
          }),
        );
        const compressMs = performance.now() - start;
        clearInterval(timer);
        assert(ticks > 0, "Main thread should remain responsive");
        console.log(`XZ ${archive.size} bytes in ${Math.round(compressMs)} ms`);
        await negative("truncated footer", decompressTarXzToZip(archive.slice(0, -1)));
        const extractStart = performance.now();
        const zip = await save(
          "roundtrip.zip",
          decompressTarXzToZip(archive, {
            extraFiles: [{ name: "translation.txt", blob: new Blob(["翻译测试"]) }],
          }),
        );
        const decompressMs = performance.now() - extractStart;
        console.log(`ZIP ${zip.size} bytes in ${Math.round(decompressMs)} ms`);
        const zipReader = new ZipReader(new BlobReader(zip));
        const entries = await zipReader.getEntries();
        assert(entries.length === input.length + 1, "Entry count mismatch");
        const hashes = new Map();
        for (let index = 0; index < input.length; index++) {
          const file = input[index];
          const entry = entries[index];
          assert(entry.filename === file.name, "File name mismatch");
          const restored = await entry.getData(new BlobWriter(), { checkSignature: true });
          const key = large ? "repeated" : file.name;
          if (!hashes.has(key)) {
            hashes.set(key, await hash(file.blob));
          }
          assert((await hash(restored)) === hashes.get(key), `SHA-256 mismatch: ${file.name}`);
        }
        await zipReader.close();
        return {
          files: input.length,
          inputBytes,
          xzBytes: archive.size,
          zipBytes: zip.size,
          preset,
          compressMs,
          decompressMs,
          sha256Verified: input.length,
          mainThreadTicks: ticks,
          cancellation: "passed",
          backpressure: "passed",
          truncatedFooter: "rejected",
          productionWorker: true,
          storageQuota: storageEstimate.quota,
          largeFixture: large ? "200 logical files using a 20 MiB slice of a real PSD" : false,
        };
      } finally {
        for (const name of handles) {
          await directory.removeEntry(name).catch(() => {});
        }
      }
    },
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
