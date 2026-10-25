import { useState, type ComponentProps, type ReactElement } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, mocked, userEvent, waitFor, within } from "storybook/test";
import { ArchiveExportDialog } from "./ArchiveExportDialog";
import type { ExportArchives } from "./archive-export";
import { ComicList } from "../comic-list/ComicList";
import {
  archiveListProps,
  emptyArchiveExport,
  pendingArchiveExport,
  sampleArchiveExport,
  storyDate,
} from "./archive-story-fixture";

const meta = {
  title: "Features/ComicPlayground/ArchiveExport",
  component: ArchiveExportDialog,
  parameters: { layout: "fullscreen" },
  args: { now: storyDate, onClose: fn(), onExport: fn(sampleArchiveExport) },
} satisfies Meta<typeof ArchiveExportDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
type Props = ComponentProps<typeof ArchiveExportDialog>;

function PlaygroundEntry(args: Props): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <main className="h-dvh">
      <ComicList
        {...archiveListProps}
        onExportArchives={() => {
          setOpen(true);
        }}
      />
      {open && (
        <ArchiveExportDialog
          {...args}
          onClose={() => {
            setOpen(false);
          }}
        />
      )}
    </main>
  );
}

export const Entry: Story = {
  name: "漫画广场入口",
  render: (args) => <PlaygroundEntry {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "导出归档" });
    await expect(button.previousElementSibling).toHaveAttribute("title", "创建漫画");
    await userEvent.click(button);
    const page = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(page.getByRole("dialog", { name: "导出归档" })).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await expect(button).toHaveFocus();
  },
};

export const Default: Story = { name: "选择归档月份" };

export const CrossYearSelection: Story = {
  name: "跨年多选",
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "上一年" }));
    await userEvent.click(page.getByRole("button", { name: "2025 年 12 月" }));
    await waitFor(() => expect(page.getByRole("button", { name: "移除 2026-09" })).toBeVisible());
    await expect(page.getByRole("button", { name: "移除 2025-12" })).toBeVisible();
    await userEvent.click(page.getByRole("button", { name: "下一年" }));
    await expect(page.getByRole("button", { name: "2026 年 9 月" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("button", { name: "2026 年 11 月" })).toBeDisabled();
  },
};

export const AllArchives: Story = {
  name: "全部归档",
  args: { onExport: fn(emptyArchiveExport) },
  play: async ({ canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "全部归档" }));
    await userEvent.click(page.getByRole("button", { name: "导出全部归档" }));
    await expect(args.onExport).toHaveBeenCalledWith(undefined, expect.any(AbortSignal));
    await expect(page.getByRole("status")).toHaveTextContent("暂无归档");
  },
};

export const Exporting: Story = {
  name: "导出中",
  args: { onExport: fn(pendingArchiveExport) },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "导出" }));
    await expect(page.getByRole("status")).toHaveTextContent("正在导出归档");
    await expect(page.getByRole("button", { name: "2026 年 9 月" })).toBeDisabled();
  },
};

export const Empty: Story = {
  name: "所选月份无归档",
  args: { onExport: fn(emptyArchiveExport) },
  play: async ({ canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "导出" }));
    await expect(args.onExport).toHaveBeenCalledWith(["2026-09"], expect.any(AbortSignal));
    await expect(page.getByRole("status")).toHaveTextContent("所选月份暂无归档");
  },
};

export const Retry: Story = {
  name: "失败重试",
  args: {
    onExport: fn<ExportArchives>(() => Promise.resolve({ success: false, error: "网络连接失败" })),
  },
  play: async ({ canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "导出" }));
    await expect(page.getByRole("alert")).toHaveTextContent("导出失败，请重试");
    await expect(page.getByRole("button", { name: "2026 年 9 月" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    mocked(args.onExport).mockResolvedValueOnce({ success: true, data: null });
    await userEvent.click(page.getByRole("button", { name: "重试" }));
    await expect(args.onExport).toHaveBeenCalledTimes(2);
    await expect(page.getByRole("status")).toHaveTextContent("所选月份暂无归档");
  },
};

export const Mobile390: Story = {
  name: "移动端",
  globals: { viewport: { value: "mobile1", isRotated: false } },
};

export const Completed: Story = {
  name: "导出完成",
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "导出" }));
    await waitFor(() => expect(page.getByRole("status")).toHaveTextContent("已导出 1 部漫画"));
    await expect(page.getByRole("button", { name: "再次下载" })).toBeEnabled();
  },
};

export const Cancelled: Story = {
  name: "取消后重新选择",
  args: { onExport: fn(pendingArchiveExport) },
  play: async ({ canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "导出" }));
    await userEvent.click(page.getByRole("button", { name: "取消导出" }));
    const signal = mocked(args.onExport).mock.calls[0]?.[1];
    await expect(signal?.aborted).toBe(true);
    await userEvent.click(page.getByRole("button", { name: "移除 2026-09" }));
    await expect(page.getByRole("button", { name: "导出" })).toBeDisabled();
    await userEvent.click(page.getByRole("button", { name: "2026 年 8 月" }));
    await expect(page.getByRole("button", { name: "导出" })).toBeEnabled();
  },
};
