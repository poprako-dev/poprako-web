import { afterEach, describe, expect, test, vi } from "vitest";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import {
  prepareArtwork,
  validateArtworkFiles,
} from "@/route/_authenticated/_shell/business/comic-detail/upload/artwork-upload";
import { artworkPermissions } from "@/route/_authenticated/business/artwork/artwork";
import { compressTarXz } from "@/shared/utility/compress";

vi.mock("@/shared/utility/compress", () => ({ compressTarXz: vi.fn() }));
const chapter: ChapterInfo = {
  id: "chapter",
  comicId: "comic",
  index: 0,
  subtitle: "",
  isPinned: false,
  stages: 0,
  pageCount: 1,
  totalUnitCount: 0,
  translatedUnitCount: 0,
  proofreadUnitCount: 0,
  creatorId: "user",
  createdAt: 1,
  updatedAt: 1,
};
const assignment: AssignmentInfo = {
  id: "assignment",
  roles: 0,
  chapterId: "chapter",
  userId: "user",
  createdAt: 1,
  updatedAt: 1,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("artwork upload permissions", () => {
  test.each([8, 16] as const)("allows chapter %s", (role) => {
    expect(artworkPermissions(chapter, { ...assignment, roles: role }, false).archive).toBe(true);
  });
  test("rejects missing, unrelated, stale and published chapter assignments", () => {
    const typesetter = { ...assignment, roles: 8 };
    expect(artworkPermissions(chapter, undefined, false).archive).toBe(false);
    expect(artworkPermissions(chapter, { ...assignment, roles: 2 }, false).archive).toBe(false);
    expect(artworkPermissions(chapter, { ...assignment, roles: 128 }, false).archive).toBe(false);
    expect(artworkPermissions(chapter, { ...typesetter, chapterId: "other" }, false).archive).toBe(
      false,
    );
    expect(artworkPermissions({ ...chapter, stages: 2 << 10 }, typesetter, false).archive).toBe(
      false,
    );
  });
});

test("rejects normalized duplicate names before creating a temporary file", () => {
  expect(() => {
    validateArtworkFiles([new File(["a"], "PAGE.PSD"), new File(["b"], "page.psd")]);
  }).toThrow("同名文件");
  expect(() => {
    validateArtworkFiles([]);
  }).toThrow("请先选择");
});

function mockStorage(): {
  removeEntry: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
} {
  const removeEntry = vi.fn().mockResolvedValue(undefined);
  const close = vi.fn();
  const abort = vi.fn();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  const createWritable = vi.fn().mockResolvedValue(
    new WritableStream<Uint8Array>({
      write(chunk) {
        chunks.push(new Uint8Array(chunk));
      },
      close,
      abort,
    }),
  );
  vi.stubGlobal("navigator", {
    storage: {
      getDirectory: () =>
        Promise.resolve({
          removeEntry,
          getFileHandle: () =>
            Promise.resolve({
              createWritable,
              getFile: () => Promise.resolve(new File(chunks, "artwork.tar.xz")),
            }),
        }),
    },
  });
  return { removeEntry, close, abort };
}

test("stages output and hashes exact archive bytes with canonical base64", async () => {
  const storage = mockStorage();
  vi.mocked(compressTarXz).mockReturnValue(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("a"));
        controller.enqueue(new TextEncoder().encode("bc"));
        controller.close();
      },
    }),
  );
  const result = await prepareArtwork(
    [new File(["psd"], "page.psd")],
    new AbortController().signal,
    vi.fn(),
  );
  expect(await result.file.text()).toBe("abc");
  expect(result.hash).toBe("ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=");
  expect(storage.close).toHaveBeenCalledOnce();
  expect(storage.removeEntry).not.toHaveBeenCalled();
  await result.dispose();
  expect(storage.removeEntry).toHaveBeenCalledOnce();
});

test("aborts the output and deletes temporary files on compression failure", async () => {
  const storage = mockStorage();
  vi.mocked(compressTarXz).mockReturnValue(
    new ReadableStream({
      start(controller) {
        controller.error(new Error("compression failed"));
      },
    }),
  );
  await expect(
    prepareArtwork([new File(["psd"], "page.psd")], new AbortController().signal, vi.fn()),
  ).rejects.toThrow("compression failed");
  expect(storage.abort).toHaveBeenCalledOnce();
  expect(storage.close).not.toHaveBeenCalled();
  expect(storage.removeEntry).toHaveBeenCalledOnce();
});
