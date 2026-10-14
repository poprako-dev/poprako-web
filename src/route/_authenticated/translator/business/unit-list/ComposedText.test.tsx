import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { expect, test, vi } from "vitest";
import { useComposedText } from "./use-composed-text";

test("composition previews do not commit, and the final input commits exactly once", () => {
  const changed = vi.fn();
  const { result } = renderHook(() => {
    const [value, setValue] = useState("a");
    return useComposedText(value, (next) => {
      changed(next);
      setValue(next);
    });
  });
  act(() => {
    result.current.start();
  });
  act(() => {
    result.current.change("ani");
  });
  expect(result.current.value).toBe("ani");
  expect(changed).not.toHaveBeenCalled();
  act(() => {
    result.current.change("a你好");
  });
  act(() => {
    result.current.end("a你好");
    result.current.change("a你好");
  });
  expect(changed.mock.calls).toEqual([["a你好"]]);
  expect(result.current.value).toBe("a你好");
  act(() => {
    result.current.change("a你好");
  });
  expect(changed).toHaveBeenCalledTimes(1);
});

test("cancelled composition adds no edit and external undo updates the input", () => {
  const changed = vi.fn();
  const { result, rerender } = renderHook(({ value }) => useComposedText(value, changed), {
    initialProps: { value: "ab" },
  });
  act(() => {
    result.current.start();
    result.current.change("abni");
    result.current.end("ab");
  });
  expect(changed).not.toHaveBeenCalled();
  rerender({ value: "a" });
  expect(result.current.value).toBe("a");
  act(() => {
    result.current.change("ab");
  });
  expect(changed).toHaveBeenCalledWith("ab");
});
