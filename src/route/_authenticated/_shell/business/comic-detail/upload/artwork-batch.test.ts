import { afterEach, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import type { ArtworkImageInput } from "@/api/page-artwork/page-artwork-api";
import type { ArtworkPageTask } from "./artwork-batch-types";
import { createArtworkBatch } from "./artwork-batch";

const requests = vi.hoisted(() => ({
  confirm: vi.fn(),
  prepareArchive: vi.fn(),
  preparePages: vi.fn(),
  archiveAllocate: vi.fn(),
  archiveConfirm: vi.fn(),
}));
vi.mock("./artwork-staging", () => ({
  createArtworkStaging: (pages: ArtworkPageTask[]) => ({
    prepare: async () => {
      await requests.preparePages();
      for (const page of pages) {
        page.prepared = {
          file: new File(["preview"], page.input.name + ".webp"),
          name: page.input.name,
          hash: page.input.name,
        };
      }
    },
    dispose: () => Promise.resolve(),
  }),
}));
vi.mock("./artwork-upload", () => ({
  validateArtworkFiles: () => undefined,
  prepareArtwork: requests.prepareArchive,
}));
vi.mock("@/api/chapter/artwork-api", () => ({
  allocArtwork: requests.archiveAllocate,
  markArtworkUploaded: requests.archiveConfirm,
}));
vi.mock("@/api/page-artwork/page-artwork-api", () => ({
  listPageArtworks: () => Promise.resolve({ success: true, data: [] }),
  allocatePageArtworks: (_client: unknown, _chapter: string, pages: ArtworkImageInput[]) =>
    Promise.resolve({
      success: true,
      data: pages.map((page, index) => ({
        pageArtworkId: "artwork-" + String(index),
        index,
        imageVersion: 1,
        imageHash: page.imageHash,
        ext: "webp",
        slot: { putUrl: "https://upload.test/" + String(index), headers: {}, imageVersion: 1 },
      })),
    }),
  confirmArtworkImage: requests.confirm,
  allocateArtworkImage: vi.fn(),
}));
afterEach(() => {
  vi.restoreAllMocks();
  requests.confirm.mockReset();
  requests.prepareArchive.mockReset();
  requests.preparePages.mockReset();
  requests.archiveAllocate.mockReset();
  requests.archiveConfirm.mockReset();
});

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve: () => void = vi.fn();
  const promise = new Promise<void>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}

function createOrderedArchiveBatch(): {
  batch: ReturnType<typeof createArtworkBatch>;
  putCallCount: () => number;
  packing: ReturnType<typeof deferred>;
  upload: ReturnType<typeof deferred>;
} {
  requests.archiveAllocate.mockResolvedValue({
    success: true,
    data: { artworkVersion: 1, slot: { putUrl: "https://upload.test/archive", headers: {} } },
  });
  requests.archiveConfirm.mockResolvedValue({ success: true, data: undefined });
  const packing = deferred();
  requests.prepareArchive.mockImplementation(async () => {
    await packing.promise;
    return { file: new File(["archive"], "artwork.tar.xz"), hash: "hash", dispose: vi.fn() };
  });
  requests.confirm.mockResolvedValue({ success: true, data: undefined });
  const upload = deferred();
  const client = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => null });
  const put = vi.spyOn(client, "putPresigned").mockImplementation(async (options) => {
    if (options.url.endsWith("/archive")) await upload.promise;
    return { success: true, data: undefined };
  });
  const batch = createArtworkBatch({
    client,
    chapterId: "packing",
    files: [new File(["psd"], "01.psd")],
    includeArchive: true,
    onChanged: vi.fn(),
  });
  requests.preparePages.mockImplementation(() => {
    expect(requests.prepareArchive).toHaveBeenCalledOnce();
    expect(batch.getSnapshot().tasks[0]?.phase).toBe("done");
  });
  return { batch, putCallCount: () => put.mock.calls.length, packing, upload };
}

