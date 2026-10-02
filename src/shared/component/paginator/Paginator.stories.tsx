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

const draftPages: PageStat[] = Array.from({ length: 6 }, (_, index) => {
  const status = Math.floor(index / 2);
  return {
    pageId: `draft-page-${String(index + 1)}`,
    totalUnits: 6,
    translatedUnits: status > 0 ? 6 : 0,
    proofreadUnits: status > 1 ? 6 : 0,
    hasLocalDraft: index % 2 === 1,
    ...(status < 2 ? { flaggedUnits: status === 0 ? 2 : 0 } : {}),
  };
});

export const PageDraftIndicators: Story = {
  args: {
    mode: "list",
    currPageIndex: 0,
    totalPageCount: draftPages.length,
    onPageIndexChange: fn(),
    pageStats: draftPages,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open page list" }));
    await expect(canvas.getAllByRole("img", { name: "有未保存草稿" })).toHaveLength(3);
    for (const index of [0, 2, 4]) {
      const saved = canvas.getByRole("button", {
        name: new RegExp(`\\bP${String(index + 1)}\\b`),
      });
      const pending = canvas.getByRole("button", {
        name: new RegExp(`\\bP${String(index + 2)}\\b`),
      });
      await expect(within(saved).queryByLabelText("有未保存草稿")).toBeNull();
      if (index === 0) {
        for (const row of [saved, pending]) {
          await expect(within(row).getByLabelText("2 个待回看的标记")).toHaveTextContent("");
        }
      }
      const draft = within(pending).getByRole("img", { name: "有未保存草稿" });
      await expect(draft).toBeVisible();
      await expect(draft.querySelector("svg")).not.toBeNull();
      await expect(draft.previousElementSibling).toBe(
        index === 0
          ? within(pending).getByLabelText("2 个待回看的标记")
          : within(pending).getByText(`P${String(index + 2)}`),
      );
      const savedDot = saved.querySelector("span.rounded-full");
      const pendingDot = pending.querySelector("span.rounded-full");
      if (!savedDot || !pendingDot) throw new Error("Missing page completion indicator");
      await expect(getComputedStyle(pendingDot).backgroundColor).toBe(
        getComputedStyle(savedDot).backgroundColor,
      );
      await expect(getComputedStyle(pendingDot).boxShadow).not.toContain("inset");
    }
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
