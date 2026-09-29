import { describe, expect, test } from "vitest";
import { resolveArchiveImageNames } from "@/route/_authenticated/_shell/business/comic-detail/export-image-names";

const PAGES = [
  { pageId: "page-0", defaultName: "000.png" },
  { pageId: "page-1", defaultName: "001.jpg" },
  { pageId: "page-2", defaultName: "002.jpg" },
];

describe("export image names", () => {
  test("resolves original image names by page ID", () => {
    const rawIdentByPageId = new Map([
      ["page-0", "原稿 01.PNG"],
      ["page-1", "scan-b.jpg"],
    ]);

    expect(Object.fromEntries(resolveArchiveImageNames(PAGES, rawIdentByPageId))).toEqual({
      "page-0": "原稿 01.PNG",
      "page-1": "scan-b.jpg",
    });
  });

  test("keeps names safe and prevents duplicate ZIP entries", () => {
    const rawIdentByPageId = new Map([
      ["page-0", "same.jpg"],
      ["page-1", "same.jpg"],
      ["page-2", "../escape.png"],
    ]);

    expect(Object.fromEntries(resolveArchiveImageNames(PAGES, rawIdentByPageId))).toEqual({
      "page-0": "same.jpg",
      "page-1": "same (2).jpg",
    });
  });

  test("leaves backend fallback names to the normal ZIP naming path", () => {
    const rawIdentByPageId = new Map([["page-0", "000.png"]]);
    expect(resolveArchiveImageNames(PAGES, rawIdentByPageId).size).toBe(0);
  });
});
