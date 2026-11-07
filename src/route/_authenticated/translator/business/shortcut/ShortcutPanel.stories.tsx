import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";
import { ShortcutPanel } from "@/route/_authenticated/translator/business/shortcut/ShortcutPanel";

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
    const shortcut = panel.getByRole("button", { name: "录制快捷键：保存" });
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
    await userEvent.click(panel.getByRole("button", { name: "录制快捷键：保存" }));
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
    const shortcut = panel.getByRole("button", { name: "录制快捷键：保存" });
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

export const ContentAboveBackdrop: Story = {
  play: async ({ canvasElement }) => {
    const panel = within(canvasElement.ownerDocument.body);
    const dialog = await panel.findByRole("dialog", { name: "快捷键设置" });
    // The enter animation scales the panel; hit-testing only reflects the final layout after it.
    await waitFor(async () => {
      await expect(getComputedStyle(dialog).transform).toBe("none");
    });
    const rect = dialog.getBoundingClientRect();
    const hit = canvasElement.ownerDocument.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    await expect(hit?.closest('[role="dialog"]')).toBe(dialog);
  },
};
