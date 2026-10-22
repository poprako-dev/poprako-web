export function migrateDraftUnitNotes(_key: string, value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return value;
  if (!("id" in value && "index" in value)) return value;
  if (!("translationComment" in value || "supplementComment" in value)) return value;
  const { translationComment, supplementComment, ...unit } = value as Record<string, unknown>;
  return {
    ...unit,
    typographyNote: "typographyNote" in unit ? unit["typographyNote"] : translationComment,
    translationNote: "translationNote" in unit ? unit["translationNote"] : supplementComment,
  };
}
