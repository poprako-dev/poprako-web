import { act, useState, type ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import ReadOnlyPageActions from
  "@/features/BaseTranslator/features/PageUnitStats/components/business/ReadOnlyPageActions";
import type { PageUnitDiffStats } from "@/types/page";

type Props = ComponentProps<typeof ReadOnlyPageActions>;

function StatsPreview(props: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPageId, setCurrentPageId] = useState(props.currentPageId);

  async function handleNavigate(index: number) {
    await props.onNavigate(index);
    const page = props.pages[index];
    if (page) {setCurrentPageId(page.id);}
  }

  return (
    <div className="relative h-dvh bg-stone-700">
      <div className="absolute bottom-3 right-3">
        <ReadOnlyPageActions
          {...props}
          currentPageId={currentPageId}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
}

const pages = Array.from({ length: 12 }, (_, index) => ({
  id: `page-${String(index + 1)}`,
  index,
  translatedUnitCount: index === 0 ? 0 : 12 + index,
}));

const stats: PageUnitDiffStats[] = [
  {
    pageId: "page-2", index: 1, translatedUnitCount: 10,
    editedUnitCount: 3, proofreaderAppendUnitCount: 2,
  },
  {
    pageId: "page-3", index: 2, translatedUnitCount: 0,
    editedUnitCount: 0, proofreaderAppendUnitCount: 6,
  },
  {
    pageId: "page-4", index: 3, translatedUnitCount: 15,
    editedUnitCount: 15, proofreaderAppendUnitCount: 0,
  },
];

const meta = {
  title: "Features/PageUnitStats",
  component: ReadOnlyPageActions,
  parameters: { layout: "fullscreen" },
  render: (args) => <StatsPreview {...args} />,
  args: {
    pages,
    currentPageId: "page-2",
    isDisabled: false,
    isOpen: false,
    onOpenChange: fn(),
    onListPageUnitDiffStats: fn(() => Promise.resolve(stats)),
    onNavigate: fn((_index: number) => Promise.resolve()),
  },
} satisfies Meta<typeof ReadOnlyPageActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chapter: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "页面 unit 统计" }));
    await expect(await page.findByRole("button", {
      name: "第 2 页，翻译 10，编辑 3，追加 2",
    })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("button", {
      name: "第 1 页，翻译 0，编辑 0，追加 0",
    })).toBeInTheDocument();
    await expect(page.getByRole("button", {
      name: "第 3 页，翻译 0，编辑 0，追加 6",
    })).toBeInTheDocument();
    await expect(page.getByRole("button", {
      name: "第 4 页，翻译 15，编辑 15，追加 0",
    })).toBeInTheDocument();
    await expect(page.getByRole("dialog").textContent).toMatch(/^[\dP\s]+$/);
    const row = page.getByRole("button", { name: "第 2 页，翻译 10，编辑 3，追加 2" });
    const translated = row.querySelector('[data-stat="translated"]')?.getBoundingClientRect();
    const edited = row.querySelector('[data-stat="edited"]')?.getBoundingClientRect();
    const appended = row.querySelector('[data-stat="appended"]')?.getBoundingClientRect();
    if (!translated || !edited || !appended) {throw new Error("Missing chart bars");}
    await expect(translated.height).toBe(4);
    await expect(edited.height).toBe(2);
    await expect(edited.x).toBe(translated.x);
    await expect(appended.x).toBeCloseTo(translated.right, 0);
    await expect(edited.width / translated.width).toBeCloseTo(0.3, 2);
    await expect(appended.width / translated.width).toBeCloseTo(0.2, 2);
    const longestRow = page.getByRole("button", {
      name: "第 12 页，翻译 23，编辑 0，追加 0",
    });
    const longest = longestRow.querySelector('[data-stat="translated"]');
    const plot = longest?.parentElement;
    if (!longest || !plot) {throw new Error("Missing longest bar");}
    await expect(longest.getBoundingClientRect().right)
      .toBeCloseTo(plot.getBoundingClientRect().right, 1);
    await expect(within(page.getByTitle("unit")).getByText("23")).toBeInTheDocument();
  },
};

export const NavigationAndRefresh: Story = {
  play: async ({ canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    const trigger = page.getByRole("button", { name: "页面 unit 统计" });
    await userEvent.click(trigger);
    await userEvent.click(await page.findByRole("button", {
      name: "第 4 页，翻译 15，编辑 15，追加 0",
    }));
    await expect(args.onNavigate).toHaveBeenCalledWith(3);
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await expect(await page.findByRole("button", {
      name: "第 4 页，翻译 15，编辑 15，追加 0",
    })).toHaveAttribute("aria-current", "page");
    await expect(args.onListPageUnitDiffStats).toHaveBeenCalledTimes(2);
    await userEvent.keyboard("{Escape}");
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();
  },
};

export const NoDifferences: Story = {
  args: { onListPageUnitDiffStats: fn(() => Promise.resolve([])) },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "页面 unit 统计" }));
    await expect(await page.findByRole("button", {
      name: "第 2 页，翻译 13，编辑 0，追加 0",
    })).toBeVisible();
  },
};

