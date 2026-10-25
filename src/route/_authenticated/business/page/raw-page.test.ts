import { describe, expect, test } from "vitest";
import { toPageInfo } from "./page-request";
import { toCamelCase } from "@/shared/utility/case-convert";
import type { SnakeCase } from "@/shared/utility/case-convert-type";
import type { PageResponse } from "@/api/page/page-api";

function rawPage(imageOptimizedUrl: string | null | undefined): SnakeCase<PageResponse> {
  return {
    id: "page-1",
    chapter_id: "chapter-1",
    index: 0,
    image_uploaded: true,
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
    expect(
      toPageInfo(toCamelCase(rawPage("images.test/page-optimized.png"))).imageOptimizedUrl,
    ).toBe("https://images.test/page-optimized.png");
  });

  test.each([null, undefined])("keeps a missing optimized image URL empty", (imageOptimizedUrl) => {
    expect(toPageInfo(toCamelCase(rawPage(imageOptimizedUrl))).imageOptimizedUrl).toBe("");
  });
});
