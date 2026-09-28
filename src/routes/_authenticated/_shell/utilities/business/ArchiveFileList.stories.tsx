import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, userEvent, within } from "storybook/test";
import { ArchiveFileList } from "@/routes/_authenticated/_shell/utilities/business/ArchiveFileList";

const meta = {
  title: "Utilities/ArchiveFileList",
  component: ArchiveFileList,
  args: {
    files: [new File(["a"], "a.txt"), new File(["b"], "b.txt")],
    isBusy: false,
    onChange: fn(),
  },
} satisfies Meta<typeof ArchiveFileList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ArchivePagination: Story = {
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
