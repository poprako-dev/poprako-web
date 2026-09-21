import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, userEvent, within } from "storybook/test";
import { useShortcutActions } from "@/features/BaseTranslator/hook/useShortcutActions";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Props convention.
type Props = { onAction: () => void };

function ShortcutScope({ onAction }: Props) {
  useShortcutActions({ save: onAction }, [{ action: "save", label: "保存", keys: ["j"] }], false);
  return (
    <div>
      <input aria-label="普通输入" />
      <textarea aria-label="普通文本" />
      <select aria-label="普通选择"><option>一</option><option>二</option></select>
      <div contentEditable role="textbox" aria-label="富文本" tabIndex={0} />
      <div data-unit-id="unit-1">
        <textarea aria-label="单元输入" />
        <textarea
          aria-label="已处理的输入"
          onKeyDown={(event) => { event.preventDefault(); }}
        />
        <div role="dialog" aria-label="嵌套对话框">
          <input aria-label="对话框输入" />
        </div>
        <div data-app-dialog><input aria-label="标记对话框输入" /></div>
      </div>
    </div>
  );
}

const meta = {
  title: "Features/BaseTranslator/KeyboardScope",
  component: ShortcutScope,
  args: { onAction: fn() },
} satisfies Meta<typeof ShortcutScope>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InputBoundaries: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["普通输入", "普通文本", "对话框输入", "标记对话框输入"]) {
      const input = canvas.getByRole("textbox", { name });
      await userEvent.type(input, "j");
      await expect(input).toHaveValue("j");
      await expect(input).toHaveFocus();
    }
    const richText = canvas.getByRole("textbox", { name: "富文本" });
    await userEvent.click(richText);
    await userEvent.keyboard("j");
    await expect(richText).toHaveTextContent("j");
    await fireEvent.keyDown(canvas.getByRole("combobox"), { key: "j" });
    const handled = canvas.getByRole("textbox", { name: "已处理的输入" });
    await userEvent.type(handled, "j");
    const unit = canvas.getByRole("textbox", { name: "单元输入" });
    await fireEvent.keyDown(unit, { key: "j", isComposing: true });
    await fireEvent.keyDown(unit, { key: "j", keyCode: 229 });
    await expect(args.onAction).not.toHaveBeenCalled();
    await userEvent.type(unit, "j");
    await expect(args.onAction).toHaveBeenCalledTimes(1);
  },
};
