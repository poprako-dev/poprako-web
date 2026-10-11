import { showLocalCaughtError } from "@/route/business/request-error";
import type { RefObject } from "react";
import type { TranslatorCompletionStage } from "../contract/access";
import type { EditorProps } from "./editor-props";
import type { EditorState } from "./use-editor-state";
import type { useUnitPersistence } from "../persistence/use-unit-persistence";

type Persistence = ReturnType<typeof useUnitPersistence>;

export function createEditorSessionActions(
  props: EditorProps,
  state: EditorState,
  persistence: Persistence,
  completionStage: TranslatorCompletionStage | undefined,
  generationRef: RefObject<number>,
): {
  handleSave: () => Promise<void>;
  handleToggleImageQuality: () => Promise<void>;
  handleCompleteStage: () => Promise<void>;
} {
  return {
    handleSave: () => saveEditorUnits(persistence.flushIfDirty),
    handleToggleImageQuality: () => toggleEditorImageQuality(props, state, generationRef),
    handleCompleteStage: () => completeEditorStage(props, state, persistence, completionStage),
  };
}

async function saveEditorUnits(flushIfDirty: Persistence["flushIfDirty"]): Promise<void> {
  try {
    await flushIfDirty();
  } catch {
    // The persistence coordinator already reports and retains failed saves.
  }
}

async function toggleEditorImageQuality(
  props: EditorProps,
  state: EditorState,
  generationRef: RefObject<number>,
): Promise<void> {
  const page = props.project.pages[state.pageIndex];
  if (!page) return;
  const isHighResolution = !state.isHighResolution;
  const generation = ++generationRef.current;
  state.setIsHighResolution(isHighResolution);
  state.setIsLoadingPage(true);
  state.setImageUrl(null);
  try {
    const image = await props.onLoadPageImage(page.id, isHighResolution ? "original" : "optimized");
    if (generation === generationRef.current) state.setImageUrl(image);
  } catch (error) {
    console.error("[BaseTranslator] 图片加载失败", error);
    showLocalCaughtError(error, state.showToast, "图片加载失败，请重试");
  } finally {
    if (generation === generationRef.current) state.setIsLoadingPage(false);
  }
}

async function completeEditorStage(
  props: EditorProps,
  state: EditorState,
  persistence: Persistence,
  completionStage: TranslatorCompletionStage | undefined,
): Promise<void> {
  if (!completionStage || state.isCompletingStage || state.hasCompletedStage) return;
  state.setIsCompletingStage(true);
  try {
    await persistence.runExclusive(() => props.onCompleteStage(completionStage));
    state.setHasCompletedStage(true);
    state.setIsCompleteConfirmOpen(false);
    state.showToast(completionStage === "proofread" ? "校对已完成" : "翻译已完成", "success");
  } catch (error) {
    console.error("[BaseTranslator] 推进译校阶段失败", { stage: completionStage, error });
    showLocalCaughtError(error, state.showToast, "推进阶段失败，请重试");
  } finally {
    state.setIsCompletingStage(false);
  }
}
