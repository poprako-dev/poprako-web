import type { RefObject as TranslatorImportedType0 } from "react";
import { useCallback, useEffect, useRef } from "react";
import { showLocalCaughtError } from "@/route/business/request-error";
import { unitId } from "@/route/_authenticated/translator/business/unit/unit";
import { useDetachableSpecialCharsBar } from "@/route/_authenticated/translator/business/preference/use-detachable-special-chars-bar";
import type { UnitTextPart } from "@/route/_authenticated/translator/business/contract/unit-search-transform";
import { useUnitPersistence } from "@/route/_authenticated/translator/business/persistence/use-unit-persistence";
import { translatorCompletionStage } from "@/route/_authenticated/translator/business/contract/access";
import type { EditorProps } from "./editor-props";
import { type EditorState, useEditorState } from "./use-editor-state";
import { useEditorUnitActions } from "./use-editor-unit-actions";
import { useEditorKeyboard } from "./use-editor-keyboard";
type EditorSessionAdditions = {
  pageLoadGenerationRef: TranslatorImportedType0<number>;
  isSpecialCharsBarSuspended: boolean;
  isSpecialCharsBarVisible: boolean;
  canInsertSpecialChar: boolean;
  specialCharsBar: ReturnType<typeof useDetachableSpecialCharsBar>;
  loadPage: (idx: number, targetUnitId?: string) => Promise<void>;
  handleSave: () => Promise<void>;
  handleToggleImageQuality: () => Promise<void>;
  handleCompleteStage: () => Promise<void>;
  completionStage: ReturnType<typeof translatorCompletionStage>;
  unitSearchPart: UnitTextPart;
};

export type EditorSession = EditorProps &
  EditorState &
  ReturnType<typeof useUnitPersistence> &
  ReturnType<typeof useEditorUnitActions> &
  ReturnType<typeof useEditorKeyboard> &
  EditorSessionAdditions;

