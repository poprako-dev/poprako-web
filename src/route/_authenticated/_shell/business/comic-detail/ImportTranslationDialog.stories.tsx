import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { ImportTranslationDialog } from "@/route/_authenticated/_shell/business/comic-detail/ImportDialog";

const meta = {
  title: "Features/ComicDetailModal/ImportTranslationDialog",
  component: ImportTranslationDialog,
  args: {
    fileName: "第 01 话.txt",
    format: "lp",
    canTranslate: true,
    canProofread: true,
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
    await expect(args.onConfirm).toHaveBeenCalledWith("keep", "translation");
  },
};

export const Overwrite: Story = {
  play: async ({ canvasElement, args }) => {
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(screen.getByRole("radio", { name: /覆盖已有内容/ }));
    await expect(args.onConfirm).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "确认导入" }));
    await expect(args.onConfirm).toHaveBeenCalledWith("overwrite", "translation");
  },
};

export const Cancel: Story = {
  play: async ({ canvasElement, args }) => {
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(screen.getByRole("button", { name: "关闭" }));
    await expect(screen.queryByRole("button", { name: "取消" })).not.toBeInTheDocument();
    await expect(args.onCancel).toHaveBeenCalledOnce();
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

export const Importing: Story = {
  args: { loading: true },
  play: async ({ canvasElement, args }) => {
    const screen = within(canvasElement.ownerDocument.body);
    await expect(screen.getByRole("radio", { name: /覆盖已有内容/ })).toBeDisabled();
    await expect(screen.getByRole("button", { name: "翻译" })).toBeDisabled();
    await expect(screen.getByRole("button", { name: "校对" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "关闭" }));
    await expect(args.onCancel).not.toHaveBeenCalled();
  },
};

export const TranslatorOnly: Story = {
  args: { canProofread: false, format: "json", fileName: "第 01 话.json" },
  play: async ({ canvasElement, args }) => {
    const screen = within(canvasElement.ownerDocument.body);
    await expect(screen.getByRole("dialog", { name: "导入翻译" })).toBeInTheDocument();
    await expect(screen.queryByRole("group", { name: "导入目标" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "确认导入" }));
    await expect(args.onConfirm).toHaveBeenCalledWith("keep", "translation");
  },
};

export const ProofreaderOnly: Story = {
  args: { canTranslate: false, format: "json", fileName: "第 01 话.json" },
  play: async ({ canvasElement, args }) => {
    const screen = within(canvasElement.ownerDocument.body);
    await expect(screen.getByRole("dialog", { name: "导入校对" })).toBeInTheDocument();
    await expect(screen.queryByRole("group", { name: "导入目标" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "确认导入" }));
    await expect(args.onConfirm).toHaveBeenCalledWith("keep", "proofread");
  },
};

export const BothRolesLabelPlus: Story = {
  play: async ({ canvasElement, args }) => {
    const screen = within(canvasElement.ownerDocument.body);
    await expect(screen.getByRole("group", { name: "导入目标" })).toBeInTheDocument();
    await expect(screen.queryByRole("button", { name: "翻译+校对" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "校对" }));
    await userEvent.click(screen.getByRole("button", { name: "确认导入" }));
    await expect(args.onConfirm).toHaveBeenCalledWith("keep", "proofread");
  },
};

export const BothRolesJson: Story = {
  args: { format: "json", fileName: "第 01 话.json" },
  play: async ({ canvasElement, args }) => {
    const screen = within(canvasElement.ownerDocument.body);
    await expect(screen.getByRole("group", { name: "导入目标" })).toBeInTheDocument();
    await expect(screen.getByRole("button", { name: "翻译" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(screen.getByRole("button", { name: "翻译+校对" }));
    await userEvent.click(screen.getByRole("button", { name: "确认导入" }));
    await expect(args.onConfirm).toHaveBeenCalledWith("keep", "both");
  },
};
