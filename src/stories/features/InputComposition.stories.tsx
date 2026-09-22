import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, userEvent, within } from "storybook/test";
import MemberListFilterHeader from
  "@/features/MemberList/components/business/MemberListFilterHeader";
import ArchiveFileList from "@/features/Utilities/components/business/ArchiveFileList";
import SpecialCharPanel from
  "@/features/BaseTranslator/features/SpecialCharPanel/components/business/SpecialCharPanel";

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

export const MemberSearch: Story = {
  render: ({ onChange }) => (
    <MemberListFilterHeader
      activeFuzzyName="" activeRole={null} onChangeFuzzyName={onChange}
      onChangeRole={fn()} onCreateMember={fn()}
    />
  ),
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox");
    await userEvent.type(input, "中文姓名");
    await fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    await fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    await expect(input).toHaveFocus();
    await expect(args.onChange).not.toHaveBeenCalled();
    await userEvent.keyboard("{Enter}");
    await expect(args.onChange).toHaveBeenCalledWith("中文姓名");
  },
};

export const ArchivePagination: Story = {
  render: () => (
    <ArchiveFileList
      files={[new File(["a"], "a.txt"), new File(["b"], "b.txt")]}
      isBusy={false} onChange={fn()}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "文件页码" });
    await userEvent.clear(input);
    await userEvent.keyboard("2");
    await fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    await fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    await expect(input).toHaveFocus();
    await expect(canvas.getByText("a.txt")).toBeVisible();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("b.txt")).toBeVisible();
    await expect(canvas.getByRole("textbox", { name: "文件页码" })).toHaveValue("2");
  },
};

export const SpecialCharacter: Story = {
  beforeEach: () => {
    const stored = localStorage.getItem("specialChars_v2");
    localStorage.removeItem("specialChars_v2");
    return () => {
      if (stored === null) {localStorage.removeItem("specialChars_v2");}
      else {localStorage.setItem("specialChars_v2", stored);}
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
