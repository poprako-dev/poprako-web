import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { useProofreadPreviewPreference } from "@/route/_authenticated/translator/business/preference/use-proofread-preview-preference";

const STORAGE_KEY = "translator:proofread-preview-visibility";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

function toggleVisibility(current: "visible" | "dimmed"): "visible" | "dimmed" {
  return current === "visible" ? "dimmed" : "visible";
}

describe("useProofreadPreviewPreference", () => {
  test("defaults to visible when nothing was stored", () => {
    const { result } = renderHook(() => useProofreadPreviewPreference());

    expect(result.current.proofreadPreviewVisibility).toBe("visible");
  });

  test("restores the stored preference on mount", () => {
    localStorage.setItem(STORAGE_KEY, "dimmed");

    const { result } = renderHook(() => useProofreadPreviewPreference());

    expect(result.current.proofreadPreviewVisibility).toBe("dimmed");
  });

  test("persists toggles so a remount keeps the last choice", () => {
    const first = renderHook(() => useProofreadPreviewPreference());

    act(() => {
      first.result.current.setProofreadPreviewVisibility(toggleVisibility);
    });

    expect(first.result.current.proofreadPreviewVisibility).toBe("dimmed");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dimmed");

    first.unmount();

    const second = renderHook(() => useProofreadPreviewPreference());

    expect(second.result.current.proofreadPreviewVisibility).toBe("dimmed");
  });

  test("accepts a direct value as well as an updater", () => {
    const { result } = renderHook(() => useProofreadPreviewPreference());

    act(() => {
      result.current.setProofreadPreviewVisibility("dimmed");
    });

    expect(result.current.proofreadPreviewVisibility).toBe("dimmed");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dimmed");
  });
});
