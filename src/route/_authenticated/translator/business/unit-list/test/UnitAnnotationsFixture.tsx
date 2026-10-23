import { useState, type JSX } from "react";
import { StatusOptionBar } from "../../StatusOptionBar";
import { UnitList } from "./UnitListPreview";
import { createUnit, type UnitInfo } from "../../unit/unit";
import { applyUnitUpdates } from "../../unit/unit-edit";
import { createUnitAnnotationFixture } from "../../test/unit-annotation-fixture";

type Props = {
  mode: "translate" | "proofread";
  width: number;
  readOnly: boolean;
};

const texts = [
  "无论如何，我都一定会回来。",
  "你说的那个人……难道是他？",
  "嗯。我们约好了，就在这里见面。",
];

function initialUnit(index: number): UnitInfo {
  return {
    ...createUnit(0.3, 0.4, index !== 2),
    id: `annotation-unit-${String(index)}`,
    index,
    translatedText: texts[index] ?? "",
    proofreadText: index === 1 ? "你说的那个人……难道就是他？" : undefined,
  };
}

export function UnitAnnotationsFixture({ mode, width, readOnly }: Props): JSX.Element {
  const [isAnnotationEditingEnabled, setIsAnnotationEditingEnabled] = useState(false);
  const [focusedUnitId, setFocusedUnitId] = useState<string | undefined>();
  const [units, setUnits] = useState(() => texts.map((_text, index) => initialUnit(index)));
  const [annotations] = useState(() =>
    createUnitAnnotationFixture({
      "annotation-unit-2": {
        typographyNote: null,
        translationNote: "这里是两人约定见面的地方。",
      },
      "annotation-unit-1": {
        typographyNote: "“他”字加重，保留省略号。",
        translationNote: "这里带有确认语气，补上“就”更贴近原意。",
      },
    }),
  );
  return (
    <div className="flex h-160 max-w-full flex-col border border-line-stone-200" style={{ width }}>
      <StatusOptionBar
        currMode={mode}
        view={mode}
        nextView={mode}
        canSwitchView={false}
        isRelocationEnabled={false}
        isUnitCreationEnabled={true}
        proofreadPreviewVisibility="visible"
        isHighResolution={false}
        isLoadingPage={false}
        saving={false}
        saveStatus="已保存"
        onSwitchView={() => undefined}
        onRelocationClick={() => undefined}
        onUnitCreationClick={() => undefined}
        onToggleProofreadPreviewClick={() => undefined}
        onToggleImageQualityClick={() => Promise.resolve()}
        onSaveClick={() => Promise.resolve()}
        isAnnotationEditingEnabled={isAnnotationEditingEnabled}
        onToggleAnnotationEditing={() => {
          setIsAnnotationEditingEnabled((value) => !value);
        }}
      />
      <div className="min-h-0 flex-1">
        <UnitList
          units={units}
          annotations={annotations}
          isAnnotationEditingEnabled={isAnnotationEditingEnabled}
          mode={mode}
          focusedUnitId={focusedUnitId}
          onFocusUnit={setFocusedUnitId}
          enableReadOnly={readOnly}
          onResolveUser={() => Promise.resolve({ success: false, error: "无用户资料" })}
          editing={{
            modifyUnit: (id, updates) => {
              setUnits((previous) =>
                previous.map((unit) => (unit.id === id ? applyUnitUpdates(unit, updates) : unit)),
              );
            },
          }}
        />
      </div>
    </div>
  );
}
