import { beforeAll, describe, expect, it } from "vitest";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { initModule } from "node-liblzma/wasm";
import { BlobReader, BlobWriter, ZipReader } from "@zip.js/zip.js";
import { packTar } from "modern-tar";
import { runArchive } from "@/shared/utility/compress/core";
import { xzStream } from "@/shared/utility/compress/xz";
import type { WorkerJob } from "@/shared/utility/compress/types";

const fixture = new URL("../../../../test-resource/generated/roundtrip.bin", import.meta.url);
const defaults = { preset: 1, maxBytes: 8 * 1024 ** 3, maxFiles: 1000 };
type Sample = { bytes: Uint8Array; archive: Blob };

beforeAll(async () => {
  await initModule();
  await mkdir(new URL(".", fixture), { recursive: true });
  const bytes = Uint8Array.from({ length: 256 * 1024 }, (_, index) => index % 251);
  await writeFile(fixture, bytes);
});

async function collect(job: WorkerJob): Promise<Blob> {
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  await runArchive(
    job,
    new WritableStream({
      write(chunk: Uint8Array) {
        chunks.push(new Uint8Array(chunk));
      },
    }),
    () => {
      /* Progress is checked in the browser integration test. */
    },
  );
  return new Blob(chunks);
}

async function sample(): Promise<Sample> {
  const bytes = await readFile(fixture, { encoding: null });
  const blob = new Blob([bytes]);
  const files = [
    { name: "中文目录/测试.psd", blob },
    { name: "empty.psd", blob: new Blob() },
  ];
  const archive = await collect({ ...defaults, operation: "compress", files });
  return { bytes, archive };
}

describe("streaming TAR/XZ to ZIP", () => {
  it("round trips unicode paths, binary content, empty files and extra ZIP files", async () => {
    const { bytes, archive } = await sample();
    const zip = await collect({
      ...defaults,
      operation: "decompress",
      source: archive.stream(),
      files: [{ name: "translation.txt", blob: new Blob(["翻译"]) }],
    });
    const reader = new ZipReader(new BlobReader(zip));
    const entries = await reader.getEntries();
    expect(entries.map((entry) => entry.filename)).toEqual([
      "中文目录/测试.psd",
      "empty.psd",
      "translation.txt",
    ]);
    const first = entries[0];
    if (!first || first.directory) {
      throw new Error("Missing PSD");
    }
    const restored = await first.getData(new BlobWriter(), { checkSignature: true });
    expect(new Uint8Array(await restored.arrayBuffer())).toEqual(new Uint8Array(bytes));
    await reader.close();
  });
});

describe("streaming TAR/XZ to ZIP", () => {
  it("rejects truncated XZ footers even after all PSD bytes have been decoded", async () => {
    const { archive } = await sample();
    for (const trim of [1, 8, 12, 24]) {
      await expect(
        collect({
          ...defaults,
          operation: "decompress",
          files: [],
          source: archive.slice(0, archive.size - trim).stream(),
        }),
      ).rejects.toThrow();
    }
  });
});

describe("streaming TAR/XZ to ZIP", () => {
  it("rejects corrupt XZ data and trailing garbage", async () => {
    const { archive } = await sample();
    const bytes = new Uint8Array(await archive.arrayBuffer());
    bytes[40] = (bytes[40] ?? 0) ^ 255;
    for (const blob of [new Blob([bytes]), new Blob([archive, "garbage"])]) {
      await expect(
        collect({
          ...defaults,
          operation: "decompress",
          files: [],
          source: blob.stream(),
        }),
      ).rejects.toThrow();
    }
  });
});

describe("streaming TAR/XZ to ZIP", () => {
  it("rejects unsafe paths, duplicate paths and resource limits", async () => {
    for (const names of [["../x"], ["/x"], [String.raw`a\b`], ["a", "A"], ["folder/"]]) {
      await expect(
        collect({
          ...defaults,
          operation: "compress",
          files: names.map((name) => ({ name, blob: new Blob(["x"]) })),
        }),
      ).rejects.toThrow();
    }
    const { archive } = await sample();
    for (const limits of [{ maxFiles: 1 }, { maxBytes: 1 }]) {
      await expect(
        collect({
          ...defaults,
          ...limits,
          operation: "decompress",
          files: [],
          source: archive.stream(),
        }),
      ).rejects.toThrow();
    }
  });
});

describe("streaming TAR/XZ to ZIP", () => {
  it("handles fragmented XZ input and rejects collisions with extra ZIP files", async () => {
    const { archive } = await sample();
    const bytes = new Uint8Array(await archive.arrayBuffer());
    let offset = 0;
    const source = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (offset === bytes.length) {
          controller.close();
          return;
        }
        controller.enqueue(bytes.slice(offset, offset + 7));
        offset = Math.min(offset + 7, bytes.length);
      },
    });
    await expect(
      collect({
        ...defaults,
        operation: "decompress",
        source,
        files: [{ name: "empty.psd", blob: new Blob() }],
      }),
    ).rejects.toThrow("Duplicate");
  });
});

describe("streaming TAR/XZ to ZIP", () => {
  it("rejects truncated TAR content inside an otherwise valid XZ stream", async () => {
    const tar = await packTar([
      {
        header: { name: "broken.psd", size: 1024 },
        body: new Uint8Array(1024),
      },
    ]);
    const body = new Blob([new Uint8Array(tar).slice(0, 600)]);
    const source = xzStream(body.stream(), false);
    await expect(
      collect({
        ...defaults,
        operation: "decompress",
        files: [],
        source,
      }),
    ).rejects.toThrow();
  });
});

describe("streaming TAR/XZ to ZIP", () => {
  it("rejects links and unsafe names supplied by external TAR archives", async () => {
    for (const header of [
      { name: "../evil", size: 0, type: "file" as const },
      { name: "link", size: 0, type: "symlink" as const, linkname: "/etc/passwd" },
    ]) {
      const tar = await packTar([{ header }]);
      const source = xzStream(new Blob([new Uint8Array(tar)]).stream(), false, 1);
      await expect(
        collect({
          ...defaults,
          operation: "decompress",
          files: [],
          source,
        }),
      ).rejects.toThrow();
    }
  });
});

describe("streaming TAR/XZ to ZIP", () => {
  it("bounds highly compressible decoder output and cancels the upstream", async () => {
    const zeros = new Blob([new Uint8Array(16 * 1024 * 1024)]);
    const compressed = await new Response(xzStream(zeros.stream(), false, 1)).arrayBuffer();
    let isCancelled = false;
    let reads = 0;
    const source = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          reads++;
          if (reads === 1) {
            controller.enqueue(new Uint8Array(compressed));
          }
        },
        cancel() {
          isCancelled = true;
        },
      },
      { highWaterMark: 0 },
    );
    const reader = xzStream(source, true).getReader();
    const first = await reader.read();
    expect(first.value?.length).toBeLessThanOrEqual(64 * 1024);
    expect(reads).toBe(1);
    await reader.cancel();
    expect(isCancelled).toBe(true);
  });
});
