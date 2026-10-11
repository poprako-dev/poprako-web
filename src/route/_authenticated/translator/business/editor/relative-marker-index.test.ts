import { describe, expect, it } from "vitest";
import { getRelativeMarkerIndex } from "./use-editor-keyboard";

describe("getRelativeMarkerIndex", () => {
  it("starts at the first marker when moving forward without a current marker", () => {
    expect(getRelativeMarkerIndex(-1, 4, 1)).toBe(0);
  });

  it("starts at the last marker when moving backward without a current marker", () => {
    expect(getRelativeMarkerIndex(-1, 4, -1)).toBe(3);
  });

  it("wraps from the first marker to the last marker when moving backward", () => {
    expect(getRelativeMarkerIndex(0, 4, -1)).toBe(3);
  });
});
