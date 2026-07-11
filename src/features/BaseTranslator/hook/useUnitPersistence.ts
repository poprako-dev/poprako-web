import { useCallback, useRef, useState } from "react";
import { normalizeUnitIndexes, unitId, type UnitInfo } from "@/types/unit";
import type { ToastType } from "@/components/ui/NotificationToast";
import type {
  UnitCreateOp,
  UnitDiff,
  UnitOp,
  UnitPayload,
  UnitSaveOp,
} from "../types/type";

type ShowToast = (message: string, type: ToastType) => void;

export type PendingAction =
  | { type: "navigate"; newIndex: number }
  | { type: "exit" };

type Args = {
  getPageId: () => string;
  onSaveUnits: (pageId: string, diff: UnitDiff) => Promise<void>;
  onReloadUnits: (pageId: string) => Promise<UnitInfo[]>;
  onExit: () => void;
  showToast: ShowToast;
  loadPage: (index: number) => Promise<void>;
  setUnitBuf: (units: UnitInfo[]) => void;
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
  if ((current.translatorId ?? null) !== (baseline.translatorId ?? null)) {
    return true;
  }
  if (
    normalizedText(current.proofreadText) !==
    normalizedText(baseline.proofreadText)
  ) {
    return true;
  }
  return (current.proofreaderId ?? null) !== (baseline.proofreaderId ?? null);
}

function buildUnitPayload(
  unit: UnitInfo,
  beforeId: string | undefined,
): UnitPayload {
  return {
    beforeId,
    xCoord: unit.xCoord,
    yCoord: unit.yCoord,
    isBubble: unit.isBubble,
    isProofread: unit.isProofread,
    translatedText: normalizedText(unit.translatedText),
    lastTranslatorId: unit.translatorId ?? null,
    proofreadText: normalizedText(unit.proofreadText),
    lastProofreaderId: unit.proofreaderId ?? null,
  };
}

function buildCreateUnitOp(
  unit: UnitInfo,
  beforeId: string | undefined,
): UnitCreateOp {
  return {
    oper: "create",
    localId: unitId(unit),
    ...buildUnitPayload(unit, beforeId),
  };
}

function buildSaveUnitOp(
  unit: UnitInfo,
  beforeId: string | undefined,
): UnitSaveOp {
  return {
    oper: "save",
    id: unitId(unit),
    ...buildUnitPayload(unit, beforeId),
  };
}

function nextExistingId(
  units: UnitInfo[],
  startIndex: number,
  baselineById: Map<string, UnitInfo>,
): string | undefined {
  for (let index = startIndex + 1; index < units.length; index++) {
    const id = unitId(units[index]);
    if (baselineById.has(id)) return id;
  }

  return undefined;
}

function existingOrderChanged(
  current: UnitInfo[],
  baseline: UnitInfo[],
): boolean {
  const currentById = new Set(current.map(unitId));
  const baselineById = new Set(baseline.map(unitId));
  const baselineSurvivors = baseline
    .filter((unit) => currentById.has(unitId(unit)))
    .map(unitId);
  const currentExisting = current
    .filter((unit) => baselineById.has(unitId(unit)))
    .map(unitId);

  if (baselineSurvivors.length !== currentExisting.length) return true;

  return baselineSurvivors.some((id, index) => id !== currentExisting[index]);
}

