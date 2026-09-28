import { describe, expect, it } from "vitest";
import {
  dragThreshold,
  isBeyondDragThreshold,
} from "@/routes/_authenticated/translator/business/unit-list/drag-threshold";

describe("dragThreshold", () => {
  it("allows more touch movement before starting a drag", () => {
    expect(dragThreshold("touch")).toBe(8);
  });

  it.each(["mouse", "pen", ""])(
    "keeps the precise pointer threshold for %s input",
    (pointerType) => {
      expect(dragThreshold(pointerType)).toBe(4);
    },
  );
});

describe("isBeyondDragThreshold", () => {
  it("keeps an eight-pixel touch movement as a tap", () => {
    expect(isBeyondDragThreshold("touch", 8, 0)).toBe(false);
  });

  it("starts a touch drag after moving beyond eight pixels", () => {
    expect(isBeyondDragThreshold("touch", 8, 1)).toBe(true);
  });

  it("starts a mouse drag after moving beyond four pixels", () => {
    expect(isBeyondDragThreshold("mouse", 4, 1)).toBe(true);
  });
});
