import { describe, expect, test } from "vitest";
import { findNextEditedPageIndex } from "@/routes/_authenticated/translator/business/edited-page-navigation";

const pages = [{ id: "page-1" }, { id: "page-2" }, { id: "page-3" }, { id: "page-4" }];

describe("edited page navigation", () => {
  test("finds the first edited page after the paginator's current index", () => {
    expect(findNextEditedPageIndex(pages, 1, ["page-1", "page-3", "page-4"])).toBe(2);
  });

  test("uses project order and ignores stale page IDs", () => {
    expect(findNextEditedPageIndex(pages, 0, ["removed-page", "page-4", "page-2"])).toBe(1);
  });

  test("does not wrap around after the last edited page", () => {
    expect(findNextEditedPageIndex(pages, 3, ["page-1", "page-4"])).toBe(-1);
  });
});