test("uploads the PSD archive before preparing or uploading page previews", async () => {
  const { batch, putCallCount, packing, upload } = createOrderedArchiveBatch();
  try {
    const running = batch.run();
    await vi.waitFor(() => {
      expect(requests.prepareArchive).toHaveBeenCalledOnce();
    });
    expect(requests.preparePages).not.toHaveBeenCalled();
    expect(putCallCount()).toBe(0);
    expect(batch.getSnapshot().tasks[0]?.phase).toBe("packing");
    packing.resolve();
    await vi.waitFor(() => {
      expect(putCallCount()).toBe(1);
    });
    expect(requests.preparePages).not.toHaveBeenCalled();
    expect(requests.archiveConfirm).not.toHaveBeenCalled();
    upload.resolve();
    await running;
    expect(requests.archiveConfirm).toHaveBeenCalledOnce();
    expect(batch.getSnapshot().tasks.map((task) => task.phase)).toEqual(["done", "done"]);
  } finally {
    packing.resolve();
    upload.resolve();
    await batch.dispose();
  }
});

test("batch subscription and lifecycle methods work when detached from the factory result", async () => {
  const preparing = deferred();
  requests.preparePages.mockImplementation(async () => {
    await preparing.promise;
  });
  const client = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => null });
  const batch = createArtworkBatch({
    client,
    chapterId: "detached-methods",
    files: [new File(["psd"], "01.psd")],
    includeArchive: false,
    onChanged: vi.fn(),
  });
  const { getSnapshot, subscribe, run, cancel, dispose } = batch;
  const listener = vi.fn();
  const unsubscribe = subscribe(listener);
  const running = run();
  try {
    await vi.waitFor(() => {
      expect(getSnapshot().running).toBe(true);
    });
    cancel();
    preparing.resolve();
    await running;
    expect(getSnapshot().running).toBe(false);
    expect(listener).toHaveBeenCalled();
  } finally {
    preparing.resolve();
    unsubscribe();
    await dispose();
  }
});

test("a failed archive blocks previews and retry keeps the prepared archive", async () => {
  requests.prepareArchive.mockResolvedValue({
    file: new File(["archive"], "artwork.tar.xz"),
    hash: "hash",
    dispose: vi.fn(),
  });
  requests.archiveAllocate
    .mockResolvedValueOnce({ success: false, httpStatus: 403, code: 1, error: "上传被拒绝" })
    .mockResolvedValue({ success: true, data: { artworkVersion: 1, slot: null } });
  requests.archiveConfirm.mockResolvedValue({ success: true, data: undefined });
  requests.confirm.mockResolvedValue({ success: true, data: undefined });
  const client = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => null });
  const put = vi
    .spyOn(client, "putPresigned")
    .mockResolvedValue({ success: true, data: undefined });
  const batch = createArtworkBatch({
    client,
    chapterId: "archive-retry",
    files: [new File(["psd"], "01.psd")],
    includeArchive: true,
    onChanged: vi.fn(),
  });
  try {
    await batch.run();
    expect(batch.getSnapshot().tasks.map((task) => task.phase)).toEqual(["failed", "queued"]);
    expect(requests.preparePages).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
    await batch.run();
    expect(requests.prepareArchive).toHaveBeenCalledOnce();
    expect(batch.getSnapshot().tasks.map((task) => task.phase)).toEqual(["done", "done"]);
  } finally {
    await batch.dispose();
  }
});

test("parallel page uploads do not expose chapter confirmation conflicts as failed pages", async () => {
  let confirming = false;
  requests.confirm.mockImplementation(async () => {
    if (confirming) {
      return { success: false, httpStatus: 409, code: 8, error: "资源已被并发修改，请重试请求" };
    }
    confirming = true;
    await new Promise<void>((resolve) => setTimeout(resolve, 5));
    confirming = false;
    return { success: true, data: undefined };
  });
  const client = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => null });
  const put = vi
    .spyOn(client, "putPresigned")
    .mockResolvedValue({ success: true, data: undefined });
  const batch = createArtworkBatch({
    client,
    chapterId: "chapter",
    files: [new File(["psd"], "01.psd"), new File(["psd"], "02.psd")],
    includeArchive: false,
    onChanged: vi.fn(),
  });
  try {
    await batch.run();
    expect(batch.getSnapshot().tasks.map((task) => task.error)).not.toContain(
      "资源已被并发修改，请重试请求",
    );
    expect(batch.getSnapshot().tasks.map((task) => task.phase)).toEqual(["done", "done"]);
    expect(put).toHaveBeenCalledTimes(2);
  } finally {
    await batch.dispose();
  }
});