export function useEditorSession(props: EditorProps): EditorSession {
  const {
    project,
    onLoadUnits,
    onSaveUnits,
    onLoadPageImage,
    onCompleteStage,
    onExit,
    canTranslate,
    canProofread,
  } = props;
  const state = useEditorState(props);
  const loadPageRef = useRef<((idx: number, targetUnitId?: string) => Promise<void>) | null>(null);
  const loadPage = useCallback((idx: number, targetUnitId?: string) => {
    const callback = loadPageRef.current;
    return callback ? callback(idx, targetUnitId) : Promise.resolve();
  }, []);
  const {
    initialPageIndex,
    pageIndex,
    setPageIndex,
    unitBuf,
    setUnitBuf,
    focusedUnitId,
    setFocusedUnitId,
    view,
    isReadOnly,
    canEditView,
    setImageUrl,
    isHighResolution,
    setIsHighResolution,
    isLoadingPage,
    setIsLoadingPage,
    imageQuality,
    isShortcutPanelOpen,
    isSpecialCharPanelOpen,
    isUnitSearchTransformOpen,
    deleteConfirmUnitId,
    isCompletingStage,
    setIsCompletingStage,
    hasCompletedStage,
    setHasCompletedStage,
    isCompleteConfirmOpen,
    setIsCompleteConfirmOpen,
    relocationSuppressedUnitIdRef,
    pendingCenteredUnitIdRef,
    showToast,
  } = state;
  const completionStage = translatorCompletionStage({
    canTranslate,
    canProofread,
  });

  const persistence = useUnitPersistence({
    onSaveUnits,
    onReloadUnits: onLoadUnits,
    onExit,
    showToast,
    loadPage,
    setUnitBuf,
    autoSaveEnabled:
      !isLoadingPage && !isReadOnly && !isUnitSearchTransformOpen && !isCompletingStage,
  });
  const { pendingAction, runExclusive, setLoadedUnits, flushIfDirty } = persistence;

  const pageLoadGenerationRef = useRef(0);

  const isSpecialCharsBarSuspended =
    isShortcutPanelOpen ||
    isSpecialCharPanelOpen ||
    isUnitSearchTransformOpen ||
    pendingAction !== null ||
    deleteConfirmUnitId !== undefined ||
    isCompleteConfirmOpen;
  const isSpecialCharsBarVisible = !isReadOnly && !isSpecialCharsBarSuspended;
  const canInsertSpecialChar =
    canEditView &&
    !isLoadingPage &&
    !isCompletingStage &&
    !isSpecialCharsBarSuspended &&
    unitBuf.some((unit) => unitId(unit) === focusedUnitId);
  const specialCharsBar = useDetachableSpecialCharsBar({
    enabled: isSpecialCharsBarVisible,
    interactionKey: JSON.stringify([
      project.id,
      pageIndex,
      focusedUnitId,
      view,
      isLoadingPage,
      isCompletingStage,
      canEditView,
    ]),
  });

  useEffect(
    () => () => {
      pageLoadGenerationRef.current += 1;
    },
    [],
  );

  async function loadPageCurrent(idx: number, targetUnitId?: string): Promise<void> {
    const page = project.pages[idx];
    if (!page) return;
    const generation = ++pageLoadGenerationRef.current;
    setIsLoadingPage(true);
    try {
      const [units, img] = await Promise.all([
        onLoadUnits(page.id),
        onLoadPageImage(page.id, imageQuality),
      ]);
      if (generation !== pageLoadGenerationRef.current) return;
      setPageIndex(idx);
      setLoadedUnits(page.id, units);
      setImageUrl(img);
      relocationSuppressedUnitIdRef.current = null;
      pendingCenteredUnitIdRef.current = targetUnitId ?? null;
      setFocusedUnitId(targetUnitId);
    } finally {
      if (generation === pageLoadGenerationRef.current) setIsLoadingPage(false);
    }
  }

  useEffect(() => {
    loadPageRef.current = loadPageCurrent;
  });

  useEffect(() => {
    if (project.pages.length > 0) {
      void loadPage(initialPageIndex).catch((error: unknown) => {
        console.error("[BaseTranslator] 初始页面加载失败", error);
        showLocalCaughtError(error, showToast, "页面加载失败，请重试");
      });
    }
  }, [initialPageIndex, loadPage, project.pages.length, showToast]);

  async function handleSave(): Promise<void> {
    try {
      await flushIfDirty();
    } catch {
      // The persistence coordinator already reports and retains failed saves.
    }
  }

  async function handleToggleImageQuality(): Promise<void> {
    const isNextIsHighResolution = !isHighResolution;
    const page = project.pages[pageIndex];
    if (!page) return;

    const generation = ++pageLoadGenerationRef.current;
    setIsHighResolution(isNextIsHighResolution);
    setIsLoadingPage(true);
    setImageUrl(null);
    try {
      const nextImageUrl = await onLoadPageImage(
        page.id,
        isNextIsHighResolution ? "original" : "optimized",
      );
      if (generation === pageLoadGenerationRef.current) {
        setImageUrl(nextImageUrl);
      }
    } catch (error) {
      console.error("[BaseTranslator] 图片加载失败", error);
      showLocalCaughtError(error, showToast, "图片加载失败，请重试");
    } finally {
      if (generation === pageLoadGenerationRef.current) setIsLoadingPage(false);
    }
  }

  async function handleCompleteStage(): Promise<void> {
    if (!completionStage || isCompletingStage || hasCompletedStage) {
      return;
    }

    setIsCompletingStage(true);
    try {
      await runExclusive(() => onCompleteStage(completionStage));
      setHasCompletedStage(true);
      setIsCompleteConfirmOpen(false);
      showToast(completionStage === "proofread" ? "校对已完成" : "翻译已完成", "success");
    } catch (error) {
      console.error("[BaseTranslator] 推进译校阶段失败", {
        stage: completionStage,
        error,
      });
      showLocalCaughtError(error, showToast, "推进阶段失败，请重试");
    } finally {
      setIsCompletingStage(false);
    }
  }

  const actions = useEditorUnitActions({
    ...props,
    ...state,
    ...persistence,
    canInsertSpecialChar,
  });
  const keyboard = useEditorKeyboard({
    ...props,
    ...state,
    ...persistence,
    ...actions,
    handleSave,
  });
  const unitSearchPart: UnitTextPart =
    state.view === "translate" ? "translatedText" : "proofreadText";
  return {
    ...props,
    ...state,
    ...persistence,
    ...actions,
    ...keyboard,
    pageLoadGenerationRef,
    isSpecialCharsBarSuspended,
    isSpecialCharsBarVisible,
    canInsertSpecialChar,
    specialCharsBar,
    loadPage,
    handleSave,
    handleToggleImageQuality,
    handleCompleteStage,
    completionStage,
    unitSearchPart,
  };
}
