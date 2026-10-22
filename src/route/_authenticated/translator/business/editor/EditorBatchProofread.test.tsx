import { act, fireEvent, renderHook, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { useEditorSession } from "./use-editor-session";
import { createStoryArgs } from "../test/base-translator-story-fixture";
import { undoUnit, deferredUndoSave } from "../test/unit-undo-fixture";

function batchProps(): ReturnType<typeof createStoryArgs> {
  return createStoryArgs({
    canTranslate: true,
    canProofread: true,
    units: [
      { ...undoUnit("u1", "legacy"), proofreadText: "校对", proofreaderId: "reviewer" },
      { ...undoUnit("u2"), index: 1, isProofread: true },
    ],
  });
}

function undo(): void {
  fireEvent.keyDown(document.body, {
    key: ".",
    ctrlKey: !navigator.userAgent.includes("Mac"),
    metaKey: navigator.userAgent.includes("Mac"),
  });
}

test("batch confirmation and cancellation each undo in one step without changing proofread text", async () => {
  const props = batchProps();
  const { result } = renderHook(() => useEditorSession(props));
  await waitFor(() => {
    expect(result.current.isLoadingPage).toBe(false);
  });
  const before = structuredClone(result.current.unitBuf);
  const actions = [result.current.handleModifyUnit, result.current.handleFocusUnit];
  act(() => {
    result.current.handleProofreadAllUnits(true);
  });
  expect(result.current.unitBuf.map((unit) => unit.isProofread)).toEqual([true, true]);
  expect(result.current.unitBuf[0]).toMatchObject({
    translatorId: "mock-user",
    proofreadText: "校对",
    proofreaderId: "reviewer",
  });
  expect([result.current.handleModifyUnit, result.current.handleFocusUnit]).toEqual(actions);
  act(() => {
    result.current.handleProofreadAllUnits(false);
  });
  expect(result.current.unitBuf.map((unit) => unit.isProofread)).toEqual([false, false]);
  act(undo);
  expect(result.current.unitBuf.map((unit) => unit.isProofread)).toEqual([true, true]);
  act(undo);
  expect(result.current.unitBuf).toMatchObject(before);
  expect(result.current.saveState.canUndo).toBe(false);
});

test("batch edits during saving survive the earlier acknowledgement and flush together", async () => {
  const props = batchProps();
  const originalSave = props.onSaveUnits;
  const gate = deferredUndoSave();
  props.onSaveUnits = vi.fn(async (...args: Parameters<typeof originalSave>) => {
    await gate.promise;
    return originalSave(...args);
  });
  const { result } = renderHook(() => useEditorSession(props));
  await waitFor(() => {
    expect(result.current.isLoadingPage).toBe(false);
  });
  act(() => {
    result.current.handleProofreadAllUnits(true);
  });
  let save: Promise<void> | undefined;
  act(() => {
    save = result.current.handleSave();
  });
  await waitFor(() => {
    expect(props.onSaveUnits).toHaveBeenCalledTimes(1);
  });
  act(() => {
    result.current.handleProofreadAllUnits(false);
  });
  await act(async () => {
    gate.resolve();
    await save;
  });
  expect(result.current.unitBuf.map((unit) => unit.isProofread)).toEqual([false, false]);
  expect(result.current.unitBuf[0]?.proofreadText).toBe("校对");
  expect(result.current.saveState.dirty).toBe(false);
  expect(props.onSaveUnits).toHaveBeenCalledTimes(2);
});

test("batch proofreading is blocked while loading and in read-only views", async () => {
  const props = batchProps();
  props.canTranslate = false;
  props.canProofread = false;
  const { result } = renderHook(() => useEditorSession(props));
  act(() => {
    result.current.handleProofreadAllUnits(true);
  });
  expect(result.current.unitBuf).toEqual([]);
  await waitFor(() => {
    expect(result.current.isLoadingPage).toBe(false);
  });
  const before = result.current.unitBuf;
  act(() => {
    result.current.handleProofreadAllUnits(true);
  });
  expect(result.current.unitBuf).toBe(before);
  expect(result.current.saveState.canUndo).toBe(false);
});
