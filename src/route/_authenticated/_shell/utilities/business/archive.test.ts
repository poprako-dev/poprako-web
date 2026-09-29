import { afterEach, expect, test, vi } from "vitest";
import { compressTarXz, decompressTarXzToZip } from "@/shared/utility/compress";
import {
  prepareArchive,
  validateFiles,
} from "@/route/_authenticated/_shell/utilities/business/archive";

vi.mock("@/shared/utility/compress", () => ({
  compressTarXz: vi.fn(),
  decompressTarXzToZip: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mockStorage(): {
  abort: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  removeEntry: ReturnType<typeof vi.fn>;
  createUrl: ReturnType<typeof vi.spyOn>;
  revokeUrl: ReturnType<typeof vi.spyOn>;
} {
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  const abort = vi.fn();
  const close = vi.fn();
  const removeEntry = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", {
    storage: {
      getDirectory: () =>
        Promise.resolve({
          removeEntry,
          getFileHandle: () =>
            Promise.resolve({
              createWritable: () =>
                Promise.resolve(
                  new WritableStream<Uint8Array>({
                    write(chunk) {
                      chunks.push(new Uint8Array(chunk));
                    },
                    close,
                    abort,
                  }),
                ),
              getFile: () => Promise.resolve(new File(chunks, "output")),
            }),
        }),
    },
  });
  const createUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:archive");
  const revokeUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {
    // No native URL was allocated.
  });
  return { abort, close, removeEntry, createUrl, revokeUrl };
}

test("rejects duplicate normalized paths and multiple extraction inputs", () => {
  expect(
    validateFiles([new File([], "É.psd"), new File([], "e\u{0301}.PSD")], "compress"),
  ).toContain("同名文件");
  expect(validateFiles([new File([], "a.tar.xz"), new File([], "b.tar.xz")], "extract")).toContain(
    "一个 .tar.xz",
  );
  expect(validateFiles([new File([], "a.zip")], "extract")).toContain(".tar.xz");
});

test("exposes output only after stream completion and disposes its URL and disk file", async () => {
  const storage = mockStorage();
  vi.mocked(compressTarXz).mockReturnValue(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.close();
      },
    }),
  );
  const result = await prepareArchive(
    [new File(["input"], "page.psd")],
    "compress",
    3,
    new AbortController().signal,
    vi.fn(),
  );
  expect(new Uint8Array(await result.file.arrayBuffer())).toEqual(new Uint8Array([1, 2]));
  expect(storage.close).toHaveBeenCalledOnce();
  expect(storage.removeEntry).not.toHaveBeenCalled();
  await result.dispose();
  expect(storage.revokeUrl).toHaveBeenCalledWith("blob:archive");
  expect(storage.removeEntry).toHaveBeenCalledOnce();
});

test("a late integrity error deletes partial output without exposing a download", async () => {
  const storage = mockStorage();
  let count = 0;
  vi.mocked(decompressTarXzToZip).mockReturnValue(
    new ReadableStream({
      pull(controller) {
        if (count++ === 0) {
          controller.enqueue(new Uint8Array([1]));
          return;
        }
        controller.error(new Error("XZ integrity failure"));
      },
    }),
  );
  await expect(
    prepareArchive(
      [new File(["broken"], "input.tar.xz")],
      "extract",
      3,
      new AbortController().signal,
      vi.fn(),
    ),
  ).rejects.toThrow("XZ integrity failure");
  expect(storage.abort).toHaveBeenCalledOnce();
  expect(storage.close).not.toHaveBeenCalled();
  expect(storage.createUrl).not.toHaveBeenCalled();
  expect(storage.removeEntry).toHaveBeenCalledOnce();
});

test("cancellation aborts the destination and removes its temporary file", async () => {
  const storage = mockStorage();
  const controller = new AbortController();
  vi.mocked(compressTarXz).mockImplementation(
    () =>
      new ReadableStream({
        pull() {
          controller.abort();
        },
      }),
  );
  await expect(
    prepareArchive([new File(["input"], "page.psd")], "compress", 3, controller.signal, vi.fn()),
  ).rejects.toThrow();
  expect(storage.abort).toHaveBeenCalledOnce();
  expect(storage.createUrl).not.toHaveBeenCalled();
  expect(storage.removeEntry).toHaveBeenCalledOnce();
});
