import { afterEach, expect, test, vi } from "vitest";
import { createTestApi } from "@/test-resource/api-client";
import { startChapterPageUpload, cancelAllPageUploads } from "./page-upload";
import { getPageUploadTaskState, subscribePageUploadTasks } from "./page-upload-store";

vi.mock("@/shared/utility/hash/image-hash", () => ({
  hashPageFile: (file: File) => Promise.resolve({ imageHash: file.name }),
}));
vi.mock("@/route/_authenticated/business/page/page-request", () => ({
  listPages: () => Promise.resolve({ success: true, data: [] }),
  allocChapterPages: (
    _client: unknown,
    args: { pages: { imageHash: string; extension: string }[] },
  ) =>
    Promise.resolve({
      success: true,
      data: {
        pages: args.pages.map((page, index) => ({
          ...page,
          pageId: `page-${String(index)}`,
          index,
          slot: null,
        })),
      },
    }),
}));

afterEach(cancelAllPageUploads);

test.each([100, 1000])(
  "publishes preparation and allocation for %i files once each",
  async (count) => {
    const publishedSizes: number[] = [];
    const unsubscribe = subscribePageUploadTasks((state, previous) => {
      const tasks = state.tasksByChapter["chapter"];
      if (tasks && tasks !== previous.tasksByChapter["chapter"]) {
        publishedSizes.push(Object.keys(tasks).length);
      }
    });
    try {
      const files = Array.from(
        { length: count },
        (_, index) => new File(["image"], `${String(index)}.png`),
      );
      const started = await startChapterPageUpload(createTestApi(), "chapter", files);
      await expect(started.completion).resolves.toEqual({
        succeeded: 0,
        failed: 0,
        reportedValidationFailures: 0,
      });
      expect(started.skippedCount).toBe(count);
      expect(publishedSizes).toEqual([count, count]);
      expect(
        Object.values(getPageUploadTaskState().tasks).every((task) => task.status === "succeeded"),
      ).toBe(true);
    } finally {
      unsubscribe();
    }
  },
);
