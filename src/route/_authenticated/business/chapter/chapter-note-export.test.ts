import { expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { exportChapter } from "./chapter-request";

test("chapter exports decode notes by audience from the API fields", async () => {
  const fetchImpl = vi.fn(() =>
    Promise.resolve(
      Response.json({
        label_plus: "text",
        poprako: {
          comic_id: "comic",
          comic_title: "Comic",
          chapter_id: "chapter",
          chapter_index: 0,
          chapter_subtitle: "Chapter",
          pages: [
            {
              page_id: "page",
              page_index: 0,
              units: [{ unit_id: "unit", translation_note: "翻校", typography_note: "嵌字" }],
            },
          ],
        },
      }),
    ),
  );
  const client = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => null, fetchImpl });
  const result = await exportChapter(client, "chapter");
  expect(result.success).toBe(true);
  if (!result.success) throw new Error(result.error);
  expect(result.data.poprako.pages[0]?.units[0]).toEqual({
    unitId: "unit",
    translationNote: "翻校",
    typographyNote: "嵌字",
  });
});
