import type { UnitCommentField, UnitComments } from "../unit/unit-comments";

export interface UnitAnnotationSource {
  get: (unitId: string) => UnitComments;
  set: (unitId: string, field: UnitCommentField, content: string | null) => void;
  subscribe: (listener: () => void) => () => void;
}
