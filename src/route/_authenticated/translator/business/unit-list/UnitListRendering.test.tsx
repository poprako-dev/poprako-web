import type { ComponentProps } from "react";
import { render } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { UnitList, type UnitListProps } from "./UnitList";
import type { TranslateModeUnitItem } from "./TranslateModeUnitItem";
import { undoUnit } from "../test/unit-undo-fixture";

function listProps(): UnitListProps {
  return {
    units: [undoUnit("u1", "first"), { ...undoUnit("u2", "second"), index: 1 }],
    mode: "translate",
    editing: { modifyUnit: vi.fn() },
    onResolveUser: () => Promise.resolve({ success: false, error: "No author" }),
  };
}

test("editing or pending changes in one row skip rendering unchanged rows", () => {
  const rendered = vi.fn<(props: ComponentProps<typeof TranslateModeUnitItem>) => void>();
  function Item(props: ComponentProps<typeof TranslateModeUnitItem>): null {
    rendered(props);
    return null;
  }
  const props = listProps();
  const view = render(<UnitList {...props} ItemComponent={Item} />);
  expect(rendered.mock.calls.map(([row]) => row.unit.id)).toEqual(["u1", "u2"]);
  rendered.mockClear();
  view.rerender(<UnitList {...props} ItemComponent={Item} />);
  expect(rendered).not.toHaveBeenCalled();
  const units = props.units.map((unit) =>
    unit.id === "u1" ? { ...unit, translatedText: "edited" } : unit,
  );
  view.rerender(<UnitList {...props} units={units} pendingUnitIds={["u1"]} ItemComponent={Item} />);
  expect(rendered.mock.calls.map(([row]) => row.unit.id)).toEqual(["u1"]);
  rendered.mockClear();
  view.rerender(<UnitList {...props} units={units} pendingUnitIds={["u1"]} ItemComponent={Item} />);
  expect(rendered).not.toHaveBeenCalled();
});