export const OutsideAndTriggerClose: Story = {
  play: async ({ canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    const trigger = page.getByRole("button", { name: "页面 unit 统计" });
    await userEvent.click(trigger);
    await page.findByRole("button", { name: "第 2 页，翻译 10，编辑 3，追加 2" });
    await userEvent.click(canvasElement);
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(trigger);
    await page.findByRole("button", { name: "第 2 页，翻译 10，编辑 3，追加 2" });
    await userEvent.click(trigger);
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await expect(args.onListPageUnitDiffStats).toHaveBeenCalledTimes(2);
  },
};

export const AllZero: Story = {
  args: {
    pages: pages.map((page) => ({ ...page, translatedUnitCount: 0 })),
    onListPageUnitDiffStats: fn(() => Promise.resolve([])),
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "页面 unit 统计" }));
    await expect(await page.findByRole("button", {
      name: "第 2 页，翻译 0，编辑 0，追加 0",
    })).toBeVisible();
    const row = page.getByRole("button", { name: "第 2 页，翻译 0，编辑 0，追加 0" });
    for (const bar of row.querySelectorAll("[data-stat]")) {
      await expect(bar).toHaveStyle({ width: "0px" });
    }
  },
};

export const EmptyChapter: Story = {
  args: { pages: [], currentPageId: "" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "页面 unit 统计" }));
    await expect(await page.findByRole("status")).toHaveAccessibleName("当前章节暂无页面");
    await userEvent.keyboard("{Escape}");
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
  },
};

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    const trigger = page.getByRole("button", { name: "页面 unit 统计" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await page.findByRole("button", { name: "第 1 页，翻译 0，编辑 0，追加 0" });
    await userEvent.tab();
    await expect(page.getByRole("button", {
      name: "第 1 页，翻译 0，编辑 0，追加 0",
    })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onNavigate).toHaveBeenCalledWith(0);
    await expect(trigger).toHaveFocus();
  },
};

export const LongChapter: Story = {
  name: "Scrollable Chapter",
  args: {
    pages: Array.from({ length: 200 }, (_, index) => ({
      id: `page-${String(index + 1)}`, index, translatedUnitCount: index % 41,
    })),
    currentPageId: "page-150",
    onListPageUnitDiffStats: fn(() => Promise.resolve(
      Array.from({ length: 200 }, (_, index) => ({
        pageId: `page-${String(index + 1)}`,
        index,
        translatedUnitCount: index % 41,
        editedUnitCount: Math.min(index % 7, index % 41),
        proofreaderAppendUnitCount: index % 5,
      })),
    )),
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "页面 unit 统计" }));
    const current = await page.findByRole("button", { name: /^第 150 页，/ });
    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(current).toBeVisible();
    const scroller = current.parentElement?.parentElement;
    const header = scroller?.firstElementChild;
    if (!scroller || !header) {throw new Error("Missing scrollable chart");}
    await waitFor(async () => {
      await expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
      await expect(scroller.scrollTop).toBeGreaterThan(0);
    });

    scroller.scrollTo({ top: 0, behavior: "instant" });
    await waitFor(async () => {await expect(scroller.scrollTop).toBe(0);});
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "instant" });
    await waitFor(async () => {
      const last = page.getByRole("button", { name: /^第 200 页，/ }).getBoundingClientRect();
      const viewport = scroller.getBoundingClientRect();
      await expect(last.top).toBeGreaterThanOrEqual(header.getBoundingClientRect().bottom);
      await expect(last.bottom).toBeLessThanOrEqual(viewport.bottom);
      await expect(header.getBoundingClientRect().top).toBeCloseTo(viewport.top, 0);
    });
    current.scrollIntoView({ block: "center", behavior: "instant" });
  },
};

export const FailedThenRetry: Story = {
  play: async ({ canvasElement, args }) => {
    args.onListPageUnitDiffStats.mockRejectedValueOnce(new Error("Statistics unavailable"));
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "页面 unit 统计" }));
    await expect(await page.findByRole("alert")).toHaveAccessibleName("统计加载失败");
    await userEvent.click(page.getByRole("button", { name: "重试" }));
    await expect(await page.findByRole("button", {
      name: "第 2 页，翻译 10，编辑 3，追加 2",
    })).toBeVisible();
  },
};

export const NextEditedPage: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "前进到下一个修改" }));
    await waitFor(async () => { await expect(args.onNavigate).toHaveBeenCalledWith(2); });
    await userEvent.click(canvas.getByRole("button", { name: "前进到下一个修改" }));
    await waitFor(async () => { await expect(args.onNavigate).toHaveBeenCalledWith(3); });
    await userEvent.click(canvas.getByRole("button", { name: "前进到下一个修改" }));
    await expect(args.onNavigate).toHaveBeenCalledTimes(2);
    await expect(args.onListPageUnitDiffStats).toHaveBeenCalledTimes(3);
  },
};

export const CloseDuringLoad: Story = {
  play: async ({ canvasElement, args }) => {
    let finishRequest: ((value: PageUnitDiffStats[]) => void) | undefined;
    // eslint-disable-next-line unicorn/prefer-promise-with-resolvers -- ES2022 target.
    const pending = new Promise<PageUnitDiffStats[]>((resolve) => {
      finishRequest = resolve;
    });
    args.onListPageUnitDiffStats.mockImplementationOnce(() => pending);
    const page = within(canvasElement.ownerDocument.body);
    const trigger = page.getByRole("button", { name: "页面 unit 统计" });
    await userEvent.click(trigger);
    await expect(await page.findByRole("status")).toHaveAccessibleName("正在加载统计");
    await userEvent.keyboard("{Escape}");
    args.onListPageUnitDiffStats.mockResolvedValueOnce([]);
    await userEvent.click(trigger);
    await expect(await page.findByRole("button", {
      name: "第 2 页，翻译 13，编辑 0，追加 0",
    })).toBeVisible();
    await act(async () => {
      finishRequest?.(stats);
      await pending;
    });
    await expect(page.getByRole("button", {
      name: "第 2 页，翻译 13，编辑 0，追加 0",
    })).toBeVisible();
  },
};
