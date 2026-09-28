import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, userEvent, within } from "storybook/test";
import { SpecialCharPanel } from "@/routes/_authenticated/translator/business/special-character/SpecialCharPanel";

interface Args {
  onChange: (value: string) => void;
  onClose: () => void;
}

const meta = {
  title: "Regression/InputComposition",
  args: { onChange: fn(), onClose: fn() },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<Args>;

export const SpecialCharacter: Story = {
  beforeEach: () => {
    const stored = localStorage.getItem("specialChars_v2");
    localStorage.removeItem("specialChars_v2");
    return () => {
      if (stored === null) localStorage.removeItem("specialChars_v2");
      else localStorage.setItem("specialChars_v2", stored);
    };
  },
  render: ({ onClose }) => <SpecialCharPanel onClose={onClose} />,
  play: async ({ args, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "添加特殊符号" }));
    const input = page.getByRole("textbox");
    await userEvent.keyboard("特殊符号");
    for (const key of ["Enter", "Escape"]) {
      await fireEvent.keyDown(input, { key, isComposing: true });
      await fireEvent.keyDown(input, { key, keyCode: 229 });
    }
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue("特殊符号");
    await expect(localStorage.getItem("specialChars_v2")).toBeNull();
    await expect(args.onClose).not.toHaveBeenCalled();
    await userEvent.keyboard("{Enter}");
    await expect(page.getByText("特殊符号", { exact: true })).toBeVisible();
  },
};
