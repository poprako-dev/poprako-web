import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, userEvent, within } from "storybook/test";
import { MemberListFilterHeader } from "@/routes/_authenticated/_shell/member-list/business/MemberListFilterHeader";

const meta = {
  title: "MemberList/FilterHeader",
  component: MemberListFilterHeader,
  args: { onChangeFuzzyName: fn(), onChangeRole: fn(), onCreateMember: fn() },
} satisfies Meta<typeof MemberListFilterHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SearchComposition: Story = {
  args: { activeFuzzyName: "", activeRole: null },
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox");
    await userEvent.type(input, "中文姓名");
    await fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    await fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    await expect(input).toHaveFocus();
    await expect(args.onChangeFuzzyName).not.toHaveBeenCalled();
    await userEvent.keyboard("{Enter}");
    await expect(args.onChangeFuzzyName).toHaveBeenCalledWith("中文姓名");
  },
};
