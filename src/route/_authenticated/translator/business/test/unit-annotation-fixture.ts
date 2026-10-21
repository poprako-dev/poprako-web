import type { UnitAnnotationSource } from "../contract/unit-annotations";
import type { UnitComments } from "../unit/unit-comments";

export function createUnitAnnotationFixture(
  initial: Record<string, UnitComments> = {},
): UnitAnnotationSource {
  const values = new Map(Object.entries(initial));
  const empty: UnitComments = { translationComment: null, supplementComment: null };
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
