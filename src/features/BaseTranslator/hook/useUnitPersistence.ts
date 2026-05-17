import { useCallback, useRef, useState } from "react";
import { unitId, type UnitInfo } from "@/types/unit";
import type { ToastType } from "@/components/ui/NotificationToast";
import type { UnitDiff, UnitOp } from "../types/type";

type ShowToast = (message: string, type: ToastType) => void;

export type PendingAction =
  | { type: "navigate"; newIndex: number }
  | { type: "exit" };

type Args = {
  getPageId: () => string;
  onSaveUnits: (pageId: string, diff: UnitDiff) => Promise<void>;
  onExit: () => void;
  showToast: ShowToast;
  loadPage: (index: number) => Promise<void>;
};

function normalizedText(val?: string): string | null {
  return val && val !== "" ? val : null;
}

function hasPersistedMutation(current: UnitInfo, baseline: UnitInfo): boolean {
  if (current.xCoord !== baseline.xCoord || current.yCoord !== baseline.yCoord) {
    return true;
  }
  if (current.isBubble !== baseline.isBubble) {
    return true;
  }
  if (current.isProofread !== baseline.isProofread) {
    return true;
  }
  if (normalizedText(current.translatedText) !== normalizedText(baseline.translatedText)) {
    return true;
  }
  if (
    normalizedText(current.translatorCommnet) !==
    normalizedText(baseline.translatorCommnet)
  ) {
    return true;
  }
  if ((current.translatorId ?? null) !== (baseline.translatorId ?? null)) {
    return true;
  }
  if (
    normalizedText(current.proofreadText) !==
    normalizedText(baseline.proofreadText)
  ) {
    return true;
  }
  if (
    normalizedText(current.proofreaderComment) !==
    normalizedText(baseline.proofreaderComment)
  ) {
    return true;
  }

  return (current.proofreaderId ?? null) !== (baseline.proofreaderId ?? null);
}

function buildUnitOp(unit: UnitInfo, local?: boolean): UnitOp {
  const op: UnitOp = local ? { localId: unitId(unit) } : { id: unitId(unit) };

  op.xCoord = unit.xCoord;
  op.yCoord = unit.yCoord;
  op.isBubble = unit.isBubble;
  op.isProofread = unit.isProofread;

  const translatedText = normalizedText(unit.translatedText);
  if (translatedText) op.translatedText = translatedText;
  const translatorComment = normalizedText(unit.translatorCommnet);
  if (translatorComment) op.translatorComment = translatorComment;
  if (unit.translatorId) op.lastTranslatorId = unit.translatorId;
  const proofreadText = normalizedText(unit.proofreadText);
  if (proofreadText) op.proofreadText = proofreadText;
  const proofreaderComment = normalizedText(unit.proofreaderComment);
  if (proofreaderComment) op.proofreaderComment = proofreaderComment;
  if (unit.proofreaderId) op.lastProofreaderId = unit.proofreaderId;

  return op;
}

function buildUnitDiff(current: UnitInfo[], baseline: UnitInfo[]): UnitDiff {
  const baselineById = new Map(baseline.map((unit) => [unitId(unit), unit]));
  const currentById = new Map(current.map((unit) => [unitId(unit), unit]));
  const ops: UnitOp[] = [];

  for (const unit of current) {
    const baselineUnit = baselineById.get(unitId(unit));

    if (baselineUnit === undefined) {
      ops.push(buildUnitOp(unit, true));
      continue;
    }

    if (!hasPersistedMutation(unit, baselineUnit)) {
      continue;
    }

    ops.push(buildUnitOp(unit));
  }

  for (const unit of baseline) {
    if (currentById.has(unitId(unit))) {
      continue;
    }

    ops.push({ id: unitId(unit) });
  }

  return {
    ops,
    candOrder: current.map((unit) => unitId(unit)),
  };
}

export function useUnitPersistence({
  getPageId,
  onSaveUnits,
  onExit,
  showToast,
  loadPage,
}: Args) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [saving, setSaving] = useState(false);
  const unitBufRef = useRef<UnitInfo[]>([]);
  const baselineUnitsRef = useRef<UnitInfo[]>([]);
  const isNavigating = useRef(false);
  const isSaving = useRef(false);

  const commitUnits = useCallback((nextUnits: UnitInfo[], setUnitBuf: (units: UnitInfo[]) => void) => {
    unitBufRef.current = nextUnits;
    setUnitBuf(nextUnits);
  }, []);

  const setLoadedUnits = useCallback((units: UnitInfo[], setUnitBuf: (units: UnitInfo[]) => void) => {
    baselineUnitsRef.current = units;
    unitBufRef.current = units;
    setUnitBuf(units);
  }, []);

  const flushIfDirty = useCallback(async () => {
    if (isSaving.current) return;
    const diff = buildUnitDiff(unitBufRef.current, baselineUnitsRef.current);
    if (diff.ops.length === 0) return;

    isSaving.current = true;
    setSaving(true);
    try {
      await onSaveUnits(getPageId(), diff);
      baselineUnitsRef.current = [...unitBufRef.current];
      showToast("保存成功", "success");
    } catch (err) {
      const summary = `ops:${diff.ops.length} candOrder:${diff.candOrder.length}`;
      console.error(`[BaseTranslator] 保存失败 pageId=${getPageId()} diff=${summary}`, err);
      showToast("保存失败，请重试", "error");
      throw err;
    } finally {
      isSaving.current = false;
      setSaving(false);
    }
  }, [getPageId, onSaveUnits, showToast]);

  const handleNavigate = useCallback(
    async (newIndex: number) => {
      if (isNavigating.current) return;
      isNavigating.current = true;
      setPendingAction(null);
      try {
        await flushIfDirty();
        await loadPage(newIndex);
      } catch {
        setPendingAction({ type: "navigate", newIndex });
      } finally {
        isNavigating.current = false;
      }
    },
    [flushIfDirty, loadPage],
  );

  const handleExit = useCallback(async () => {
    setPendingAction(null);
    try {
      await flushIfDirty();
      onExit();
    } catch {
      setPendingAction({ type: "exit" });
    }
  }, [flushIfDirty, onExit]);

  const handleRetryPendingAction = useCallback(async () => {
    if (!pendingAction || isNavigating.current) return;
    isNavigating.current = true;

    try {
      await flushIfDirty();

      if (pendingAction.type === "navigate") {
        await loadPage(pendingAction.newIndex);
      } else {
        onExit();
      }

      setPendingAction(null);
    } catch {
      // no-op
    } finally {
      isNavigating.current = false;
    }
  }, [flushIfDirty, loadPage, onExit, pendingAction]);

  const handleDiscardPendingAction = useCallback(() => {
    if (!pendingAction || isNavigating.current) return;

    const action = pendingAction;
    setPendingAction(null);

    if (action.type === "navigate") {
      void loadPage(action.newIndex);
      return;
    }

    onExit();
  }, [loadPage, onExit, pendingAction]);

  return {
    unitBufRef,
    baselineUnitsRef,
    pendingAction,
    saving,
    commitUnits,
    setLoadedUnits,
    flushIfDirty,
    handleNavigate,
    handleExit,
    handleRetryPendingAction,
    handleDiscardPendingAction,
  };
}
