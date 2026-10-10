import { expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { createArtworkPreviewLoader } from "./artwork-preview-loader";

const list = vi.hoisted(() => vi.fn());
vi.mock("@/api/page-artwork/page-artwork-api", () => ({ listPageArtworks: list }));

test("uses the optimized URL directly and refreshes expired URLs on retry", async () => {
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
  expect((await load("page", signal)).composite.source).toBe("/optimized.webp");
  expect(list).not.toHaveBeenCalled();
  expect((await load("page", signal)).composite.source).toBe("/new-optimized.webp");
  expect(list).toHaveBeenCalledWith(client, "chapter", signal);
});
