import { act, fireEvent, renderHook, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { useEditorSession } from "./use-editor-session";
import { createStoryArgs } from "../test/base-translator-story-fixture";
import { undoUnit } from "../test/unit-undo-fixture";

async function setup(): Promise<
  ReturnType<typeof renderHook<ReturnType<typeof useEditorSession>, unknown>>
> {
  const props = createStoryArgs({ canTranslate: true, canProofread: true, units: [undoUnit()] });
  props.onCompleteStage = vi.fn(() => Promise.resolve());
  const hook = renderHook(() => useEditorSession(props));
  await waitFor(() => {
    expect(hook.result.current.isLoadingPage).toBe(false);
  });
  act(() => {
    hook.result.current.handleModifyUnit("page-1-u1", { translatedText: "a" });
  });
  expect(hook.result.current.saveState.canUndo).toBe(true);
  return hook;
}

function undo(): void {
  fireEvent.keyDown(document.body, {
    key: ".",
    ctrlKey: !navigator.userAgent.includes("Mac"),
    metaKey: navigator.userAgent.includes("Mac"),
  });
}

test("same-page search still centers the selected unit and retains undo history", async () => {
  const { result } = await setup();
  const centerOn = vi.fn();
  result.current.canvasRef.current = { centerOn };
  if (result.current.isRelocationEnabled) {
    act(() => {
      result.current.toggleRelocation();
    });
  }
  await act(() => result.current.searchCoordinator.navigate("page-1", "page-1-u1"));
  expect(result.current.focusedUnitId).toBe("page-1-u1");
  expect(centerOn).toHaveBeenCalledWith(0.1, 0.2);
  expect(result.current.saveState.canUndo).toBe(true);
  act(undo);
  expect(result.current.unitBuf[0]?.translatedText ?? "").toBe("");
});

test("image quality and view changes retain undo history", async () => {
  const { result } = await setup();
  await act(() => result.current.handleToggleImageQuality());
  expect(result.current.saveState.canUndo).toBe(true);
  act(() => {
    result.current.handleSwitchView();
  });
  expect(result.current.saveState.canUndo).toBe(true);
  act(undo);
  expect(result.current.unitBuf[0]?.translatedText ?? "").toBe("");
});

test("successful stage completion clears history after saving", async () => {
  const { result } = await setup();
  await act(() => result.current.handleCompleteStage());
  expect(result.current.hasCompletedStage).toBe(true);
  expect(result.current.saveState).toMatchObject({ canUndo: false, dirty: false });
  act(undo);
  expect(result.current.unitBuf[0]?.translatedText).toBe("a");
});
