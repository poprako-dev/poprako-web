import { describe, expect, test } from "vitest";
import { isKeyboardComposing } from "@/shared/utility/keyboard";
import { defaultUndoKeys, isShortcutMatch } from "./shortcut";

test.each(["Macintosh", "Windows NT", "Linux"])("undo default matches %s", (platform) => {
  const mac = platform === "Macintosh";
  const keys = defaultUndoKeys(platform);
  expect(keys).toEqual([mac ? "Meta" : "Control", "."]);
  expect(
    isShortcutMatch(
      { key: ".", metaKey: mac, ctrlKey: !mac, altKey: false, shiftKey: false } as KeyboardEvent,
      keys,
    ),
  ).toBe(true);
});

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
