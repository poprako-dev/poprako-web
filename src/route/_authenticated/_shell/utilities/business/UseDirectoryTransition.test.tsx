import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useDirectoryTransition } from "./use-directory-transition";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function stubMotion(reduced: boolean): void {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({
    matches: reduced,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

test("cancels an outgoing transition when the user immediately returns", () => {
  stubMotion(false);
  const { result, rerender } = renderHook(
    ({ level }: { level: "termbases" | "terms" }) => useDirectoryTransition(level),
    { initialProps: { level: "termbases" } },
  );
  rerender({ level: "terms" });
  act(() => {
    vi.advanceTimersByTime(20);
  });
  expect(result.current).toEqual({ displayedLevel: "termbases", fading: true });
  rerender({ level: "termbases" });
  act(() => {
    vi.advanceTimersByTime(200);
  });
  expect(result.current).toEqual({ displayedLevel: "termbases", fading: false });
});

test("switches on the next frame without a fade when motion is reduced", () => {
  stubMotion(true);
  const { result, rerender } = renderHook(
    ({ level }: { level: "termbases" | "terms" }) => useDirectoryTransition(level),
    { initialProps: { level: "termbases" } },
  );
  rerender({ level: "terms" });
  act(() => {
    vi.advanceTimersByTime(20);
  });
  expect(result.current).toEqual({ displayedLevel: "terms", fading: false });
});
