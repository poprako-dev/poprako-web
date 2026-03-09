import type { Meta, StoryObj } from "@storybook/react-vite";

import { fn } from "storybook/test";

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
    onPageUp: undefined,
    onPageDown: undefined,
    onPageIndexChange: undefined,
  },
};
