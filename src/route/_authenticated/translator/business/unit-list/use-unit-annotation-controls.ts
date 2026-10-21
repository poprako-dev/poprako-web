import { useId, useSyncExternalStore, type ComponentProps } from "react";
import type { UnitAnnotationEditor } from "./UnitAnnotationEditor";
import type { UnitAnnotationSource } from "../contract/unit-annotations";
import type { UnitComments } from "../unit/unit-comments";

const emptyValues: UnitComments = { translationComment: null, supplementComment: null };

function subscribeNothing(): () => void {
  return () => undefined;
}

export function useUnitAnnotationControls(
  source: UnitAnnotationSource | undefined,
  unitId: string,
  readOnly: boolean,
  expanded: boolean,
): ComponentProps<typeof UnitAnnotationEditor> {
  const id = useId();
  const values = useSyncExternalStore(
    source?.subscribe ?? subscribeNothing,
    () => source?.get(unitId) ?? emptyValues,
  );
  return {
    id,
    expanded,
    values,
    readOnly,
    onChange: (target, content) => {
      if (!readOnly) source?.set(unitId, target, content);
    },
  };
}
