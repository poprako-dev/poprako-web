import { useState } from "react";
import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Tooltip } from "radix-ui";
import { ReadOnlyDiffUnitItem } from "../unit-list/ReadOnlyDiffUnitItem";
import { mockUnits } from "../test/base-translator-story-data";
import { RevisionNoteItem } from "./RevisionNoteItem";
type Props = { selected: boolean; long: boolean };
function Comparison({ selected, long }: Props): JSX.Element {
  const [focused, setFocused] = useState(selected);
  const unit = mockUnits[0];
  if (!unit) throw new Error("Missing comparison fixture");
  return (
    <Tooltip.Provider>
      <div className="grid w-full grid-cols-2 gap-4 bg-surface-stone-50 p-4">
        <div className="border border-line-stone-200">
          <ReadOnlyDiffUnitItem
            unit={unit}
            isFocused={focused}
            onSelect={() => {
              setFocused(true);
            }}
          />
        </div>
        <div className="border border-line-stone-200">
          <RevisionNoteItem
            layerName="对白"
            note={{
              id: "note",
              number: 7,
              type: "断行",
              content: long ? "保留原句，调整断行。\n".repeat(12) : "保留原句，调整断行。",
              layerId: "0.1",
              rect: null,
            }}
            isFocused={focused}
            onSelect={() => {
              setFocused(true);
            }}
          />
        </div>
      </div>
    </Tooltip.Provider>
  );
}
const meta: Meta<typeof Comparison> = {
  title: "Features/Translator/RevisionNoteItem",
  component: Comparison,
  parameters: { layout: "fullscreen" },
  args: { selected: false, long: false },
};
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const LongText: Story = { args: { long: true } };
export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "revision_note 7：断行" });
    await userEvent.hover(button);
    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-pressed", "true");
  },
};
