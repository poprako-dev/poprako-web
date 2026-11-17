import { useCallback, useMemo, useRef } from "react";
import { unitId, unitTranslationNote, unitTypographyNote, type UnitInfo } from "../unit/unit";
import type { UnitAnnotationSource } from "../contract/unit-annotations";
import type { UnitNoteField, UnitNotes } from "../unit/unit-notes";
import type { UnitEdit } from "../unit/unit-edit";
import type { EditorProps } from "./editor-props";
import type { EditorSession } from "./editor-session-type";

const emptyNotes: UnitNotes = { typographyNote: null, translationNote: null };

// 生产会话中的注释源：读取 unitBuf，写入走编辑器统一的 Unit 修改通道。
export function useUnitAnnotationSource(
  units: UnitInfo[],
  modifyUnit: (targetUnitId: string, updates: UnitEdit) => void,
): UnitAnnotationSource {
  const notesByUnit = useMemo(() => createNotesByUnit(units), [units]);
  const listenersRef = useRef(new Set<() => void>());
  const notify = useCallback(() => {
    for (const listener of listenersRef.current) listener();
  }, []);
  return useMemo<UnitAnnotationSource>(
    () => ({
      get: (targetUnitId) => notesByUnit.get(targetUnitId) ?? emptyNotes,
      set: (targetUnitId, field, content) => {
        modifyUnit(targetUnitId, noteUpdate(field, content));
        notify();
      },
      subscribe: (listener) => {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
    }),
    [modifyUnit, notesByUnit, notify],
  );
}

// 显式传入的注释源优先（Storybook/测试），否则使用当前会话的 unitBuf。
export function useEditorAnnotations(
  props: EditorProps,
  session: EditorSession,
): UnitAnnotationSource {
  const sessionSource = useUnitAnnotationSource(session.unitBuf, session.handleModifyUnit);
  return props.annotations ?? sessionSource;
}

function noteUpdate(field: UnitNoteField, content: string | null): UnitEdit {
  return field === "translationNote" ? { translationNote: content } : { typographyNote: content };
}

function createNotesByUnit(units: UnitInfo[]): Map<string, UnitNotes> {
  return new Map(
    units.map((unit) => [
      unitId(unit),
      {
        typographyNote: unitTypographyNote(unit),
        translationNote: unitTranslationNote(unit),
      } satisfies UnitNotes,
    ]),
  );
}
