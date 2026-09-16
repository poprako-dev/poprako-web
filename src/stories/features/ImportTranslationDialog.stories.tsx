import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import ImportTranslationDialog from
  "@/features/ComicPlayground/features/ComicDetailModal/components/business/ImportDialog";

const meta = {
  title: "Features/ComicDetailModal/ImportTranslationDialog",
  component: ImportTranslationDialog,
  args: {
    fileName: "第 01 话.txt",
    loading: false,
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof ImportTranslationDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Keep: Story = {
  play: async ({ canvasElement, args }) => {
    const screen = within(canvasElement.ownerDocument.body);
    await expect(screen.getByRole("radio", { name: /保留已有内容/ })).toBeChecked();
    await expect(args.onConfirm).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "确认导入" }));
    await expect(args.onConfirm).toHaveBeenCalledWith("keep");
  },
};

export const Overwrite: Story = {
  play: async ({ canvasElement, args }) => {
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(screen.getByRole("radio", { name: /覆盖已有内容/ }));
    await expect(args.onConfirm).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "确认导入" }));
    await expect(args.onConfirm).toHaveBeenCalledWith("overwrite");
  },
};

export const Cancel: Story = {
  play: async ({ canvasElement, args }) => {
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(screen.getByRole("button", { name: "取消" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

export const Importing: Story = {
  args: { loading: true },
  play: async ({ canvasElement, args }) => {
    const screen = within(canvasElement.ownerDocument.body);
    await expect(screen.getByRole("radio", { name: /覆盖已有内容/ })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "取消" }));
    await expect(args.onCancel).not.toHaveBeenCalled();
  },
};
