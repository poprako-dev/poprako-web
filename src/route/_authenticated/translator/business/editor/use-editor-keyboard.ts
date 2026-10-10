import { useEffect } from "react";
import { unitId } from "@/route/_authenticated/translator/business/unit/unit";
import { useShortcutActions } from "@/shared/hook/use-shortcut-actions";
import { shouldIgnoreWorkbenchKey } from "@/shared/utility/keyboard-scope";
import type { EditorState } from "./use-editor-state";
import type { EditorUnitActions } from "./use-editor-unit-actions";
import type { EditorProps } from "./editor-props";
import type { useUnitPersistence } from "../persistence/use-unit-persistence";
type Options = Pick<
  EditorState,
  | "pageIndex"
  | "unitBuf"
  | "focusedUnitId"
  | "setFocusedUnitId"
  | "availableModes"
  | "mode"
  | "setViewState"
  | "setProofreadPreviewVisibility"
  | "isReadOnly"
  | "canSwitchView"
  | "toggleRelocation"
  | "isShortcutPanelOpen"
  | "isSpecialCharPanelOpen"
  | "isUnitSearchTransformOpen"
  | "isPageStatsOpen"
  | "setIsPageStatsOpen"
  | "activeShortcuts"
> &
  Pick<ReturnType<typeof useUnitPersistence>, "handleNavigate"> &
  Pick<
    EditorUnitActions,
    "handleQuickSpecialChar" | "handleQuickSpecialCharAt" | "handleFocusUnit"
  > &
  Pick<EditorProps, "project"> & { handleSave: () => Promise<void> };
export function useEditorKeyboard(options: Options): { handleSwitchView: () => void } {
  const handleSwitchView = createSwitchViewHandler({
    canSwitchView: options.canSwitchView,
    setIsPageStatsOpen: options.setIsPageStatsOpen,
    setViewState: options.setViewState,
    availableModes: options.availableModes,
    mode: options.mode,
  });
  useKeyboardBindings(options, handleSwitchView);
  return { handleSwitchView };
}

function useKeyboardBindings(options: Options, handleSwitchView: () => void): void {
  const {
    unitBuf,
    focusedUnitId,
    setFocusedUnitId,
    setProofreadPreviewVisibility,
    isReadOnly,
    isShortcutPanelOpen,
    isSpecialCharPanelOpen,
    isUnitSearchTransformOpen,
    isPageStatsOpen,
    activeShortcuts,
    toggleRelocation,
    pageIndex,
    project,
    handleNavigate,
    handleQuickSpecialChar,
    handleQuickSpecialCharAt,
    handleFocusUnit,
    handleSave,
  } = options;
  const disabled =
    isShortcutPanelOpen ||
    isSpecialCharPanelOpen ||
    isUnitSearchTransformOpen ||
    (isReadOnly && isPageStatsOpen);
  useShortcutActions(
    createEditorShortcutActions({
      handleSwitchView,
      toggleRelocation,
      setProofreadPreviewVisibility,
      unitBuf,
      focusedUnitId,
      handleFocusUnit,
      pageIndex,
      project,
      handleNavigate,
      handleQuickSpecialChar,
      handleQuickSpecialCharAt,
      handleSave,
    }),
    activeShortcuts,
    disabled,
    "[data-unit-id]",
  );

  useEscapeToClearFocus(disabled, setFocusedUnitId);
}

function createSwitchViewHandler(
  options: Pick<
    Options,
    "canSwitchView" | "setIsPageStatsOpen" | "setViewState" | "availableModes" | "mode"
  >,
): () => void {
  return () => {
    if (!options.canSwitchView) return;
    options.setIsPageStatsOpen(false);
    options.setViewState((current) => {
      const currentIndex = options.availableModes.indexOf(current.view);
      const next = options.availableModes[(currentIndex + 1) % options.availableModes.length];
      return next ? { entryMode: options.mode, view: next } : current;
    });
  };
}

type ShortcutMap = Parameters<typeof useShortcutActions>[0];
type ShortcutOptions = Pick<
  Options,
  | "toggleRelocation"
  | "setProofreadPreviewVisibility"
  | "unitBuf"
  | "focusedUnitId"
  | "handleFocusUnit"
  | "pageIndex"
  | "project"
  | "handleNavigate"
  | "handleQuickSpecialChar"
  | "handleQuickSpecialCharAt"
  | "handleSave"
> & { handleSwitchView: () => void };

function createEditorShortcutActions(options: ShortcutOptions): ShortcutMap {
  return {
    toggleMode: options.handleSwitchView,
    toggleRelocation: options.toggleRelocation,
    toggleProofreadPreview: () => {
      toggleProofreadPreview(options.setProofreadPreviewVisibility);
    },
    nextMarker: () => {
      focusRelativeMarker(options, 1);
    },
    prevMarker: () => {
      focusRelativeMarker(options, -1);
    },
    pageUp: () => {
      navigateRelativePage(options, -1);
    },
    pageDown: () => {
      navigateRelativePage(options, 1);
    },
    quickSpecialChar: options.handleQuickSpecialChar,
    quickSpecialChar1: () => {
      options.handleQuickSpecialCharAt(0);
    },
    quickSpecialChar2: () => {
      options.handleQuickSpecialCharAt(1);
    },
    quickSpecialChar3: () => {
      options.handleQuickSpecialCharAt(2);
    },
    save: () => {
      saveFromShortcut(options.handleSave);
    },
  };
}

function toggleProofreadPreview(setVisibility: Options["setProofreadPreviewVisibility"]): void {
  setVisibility((value) => (value === "visible" ? "dimmed" : "visible"));
}

function focusRelativeMarker(options: ShortcutOptions, direction: 1 | -1): void {
  if (options.unitBuf.length === 0) return;
  const current = options.unitBuf.findIndex((unit) => unitId(unit) === options.focusedUnitId);
  const nextIndex = getRelativeMarkerIndex(current, options.unitBuf.length, direction);
  const unit = options.unitBuf[nextIndex];
  if (unit) options.handleFocusUnit(unitId(unit));
}

export function getRelativeMarkerIndex(current: number, length: number, direction: 1 | -1): number {
  if (current < 0) return direction > 0 ? 0 : length - 1;
  return (current + direction + length) % length;
}

function navigateRelativePage(options: ShortcutOptions, direction: 1 | -1): void {
  const target = options.pageIndex + direction;
  if (target < 0 || target >= options.project.pages.length) return;
  void options.handleNavigate(target).catch((error: unknown) => {
    const label = direction < 0 ? "上一页" : "下一页";
    console.error(`[Translator] ${label}导航失败:`, error);
  });
}

function saveFromShortcut(handleSave: Options["handleSave"]): void {
  void handleSave().catch((error: unknown) => {
    console.error("[Translator] 快捷键保存失败:", error);
  });
}

function useEscapeToClearFocus(
  disabled: boolean,
  setFocusedUnitId: Options["setFocusedUnitId"],
): void {
  useEffect(() => {
    if (disabled) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (shouldIgnoreWorkbenchKey(event, "[data-unit-id]")) return;
      if (event.key === "Escape") setFocusedUnitId(undefined);
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [disabled, setFocusedUnitId]);
}
