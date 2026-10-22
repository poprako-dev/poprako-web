import type { UnitCreateOp, UnitPatchOp } from "../contract/type";
import { unitTranslationNote, unitTypographyNote, type UnitInfo } from "../unit/unit";

export function buildUnitNotes(
  unit: UnitInfo,
): Pick<UnitCreateOp, "translationNote" | "typographyNote"> {
  const translationNote = unitTranslationNote(unit);
  const typographyNote = unitTypographyNote(unit);
  return {
    ...(translationNote === null ? {} : { translationNote }),
    ...(typographyNote === null ? {} : { typographyNote }),
  };
}

export function buildUnitNotePatch(
  unit: UnitInfo,
  baseline: UnitInfo,
): Pick<UnitPatchOp, "translationNote" | "typographyNote"> {
  const current = buildUnitNotes(unit);
  const previous = buildUnitNotes(baseline);
  const patch: Pick<UnitPatchOp, "translationNote" | "typographyNote"> = {};
  for (const field of ["translationNote", "typographyNote"] as const) {
    if (current[field] === previous[field]) continue;
    const value = current[field];
    patch[field] = value === undefined ? { type: "clear" } : { type: "assign", value };
  }
  return patch;
}

export function applyUnitNotePatch(unit: UnitInfo, op: UnitPatchOp): UnitInfo {
  for (const field of ["translationNote", "typographyNote"] as const) {
    const patch = op[field];
    if (!patch || patch.type === "skip") continue;
    unit = { ...unit, [field]: patch.type === "assign" ? patch.value : null };
  }
  return unit;
}
