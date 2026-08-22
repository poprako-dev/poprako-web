import { describe, expect, test } from "vitest";

import {
  loadRelocationPreference,
  saveRelocationPreference,
} from "./useRelocationPreference";

function createStorage(initialEntries: Record<string, string> = {}) {
  const entries = new Map(Object.entries(initialEntries));

  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
  };
}

describe("relocation preference", () => {
  test("defaults to disabled when no preference is stored", () => {
    expect(loadRelocationPreference(createStorage())).toBe(false);
  });

  test("restores both enabled and disabled preferences", () => {
    const storage = createStorage();

    saveRelocationPreference(true, storage);
    expect(loadRelocationPreference(storage)).toBe(true);

    saveRelocationPreference(false, storage);
    expect(loadRelocationPreference(storage)).toBe(false);
  });

  test("treats invalid stored values as disabled", () => {
    const storage = createStorage({ "translator:relocation-enabled": "enabled" });

    expect(loadRelocationPreference(storage)).toBe(false);
  });
});
