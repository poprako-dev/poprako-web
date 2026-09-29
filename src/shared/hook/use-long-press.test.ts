// @vitest-environment jsdom
// @vitest-environment-options {"url":"http://localhost/"}
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useLongPress } from "@/shared/hook/use-long-press";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useLongPress", () => {
  test("clears a pending press when its owner unmounts", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as ReactPointerEvent;
    const { result, unmount } = renderHook(() => useLongPress({ onLongPress }));

    act(() => {
      result.current.onPointerDown(event);
    });
    unmount();
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });
});
