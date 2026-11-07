import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useDelayedHover } from "./use-delayed-hover";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test("expands only after the pointer stays for the full delay", () => {
  const { result } = renderHook(() => useDelayedHover(100));
  act(() => {
    result.current.handleMouseEnter();
  });
  act(() => {
    vi.advanceTimersByTime(99);
  });
  expect(result.current.isHovered).toBe(false);
  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(result.current.isHovered).toBe(true);
});

test("cancels a pending expansion when the pointer leaves early", () => {
  const { result } = renderHook(() => useDelayedHover(100));
  act(() => {
    result.current.handleMouseEnter();
  });
  act(() => {
    vi.advanceTimersByTime(50);
  });
  act(() => {
    result.current.handleMouseLeave();
  });
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(result.current.isHovered).toBe(false);
});

test("collapses immediately when the pointer leaves", () => {
  const { result } = renderHook(() => useDelayedHover(100));
  act(() => {
    result.current.handleMouseEnter();
  });
  act(() => {
    vi.advanceTimersByTime(100);
  });
  expect(result.current.isHovered).toBe(true);
  act(() => {
    result.current.handleMouseLeave();
  });
  expect(result.current.isHovered).toBe(false);
});
