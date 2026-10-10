type ArchiveFile = { name: string; blob: Blob };
type ArchiveEntry = {
  filename: string;
  getData(writer: unknown, options?: Record<string, unknown>): Promise<Blob>;
};
type ArchiveTools = {
  compressTarXz(
    files: readonly ArchiveFile[],
    options?: Record<string, unknown>,
  ): ReadableStream<Uint8Array>;
  decompressTarXzToZip(
    source: Blob | ReadableStream<Uint8Array>,
    options?: Record<string, unknown>,
  ): ReadableStream<Uint8Array>;
  ZipReader: new (reader: unknown) => {
    getEntries(): Promise<ArchiveEntry[]>;
    close(): Promise<void>;
  };
  BlobReader: new (blob: Blob) => unknown;
  BlobWriter: new () => unknown;
};

function assertBrowser(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function saveToOpfs(
  directory: FileSystemDirectoryHandle,
  handles: string[],
  name: string,
  stream: ReadableStream<Uint8Array>,
): Promise<File> {
  handles.push(name);
  const handle = await directory.getFileHandle(name, { create: true });
  await stream.pipeTo(await handle.createWritable());
  return handle.getFile();
}

async function hashBlob(blob: Blob): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function expectStreamFailure(
  name: string,
  stream: ReadableStream<Uint8Array>,
): Promise<void> {
  let failed = false;
  try {
    await stream.pipeTo(new WritableStream());
  } catch {
    failed = true;
  }
  assertBrowser(failed, `${name} should fail`);
}

async function verifyBackpressure(files: ArchiveFile[], tools: ArchiveTools): Promise<void> {
  let progressCount = 0;
  const reader = tools.compressTarXz(files, { onProgress: () => progressCount++ }).getReader();
  await reader.read();
  await new Promise((resolve) => setTimeout(resolve, 100));
  const pausedCount = progressCount;
  await new Promise((resolve) => setTimeout(resolve, 300));
  assertBrowser(progressCount === pausedCount, "Stopped consumer must stop input progress");
  await reader.cancel();
}

async function verifyAbortAndSinkFailure(files: ArchiveFile[], tools: ArchiveTools): Promise<void> {
  const abortedController = new AbortController();
  const reader = tools.compressTarXz(files, { signal: abortedController.signal }).getReader();
  await reader.read();
  abortedController.abort();
  let aborted = false;
  try {
    await reader.read();
  } catch (error) {
    aborted = error instanceof Error && error.name === "AbortError";
  }
  assertBrowser(aborted, "Mid-operation abort should reject with AbortError");
  await verifySinkFailure(files, tools);
}

async function verifySinkFailure(files: ArchiveFile[], tools: ArchiveTools): Promise<void> {
  let sinkFailed = false;
  try {
    await tools.compressTarXz(files).pipeTo(
      new WritableStream({
        write: () => {
          throw new Error("Disk full");
        },
      }),
    );
  } catch (error) {
    sinkFailed = error instanceof Error && error.message === "Disk full";
  }
  assertBrowser(sinkFailed, "Output failure should cancel the worker pipeline");
}

async function verifySourceCancellation(tools: ArchiveTools): Promise<void> {
  let cancelled = false;
  const stalled = new ReadableStream<Uint8Array>({
    cancel: () => {
      cancelled = true;
    },
  });
  const reader = tools.decompressTarXzToZip(stalled).getReader();
  const pending = reader.read();
  await reader.cancel();
  await pending;
  await new Promise((resolve) => setTimeout(resolve, 100));
  assertBrowser(cancelled, "Cancelled worker must cancel transferred source");
}

async function verifyCancellation(files: ArchiveFile[], tools: ArchiveTools): Promise<void> {
  const controller = new AbortController();
  controller.abort();
  await expectStreamFailure("pre-abort", tools.compressTarXz(files, { signal: controller.signal }));
  await verifyBackpressure(files, tools);
  await verifyAbortAndSinkFailure(files, tools);
  await verifySourceCancellation(tools);
}

function createInputFiles(files: ArchiveFile[], large: boolean): ArchiveFile[] {
  if (!large) return files;
  const largeFile = files.find((file) => file.blob.size >= 20 * 1024 ** 2);
  const largeBlob = largeFile?.blob;
  if (!largeBlob) throw new Error("Large test requires a 20 MiB source file");
  return Array.from({ length: 200 }, (_, index) => ({
    name: `大批量/${String(index).padStart(3, "0")}.psd`,
    blob: largeBlob.slice(0, 20 * 1024 ** 2),
  }));
}

async function verifyZipEntries(
  zip: File,
  input: ArchiveFile[],
  large: boolean,
  tools: ArchiveTools,
): Promise<void> {
  const reader = new tools.ZipReader(new tools.BlobReader(zip));
  const entries = await reader.getEntries();
  assertBrowser(entries.length === input.length + 1, "Entry count mismatch");
  const hashes = new Map<string, string>();
  for (let index = 0; index < input.length; index++) {
    const file = input[index];
    const entry = entries[index];
    assertBrowser(file !== undefined && entry !== undefined, "missing archive entry");
    assertBrowser(entry.filename === file.name, "File name mismatch");
    const restored = await entry.getData(new tools.BlobWriter(), { checkSignature: true });
    const key = large ? "repeated" : file.name;
    if (!hashes.has(key)) hashes.set(key, await hashBlob(file.blob));
    assertBrowser((await hashBlob(restored)) === hashes.get(key), `SHA-256 mismatch: ${file.name}`);
  }
  await reader.close();
}

async function compressAndVerify(
  input: ArchiveFile[],
  directory: FileSystemDirectoryHandle,
  handles: string[],
  preset: number,
  tools: ArchiveTools,
): Promise<{ archive: File; zip: File; compressMs: number; decompressMs: number; ticks: number }> {
  let ticks = 0;
  const timer = setInterval(() => ticks++, 50);
  const start = performance.now();
  let lastLog = 0;
  const archive = await saveToOpfs(
    directory,
    handles,
    "roundtrip.tar.xz",
    tools.compressTarXz(input, {
      preset,
      onProgress(progress: { completedFiles: number }) {
        if (performance.now() - lastLog > 5000) {
          console.warn(`Compressed ${String(progress.completedFiles)}/${String(input.length)}`);
          lastLog = performance.now();
        }
      },
    }),
  );
  const compressMs = performance.now() - start;
  clearInterval(timer);
  assertBrowser(ticks > 0, "Main thread should remain responsive");
  console.warn(`XZ ${String(archive.size)} bytes in ${String(Math.round(compressMs))} ms`);
  await expectStreamFailure("truncated footer", tools.decompressTarXzToZip(archive.slice(0, -1)));
  return createZip(archive, directory, handles, input, compressMs, ticks, tools);
}

async function createZip(
  archive: File,
  directory: FileSystemDirectoryHandle,
  handles: string[],
  input: ArchiveFile[],
  compressMs: number,
  ticks: number,
  tools: ArchiveTools,
): Promise<{ archive: File; zip: File; compressMs: number; decompressMs: number; ticks: number }> {
  const start = performance.now();
  const zip = await saveToOpfs(
    directory,
    handles,
    "roundtrip.zip",
    tools.decompressTarXzToZip(archive, {
      extraFiles: [{ name: "translation.txt", blob: new Blob(["翻译测试"]) }],
    }),
  );
  const decompressMs = performance.now() - start;
  console.warn(`ZIP ${String(zip.size)} bytes in ${String(Math.round(decompressMs))} ms`);
  await verifyZipEntries(zip, input, input.length === 200, tools);
  return { archive, zip, compressMs, decompressMs, ticks };
}

function readInputFiles(): ArchiveFile[] {
  const input = document.querySelector("#files");
  if (!(input instanceof HTMLInputElement) || !input.files) {
    throw new Error("Archive input fixture is missing");
  }
  return [...input.files].map((blob) => ({ name: `测试/${blob.name}`, blob }));
}

async function cleanupFiles(
  directory: FileSystemDirectoryHandle,
  handles: string[],
): Promise<void> {
  for (const name of handles) {
    await directory.removeEntry(name).catch((error: unknown) => {
      console.warn(`Could not remove temporary archive ${name}`, error);
    });
  }
}

export async function runCompressionCheck(
  tools: ArchiveTools,
  large: boolean,
  preset: number,
): Promise<Record<string, unknown>> {
  await verifyCancellation(readInputFiles(), tools);
  const input = createInputFiles(readInputFiles(), large);
  const inputBytes = input.reduce((total, file) => total + file.blob.size, 0);
  console.warn(`Testing ${String(input.length)} files, ${String(inputBytes)} bytes`);
  const directory = await navigator.storage.getDirectory();
  const storageEstimate = await navigator.storage.estimate();
  console.warn(`Storage quota: ${String(storageEstimate.quota)} bytes`);
  const handles: string[] = [];
  try {
    const result = await compressAndVerify(input, directory, handles, preset, tools);
    return {
      files: input.length,
      inputBytes,
      xzBytes: result.archive.size,
      zipBytes: result.zip.size,
      preset,
      compressMs: result.compressMs,
      decompressMs: result.decompressMs,
      sha256Verified: input.length,
      mainThreadTicks: result.ticks,
      cancellation: "passed",
      backpressure: "passed",
      truncatedFooter: "rejected",
      productionWorker: true,
      storageQuota: storageEstimate.quota,
      largeFixture: large ? "200 logical files using a 20 MiB slice of a real PSD" : false,
    };
  } finally {
    await cleanupFiles(directory, handles);
  }
}
