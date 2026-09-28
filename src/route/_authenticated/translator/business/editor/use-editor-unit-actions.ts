import { useEffect } from "react";
import { applyUnitUpdates } from "@/route/_authenticated/translator/business/unit/unit-edit";
import type { UnitEdit } from "@/route/_authenticated/translator/business/unit/unit-edit";
import {
  createUnit,
  modifyUnitPosition,
  moveUnitToIndex,
  unitId,
  unitPosition,
  unitProofreadText,
  unitTranslatedText,
} from "@/route/_authenticated/translator/business/unit/unit";
import type { useUnitPersistence } from "@/route/_authenticated/translator/business/persistence/use-unit-persistence";
import type { EditorState } from "./use-editor-state";
import type { EditorProps } from "./editor-props";
type Options = EditorState &
  ReturnType<typeof useUnitPersistence> &
  EditorProps & { canInsertSpecialChar: boolean };
export function useEditorUnitActions({
  setUnitBuf,
  focusedUnitId,
  setFocusedUnitId,
  isLoadingPage,
  isRelocationEnabled,
  setSpecialCharInsertRequest,
  setDeleteConfirmUnitId,
  isCompletingStage,
  canvasRef,
  lastSpecialCharRef,
  specialCharRequestIdRef,
  relocationSuppressedUnitIdRef,
  pendingCenteredUnitIdRef,
  showToast,
  allChars,
  favoriteChars,
  unitBufRef,
  refreshUnits,
  commitUnits,
  handleNavigate,
  project,
  currentUserId,
  canInsertSpecialChar,
}: Options): {
  handleRequestSpecialChar: (char: string) => void;
  handleQuickSpecialChar: () => void;
  handleQuickSpecialCharAt: (index: number) => void;
  handleSpecialCharUse: (char: string) => void;
  handleSpecialCharInserted: (requestId: number, char: string) => void;
  handleModifyUnit: (targetUnitId: string, updates: UnitEdit) => void;
  handleMoveUnit: (targetUnitId: string, xCoord: number, yCoord: number) => void;
  handleReorderUnit: (targetUnitId: string, targetIndex: number) => void;
  handleAddUnit: (xCoord: number, yCoord: number, isBubble: boolean) => void;
  handleFocusUnit: (targetUnitId: string) => void;
  handlePageImageLoad: () => void;
  handleRefreshCurrentPage: () => Promise<void>;
  handleSearchResultNavigate: (pageId: string, targetUnitId?: string) => Promise<void>;
  doDeleteUnit: (targetUnitId: string) => void;
  handleDeleteUnit: (targetUnitId: string) => void;
} {
  function handleRequestSpecialChar(char: string): void {
    if (!char || !focusedUnitId || !canInsertSpecialChar) return;
    specialCharRequestIdRef.current += 1;
    setSpecialCharInsertRequest({
      id: specialCharRequestIdRef.current,
      char,
      targetUnitId: focusedUnitId,
    });
  }

  function handleQuickSpecialChar(): void {
    const char = lastSpecialCharRef.current ?? allChars[0]?.text;
    if (char) handleRequestSpecialChar(char);
  }

  function handleQuickSpecialCharAt(index: number): void {
    const char = favoriteChars[index];
    if (char) handleRequestSpecialChar(char);
  }

  function handleSpecialCharUse(char: string): void {
    lastSpecialCharRef.current = char;
  }

  function handleSpecialCharInserted(requestId: number, char: string): void {
    lastSpecialCharRef.current = char;
    setSpecialCharInsertRequest((request) => (request?.id === requestId ? undefined : request));
  }

  function handleModifyUnit(targetUnitId: string, updates: UnitEdit): void {
    if (isLoadingPage || isCompletingStage) return;
    if (updates.isFlagged !== undefined && Object.keys(updates).length === 1) {
      commitUnits(
        unitBufRef.current.map((unit) =>
          unitId(unit) === targetUnitId ? applyUnitUpdates(unit, updates) : unit,
        ),
        setUnitBuf,
      );
      return;
    }
    const nextUpdates = { ...updates };
    const currentUnit = unitBufRef.current.find((unit) => unitId(unit) === targetUnitId);
    const currentTranslatedText = currentUnit ? unitTranslatedText(currentUnit) : null;

    if (updates.translatedText?.trim()) {
      nextUpdates.translatorId = currentUserId;
    }

    // FIXME: 服务端应从认证 token 写入编辑者，并迁移历史缺失作者的数据。
    // 当前协议会拒绝带翻译文本却没有翻译者的完整 unit payload，先以当前用户兜底。
    if (currentTranslatedText?.trim() && !currentUnit?.translatorId) {
      nextUpdates.translatorId = currentUserId;
    }

    if (updates.proofreadText?.trim()) {
      nextUpdates.proofreaderId = currentUserId;
    }

    commitUnits(
      unitBufRef.current.map((unit) =>
        unitId(unit) === targetUnitId ? applyUnitUpdates(unit, nextUpdates) : unit,
      ),
      setUnitBuf,
    );
  }

  function handleMoveUnit(targetUnitId: string, xCoord: number, yCoord: number): void {
    commitUnits(
      unitBufRef.current.map((unit) =>
        unitId(unit) === targetUnitId ? modifyUnitPosition(unit, xCoord, yCoord) : unit,
      ),
      setUnitBuf,
    );
  }

  function handleReorderUnit(targetUnitId: string, targetIndex: number): void {
    commitUnits(moveUnitToIndex(unitBufRef.current, targetUnitId, targetIndex), setUnitBuf);
  }

  function handleAddUnit(xCoord: number, yCoord: number, isBubble: boolean): void {
    if (isLoadingPage || isCompletingStage) return;
    if (unitBufRef.current.length >= 100) {
      showToast("每页最多 100 个文本块", "error");
      return;
    }
    const newUnit = createUnit(xCoord, yCoord, isBubble);

    commitUnits([...unitBufRef.current, newUnit], setUnitBuf);

    const newUnitId = unitId(newUnit);
    relocationSuppressedUnitIdRef.current = newUnitId;
    setFocusedUnitId(newUnitId);
  }

  function handleFocusUnit(targetUnitId: string): void {
    if (targetUnitId !== focusedUnitId) {
      relocationSuppressedUnitIdRef.current = null;
    }
    setFocusedUnitId(targetUnitId);
  }

  function handlePageImageLoad(): void {
    const targetUnitId = pendingCenteredUnitIdRef.current;
    if (!targetUnitId) return;

    const unit = unitBufRef.current.find((item) => unitId(item) === targetUnitId);
    if (!unit) return;

    pendingCenteredUnitIdRef.current = null;
    const position = unitPosition(unit);
    canvasRef.current?.centerOn(position.xCoord, position.yCoord);
  }

  async function handleRefreshCurrentPage(): Promise<void> {
    await refreshUnits();
  }

  async function handleSearchResultNavigate(pageId: string, targetUnitId?: string): Promise<void> {
    const targetIndex = project.pages.findIndex((page) => page.id === pageId);
    if (targetIndex === -1) {
      console.error("[BaseTranslator] 搜索结果页面不存在", { pageId });
      showToast("目标页面已不存在，请重新进入翻译器", "error");
      return;
    }

    await handleNavigate(targetIndex, targetUnitId);
  }

  function doDeleteUnit(targetUnitId: string): void {
    if (isLoadingPage || isCompletingStage) return;
    const filteredUnits = unitBufRef.current.filter((unit) => unitId(unit) !== targetUnitId);

    commitUnits(filteredUnits, setUnitBuf);

    if (focusedUnitId === targetUnitId) {
      setFocusedUnitId(undefined);
    }
  }

  function handleDeleteUnit(targetUnitId: string): void {
    const unit = unitBufRef.current.find((u) => unitId(u) === targetUnitId);
    if (unit && (unitTranslatedText(unit) !== null || unitProofreadText(unit) !== null)) {
      setDeleteConfirmUnitId(targetUnitId);
      return;
    }
    doDeleteUnit(targetUnitId);
  }

  // Relocation: when focused unit changes and relocation is on, center canvas on it
  useEffect(() => {
    if (!isRelocationEnabled || !focusedUnitId) return;
    if (relocationSuppressedUnitIdRef.current === focusedUnitId) return;

    const unit = unitBufRef.current.find((item) => unitId(item) === focusedUnitId);
    if (!unit) return;
    const position = unitPosition(unit);

    canvasRef.current?.centerOn(position.xCoord, position.yCoord);
  }, [canvasRef, focusedUnitId, isRelocationEnabled, relocationSuppressedUnitIdRef, unitBufRef]);

  return {
    handleRequestSpecialChar,
    handleQuickSpecialChar,
    handleQuickSpecialCharAt,
    handleSpecialCharUse,
    handleSpecialCharInserted,
    handleModifyUnit,
    handleMoveUnit,
    handleReorderUnit,
    handleAddUnit,
    handleFocusUnit,
    handlePageImageLoad,
    handleRefreshCurrentPage,
    handleSearchResultNavigate,
    doDeleteUnit,
    handleDeleteUnit,
  };
}
export type EditorUnitActions = ReturnType<typeof useEditorUnitActions>;
