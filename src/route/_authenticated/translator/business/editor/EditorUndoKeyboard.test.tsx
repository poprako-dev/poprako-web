import { fireEvent, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { useEditorKeyboard } from "./use-editor-keyboard";
import { mockProject } from "../test/base-translator-story-data";
import { undoUnit } from "../test/unit-undo-fixture";

type Options = Parameters<typeof useEditorKeyboard>[0];

function keyboardOptions(): Options {
  return {
    pageIndex: 0,
    project: mockProject,
    unitBuf: [undoUnit()],
    unitBufRef: { current: [undoUnit()] },
    focusedUnitId: "u1",
    setFocusedUnitId: vi.fn(),
    availableModes: ["translate", "readOnly"],
    mode: "translate",
    setViewState: vi.fn(),
    setProofreadPreviewVisibility: vi.fn(),
    isReadOnly: false,
    canEditView: true,
    isLoadingPage: false,
    isCompletingStage: false,
    deleteConfirmUnitId: undefined,
    isCompleteConfirmOpen: false,
    canSwitchView: true,
    toggleRelocation: vi.fn(),
    isShortcutPanelOpen: false,
    isSpecialCharPanelOpen: false,
    isUnitSearchTransformOpen: false,
    isPageStatsOpen: false,
    setIsPageStatsOpen: vi.fn(),
    activeShortcuts: [{ action: "undo", label: "万能回退", keys: ["Control", "."] }],
    handleNavigate: vi.fn(),
    undo: vi.fn(),
    canUndo: true,
    handleQuickSpecialChar: vi.fn(),
    handleQuickSpecialCharAt: vi.fn(),
    handleFocusUnit: vi.fn(),
    handleSave: vi.fn(),
  };
}

test.each([
  "isLoadingPage",
  "isCompletingStage",
  "isCompleteConfirmOpen",
  "isShortcutPanelOpen",
  "isSpecialCharPanelOpen",
  "isUnitSearchTransformOpen",
  "isPageStatsOpen",
] as const)("undo is disabled during %s", (field) => {
  const options = keyboardOptions();
  const { rerender } = renderHook((args) => useEditorKeyboard(args), {
    initialProps: { ...options, [field]: true },
  });
  fireEvent.keyDown(document.body, { key: ".", ctrlKey: true });
  expect(options.undo).not.toHaveBeenCalled();
  rerender(options);
  fireEvent.keyDown(document.body, { key: ".", ctrlKey: true });
  expect(options.undo).toHaveBeenCalledOnce();
});

test("readonly, empty history, and delete confirmation block undo", () => {
  const options = keyboardOptions();
  const { rerender } = renderHook((args) => useEditorKeyboard(args), { initialProps: options });
  for (const blocked of [
    { canEditView: false },
    { canUndo: false },
    { deleteConfirmUnitId: "u1" },
  ]) {
    rerender({ ...options, ...blocked });
    fireEvent.keyDown(document.body, { key: ".", ctrlKey: true });
  }
  expect(options.undo).not.toHaveBeenCalled();
});

test("undo clears focus only when the focused unit no longer exists", () => {
  const options = keyboardOptions();
  options.undo = vi.fn(() => {
    options.unitBufRef.current = [];
  });
  renderHook(() => useEditorKeyboard(options));
  fireEvent.keyDown(document.body, { key: ".", ctrlKey: true });
  expect(options.setFocusedUnitId).toHaveBeenCalledWith(undefined);
});
