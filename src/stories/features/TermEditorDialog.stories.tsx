import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import TermEditorDialog from
  "@/features/BaseTranslator/features/TerminologyLookup/components/business/TermEditorDialog";

const meta = {
  title: "Features/BaseTranslator/TermEditorDialog",
  component: TermEditorDialog,
  args: { onSave: fn().mockResolvedValue(true), onClose: fn() },
} satisfies Meta<typeof TermEditorDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ContinuousInput: Story = {
  play: async ({ args, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    for (const name of ["原文", "译名 1", "备注"]) {
      const input = page.getByRole<HTMLInputElement>("textbox", { name });
      await userEvent.click(input);
      for (const character of "abc") {
        await userEvent.keyboard(character);
        await expect(input).toHaveFocus();
        await expect(page.getByRole("textbox", { name })).toBe(input);
      }
      await expect(input).toHaveValue("abc");
      await userEvent.keyboard("{ArrowLeft}中");
      await expect(input).toHaveValue("ab中c");
      await expect(input.selectionStart).toBe(3);
    }
    await userEvent.click(page.getByRole("button", { name: "保存" }));
    await expect(args.onSave).toHaveBeenCalledWith({
      source: "ab中c", targets: ["ab中c"], comment: "ab中c",
    });
  },
};

export const StableRows: Story = {
  args: {
    term: {
      id: "term-1", termbaseId: "base-1", source: "原文", targets: ["甲", "乙"],
      creatorId: "user-1", createdAt: 1, updatedAt: 1,
    },
  },
  play: async ({ args, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const first = page.getByRole("textbox", { name: "译名 1" });
    const second = page.getByRole("textbox", { name: "译名 2" });
    await userEvent.type(first, "修改");
    await expect(first).toHaveFocus();
    await expect(first).toHaveValue("甲修改");
    await userEvent.click(page.getByRole("button", { name: "添加译名" }));
    const third = page.getByRole("textbox", { name: "译名 3" });
    await userEvent.click(page.getByRole("button", { name: "添加译名" }));
    const fourth = page.getByRole("textbox", { name: "译名 4" });
    await expect(fourth).not.toBe(third);
    await userEvent.type(third, "乙");
    await userEvent.type(fourth, "丁");
    await expect(page.getByText("译名不能重复")).toBeVisible();
    await expect(page.getByRole("button", { name: "保存" })).toBeDisabled();
    await userEvent.type(third, "补充");
    await expect(third).toHaveValue("乙补充");
    await userEvent.click(page.getByRole("button", { name: "上移译名 3" }));
    await expect(page.getByRole("textbox", { name: "译名 2" })).toBe(third);
    await expect(page.getByRole("textbox", { name: "译名 3" })).toBe(second);
    await userEvent.click(page.getByRole("button", { name: "下移译名 1" }));
    await expect(page.getByRole("textbox", { name: "译名 2" })).toBe(first);
    await userEvent.click(page.getByRole("button", { name: "删除译名 3" }));
    await expect(second.isConnected).toBe(false);
    await expect(page.getByRole("textbox", { name: "译名 3" })).toBe(fourth);
    await userEvent.click(third);
    await userEvent.keyboard("续写");
    await expect(third).toHaveFocus();
    await expect(third).toHaveValue("乙补充续写");
    await userEvent.click(page.getByRole("button", { name: "保存" }));
    await expect(args.onSave).toHaveBeenCalledWith({
      source: "原文", targets: ["乙补充续写", "甲修改", "丁"], comment: undefined,
    });
  },
};
