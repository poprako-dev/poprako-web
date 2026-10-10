import { useEffect } from "react";
import type { UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";
import { applyUnitUpdates } from "@/route/_authenticated/translator/business/unit/unit-edit";
import type { UnitEdit } from "@/route/_authenticated/translator/business/unit/unit-edit";
import {
  createUnit,
  modifyUnitPosition,
  moveUnitToIndex,
  unitId,
  unitIsBubble,
  unitPosition,
  unitProofreadText,
  unitTranslatedText,
} from "@/route/_authenticated/translator/business/unit/unit";
import type { useUnitPersistence } from "@/route/_authenticated/translator/business/persistence/use-unit-persistence";
import type { EditorState } from "./use-editor-state";
import type { EditorProps } from "./editor-props";
type Options = Pick<
  EditorState,
  | "focusedUnitId"
  | "setFocusedUnitId"
  | "isLoadingPage"
  | "isRelocationEnabled"
  | "setSpecialCharInsertRequest"
  | "setDeleteConfirmUnitId"
  | "isCompletingStage"
  | "canvasRef"
  | "lastSpecialCharRef"
  | "specialCharRequestIdRef"
  | "relocationSuppressedUnitIdRef"
  | "pendingCenteredUnitIdRef"
  | "showToast"
  | "allChars"
  | "favoriteChars"
> &
  Pick<ReturnType<typeof useUnitPersistence>, "unitBufRef" | "commitUnits" | "handleNavigate"> &
  Pick<EditorProps, "project" | "currentUserId"> & { canInsertSpecialChar: boolean };
export function useEditorUnitActions(options: Options): {
  handleRequestSpecialChar: (char: string) => void;
  handleQuickSpecialChar: () => void;
  handleQuickSpecialCharAt: (index: number) => void;
  handleSpecialCharUse: (char: string) => void;
  handleSpecialCharInserted: (requestId: number, char: string) => void;
  handleToggleBubble: (targetUnitId: string) => void;
  handleModifyUnit: (targetUnitId: string, updates: UnitEdit) => void;
  handleMoveUnit: (targetUnitId: string, xCoord: number, yCoord: number) => void;
  handleReorderUnit: (targetUnitId: string, targetIndex: number) => void;
  handleAddUnit: (xCoord: number, yCoord: number, isBubble: boolean) => void;
  handleFocusUnit: (targetUnitId: string) => void;
  handlePageImageLoad: () => void;
  handleSearchResultNavigate: (pageId: string, targetUnitId?: string) => Promise<void>;
  doDeleteUnit: (targetUnitId: string) => void;
  handleDeleteUnit: (targetUnitId: string) => void;
} {
  const charActions = createSpecialCharActions(options);
  const editActions = createUnitEditActions(options);
  const focusActions = createFocusActions(options);
  const deleteActions = createDeleteActions(options);
  useEditorUnitRelocation(options);
  return {
    ...charActions,
    ...editActions,
    ...focusActions,
    ...deleteActions,
  };
}

function createSpecialCharActions(
  options: Options,
): Pick<
  ReturnType<typeof useEditorUnitActions>,
  | "handleRequestSpecialChar"
  | "handleQuickSpecialChar"
  | "handleQuickSpecialCharAt"
  | "handleSpecialCharUse"
  | "handleSpecialCharInserted"
> {
  function handleRequestSpecialChar(char: string): void {
    if (!char || !options.focusedUnitId || !options.canInsertSpecialChar) return;
    const requestId = options.specialCharRequestIdRef.current + 1;
    options.specialCharRequestIdRef.current = requestId;
    options.setSpecialCharInsertRequest({
      id: requestId,
      char,
      targetUnitId: options.focusedUnitId,
    });
  }
  return {
    handleRequestSpecialChar,
    handleQuickSpecialChar: () => {
      const char = options.lastSpecialCharRef.current ?? options.allChars[0]?.text;
      if (char) handleRequestSpecialChar(char);
    },
    handleQuickSpecialCharAt: (index: number) => {
      const char = options.favoriteChars[index];
      if (char) handleRequestSpecialChar(char);
    },
    handleSpecialCharUse: (char: string) => {
      options.lastSpecialCharRef.current = char;
    },
    handleSpecialCharInserted: (requestId: number, char: string) => {
      options.lastSpecialCharRef.current = char;
      options.setSpecialCharInsertRequest((request) =>
        request?.id === requestId ? undefined : request,
      );
    },
  };
}

function createUnitEditActions(
  options: Options,
): Pick<
  ReturnType<typeof useEditorUnitActions>,
  | "handleModifyUnit"
  | "handleToggleBubble"
  | "handleMoveUnit"
  | "handleReorderUnit"
  | "handleAddUnit"
> {
  function handleModifyUnit(targetUnitId: string, updates: UnitEdit): void {
    modifyEditorUnit(options, targetUnitId, updates);
  }
  return {
    handleModifyUnit,
    handleToggleBubble: (targetUnitId: string) => {
      const unit = options.unitBufRef.current.find((item) => unitId(item) === targetUnitId);
      if (unit) handleModifyUnit(targetUnitId, { isBubble: !unitIsBubble(unit) });
    },
    handleMoveUnit: (targetUnitId: string, xCoord: number, yCoord: number) => {
      options.commitUnits(
        options.unitBufRef.current.map((unit) =>
          unitId(unit) === targetUnitId ? modifyUnitPosition(unit, xCoord, yCoord) : unit,
        ),
      );
    },
    handleReorderUnit: (targetUnitId: string, targetIndex: number) => {
      options.commitUnits(moveUnitToIndex(options.unitBufRef.current, targetUnitId, targetIndex));
    },
    handleAddUnit: (xCoord: number, yCoord: number, isBubble: boolean) => {
      addEditorUnit(options, xCoord, yCoord, isBubble);
    },
  };
}

function createFocusActions(
  options: Options,
): Pick<
  ReturnType<typeof useEditorUnitActions>,
  "handleFocusUnit" | "handlePageImageLoad" | "handleSearchResultNavigate"
> {
  return {
    handleFocusUnit: (targetUnitId: string) => {
      if (targetUnitId !== options.focusedUnitId) {
        options.relocationSuppressedUnitIdRef.current = null;
      }
      options.setFocusedUnitId(targetUnitId);
    },
    handlePageImageLoad: () => {
      centerPendingUnit(options);
    },
    handleSearchResultNavigate: (pageId: string, targetUnitId?: string) =>
      navigateToSearchResult(
        options.project,
        options.handleNavigate,
        options.showToast,
        pageId,
        targetUnitId,
      ),
  };
}

function centerPendingUnit(options: Options): void {
  const targetUnitId = options.pendingCenteredUnitIdRef.current;
  if (!targetUnitId) return;
  const unit = options.unitBufRef.current.find((item) => unitId(item) === targetUnitId);
  if (!unit) return;
  options.pendingCenteredUnitIdRef.current = null;
  const position = unitPosition(unit);
  options.canvasRef.current?.centerOn(position.xCoord, position.yCoord);
}

function createDeleteActions(
  options: Options,
): Pick<ReturnType<typeof useEditorUnitActions>, "doDeleteUnit" | "handleDeleteUnit"> {
  function doDeleteUnit(targetUnitId: string): void {
    if (options.isLoadingPage || options.isCompletingStage) return;
    options.commitUnits(options.unitBufRef.current.filter((unit) => unitId(unit) !== targetUnitId));
    if (options.focusedUnitId === targetUnitId) options.setFocusedUnitId(undefined);
  }
  return {
    doDeleteUnit,
    handleDeleteUnit: (targetUnitId: string) => {
      const unit = options.unitBufRef.current.find((item) => unitId(item) === targetUnitId);
      if (unit && (unitTranslatedText(unit) !== null || unitProofreadText(unit) !== null)) {
        options.setDeleteConfirmUnitId(targetUnitId);
        return;
      }
      doDeleteUnit(targetUnitId);
    },
  };
}

function modifyEditorUnit(
  options: Pick<
    Options,
    "unitBufRef" | "commitUnits" | "currentUserId" | "isLoadingPage" | "isCompletingStage"
  >,
  targetUnitId: string,
  updates: UnitEdit,
): void {
  if (options.isLoadingPage || options.isCompletingStage) return;
  if (updates.isFlagged !== undefined && Object.keys(updates).length === 1) {
    options.commitUnits(
      options.unitBufRef.current.map((unit) =>
        unitId(unit) === targetUnitId ? applyUnitUpdates(unit, updates) : unit,
      ),
    );
    return;
  }
  const nextUpdates = { ...updates };
  const current = options.unitBufRef.current.find((unit) => unitId(unit) === targetUnitId);
  applyEditorAuthors(nextUpdates, updates, current, options.currentUserId);
  options.commitUnits(
    options.unitBufRef.current.map((unit) =>
      unitId(unit) === targetUnitId ? applyUnitUpdates(unit, nextUpdates) : unit,
    ),
  );
}

function applyEditorAuthors(
  nextUpdates: UnitEdit,
  updates: UnitEdit,
  current: UnitInfo | undefined,
  currentUserId: string,
): void {
  if (updates.translatedText?.trim()) nextUpdates.translatorId = currentUserId;
  // The API currently requires an author when a legacy translation is edited.
  // FIXME: 服务端应从认证 token 写入编辑者，并迁移历史缺失作者的数据。
  // 当前协议会拒绝带翻译文本却没有翻译者的完整 unit payload，先以当前用户兜底。
  if (current && unitTranslatedText(current)?.trim() && !current.translatorId) {
    nextUpdates.translatorId = currentUserId;
  }
  if (updates.proofreadText?.trim()) nextUpdates.proofreaderId = currentUserId;
}

function addEditorUnit(
  options: Pick<
    Options,
    | "unitBufRef"
    | "commitUnits"
    | "isLoadingPage"
    | "isCompletingStage"
    | "showToast"
    | "relocationSuppressedUnitIdRef"
    | "setFocusedUnitId"
  >,
  xCoord: number,
  yCoord: number,
  isBubble: boolean,
): void {
  if (options.isLoadingPage || options.isCompletingStage) return;
  if (options.unitBufRef.current.length >= 100) {
    options.showToast("每页最多 100 个文本块", "error");
    return;
  }
  const unit = createUnit(xCoord, yCoord, isBubble);
  options.commitUnits([...options.unitBufRef.current, unit]);
  const newUnitId = unitId(unit);
  options.relocationSuppressedUnitIdRef.current = newUnitId;
  options.setFocusedUnitId(newUnitId);
}

async function navigateToSearchResult(
  project: Options["project"],
  navigate: Options["handleNavigate"],
  showToast: Options["showToast"],
  pageId: string,
  targetUnitId?: string,
): Promise<void> {
  const targetIndex = project.pages.findIndex((page) => page.id === pageId);
  if (targetIndex === -1) {
    console.error("[BaseTranslator] 搜索结果页面不存在", { pageId });
    showToast("目标页面已不存在，请重新进入翻译器", "error");
    return;
  }
  await navigate(targetIndex, targetUnitId);
}

function useEditorUnitRelocation(
  options: Pick<
    Options,
    | "canvasRef"
    | "focusedUnitId"
    | "isRelocationEnabled"
    | "relocationSuppressedUnitIdRef"
    | "unitBufRef"
  >,
): void {
  useEffect(() => {
    if (!options.isRelocationEnabled || !options.focusedUnitId) return;
    if (options.relocationSuppressedUnitIdRef.current === options.focusedUnitId) return;
    const unit = options.unitBufRef.current.find((item) => unitId(item) === options.focusedUnitId);
    if (!unit) return;
    const position = unitPosition(unit);
    options.canvasRef.current?.centerOn(position.xCoord, position.yCoord);
  }, [
    options.canvasRef,
    options.focusedUnitId,
    options.isRelocationEnabled,
    options.relocationSuppressedUnitIdRef,
    options.unitBufRef,
  ]);
}
export type EditorUnitActions = ReturnType<typeof useEditorUnitActions>;
