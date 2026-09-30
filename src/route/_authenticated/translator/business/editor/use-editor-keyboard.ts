import { useEffect } from "react";
import { unitId } from "@/route/_authenticated/translator/business/unit/unit";
import { useShortcutActions } from "@/route/_authenticated/translator/business/editor/use-shortcut-actions";
import { shouldIgnoreTranslatorKey } from "@/route/_authenticated/translator/business/editor/keyboard-scope";
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
export function useEditorKeyboard({
  pageIndex,
  unitBuf,
  focusedUnitId,
  setFocusedUnitId,
  availableModes,
  mode,
  setViewState,
  setProofreadPreviewVisibility,
  isReadOnly,
  canSwitchView,
  toggleRelocation,
  isShortcutPanelOpen,
  isSpecialCharPanelOpen,
  isUnitSearchTransformOpen,
  isPageStatsOpen,
  setIsPageStatsOpen,
  activeShortcuts,
  handleNavigate,
  handleQuickSpecialChar,
  handleQuickSpecialCharAt,
  handleFocusUnit,
  project,
  handleSave,
}: Options): { handleSwitchView: () => void } {
  function handleSwitchView(): void {
    if (!canSwitchView) return;
    setIsPageStatsOpen(false);
    setViewState((current) => {
      const currentIndex = availableModes.indexOf(current.view);
      const next = availableModes[(currentIndex + 1) % availableModes.length];
      if (!next) return current;
      return {
        entryMode: mode,
        view: next,
      };
    });
  }

  useShortcutActions(
    {
      toggleMode: handleSwitchView,
      toggleRelocation,
      toggleProofreadPreview: () => {
        setProofreadPreviewVisibility((v) => (v === "visible" ? "dimmed" : "visible"));
      },
      nextMarker: () => {
        if (unitBuf.length === 0) return;
        const cur = unitBuf.findIndex((unit) => unitId(unit) === focusedUnitId);
        const next = cur >= unitBuf.length - 1 ? 0 : cur + 1;
        const unit = unitBuf[next];
        if (unit) handleFocusUnit(unitId(unit));
      },
      prevMarker: () => {
        if (unitBuf.length === 0) return;
        const cur = unitBuf.findIndex((unit) => unitId(unit) === focusedUnitId);
        const prev = cur <= 0 ? unitBuf.length - 1 : cur - 1;
        const unit = unitBuf[prev];
        if (unit) handleFocusUnit(unitId(unit));
      },
      pageUp: () => {
        if (pageIndex > 0) {
          void handleNavigate(pageIndex - 1).catch((error: unknown) => {
            console.error("[Translator] 上一页导航失败:", error);
          });
        }
      },
      pageDown: () => {
        if (pageIndex < project.pages.length - 1) {
          void handleNavigate(pageIndex + 1).catch((error: unknown) => {
            console.error("[Translator] 下一页导航失败:", error);
          });
        }
      },
      quickSpecialChar: handleQuickSpecialChar,
      quickSpecialChar1: () => {
        handleQuickSpecialCharAt(0);
      },
      quickSpecialChar2: () => {
        handleQuickSpecialCharAt(1);
      },
      quickSpecialChar3: () => {
        handleQuickSpecialCharAt(2);
      },
      save: () => {
        void handleSave().catch((error: unknown) => {
          console.error("[Translator] 快捷键保存失败:", error);
        });
      },
    },
    activeShortcuts,
    isShortcutPanelOpen ||
      isSpecialCharPanelOpen ||
      isUnitSearchTransformOpen ||
      (isReadOnly && isPageStatsOpen),
  );

  useEffect(() => {
    if (
      isShortcutPanelOpen ||
      isSpecialCharPanelOpen ||
      isUnitSearchTransformOpen ||
      (isReadOnly && isPageStatsOpen)
    ) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (shouldIgnoreTranslatorKey(e)) return;
      if (e.key === "Escape") {
        setFocusedUnitId(undefined);
      }
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isShortcutPanelOpen,
    isSpecialCharPanelOpen,
    isUnitSearchTransformOpen,
    isReadOnly,
    isPageStatsOpen,
    setFocusedUnitId,
  ]);

  return { handleSwitchView };
}
