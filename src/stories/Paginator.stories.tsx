import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fireEvent, fn, userEvent, within } from "storybook/test";

import Paginator from "../components/ui/Paginator";

const meta = {
  title: "UI/Paginator",
  component: Paginator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
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
    currPageIndex: 2,
    totalPageCount: 5,
    // omit handlers to show read-only display
  },
};

export const CompositionKeepsFocus: Story = {
  play: async ({ args, canvasElement }) => {
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
