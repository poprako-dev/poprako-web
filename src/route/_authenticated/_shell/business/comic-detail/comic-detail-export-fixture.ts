import { vi } from "vitest";
import { createApiClient } from "@/api/client";
import type { ChapterExports } from "@/route/_authenticated/business/chapter/chapter-input";
import type { ExportContext } from "./comic-detail-export-types";

export function createExportData(): ChapterExports {
  return {
    labelPlus: "LP translation",
    rawIdents: [{ pageId: "page-0", rawIdent: "原图.png" }],
    poprako: {
      comicId: "comic",
      comicTitle: "漫画",
      chapterId: "chapter",
      chapterIndex: 0,
      chapterSubtitle: "第一话",
      pages: [{ pageId: "page-0", pageIndex: 0, units: [{ translatedText: "译文" }] }],
    },
  };
}

export function createExportContext(controller = new AbortController()): ExportContext {
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "token",
    fetchImpl: vi
      .fn<typeof fetch>()
      .mockImplementation(() =>
        Promise.resolve(new Response("image", { headers: { "content-type": "image/png" } })),
      ),
  });
  return {
    client,
    comicTitle: "漫画",
    comicAuthor: "作者",
    comicIndex: 0,
    selectedChapterId: "chapter",
    selectedChapter: { index: 0, subtitle: "第一话" },
    pages: [
      {
        id: "page-0",
        chapterId: "chapter",
        index: 0,
        imageUrl: "https://storage.example/page.png",
        isUploaded: true,
        extension: "png",
        totalUnitCount: 1,
        translatedUnitCount: 1,
        proofreadUnitCount: 0,
        createdAt: 0,
        updatedAt: 0,
      },
    ],
    assignments: [],
    onExportChapter: vi.fn().mockResolvedValue({ success: true, data: createExportData() }),
    onWorkflowRecordsChanged: vi.fn(),
    showToast: vi.fn(),
    signal: controller.signal,
    assertNotAborted: () => {
      controller.signal.throwIfAborted();
    },
    updateProgress: vi.fn(),
    completedPages: { value: 0 },
  };
}

export function readExportJson(
  files: Map<string, Blob | string>,
  path: string,
): {
  pages: (ChapterExports["poprako"]["pages"][number] & { exportedImagePath?: string | null })[];
  skippedImageCount?: number;
} {
  const content = files.get(path);
  if (typeof content !== "string") throw new Error(`Missing text export: ${path}`);
  return JSON.parse(content) as ReturnType<typeof readExportJson>;
}
