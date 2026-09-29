import { describe, expect, test } from "vitest";

import {
  isRelocationPreferenceEnabled,
  saveRelocationPreference,
} from "@/route/_authenticated/translator/business/preference/use-relocation-preference";

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

describe("relocation preference", () => {
  test("defaults to disabled when no preference is stored", () => {
    expect(isRelocationPreferenceEnabled(createStorage())).toBe(false);
  });

  test("restores both enabled and disabled preferences", () => {
    const storage = createStorage();

    saveRelocationPreference(true, storage);
    expect(isRelocationPreferenceEnabled(storage)).toBe(true);

    saveRelocationPreference(false, storage);
    expect(isRelocationPreferenceEnabled(storage)).toBe(false);
  });

  test("treats invalid stored values as disabled", () => {
    const storage = createStorage({
      "translator:relocation-enabled": "enabled",
    });

    expect(isRelocationPreferenceEnabled(storage)).toBe(false);
  });
});
