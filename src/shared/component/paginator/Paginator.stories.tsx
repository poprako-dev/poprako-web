import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fireEvent, fn, userEvent, within } from "storybook/test";

import { Paginator } from "@/shared/component/Paginator";
import type { PageStat } from "@/shared/component/Paginator";

const meta = {
  title: "UI/Paginator",
  component: Paginator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    mode: "input",
    currPageIndex: 0,
    totalPageCount: 10,
    onPageUp: fn(),
    onPageDown: fn(),
    onPageIndexChange: fn(),
  },
} satisfies Meta<typeof Paginator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    currPageIndex: 1,
    totalPageCount: 12,
  },
};

export const ReadOnly: Story = {
  args: {
    mode: "display",
    currPageIndex: 2,
    totalPageCount: 5,
  },
};

const pageStats: PageStat[] = Array.from({ length: 12 }, (_, index) => ({
  pageId: `page-${String(index + 1)}`,
  totalUnits: 6,
  translatedUnits: index > 3 ? 6 : index,
  proofreadUnits: index > 8 ? 6 : Math.max(0, index - 4),
}));

export const PageList: Story = {
  args: {
    mode: "list",
    currPageIndex: 4,
    totalPageCount: pageStats.length,
    onPageIndexChange: fn(),
    pageStats,
  },
};

export const CompositionKeepsFocus: Story = {
  play: async ({ args, canvasElement }) => {
    if (args.mode !== "input") {
      throw new Error("CompositionKeepsFocus requires input mode");
    }
    const input = within(canvasElement).getByRole("textbox", { name: "Current page" });
    await userEvent.clear(input);
    await userEvent.keyboard("3");
    await fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    await expect(input).toHaveFocus();
    await expect(args.onPageIndexChange).not.toHaveBeenCalled();
    await fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    await expect(input).toHaveFocus();
    await expect(args.onPageIndexChange).not.toHaveBeenCalled();
    await userEvent.keyboard("{Enter}");
    await expect(args.onPageIndexChange).toHaveBeenCalledWith(2);
    await expect(input).not.toHaveFocus();
  },
};
