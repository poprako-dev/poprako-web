import type { UnitNoteField, UnitNotes } from "../unit/unit-notes";

export interface UnitAnnotationSource {
  get: (unitId: string) => UnitNotes;
  set: (unitId: string, field: UnitNoteField, content: string | null) => void;
  subscribe: (listener: () => void) => () => void;
}
