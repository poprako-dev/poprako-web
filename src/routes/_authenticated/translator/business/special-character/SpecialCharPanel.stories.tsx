import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { SpecialCharPanel } from "@/routes/_authenticated/translator/business/special-character/SpecialCharPanel";

const meta: Meta<typeof SpecialCharPanel> = {
  title: "Translator/SpecialCharPanel",
  component: SpecialCharPanel,
  parameters: { layout: "fullscreen" },
  loaders: [
    () => {
      localStorage.removeItem("specialChars_v2");
      return {};
    },
  ],
  args: { onClose: fn() },
};

export default meta;
type Story = StoryObj<typeof SpecialCharPanel>;

export const Default: Story = {};

export const EscapeClosesPanel: Story = {
  play: async ({ args, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(page.getByRole("dialog", { name: "特殊符号面板" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};
