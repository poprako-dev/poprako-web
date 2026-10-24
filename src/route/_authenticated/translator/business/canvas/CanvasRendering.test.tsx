import type { ComponentProps } from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { BaseTranslator } from "../BaseTranslator";
import { createStoryArgs } from "../test/base-translator-story-fixture";
import { undoUnit } from "../test/unit-undo-fixture";
import type { UnitMarker } from "./UnitMarker";
import type * as MarkerModule from "./UnitMarker";

const rendered = vi.hoisted(() => vi.fn<(index: number) => void>());
vi.mock("./UnitMarker", async (importOriginal) => {
  const actual = await importOriginal<typeof MarkerModule>();
  function RecordedUnitMarker(
    props: ComponentProps<typeof UnitMarker>,
  ): ReturnType<typeof UnitMarker> {
    rendered(props.index);
    return actual.UnitMarker(props);
  }
  return { ...actual, UnitMarker: RecordedUnitMarker };
});

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe(): void {
        /* Geometry is controlled directly in this DOM test. */
      }
      disconnect(): void {
        /* No observer resources are allocated. */
      }
    },
  );
  vi.stubGlobal("CSS", { escape: (value: string) => value });
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function setup(): Promise<ReturnType<typeof render>> {
  const units = Array.from({ length: 100 }, (_, index) => ({
    ...undoUnit(`u${String(index)}`, ""),
    index,
  }));
  const props = createStoryArgs({ canTranslate: true, canProofread: false, units });
  const view = render(<BaseTranslator {...props} />);
  await waitFor(() => {
    expect(view.getAllByPlaceholderText("点击输入翻译...")).toHaveLength(100);
  });
  await act(async () => {
    await Promise.resolve();
  });
  rendered.mockClear();
  return view;
}

test("100-unit translator edits and hover only render markers with changed appearance", async () => {
  const view = await setup();
  const input = view.getAllByPlaceholderText("点击输入翻译...")[0];
  if (!input) throw new Error("Missing first unit input");
  fireEvent.change(input, { target: { value: "字" } });
  expect(rendered.mock.calls.map(([index]) => index)).toEqual([0]);
  rendered.mockClear();
  const marker = view.getByRole("button", { name: "第 1 个翻校单元" });
  fireEvent.mouseEnter(marker);
  expect(view.getByText("字", { selector: "div" })).toBeVisible();
  expect(rendered).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: "字词" } });
  expect(view.getByText("字词", { selector: "div" })).toBeVisible();
  expect(rendered).not.toHaveBeenCalled();
  fireEvent.mouseLeave(marker);
  expect(view.queryByText("字词", { selector: "div" })).toBeNull();
  expect(rendered).not.toHaveBeenCalled();
});

test("100-unit translator focus and zoom update only the required marker appearance", async () => {
  const view = await setup();
  fireEvent.keyDown(view.getByRole("button", { name: "第 1 个翻校单元" }), { key: "Enter" });
  expect(rendered.mock.calls.map(([index]) => index)).toEqual([0]);
  rendered.mockClear();
  fireEvent.keyDown(view.getByRole("button", { name: "第 2 个翻校单元" }), { key: " " });
  expect(rendered.mock.calls.map(([index]) => index)).toEqual([0, 1]);
  rendered.mockClear();
  fireEvent.wheel(view.getByRole("application"), { deltaY: -100, clientX: 0, clientY: 0 });
  expect(rendered).toHaveBeenCalledTimes(100);
  expect(view.getByRole("button", { name: "第 1 个翻校单元" }).style.transform).toContain(
    "scale(0.925",
  );
});
