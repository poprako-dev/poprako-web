import { useCallback, useRef, useState } from "react";
import { normalizeUnitIndexes, unitId, type UnitInfo } from "@/types/unit";
import type { ToastType } from "@/components/ui/NotificationToast";
import type {
  UnitCreateOp,
  UnitDiff,
  UnitOp,
  UnitPatchOp,
  Patch,
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

function buildUnitCoord(unit: UnitInfo) {
  return {
    xCoord: unit.xCoord,
    yCoord: unit.yCoord,
  };
}

function buildUnitTranslation(unit: UnitInfo) {
  const translatedText = normalizedText(unit.translatedText);
  return translatedText === null ? undefined : { translatedText };
}

function buildUnitRevision(unit: UnitInfo) {
  const proofreadText = normalizedText(unit.proofreadText);
  if (!unit.isProofread && proofreadText === null) return undefined;

  return {
    isProofread: unit.isProofread,
    proofreadText: proofreadText ?? undefined,
  };
}

function skipPatch<T>(): Patch<T> {
  return { type: "skip" };
}

function clearPatch<T>(): Patch<T> {
  return { type: "clear" };
}

function assignPatch<T>(value: T): Patch<T> {
  return { type: "assign", value };
}

function buildCreateUnitOp(
  unit: UnitInfo,
  nextId: string | null,
): UnitCreateOp {
  return {
    edit: "create",
    localId: unitId(unit),
    nextId: nextId ?? undefined,
    isBubble: unit.isBubble,
    coord: buildUnitCoord(unit),
    translation: buildUnitTranslation(unit),
    revision: buildUnitRevision(unit),
  };
}

function buildPatchUnitOp(
  unit: UnitInfo,
  baseline: UnitInfo,
  nextId: string | null | undefined,
): UnitPatchOp {
  const edit: UnitPatchOp = {
    edit: "patch",
    id: unitId(unit),
    nextId: skipPatch(),
    translation: skipPatch(),
    revision: skipPatch(),
  };

  if (nextId !== undefined) {
    edit.nextId = nextId === null ? clearPatch() : assignPatch(nextId);
  }
  if (unit.isBubble !== baseline.isBubble) edit.isBubble = unit.isBubble;
  if (unit.xCoord !== baseline.xCoord || unit.yCoord !== baseline.yCoord) {
    edit.coord = buildUnitCoord(unit);
  }

  if (normalizedText(unit.translatedText) !== normalizedText(baseline.translatedText)) {
    const translation = buildUnitTranslation(unit);
    edit.translation = translation ? assignPatch(translation) : skipPatch();
  }

  if (
    unit.isProofread !== baseline.isProofread
    || normalizedText(unit.proofreadText) !== normalizedText(baseline.proofreadText)
  ) {
    const revision = buildUnitRevision(unit);
    edit.revision = revision ? assignPatch(revision) : skipPatch();
  }

  return edit;
}

function nextUnitId(
  units: UnitInfo[],
  index: number,
): string | null {
  return units[index + 1] ? unitId(units[index + 1]) : null;
}

function isEmptyPatch(edit: UnitPatchOp): boolean {
  return edit.nextId.type === "skip"
    && edit.isBubble === undefined
    && edit.coord === undefined
    && edit.translation.type === "skip"
    && edit.revision.type === "skip";
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

      ops.push({ edit: "delete", id: unitId(unit) });
  }

  const orderChanged = existingOrderChanged(current, baseline);

  if (orderChanged) {
    for (let index = current.length - 1; index >= 0; index--) {
      const unit = current[index];
      if (!baselineById.has(unitId(unit))) continue;

      ops.push(buildPatchUnitOp(
        unit,
        baselineById.get(unitId(unit))!,
        nextUnitId(current, index),
      ));
    }
  } else {
    for (let index = 0; index < current.length; index++) {
      const unit = current[index];
      const baselineUnit = baselineById.get(unitId(unit));
      if (!baselineUnit) continue;
      const edit = buildPatchUnitOp(unit, baselineUnit, undefined);
      if (!isEmptyPatch(edit)) ops.push(edit);
    }
  }

  for (let index = 0; index < current.length; index++) {
    const unit = current[index];
    if (baselineById.has(unitId(unit))) continue;

    ops.push(buildCreateUnitOp(
      unit,
      nextUnitId(current, index),
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
