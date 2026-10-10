import { expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { createArtworkPreviewLoader } from "./artwork-preview-loader";

const list = vi.hoisted(() => vi.fn());
vi.mock("@/api/page-artwork/page-artwork-api", () => ({ listPageArtworks: list }));

test("uses the original URL directly and refreshes expired URLs on retry", async () => {
  const client = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => null });
  list.mockReset().mockResolvedValue({
    success: true,
    data: [
      {
        id: "page",
        imageUploaded: true,
        imageUrl: "/new-original.webp",
        imageOptimizedUrl: "/new-optimized.webp",
      },
    ],
  });
  const load = createArtworkPreviewLoader(client, {
    chapterId: "chapter",
    pages: [
      {
        id: "page",
        index: 0,
        imageUrl: "/original.webp",
        imageOptimizedUrl: "/optimized.webp",
      },
    ],
  });
  const signal = new AbortController().signal;
  expect((await load("page", signal)).composite.source).toBe("/original.webp");
  expect(list).not.toHaveBeenCalled();
  expect((await load("page", signal)).composite.source).toBe("/new-original.webp");
  expect(list).toHaveBeenCalledWith(client, "chapter", signal);
});

test("refreshes the original URL when the project only has a thumbnail", async () => {
  const client = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => null });
  list.mockReset().mockResolvedValue({
    success: true,
    data: [
      {
        id: "page",
        imageUploaded: true,
        imageUrl: "/original.webp",
        imageOptimizedUrl: "/optimized.webp",
      },
    ],
  });
  const load = createArtworkPreviewLoader(client, {
    chapterId: "chapter",
    pages: [{ id: "page", index: 0, imageUrl: null, imageOptimizedUrl: "/optimized.webp" }],
  });
  const signal = new AbortController().signal;
  expect((await load("page", signal)).composite.source).toBe("/original.webp");
  expect(list).toHaveBeenCalledWith(client, "chapter", signal);
});

test("reports an unavailable original instead of displaying the thumbnail", async () => {
  const client = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => null });
  list.mockReset().mockResolvedValue({
    success: true,
    data: [
      {
        id: "page",
        imageUploaded: true,
        imageUrl: null,
        imageOptimizedUrl: "/optimized.webp",
      },
    ],
  });
  const load = createArtworkPreviewLoader(client, {
    chapterId: "chapter",
    pages: [{ id: "page", index: 0, imageUrl: null, imageOptimizedUrl: "/optimized.webp" }],
  });
  const signal = new AbortController().signal;
  await expect(load("page", signal)).rejects.toThrow("此页预览尚未上传完成，请稍后重试。");
  expect(list).toHaveBeenCalledWith(client, "chapter", signal);
});
