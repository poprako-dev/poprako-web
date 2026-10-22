import type { UnitAnnotationSource } from "../contract/unit-annotations";
import type { UnitNotes } from "../unit/unit-notes";

export function createUnitAnnotationFixture(
  initial: Record<string, UnitNotes> = {},
): UnitAnnotationSource {
  const values = new Map(Object.entries(initial));
  const empty: UnitNotes = { typographyNote: null, translationNote: null };
  const listeners = new Set<() => void>();
  return {
    get: (unitId) => values.get(unitId) ?? empty,
    set: (unitId, field, content) => {
      values.set(unitId, { ...(values.get(unitId) ?? empty), [field]: content });
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
