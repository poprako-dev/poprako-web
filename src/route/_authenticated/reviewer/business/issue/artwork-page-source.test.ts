import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { createArtworkPageSource } from "./artwork-page-source";
import type { ReviewPage } from "./review-page";

const mocks = vi.hoisted(() => ({
  entries: [] as { filename: string; directory: false; getData: ReturnType<typeof vi.fn> }[],
  decode: vi.fn(),
  close: vi.fn(),
  release: vi.fn(),
}));
vi.mock("@zip.js/zip.js", () => ({
  BlobReader: class {
    blob: Blob;
    constructor(blob: Blob) {
      this.blob = blob;
    }
  },
  ZipReader: class {
    getEntries(): Promise<typeof mocks.entries> {
      return Promise.resolve(mocks.entries);
    }
    close(): Promise<void> {
      mocks.close();
      return Promise.resolve();
    }
  },
}));
vi.mock("@/shared/utility/compress", () => ({
  decompressTarXzToZip: (source: ReadableStream<Uint8Array>) => source,
}));
vi.mock("./open-psd-page", () => ({ openPsdPage: mocks.decode }));

const request = vi.fn();
const download = vi.fn();
const removeArchive = vi.fn();
const removePsd = vi.fn();
const client = createApiClient({
  baseUrl: "/api/v1",
  getAccessToken: () => null,
  fetchImpl: request,
});

function page(): ReviewPage {
  return {
    width: 100,
    height: 200,
    layers: [],
    composite: { source: "image", bounds: { xCoord: 0, yCoord: 0, width: 1, height: 1 } },
    dispose: mocks.release,
  };
}

function entry(filename: string): (typeof mocks.entries)[number] {
  return {
    filename,
    directory: false,
    getData: vi.fn((output: WritableStream<Uint8Array>, options: { signal: AbortSignal }) => {
      return new Blob([filename]).stream().pipeTo(output, { signal: options.signal });
    }),
  };
}

beforeEach(() => {
  request.mockReset().mockImplementation(() =>
    Promise.resolve(
      Response.json({
        code: 0,
        data: {
          artwork_version: 1,
          artwork_hash: "hash",
          ext: "xz",
          download_url: "https://storage.example/archive",
        },
      }),
    ),
  );
  download.mockReset().mockImplementation(() => Promise.resolve(new Response(new Uint8Array([1]))));
  removeArchive.mockReset().mockResolvedValue(undefined);
  removePsd.mockReset().mockResolvedValue(undefined);
  mocks.close.mockReset();
  mocks.release.mockReset();
  mocks.decode.mockReset().mockImplementation(() => Promise.resolve(page()));
  mocks.entries = [entry("10.psd"), entry("2.psd")];
  const directory = {
    getFileHandle: (filename: string) => {
      const chunks: Uint8Array<ArrayBuffer>[] = [];
      return Promise.resolve({
        createWritable: () =>
          Promise.resolve(
            new WritableStream<Uint8Array<ArrayBuffer>>({
              write(chunk) {
                chunks.push(chunk);
              },
            }),
          ),
        getFile: () => Promise.resolve(new File(chunks, filename)),
      });
    },
    removeEntry: removePsd,
  };
  vi.stubGlobal("navigator", {
    storage: {
      getDirectory: () =>
        Promise.resolve({
          getDirectoryHandle: () => Promise.resolve(directory),
          removeEntry: removeArchive,
        }),
    },
  });
  vi.stubGlobal("fetch", download);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

test("downloads once, decodes only selected pages in natural order and releases disk resources", async () => {
  const source = createArtworkPageSource(client, "chapter", ["first", "second"]);
  if (!source.loadPage) throw new Error("Missing page loader");
  const first = await source.loadPage("first", new AbortController().signal);
  expect(mocks.entries[1]?.getData).toHaveBeenCalledOnce();
  expect(mocks.entries[0]?.getData).not.toHaveBeenCalled();
  await first.dispose();
  const second = await source.loadPage("second", new AbortController().signal);
  expect(request).toHaveBeenCalledOnce();
  expect(download).toHaveBeenCalledOnce();
  expect(mocks.decode).toHaveBeenCalledTimes(2);
  expect(removePsd).toHaveBeenCalledTimes(2);
  await source.dispose();
  expect(mocks.close).toHaveBeenCalledOnce();
  expect(removeArchive).toHaveBeenCalledOnce();
  expect(mocks.release).toHaveBeenCalledTimes(2);
  expect(second.dispose).toBeTypeOf("function");
});

test("a superseded page does not cancel the shared download or decode stale PSD data", async () => {
  let resolve!: (response: Response) => void;
  download.mockImplementationOnce(
    () =>
      new Promise<Response>((callback) => {
        resolve = callback;
      }),
  );
  const source = createArtworkPageSource(client, "chapter", ["first", "second"]);
  if (!source.loadPage) throw new Error("Missing page loader");
  const old = new AbortController();
  const first = source.loadPage("first", old.signal);
  const rejection = expect(first).rejects.toThrow();
  const second = source.loadPage("second", new AbortController().signal);
  await vi.waitFor(() => {
    expect(download).toHaveBeenCalledOnce();
  });
  old.abort();
  const fetchOptions = download.mock.calls[0]?.[1] as RequestInit;
  expect(fetchOptions.signal?.aborted).toBe(false);
  resolve(new Response(new Uint8Array([1])));
  await rejection;
  await second;
  expect(mocks.decode).toHaveBeenCalledOnce();
  expect(mocks.entries[1]?.getData).not.toHaveBeenCalled();
  await source.dispose();
});

test("count mismatch cleans the archive and can retry after a corrected export", async () => {
  mocks.entries = [entry("1.psd")];
  const source = createArtworkPageSource(client, "chapter", ["first", "second"]);
  if (!source.loadPage) throw new Error("Missing page loader");
  await expect(source.loadPage("first", new AbortController().signal)).rejects.toThrow(
    "无法对应预览",
  );
  expect(removeArchive).toHaveBeenCalledOnce();
  expect(mocks.decode).not.toHaveBeenCalled();
  mocks.entries = [entry("1.psd"), entry("2.psd")];
  await source.loadPage("first", new AbortController().signal);
  expect(request).toHaveBeenCalledTimes(2);
  await source.dispose();
  expect(removeArchive).toHaveBeenCalledTimes(2);
});

test("exiting during a download aborts the fetch, cleans staging and prevents late decoding", async () => {
  let resolve!: (response: Response) => void;
  download.mockImplementationOnce(
    () =>
      new Promise<Response>((callback) => {
        resolve = callback;
      }),
  );
  const source = createArtworkPageSource(client, "chapter", ["first", "second"]);
  if (!source.loadPage) throw new Error("Missing page loader");
  const loading = source.loadPage("first", new AbortController().signal);
  const rejection = expect(loading).rejects.toThrow();
  await vi.waitFor(() => {
    expect(download).toHaveBeenCalledOnce();
  });
  const disposing = source.dispose();
  const options = download.mock.calls[0]?.[1] as RequestInit;
  expect(options.signal?.aborted).toBe(true);
  resolve(new Response(new Uint8Array([1])));
  await rejection;
  await disposing;
  expect(mocks.decode).not.toHaveBeenCalled();
  expect(removeArchive).toHaveBeenCalledOnce();
});
