import { fireEvent, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { useEditorKeyboard } from "./use-editor-keyboard";
import { mockProject } from "../test/base-translator-story-data";
import { undoUnit } from "../test/unit-undo-fixture";

type Options = Parameters<typeof useEditorKeyboard>[0];

function keyboardOptions(view: Options["view"]): Options {
  return {
    pageIndex: 0,
    project: mockProject,
    unitBuf: [undoUnit()],
    unitBufRef: { current: [undoUnit()] },
    focusedUnitId: "u1",
    setFocusedUnitId: vi.fn(),
    availableModes: ["translate", "proofread"],
    mode: "translate",
    view,
    nextView: "readOnly",
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
    activeShortcuts: [
      { action: "copyFromTranslation", label: "从初翻复制", keys: ["Control", "e"] },
    ],
    handleNavigate: vi.fn(),
    undo: vi.fn(),
    canUndo: false,
    handleQuickSpecialChar: vi.fn(),
    handleQuickSpecialCharAt: vi.fn(),
    handleFocusUnit: vi.fn(),
    handleCopyFromTranslation: vi.fn(),
    handleSave: vi.fn(),
  };
}

function pressCopyShortcut(): void {
  fireEvent.keyDown(document.body, { key: "e", ctrlKey: true });
}

test("copy from translation runs in proofread view", () => {
  const options = keyboardOptions("proofread");
  renderHook(() => useEditorKeyboard(options));
  pressCopyShortcut();
  expect(options.handleCopyFromTranslation).toHaveBeenCalledOnce();
});

test("copy from translation is ignored in translate view", () => {
  const options = keyboardOptions("translate");
  renderHook(() => useEditorKeyboard(options));
  pressCopyShortcut();
  expect(options.handleCopyFromTranslation).not.toHaveBeenCalled();
});

test("copy from translation is ignored while a panel is open", () => {
  const options = { ...keyboardOptions("proofread"), isShortcutPanelOpen: true };
  renderHook(() => useEditorKeyboard(options));
  pressCopyShortcut();
  expect(options.handleCopyFromTranslation).not.toHaveBeenCalled();
});
