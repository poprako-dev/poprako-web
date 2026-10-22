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
  isEditingEnabled: boolean,
): ComponentProps<typeof UnitAnnotationEditor> {
  const id = useId();
  const values = useSyncExternalStore(
    source?.subscribe ?? subscribeNothing,
    () => source?.get(unitId) ?? emptyValues,
  );
  const isReadOnly = readOnly || !isEditingEnabled;
  return {
    id,
    values,
    readOnly: isReadOnly,
    onChange: (target, content) => {
      if (!isReadOnly) source?.set(unitId, target, content);
    },
  };
}
