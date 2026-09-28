import { describe, expect, test } from "vitest";
import { selectPageImageUrl } from "@/route/_authenticated/translator/business/remote/page-image";

describe("translator page image selection", () => {
  test("uses the optimized image outside original mode", () => {
    expect(
      selectPageImageUrl(
        {
          imageUrl: "https://images.test/page.png",
          imageOptimizedUrl: "https://images.test/page-optimized.png",
        },
        "optimized",
      ),
    ).toBe("https://images.test/page-optimized.png");
  });

  test("falls back to the original when the optimized image is absent", () => {
    expect(
      selectPageImageUrl(
        {
          imageUrl: "https://images.test/page.png",
        },
        "optimized",
      ),
    ).toBe("https://images.test/page.png");
  });

  test("always uses the original image in original mode", () => {
    expect(
      selectPageImageUrl(
        {
          imageUrl: "https://images.test/page.png",
          imageOptimizedUrl: "https://images.test/page-optimized.png",
        },
        "original",
      ),
    ).toBe("https://images.test/page.png");
  });
});
