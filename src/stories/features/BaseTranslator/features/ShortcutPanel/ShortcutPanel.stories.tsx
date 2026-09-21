import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, userEvent, within } from "storybook/test";
import ShortcutPanel from "@/features/BaseTranslator/features/ShortcutPanel";

const meta: Meta<typeof ShortcutPanel> = {
  title: "Features/BaseTranslator/ShortcutPanel",
  component: ShortcutPanel,
  parameters: { layout: "fullscreen" },
  args: {
    fixedShortcuts: [],
    configurableShortcuts: [
      { action: "save", label: "保存", keys: ["Control", "s"] },
      { action: "nextMarker", label: "下一个标记", keys: ["Tab"] },
    ],
    onUpdateConfigurableShortcuts: fn(),
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ShortcutPanel>;

export const RecordCombination: Story = {
  play: async ({ args, canvasElement }) => {
    const panel = within(canvasElement.ownerDocument.body);
    const shortcut = panel.getByRole("button", { name: "CTRL + S" });
    await userEvent.click(shortcut);
    await expect(shortcut).toHaveFocus();
    await userEvent.keyboard("{Control>}{Shift>}k{/Shift}{/Control}");
    await expect(args.onUpdateConfigurableShortcuts).toHaveBeenCalledWith([
      { action: "save", label: "保存", keys: ["Control", "Shift", "k"] },
      args.configurableShortcuts[1],
    ]);
    await expect(args.onClose).not.toHaveBeenCalled();
  },
};

export const RecordEnter: Story = {
  play: async ({ args, canvasElement }) => {
    const panel = within(canvasElement.ownerDocument.body);
    await userEvent.click(panel.getByRole("button", { name: "CTRL + S" }));
    await userEvent.keyboard("{Enter}");
    await expect(args.onUpdateConfigurableShortcuts).toHaveBeenCalledWith([
      { action: "save", label: "保存", keys: ["Enter"] },
      args.configurableShortcuts[1],
    ]);
    await expect(args.onClose).not.toHaveBeenCalled();
  },
};

export const IgnoreComposition: Story = {
  play: async ({ args, canvasElement }) => {
    const panel = within(canvasElement.ownerDocument.body);
    const shortcut = panel.getByRole("button", { name: "CTRL + S" });
    await userEvent.click(shortcut);
    for (const key of ["a", "Enter", "Escape"]) {
      await fireEvent.keyDown(shortcut, { key, isComposing: true });
      await fireEvent.keyUp(shortcut, { key, isComposing: true });
      await fireEvent.keyDown(shortcut, { key, keyCode: 229 });
      await fireEvent.keyUp(shortcut, { key, keyCode: 229 });
    }
    await expect(args.onUpdateConfigurableShortcuts).not.toHaveBeenCalled();
    await expect(args.onClose).not.toHaveBeenCalled();
    await userEvent.keyboard("{Control>}k{/Control}");
    await expect(args.onUpdateConfigurableShortcuts).toHaveBeenCalledWith([
      { action: "save", label: "保存", keys: ["Control", "k"] },
      args.configurableShortcuts[1],
    ]);
  },
};
