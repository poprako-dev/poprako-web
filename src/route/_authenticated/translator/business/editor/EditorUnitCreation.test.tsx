import { act, fireEvent, render, renderHook, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { BaseTranslator } from "../BaseTranslator";
import { createStoryArgs } from "../test/base-translator-story-fixture";
import { undoUnit } from "../test/unit-undo-fixture";
import { useEditorSession } from "./use-editor-session";

const TRANSLATION_PLACEHOLDER = "点击输入翻译...";

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe(): void {
        /* Geometry is controlled directly in this DOM test. */
      }
      disconnect(): void {
        /* No observer resources are allocated. */
      }
    },
  );
  vi.stubGlobal("CSS", { escape: (value: string) => value });
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

function createArgs(): ReturnType<typeof createStoryArgs> {
  return createStoryArgs({
    canTranslate: true,
    canProofread: false,
    units: [undoUnit("u1", "initial")],
  });
}

async function setupSession(): Promise<
  ReturnType<typeof renderHook<ReturnType<typeof useEditorSession>, unknown>>
> {
  const hook = renderHook(() => useEditorSession(createArgs()));
  await waitFor(() => {
    expect(hook.result.current.isLoadingPage).toBe(false);
  });
  return hook;
}

async function setupCanvas(): Promise<ReturnType<typeof render>> {
  const view = render(<BaseTranslator {...createArgs()} />);
  await view.findByPlaceholderText(TRANSLATION_PLACEHOLDER);
  await waitFor(() => {
    expect(view.container.querySelector('[role="application"] img')).not.toBeNull();
  });
  return view;
}

function clickCanvas(view: ReturnType<typeof render>, shiftKey: boolean): void {
  const image = view.container.querySelector<HTMLImageElement>('[role="application"] img');
  if (!image) throw new Error("缺少页面图片");
  vi.spyOn(image, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 100, 200));
  fireEvent.mouseDown(view.getByRole("application"), {
    button: 0,
    clientX: 20,
    clientY: 30,
    shiftKey,
  });
  fireEvent.mouseUp(window, { clientX: 20, clientY: 30 });
}

test("creating a unit keeps the focused unit when the gesture asks to keep focus", async () => {
  const { result } = await setupSession();
  act(() => {
    result.current.handleFocusUnit("page-1-u1");
  });
  act(() => {
    result.current.handleAddUnit(0.5, 0.6, true, true);
  });
  expect(result.current.unitBuf).toHaveLength(2);
  expect(result.current.focusedUnitId).toBe("page-1-u1");
});

test("creating a unit keeps the empty focus when the gesture asks to keep focus", async () => {
  const { result } = await setupSession();
  act(() => {
    result.current.handleAddUnit(0.5, 0.6, true, true);
  });
  expect(result.current.unitBuf).toHaveLength(2);
  expect(result.current.focusedUnitId).toBeUndefined();
});

test("creating a unit focuses the new unit otherwise", async () => {
  const { result } = await setupSession();
  act(() => {
    result.current.handleAddUnit(0.5, 0.6, true, false);
  });
  expect(result.current.unitBuf).toHaveLength(2);
  expect(result.current.focusedUnitId).toBe(result.current.unitBuf[1]?.id);
});

test("creating a unit keeps the current focus when auto focus is disabled", async () => {
  const { result } = await setupSession();
  act(() => {
    result.current.handleFocusUnit("page-1-u1");
  });
  act(() => {
    result.current.toggleAutoFocusOnCreate();
  });
  act(() => {
    result.current.handleAddUnit(0.5, 0.6, true, false);
  });
  expect(result.current.unitBuf).toHaveLength(2);
  expect(result.current.focusedUnitId).toBe("page-1-u1");
});

test("a shifted canvas click creates a unit without moving focus", async () => {
  const view = await setupCanvas();
  const focused = view.getByPlaceholderText(TRANSLATION_PLACEHOLDER);
  await userEvent.setup().click(focused);
  expect(document.activeElement).toBe(focused);
  clickCanvas(view, true);
  await waitFor(() => {
    expect(view.getAllByPlaceholderText(TRANSLATION_PLACEHOLDER)).toHaveLength(2);
  });
  expect(document.activeElement).toBe(focused);
});

test("a plain canvas click focuses the created unit", async () => {
  const view = await setupCanvas();
  clickCanvas(view, false);
  await waitFor(() => {
    expect(view.getAllByPlaceholderText(TRANSLATION_PLACEHOLDER)).toHaveLength(2);
  });
  const inputs = view.getAllByPlaceholderText(TRANSLATION_PLACEHOLDER);
  await waitFor(() => {
    expect(document.activeElement).toBe(inputs[1]);
  });
});

test("a plain canvas click leaves focus alone when auto focus is disabled", async () => {
  const view = await setupCanvas();
  fireEvent.click(view.getByRole("button", { name: "创建标记后自动聚焦" }));
  clickCanvas(view, false);
  await waitFor(() => {
    expect(view.getAllByPlaceholderText(TRANSLATION_PLACEHOLDER)).toHaveLength(2);
  });
  const inputs = view.getAllByPlaceholderText(TRANSLATION_PLACEHOLDER);
  expect(document.activeElement).not.toBe(inputs[1]);
});
