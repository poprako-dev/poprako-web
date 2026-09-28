import { describe, expect, test } from "vitest";
import {
  unwrapRawPageInfo,
  type RawPageInfo,
} from "@/routes/_authenticated/business/page/raw-page";

function rawPage(imageOptimizedUrl: string | null | undefined): RawPageInfo {
  return {
    id: "page-1",
    chapter_id: "chapter-1",
    index: 0,
    image_url: "images.test/page.png",
    image_optimized_url: imageOptimizedUrl,
    image_thumbnail_url: "images.test/page-thumbnail.png",
    image_hash: "hash",
    ext: "png",
    total_unit_count: 3,
    translated_unit_count: 2,
    proofread_unit_count: 1,
    created_at: 1,
    updated_at: 2,
  };
}

describe("page API conversion", () => {
  test("unwraps the optimized image URL", () => {
    expect(unwrapRawPageInfo(rawPage("images.test/page-optimized.png")).imageOptimizedUrl).toBe(
      "https://images.test/page-optimized.png",
    );
  });

  test.each([null, undefined])("keeps a missing optimized image URL empty", (imageOptimizedUrl) => {
    expect(unwrapRawPageInfo(rawPage(imageOptimizedUrl)).imageOptimizedUrl).toBe("");
  });
});
