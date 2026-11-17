import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { createUnit, type UnitInfo } from "../unit/unit";
import type { UnitAnnotationSource } from "../contract/unit-annotations";
import type { EditorSession } from "./editor-session-type";
import type { EditorProps } from "./editor-props";
import { useEditorAnnotations, useUnitAnnotationSource } from "./use-editor-annotations";

function annotatedUnit(translationNote: string | null, typographyNote: string | null): UnitInfo {
  return { ...createUnit(0, 0, true), translationNote, typographyNote };
}

test("reads notes from units and normalizes whitespace-only content", () => {
  const unit = annotatedUnit("  翻校备注  ", " \t\n");
  const { result } = renderHook(() => useUnitAnnotationSource([unit], vi.fn()));
  expect(result.current.get(unit.id)).toEqual({
    translationNote: "  翻校备注  ",
    typographyNote: null,
  });
  expect(result.current.get(unit.id)).toBe(result.current.get(unit.id));
  expect(result.current.get("missing-unit")).toEqual({
    translationNote: null,
    typographyNote: null,
  });
});

test("writes through the editor unit channel and notifies subscribers", () => {
  const unit = annotatedUnit(null, null);
  const modifyUnit = vi.fn();
  const { result, rerender } = renderHook(
    ({ units }: { units: UnitInfo[] }) => useUnitAnnotationSource(units, modifyUnit),
    { initialProps: { units: [unit] } },
  );
  const listener = vi.fn();
  const unsubscribe = result.current.subscribe(listener);
  act(() => {
    result.current.set(unit.id, "translationNote", "这里是承诺。");
  });
  expect(modifyUnit).toHaveBeenCalledWith(unit.id, { translationNote: "这里是承诺。" });
  expect(listener).toHaveBeenCalledTimes(1);

  rerender({ units: [{ ...unit, translationNote: "这里是承诺。" }] });
  expect(result.current.get(unit.id).translationNote).toBe("这里是承诺。");

  act(() => {
    result.current.set(unit.id, "typographyNote", null);
  });
  expect(modifyUnit).toHaveBeenLastCalledWith(unit.id, { typographyNote: null });
  unsubscribe();
  const callsAfterUnsubscribe = listener.mock.calls.length;
  act(() => {
    result.current.set(unit.id, "typographyNote", "不应再通知");
  });
  expect(listener).toHaveBeenCalledTimes(callsAfterUnsubscribe);
});

test("falls back to the session unit buffer when no annotation source is passed", () => {
  const unit = annotatedUnit("会话注释", null);
  const handleModifyUnit = vi.fn();
  const props = { annotations: undefined } as unknown as EditorProps;
  const session = { unitBuf: [unit], handleModifyUnit } as unknown as EditorSession;
  const { result } = renderHook(() => useEditorAnnotations(props, session));
  expect(result.current.get(unit.id).translationNote).toBe("会话注释");
  act(() => {
    result.current.set(unit.id, "translationNote", "已更新");
  });
  expect(handleModifyUnit).toHaveBeenCalledWith(unit.id, { translationNote: "已更新" });
});

test("keeps an explicitly provided annotation source", () => {
  const explicit: UnitAnnotationSource = {
    get: () => ({ translationNote: "外部来源", typographyNote: null }),
    set: vi.fn(),
    subscribe: () => () => undefined,
  };
  const props = { annotations: explicit } as unknown as EditorProps;
  const session = { unitBuf: [], handleModifyUnit: vi.fn() } as unknown as EditorSession;
  const { result } = renderHook(() => useEditorAnnotations(props, session));
  expect(result.current).toBe(explicit);
});