export function buildUnitDiff(current: UnitInfo[], baseline: UnitInfo[]): UnitDiff {
  current = normalizeUnitIndexes(current);
  baseline = normalizeUnitIndexes(baseline);

  const baselineById = new Map(baseline.map((unit) => [unitId(unit), unit]));
  const currentById = new Map(current.map((unit) => [unitId(unit), unit]));
  const ops: UnitOp[] = [];

  for (const unit of baseline) {
    if (currentById.has(unitId(unit))) {
      continue;
    }

    ops.push({ oper: "delete", id: unitId(unit) });
  }

  const orderChanged = existingOrderChanged(current, baseline);

  if (orderChanged) {
    for (let index = current.length - 1; index >= 0; index--) {
      const unit = current[index];
      if (!baselineById.has(unitId(unit))) continue;

      ops.push(buildSaveUnitOp(
        unit,
        nextExistingId(current, index, baselineById),
      ));
    }
  } else {
    for (let index = 0; index < current.length; index++) {
      const unit = current[index];
      const baselineUnit = baselineById.get(unitId(unit));
      if (!baselineUnit) continue;
      if (!hasPersistedMutation(unit, baselineUnit)) continue;

      ops.push(buildSaveUnitOp(
        unit,
        nextExistingId(current, index, baselineById),
      ));
    }
  }

  for (let index = 0; index < current.length; index++) {
    const unit = current[index];
    if (baselineById.has(unitId(unit))) continue;

    ops.push(buildCreateUnitOp(
      unit,
      nextExistingId(current, index, baselineById),
    ));
  }

  return { ops };
}

export async function persistDirtyUnits({
  pageId,
  currentUnits,
  baselineUnits,
  onSaveUnits,
  onReloadUnits,
}: {
  pageId: string;
  currentUnits: UnitInfo[];
  baselineUnits: UnitInfo[];
  onSaveUnits: (pageId: string, diff: UnitDiff) => Promise<void>;
  onReloadUnits: (pageId: string) => Promise<UnitInfo[]>;
}): Promise<{ status: "clean" } | { status: "saved"; units: UnitInfo[] }> {
  const diff = buildUnitDiff(currentUnits, baselineUnits);
  if (diff.ops.length === 0) return { status: "clean" };

  await onSaveUnits(pageId, diff);

  return {
    status: "saved",
    units: normalizeUnitIndexes(await onReloadUnits(pageId)),
  };
}

export function useUnitPersistence({
  getPageId,
  onSaveUnits,
  onReloadUnits,
  onExit,
  showToast,
  loadPage,
  setUnitBuf,
}: Args) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [saving, setSaving] = useState(false);
  const unitBufRef = useRef<UnitInfo[]>([]);
  const baselineUnitsRef = useRef<UnitInfo[]>([]);
  const isNavigating = useRef(false);
  const isSaving = useRef(false);

  const commitUnits = useCallback((nextUnits: UnitInfo[], setUnitBuf: (units: UnitInfo[]) => void) => {
    const normalizedUnits = normalizeUnitIndexes(nextUnits);
    unitBufRef.current = normalizedUnits;
    setUnitBuf(normalizedUnits);
  }, []);

  const setLoadedUnits = useCallback((units: UnitInfo[], setUnitBuf: (units: UnitInfo[]) => void) => {
    const normalizedUnits = normalizeUnitIndexes(units);
    baselineUnitsRef.current = normalizedUnits;
    unitBufRef.current = normalizedUnits;
    setUnitBuf(normalizedUnits);
  }, []);

  const flushIfDirty = useCallback(async () => {
    if (isSaving.current) return;
    const diff = buildUnitDiff(unitBufRef.current, baselineUnitsRef.current);
    if (diff.ops.length === 0) return;

    isSaving.current = true;
    setSaving(true);
    try {
      const result = await persistDirtyUnits({
        pageId: getPageId(),
        currentUnits: unitBufRef.current,
        baselineUnits: baselineUnitsRef.current,
        onSaveUnits,
        onReloadUnits,
      });
      if (result.status === "saved") {
        baselineUnitsRef.current = result.units;
        unitBufRef.current = result.units;
        setUnitBuf(result.units);
      }
      showToast("保存成功", "success");
    } catch (err) {
      const summary = `ops:${diff.ops.length}`;
      console.error(`[BaseTranslator] 保存失败 pageId=${getPageId()} diff=${summary}`, err);
      showToast("保存失败，请重试", "error");
      throw err;
    } finally {
      isSaving.current = false;
      setSaving(false);
    }
  }, [getPageId, onReloadUnits, onSaveUnits, setUnitBuf, showToast]);

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
