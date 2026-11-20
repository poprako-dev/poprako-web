import { describe, expect, test } from "vitest";

import {
  readProofreadPreviewPreference,
  saveProofreadPreviewPreference,
} from "@/route/_authenticated/translator/business/preference/use-proofread-preview-preference";

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

describe("proofread preview preference", () => {
  test("defaults to visible when no preference is stored", () => {
    expect(readProofreadPreviewPreference(createStorage())).toBe("visible");
  });

  test("restores both dimmed and visible preferences", () => {
    const storage = createStorage();

    saveProofreadPreviewPreference("dimmed", storage);
    expect(readProofreadPreviewPreference(storage)).toBe("dimmed");

    saveProofreadPreviewPreference("visible", storage);
    expect(readProofreadPreviewPreference(storage)).toBe("visible");
  });

  test("treats invalid stored values as visible", () => {
    const storage = createStorage({
      "translator:proofread-preview-visibility": "hidden",
    });

    expect(readProofreadPreviewPreference(storage)).toBe("visible");
  });

  test("keeps working when browser storage is unavailable", () => {
    expect(readProofreadPreviewPreference(null)).toBe("visible");
    expect(() => {
      saveProofreadPreviewPreference("dimmed", null);
    }).not.toThrow();
  });
});
