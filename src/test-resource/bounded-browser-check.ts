type BoundedItem = { id: string; file: File; limitKiB: string | null };

type BrowserZipEntry = {
  filename: string;
  getData(writer: unknown): Promise<Blob>;
};

type BrowserTools = {
  prepareBoundedArchive(
    items: readonly BoundedItem[],
    bodyLimit: string,
    coverLimit: string,
    signal: AbortSignal,
    onProgress: (completed: number) => void,
  ): Promise<{ file: File; dispose(): Promise<void> }>;
  ZipReader: new (reader: unknown) => {
    getEntries(): Promise<BrowserZipEntry[]>;
    close(): Promise<void>;
  };
  BlobReader: new (blob: Blob) => unknown;
  BlobWriter: new () => unknown;
};

function assertBrowser(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function createPng(width: number, height: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context unavailable");
  const pixels = context.createImageData(width, height);
  fillPixels(pixels.data);
  context.putImageData(pixels, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("PNG encoding failed"));
      }
    }, "image/png");
  });
}

function fillPixels(data: Uint8ClampedArray): void {
  let seed = 42;
  for (let index = 0; index < data.length; index += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    data[index] = seed & 255;
    data[index + 1] = (seed >>> 8) & 255;
    data[index + 2] = (seed >>> 16) & 255;
    data[index + 3] = 255;
  }
}

function createItems(png: Blob): BoundedItem[] {
  return ["10.png", "2.png", "1.png"].map((name) => ({
    id: name,
    file: new File([png], name, { type: "image/png" }),
    limitKiB: name === "10.png" ? "32" : null,
  }));
}

async function directoryKeys(): Promise<string[]> {
  const keys: string[] = [];
  for await (const key of (await navigator.storage.getDirectory()).keys()) keys.push(key);
  return keys;
}

async function verifyArchive(tools: BrowserTools, file: File): Promise<number[]> {
  const reader = new tools.ZipReader(new tools.BlobReader(file));
  const entries = await reader.getEntries();
  assertBrowser(entries.map((entry) => entry.filename).join() === "1.webp,2.webp,10.webp", "sort");
  const sizes: number[] = [];
  for (const [index, entry] of entries.entries()) {
    const blob = await entry.getData(new tools.BlobWriter());
    const maxKiB = [64, 128, 32][index];
    assertBrowser(maxKiB !== undefined, "missing size limit");
    assertBrowser(blob.size <= maxKiB * 1024, "size limit");
    await verifyWebp(blob);
    sizes.push(blob.size);
  }
  await reader.close();
  return sizes;
}

async function verifyWebp(blob: Blob): Promise<void> {
  const header = new TextDecoder().decode((await blob.arrayBuffer()).slice(0, 12));
  assertBrowser(header.startsWith("RIFF") && header.endsWith("WEBP"), "WebP signature");
  const bitmap = await createImageBitmap(blob);
  assertBrowser(bitmap.width > 0 && bitmap.height > 0, "decodable image");
  bitmap.close();
}

async function verifySmallImageConversion(tools: BrowserTools): Promise<void> {
  const png = await createPng(1, 1);
  const result = await tools.prepareBoundedArchive(
    [{ id: "small", file: new File([png], "small.png", { type: "image/png" }), limitKiB: null }],
    "1024",
    "512",
    new AbortController().signal,
    (completed) => {
      assertBrowser(completed >= 0, "progress count");
    },
  );
  const reader = new tools.ZipReader(new tools.BlobReader(result.file));
  const [entry] = await reader.getEntries();
  assertBrowser(entry, "small archive entry missing");
  const blob = await entry.getData(new tools.BlobWriter());
  const signature = new TextDecoder().decode((await blob.arrayBuffer()).slice(8, 12));
  assertBrowser(signature === "WEBP", "images already below the limit must still become WebP");
  await reader.close();
  await result.dispose();
}

async function verifyCancellation(tools: BrowserTools, items: BoundedItem[]): Promise<void> {
  const controller = new AbortController();
  let cancelled = false;
  try {
    await tools.prepareBoundedArchive(items, "128", "64", controller.signal, () => {
      controller.abort();
    });
  } catch {
    cancelled = true;
  }
  assertBrowser(cancelled, "cancellation");
}

async function verifyCorruptImage(tools: BrowserTools): Promise<void> {
  let failed = false;
  try {
    await tools.prepareBoundedArchive(
      [{ id: "bad", file: new File(["bad"], "bad.png", { type: "image/png" }), limitKiB: null }],
      "128",
      "64",
      new AbortController().signal,
      (completed) => {
        assertBrowser(completed >= 0, "progress count");
      },
    );
  } catch {
    failed = true;
  }
  assertBrowser(failed, "corrupt input");
}

export async function runBoundedBrowserCheck(tools: BrowserTools): Promise<{
  sizes: number[];
  png: number[];
}> {
  const png = await createPng(1200, 1600);
  const items = createItems(png);
  const before = await directoryKeys();
  const progress: number[] = [];
  const result = await tools.prepareBoundedArchive(
    items,
    "128",
    "64",
    new AbortController().signal,
    (count) => progress.push(count),
  );
  const sizes = await verifyArchive(tools, result.file);
  await result.dispose();
  await verifySmallImageConversion(tools);
  assertBrowser(progress.join() === "1,2,3", "progress");
  await verifyCancellation(tools, items);
  await verifyCorruptImage(tools);
  const after = await directoryKeys();
  assertBrowser(before.sort().join() === after.sort().join(), "temporary file cleanup");
  return { sizes, png: [...new Uint8Array(await png.arrayBuffer())] };
}
