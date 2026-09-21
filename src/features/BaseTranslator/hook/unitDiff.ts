/* eslint-disable unicorn/no-array-callback-reference */
import { normalizeUnitIndexes, unitId, type UnitInfo } from "@/types/unit";
import type { Patch, UnitCreateOp, UnitDiff, UnitOp, UnitPatchOp } from "../types/type";

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
  // 新建 unit 未设置校对状态且没有文本时可省略 revision；这不是两者的耦合。
  if (proofreadText === null && !unit.isProofread) {return;}

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
    isFlagged: unit.isFlagged,
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
  if (unit.isFlagged !== baseline.isFlagged) {edit.isFlagged = unit.isFlagged;}
  if (unit.isBubble !== baseline.isBubble) {edit.isBubble = unit.isBubble;}
  if (unit.xCoord !== baseline.xCoord || unit.yCoord !== baseline.yCoord) {
    edit.coord = buildUnitCoord(unit);
  }

  if (normalizedText(unit.translatedText) !== normalizedText(baseline.translatedText)) {
    const translation = buildUnitTranslation(unit);
    edit.translation = translation ? assignPatch(translation) : clearPatch();
  }

  if (
    unit.isProofread !== baseline.isProofread ||
    normalizedText(unit.proofreadText) !== normalizedText(baseline.proofreadText)
  ) {
    // 协议将状态与文本放在同一 revision payload，但二者完全独立。
    // 任一值变化时必须保留另一值，绝不能从文本推导状态或反之。
    edit.revision = assignPatch({
      isProofread: unit.isProofread,
      proofreadText: normalizedText(unit.proofreadText) ?? undefined,
    });
  }

  return edit;
}

function nextUnitId(
  units: UnitInfo[],
  index: number,
): string | null {
  const next = units[index + 1];
  return next ? unitId(next) : null;
}

function isEmptyPatch(edit: UnitPatchOp): boolean {
  return edit.nextId.type === "skip" &&
    edit.isBubble === undefined &&
    edit.isFlagged === undefined &&
    edit.coord === undefined &&
    edit.translation.type === "skip" &&
    edit.revision.type === "skip";
}

function isExistingOrderChanged(
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

  if (baselineSurvivors.length !== currentExisting.length) {return true;}

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

  const isOrderChanged = isExistingOrderChanged(current, baseline);

  if (isOrderChanged) {
    for (let index = current.length - 1; index >= 0; index--) {
      const unit = current[index];
      if (!unit) {continue;}
      const previous = baselineById.get(unitId(unit));
      if (!previous) {continue;}

      ops.push(buildPatchUnitOp(
        unit,
        previous,
        nextUnitId(current, index),
      ));
    }
  } else {
    for (const unit of current) {
      const baselineUnit = baselineById.get(unitId(unit));
      if (!baselineUnit) {continue;}
      const edit = buildPatchUnitOp(unit, baselineUnit, undefined);
      if (!isEmptyPatch(edit)) {ops.push(edit);}
    }
  }

  for (let index = 0; index < current.length; index++) {
    const unit = current[index];
    if (!unit) {continue;}
    if (baselineById.has(unitId(unit))) {continue;}

    ops.push(buildCreateUnitOp(
      unit,
      nextUnitId(current, index),
    ));
  }

  return { ops };
}
