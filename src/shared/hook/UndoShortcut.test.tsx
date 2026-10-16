import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useShortcuts } from "./use-shortcuts";
import { useShortcutActions } from "./use-shortcut-actions";

afterEach(() => {
  localStorage.removeItem("configurableShortcuts");
});

test("existing configurations gain undo without replacing custom bindings", () => {
  localStorage.setItem(
    "configurableShortcuts",
    JSON.stringify([{ action: "save", label: "保存", keys: ["Alt", "s"] }]),
  );
  const { result } = renderHook(useShortcuts);
  const bindings = result.current.configurableShortcuts;
  expect(bindings.find((s) => s.action === "undo")?.keys).toEqual(["Control", "."]);
  expect(bindings.find((s) => s.action === "save")?.keys).toEqual(["Alt", "s"]);
});

test("an occupied undo default stays unbound until the user configures it", () => {
  localStorage.setItem(
    "configurableShortcuts",
    JSON.stringify([{ action: "save", label: "保存", keys: ["Control", "."] }]),
  );
  const { result } = renderHook(useShortcuts);
  expect(result.current.configurableShortcuts.find((s) => s.action === "undo")?.keys).toEqual([]);
  const configured = result.current.configurableShortcuts.map((s) =>
    s.action === "undo" ? { ...s, keys: ["Alt", "."] } : s,
  );
  act(() => {
    result.current.updateConfigurableShortcuts(configured);
  });
  expect(JSON.parse(localStorage.getItem("configurableShortcuts") ?? "[]")).toEqual(configured);
});

test.each(["Control", "Meta"])(
  "%s+. works inside units and respects keyboard scope",
  (modifier) => {
    const undo = vi.fn();
    const nativeUndo = vi.fn();
    const options = { key: ".", ctrlKey: modifier === "Control", metaKey: modifier === "Meta" };
    const { getByLabelText } = render(
      <div>
        <div data-unit-id="u">
          <textarea aria-label="unit" onChange={nativeUndo} />
        </div>
        <textarea aria-label="other" />
        <div role="dialog">
          <div data-unit-id="u">
            <textarea aria-label="dialog input" />
          </div>
        </div>
      </div>,
    );
    renderHook(() => {
      useShortcutActions(
        { undo },
        [{ action: "undo", label: "回退", keys: [modifier, "."] }],
        false,
        "[data-unit-id]",
      );
    });
    const input = getByLabelText("unit");
    fireEvent.keyDown(input, options);
    expect(undo).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(input, { ...options, repeat: true });
    fireEvent.keyDown(input, { ...options, isComposing: true });
    fireEvent.keyDown(input, { ...options, keyCode: 229 });
    fireEvent.keyDown(getByLabelText("other"), options);
    fireEvent.keyDown(getByLabelText("dialog input"), options);
    expect(undo).toHaveBeenCalledTimes(1);
    expect(fireEvent.keyDown(input, { ...options, key: "z" })).toBe(true);
    fireEvent.change(input, { target: { value: "native undo result" } });
    expect(nativeUndo).toHaveBeenCalledOnce();
  },
);
