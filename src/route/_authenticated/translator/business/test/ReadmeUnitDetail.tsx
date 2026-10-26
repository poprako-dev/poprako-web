import { useState, type JSX } from "react";
import { UnitList } from "../unit-list/test/UnitListPreview";
import { applyUnitUpdates } from "../unit/unit-edit";
import { createReadmeAnnotations, readmeUnits, resolveReadmeUser } from "./readme-translator-data";

export function ReadmeUnitDetail(): JSX.Element {
  const [units, setUnits] = useState(() => readmeUnits("readme-page-1").slice(0, 4));
  const [annotations] = useState(createReadmeAnnotations);
  const [focusedUnitId, setFocusedUnitId] = useState<string>();
  return (
    <div className="h-screen w-full max-w-xl border-x border-line-stone-200">
      <UnitList
        mode="proofread"
        units={units}
        annotations={annotations}
        focusedUnitId={focusedUnitId}
        onFocusUnit={setFocusedUnitId}
        onResolveUser={resolveReadmeUser}
        editing={{
          modifyUnit: (id, updates) => {
            setUnits((previous) =>
              previous.map((unit) => (unit.id === id ? applyUnitUpdates(unit, updates) : unit)),
            );
          },
          proofreadAllUnits: (isProofread) => {
            setUnits((previous) => previous.map((unit) => ({ ...unit, isProofread })));
          },
        }}
      />
    </div>
  );
}
