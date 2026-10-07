import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { READ_ONLY_VIEW_STORAGE_KEY, useReadOnlyView } from "./use-read-only-view";

beforeEach(() => {
  localStorage.removeItem(READ_ONLY_VIEW_STORAGE_KEY);
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.removeItem(READ_ONLY_VIEW_STORAGE_KEY);
});

it("restores the preference without overwriting it when the project cannot display it", () => {
  localStorage.setItem(READ_ONLY_VIEW_STORAGE_KEY, "revision_note");
  const { result, rerender } = renderHook(({ available }) => useReadOnlyView(available), {
    initialProps: { available: false },
  });
  expect(result.current.view).toBe("unit");
  expect(localStorage.getItem(READ_ONLY_VIEW_STORAGE_KEY)).toBe("revision_note");
  rerender({ available: true });
  expect(result.current.view).toBe("revision_note");
  act(() => {
    result.current.toggle();
  });
  expect(localStorage.getItem(READ_ONLY_VIEW_STORAGE_KEY)).toBe("unit");
});

it("defaults to unit for invalid records", () => {
  localStorage.setItem(READ_ONLY_VIEW_STORAGE_KEY, "unknown");
  expect(renderHook(() => useReadOnlyView(true)).result.current.view).toBe("unit");
});

it("remains usable when storage reads and writes fail", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  const { result } = renderHook(() => useReadOnlyView(true));
  expect(result.current.view).toBe("unit");
  act(() => {
    result.current.toggle();
  });
  expect(result.current.view).toBe("revision_note");
});
