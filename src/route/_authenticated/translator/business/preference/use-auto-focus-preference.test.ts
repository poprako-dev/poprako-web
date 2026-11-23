import { describe, expect, test } from "vitest";

import {
  isAutoFocusPreferenceEnabled,
  saveAutoFocusPreference,
} from "@/route/_authenticated/translator/business/preference/use-auto-focus-preference";

function createStorage(initialEntries: Record<string, string> = {}): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => Map<string, string>;
} {
  const entries = new Map(Object.entries(initialEntries));

  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
  };
}

describe("auto focus preference", () => {
  test("defaults to enabled when no preference is stored", () => {
    expect(isAutoFocusPreferenceEnabled(createStorage())).toBe(true);
  });

  test("restores both enabled and disabled preferences", () => {
    const storage = createStorage();

    saveAutoFocusPreference(false, storage);
    expect(isAutoFocusPreferenceEnabled(storage)).toBe(false);

    saveAutoFocusPreference(true, storage);
    expect(isAutoFocusPreferenceEnabled(storage)).toBe(true);
  });

  test("treats invalid stored values as enabled", () => {
    const storage = createStorage({
      "translator:auto-focus-on-create": "disabled",
    });

    expect(isAutoFocusPreferenceEnabled(storage)).toBe(true);
  });

  test("keeps working when browser storage is unavailable", () => {
    expect(isAutoFocusPreferenceEnabled(null)).toBe(true);
    expect(() => {
      saveAutoFocusPreference(false, null);
    }).not.toThrow();
  });
});
