import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import type { Result } from "@/shared/utility/result";
import { WorksetModifierModal } from "./WorksetModifierModal";

const meta: Meta<typeof WorksetModifierModal> = {
  title: "Features/WorksetModifierModal",
  component: WorksetModifierModal,
  parameters: { layout: "fullscreen" },
  args: {
    workset: {
      id: "workset-1",
      teamId: "team-1",
      index: 0,
      name: "日漫翻译组",
      description: "负责日文漫画的汉化工作",
      comicCount: 12,
      createdAt: 1,
      updatedAt: 1,
    },
    onUpdate: fn(() => Promise.resolve<Result<void>>({ success: true, data: undefined })),
    onDelete: fn(() => Promise.resolve<Result<void>>({ success: true, data: undefined })),
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof WorksetModifierModal>;

export const Default: Story = {};

export const CancelDeletion: Story = {
  play: async ({ args, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.clear(page.getByRole("textbox", { name: "名称" }));
    await userEvent.type(page.getByRole("textbox", { name: "名称" }), "未保存的名称");
    await userEvent.click(page.getByRole("button", { name: "删除" }));
    const dialog = page.getByRole("dialog", { name: "确认删除作品集" });
    await expect(dialog).toHaveTextContent("全部作品及章节页面也会一并删除");
    await expect(args.onDelete).not.toHaveBeenCalled();
    await expect(page.queryByRole("button", { name: "取消" })).not.toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "关闭" }));
    await expect(page.getByRole("textbox", { name: "名称" })).toHaveValue("未保存的名称");
    await expect(args.onClose).not.toHaveBeenCalled();
    await userEvent.click(page.getByRole("button", { name: "确认" }));
    await expect(args.onUpdate).toHaveBeenCalledWith({
      name: "未保存的名称",
      description: args.workset.description,
    });
  },
};

export const ConfirmDeletion: Story = {
  play: async ({ args, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "删除" }));
    await expect(args.onDelete).not.toHaveBeenCalled();
    await userEvent.click(page.getByRole("button", { name: "确认删除" }));
    await expect(args.onDelete).toHaveBeenCalledOnce();
    await expect(args.onClose).toHaveBeenCalledOnce();
    await expect(args.onUpdate).not.toHaveBeenCalled();
  },
};

export const DeleteFailure: Story = {
  args: {
    onDelete: fn(() =>
      Promise.resolve<Result<void>>({ success: false, error: "删除失败，请重试" }),
    ),
  },
  play: async ({ args, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "删除" }));
    await userEvent.click(page.getByRole("button", { name: "确认删除" }));
    await expect(args.onClose).not.toHaveBeenCalled();
    await waitFor(() => expect(page.getByRole("dialog", { name: "确认删除作品集" })).toBeVisible());
    await expect(page.getByRole("button", { name: "确认删除" })).toBeEnabled();
    await userEvent.click(page.getByRole("button", { name: "确认删除" }));
    await expect(args.onDelete).toHaveBeenCalledTimes(2);
    await expect(args.onClose).not.toHaveBeenCalled();
    await userEvent.click(page.getByRole("button", { name: "关闭" }));
    await expect(page.getByRole("textbox", { name: "名称" })).toHaveValue(args.workset.name);
  },
};

export const Deleting: Story = {
  args: { onDelete: fn(() => new Promise<Result<void>>(() => undefined)) },
  play: async ({ args, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "删除" }));
    await userEvent.click(page.getByRole("button", { name: "确认删除" }));
    const close = page.getByRole("button", { name: "关闭" });
    const confirm = page.getByRole("button", { name: "确认删除" });
    await expect(close).toBeDisabled();
    await expect(confirm).toBeDisabled();
    await userEvent.click(close);
    await userEvent.click(confirm);
    await userEvent.keyboard("{Escape}");
    await expect(args.onDelete).toHaveBeenCalledOnce();
    await expect(args.onClose).not.toHaveBeenCalled();
    await waitFor(() => expect(page.getByRole("dialog", { name: "确认删除作品集" })).toBeVisible());
  },
};

export const WithoutDeletePermission: Story = {
  args: { onDelete: undefined },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(page.queryByRole("button", { name: "删除" })).not.toBeInTheDocument();
  },
};

export const Mobile390: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
