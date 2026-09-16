import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import UnitSearchTransformDialog from
  "@/features/BaseTranslator/features/UnitSearchTransform";
import type { UnitSearchMatch } from "@/features/BaseTranslator";
import type { Page } from "@/types/page";
import type { UnitInfo } from "@/types/unit";

const pages: Page[] = [0, 1, 2].map((index) => ({
  id: `page-${String(index + 1)}`,
  chapterId: "chapter-1",
  index,
  imageUrl: "",
  isUploaded: true,
  creatorId: "user-1",
  totalUnitCount: 12,
  translatedUnitCount: 10,
  proofreadUnitCount: 8,
  createdAt: 0,
  updatedAt: 0,
}));

function makeMatch(index: number): UnitSearchMatch {
  const unit: UnitInfo = {
    id: `unit-${String(index + 1)}`,
    index,
    xCoord: 0.2,
    yCoord: 0.3,
    isBubble: index % 2 === 0,
    isProofread: false,
    translatedText: index % 2 === 0
      ? "这是一段需要替换的旧词，旧词会被逐处标出。"
      : "另一条包含旧词的译文。",
  };

  return { pageId: `page-${String((index % 3) + 1)}`, unit };
}

const groupedMatches = Array.from({ length: 8 }, (_, index) => makeMatch(index));

const meta: Meta<typeof UnitSearchTransformDialog> = {
  title: "Features/BaseTranslator/UnitSearchTransformDialog",
  component: UnitSearchTransformDialog,
  parameters: { layout: "fullscreen" },
  args: {
    runExclusive: async (operation) => { await operation(); },
    pages,
    part: "translatedText",
    currentPageId: "page-1",
    onBeforeSearch: fn(() => Promise.resolve()),
    onRefreshCurrentPage: fn(() => Promise.resolve()),
    onNavigate: fn(async () => { return; }), // eslint-disable-line @typescript-eslint/require-await
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof UnitSearchTransformDialog>;

export const GroupedResults: Story = {
  args: {
    dataSource: {
      // eslint-disable-next-line @typescript-eslint/require-await
      search: async () => ({ success: true, data: groupedMatches }),
      // eslint-disable-next-line @typescript-eslint/require-await
      transform: async () => ({ success: true, data: undefined }),
      // eslint-disable-next-line @typescript-eslint/require-await
      reloadPage: async () => ({ success: true, data: [] }),
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.type(page.getByRole("textbox", { name: "查找短语" }), "旧词");
    await userEvent.click(page.getByRole("button", { name: "搜索" }));
    await expect(await page.findByText("8 个匹配 Unit")).toBeVisible();
    const pageSelector = page.getByRole("checkbox", {
      name: "选择第 1 页全部匹配项",
    });
    await expect(pageSelector).toHaveAttribute("aria-checked", "true");
    const expandButton = page.getAllByRole("button", { name: "展开页面" })[0];
    if (!expandButton) {throw new Error("展开按钮缺失");}
    await userEvent.click(expandButton);
    await expect(page.getAllByText("旧词").length).toBeGreaterThan(0);
    await expect(page.getByRole("textbox", { name: "替换短语" })).toBeEnabled();
    const unitCheckbox = page.getAllByRole("checkbox", { name: "选择该 Unit" })[0];
    if (!unitCheckbox) {throw new Error("Unit 复选框缺失");}
    await userEvent.click(unitCheckbox);
    await expect(pageSelector).toHaveAttribute("aria-checked", "mixed");
    await userEvent.click(pageSelector);
    await expect(pageSelector).toHaveAttribute("aria-checked", "true");
    await userEvent.click(pageSelector);
    await expect(pageSelector).toHaveAttribute("aria-checked", "false");
  },
};

export const MoreThanOneHundred: Story = {
  args: {
    dataSource: {
      // eslint-disable-next-line @typescript-eslint/require-await
      search: async () => ({
        success: true,
        data: Array.from({ length: 105 }, (_, index) => makeMatch(index)),
      }),
      // eslint-disable-next-line @typescript-eslint/require-await
      transform: async () => ({ success: true, data: undefined }),
      // eslint-disable-next-line @typescript-eslint/require-await
      reloadPage: async () => ({ success: true, data: [] }),
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "搜索" }));
    await expect(await page.findByText("已选 100 · 上限 100")).toBeVisible();
  },
};

export const Empty: Story = {
  args: {
    dataSource: {
      // eslint-disable-next-line @typescript-eslint/require-await
      search: async () => ({ success: true, data: [] }),
      // eslint-disable-next-line @typescript-eslint/require-await
      transform: async () => ({ success: true, data: undefined }),
      // eslint-disable-next-line @typescript-eslint/require-await
      reloadPage: async () => ({ success: true, data: [] }),
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "搜索" }));
    await expect(await page.findByText("没有找到匹配内容")).toBeVisible();
  },
};

export const SearchError: Story = {
  args: {
    dataSource: {
      // eslint-disable-next-line @typescript-eslint/require-await
      search: async () => ({ success: false, error: "搜索失败，请稍后重试" }),
      // eslint-disable-next-line @typescript-eslint/require-await
      transform: async () => ({ success: true, data: undefined }),
      // eslint-disable-next-line @typescript-eslint/require-await
      reloadPage: async () => ({ success: true, data: [] }),
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "搜索" }));
    await expect(await page.findByText("搜索失败，请稍后重试")).toBeVisible();
  },
};
