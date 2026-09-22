import { describe, expect, test } from "vitest";
import { isKeyboardComposing } from "./keyboard";

describe("keyboard composition", () => {
  test("recognizes active composition and the IME confirmation fallback", () => {
    expect(isKeyboardComposing({ isComposing: true, keyCode: 13 })).toBe(true);
    expect(isKeyboardComposing({ isComposing: false, keyCode: 229 })).toBe(true);
  });

  test("allows ordinary Enter, Escape, Tab and character keys", () => {
    for (const keyCode of [13, 27, 9, 65, 0]) {
      expect(isKeyboardComposing({ isComposing: false, keyCode })).toBe(false);
    }
  });
});
