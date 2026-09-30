import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { UnitSearchTransformDialog } from "@/route/_authenticated/translator/business/search-transform/UnitSearchTransformDialog";
import type { UnitSearchMatch } from "@/route/_authenticated/translator/business/contract/unit-search-transform";
import type { Page } from "@/route/_authenticated/business/page/page";
import { createEditorSearchCoordinator } from "../editor/editor-search-coordinator";
import type { UnitSearchTransformDataSource } from "../contract/unit-search-transform";
import type { UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";

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
    isFlagged: false,
    isProofread: false,
    translatedText:
      index % 2 === 0 ? "这是一段需要替换的旧词，旧词会被逐处标出。" : "另一条包含旧词的译文。",
  };

  return { pageId: `page-${String((index % 3) + 1)}`, unit };
}

const groupedMatches = Array.from({ length: 8 }, (_, index) => makeMatch(index));

function makeCoordinator(
  dataSource: UnitSearchTransformDataSource,
): ReturnType<typeof createEditorSearchCoordinator> {
  return createEditorSearchCoordinator({
    dataSource,
    part: "translatedText",
    currentPageId: "page-1",
    flush: fn(() => Promise.resolve()),
    runExclusive: async (operation) => {
      await operation();
    },
    refreshCurrentPage: fn(() => Promise.resolve()),
    navigate: fn(() => Promise.resolve()),
  });
}

const meta: Meta<typeof UnitSearchTransformDialog> = {
  title: "Features/BaseTranslator/UnitSearchTransformDialog",
  component: UnitSearchTransformDialog,
  parameters: { layout: "fullscreen" },
  args: {
    pages,
    part: "translatedText",
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof UnitSearchTransformDialog>;

export const GroupedResults: Story = {
  args: {
    coordinator: makeCoordinator({
      // eslint-disable-next-line @typescript-eslint/require-await
      search: async () => ({ success: true, data: groupedMatches }),
      // eslint-disable-next-line @typescript-eslint/require-await
      transform: async () => ({ success: true, data: undefined }),
      // eslint-disable-next-line @typescript-eslint/require-await
      reloadPage: async () => ({ success: true, data: [] }),
    }),
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const dialog = within(page.getByRole("dialog", { name: "搜索与替换" }));
    await userEvent.type(dialog.getByRole("textbox", { name: "查找短语" }), "旧词");
    await userEvent.click(dialog.getByRole("button", { name: "搜索" }));
    await waitFor(async () => {
      await expect(await dialog.findByText("8 个匹配 Unit")).toBeVisible();
    });
    const pageSelector = dialog.getByRole("checkbox", {
      name: "选择第 1 页全部匹配项",
    });
    await expect(pageSelector).toHaveAttribute("aria-checked", "true");
    const expandButton = dialog.getAllByRole("button", { name: "展开页面" })[0];
    if (!expandButton) throw new Error("展开按钮缺失");
    await userEvent.click(expandButton);
    await expect(dialog.getAllByText("旧词").length).toBeGreaterThan(0);
    await expect(dialog.getByRole("textbox", { name: "替换短语" })).toBeEnabled();
    const unitCheckbox = dialog.getAllByRole("checkbox", { name: "选择该 Unit" })[0];
    if (!unitCheckbox) throw new Error("Unit 复选框缺失");
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
    coordinator: makeCoordinator({
      // eslint-disable-next-line @typescript-eslint/require-await
      search: async () => ({
        success: true,
        data: Array.from({ length: 105 }, (_, index) => makeMatch(index)),
      }),
      // eslint-disable-next-line @typescript-eslint/require-await
      transform: async () => ({ success: true, data: undefined }),
      // eslint-disable-next-line @typescript-eslint/require-await
      reloadPage: async () => ({ success: true, data: [] }),
    }),
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const dialog = within(page.getByRole("dialog", { name: "搜索与替换" }));
    await userEvent.click(dialog.getByRole("button", { name: "搜索" }));
    const summary = await dialog.findByText("已选 100 · 上限 100");
    await waitFor(async () => {
      await expect(summary).toBeVisible();
    });
  },
};

export const Empty: Story = {
  args: {
    coordinator: makeCoordinator({
      // eslint-disable-next-line @typescript-eslint/require-await
      search: async () => ({ success: true, data: [] }),
      // eslint-disable-next-line @typescript-eslint/require-await
      transform: async () => ({ success: true, data: undefined }),
      // eslint-disable-next-line @typescript-eslint/require-await
      reloadPage: async () => ({ success: true, data: [] }),
    }),
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const dialog = within(page.getByRole("dialog", { name: "搜索与替换" }));
    await userEvent.click(dialog.getByRole("button", { name: "搜索" }));
    const message = await dialog.findByText("没有找到匹配内容");
    await waitFor(async () => {
      await expect(message).toBeVisible();
    });
  },
};

export const SearchError: Story = {
  args: {
    coordinator: makeCoordinator({
      // eslint-disable-next-line @typescript-eslint/require-await
      search: async () => ({ success: false, error: "搜索失败，请稍后重试" }),
      // eslint-disable-next-line @typescript-eslint/require-await
      transform: async () => ({ success: true, data: undefined }),
      // eslint-disable-next-line @typescript-eslint/require-await
      reloadPage: async () => ({ success: true, data: [] }),
    }),
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const dialog = within(page.getByRole("dialog", { name: "搜索与替换" }));
    await userEvent.click(dialog.getByRole("button", { name: "搜索" }));
    const message = await dialog.findByText("搜索失败，请稍后重试");
    await waitFor(async () => {
      await expect(message).toBeVisible();
    });
  },
};

const blockedSearch = fn(() => Promise.resolve({ success: true as const, data: groupedMatches }));
export const SaveFailureBlocksSearch: Story = {
  args: {
    coordinator: createEditorSearchCoordinator({
      dataSource: {
        search: blockedSearch,
        transform: fn(() => Promise.resolve({ success: true as const, data: undefined })),
        reloadPage: fn(() => Promise.resolve({ success: true as const, data: [] })),
      },
      part: "translatedText",
      currentPageId: "page-1",
      flush: () => Promise.reject(new Error("保存中断")),
      runExclusive: async (operation) => {
        await operation();
      },
      refreshCurrentPage: fn(() => Promise.resolve()),
      navigate: fn(() => Promise.resolve()),
    }),
  },
  play: async ({ canvasElement }) => {
    blockedSearch.mockClear();
    const page = within(canvasElement.ownerDocument.body);
    const dialogElement = page.getByRole("dialog", { name: "搜索与替换" });
    const dialog = within(dialogElement);
    await waitFor(async () => {
      await expect(dialogElement).toBeVisible();
      await expect(dialog.getByRole("button", { name: "搜索" })).toBeEnabled();
    });
    await userEvent.click(dialog.getByRole("button", { name: "搜索" }));
    await waitFor(async () => {
      await expect(await dialog.findByText("当前页保存失败，未执行搜索")).toBeVisible();
      await expect(dialog.getByRole("button", { name: "替换" })).toBeDisabled();
    });
    await expect(blockedSearch).not.toHaveBeenCalled();
    await expect(dialog.getByRole("button", { name: "替换" })).toBeDisabled();
  },
};

const completedTransform = fn(() => Promise.resolve({ success: true as const, data: undefined }));
export const CompletedWithRefreshFailure: Story = {
  args: {
    coordinator: createEditorSearchCoordinator({
      dataSource: {
        search: fn(() => Promise.resolve({ success: true as const, data: groupedMatches })),
        transform: completedTransform,
        reloadPage: fn(() => Promise.resolve({ success: true as const, data: [] })),
      },
      part: "translatedText",
      currentPageId: "page-1",
      flush: fn(() => Promise.resolve()),
      runExclusive: async (operation) => {
        await operation();
      },
      refreshCurrentPage: () => Promise.reject(new Error("页面刷新中断")),
      navigate: fn(() => Promise.resolve()),
    }),
  },
  play: async ({ canvasElement }) => {
    completedTransform.mockClear();
    const page = within(canvasElement.ownerDocument.body);
    const dialogElement = page.getByRole("dialog", { name: "搜索与替换" });
    const dialog = within(dialogElement);
    await waitFor(async () => {
      await expect(dialogElement).toBeVisible();
      await expect(dialog.getByRole("button", { name: "搜索" })).toBeEnabled();
    });
    await userEvent.type(dialog.getByRole("textbox", { name: "查找短语" }), "旧词");
    await userEvent.click(dialog.getByRole("button", { name: "搜索" }));
    await waitFor(async () => {
      await expect(await dialog.findByText("8 个匹配 Unit")).toBeVisible();
      await expect(dialog.getByRole("textbox", { name: "替换短语" })).toBeEnabled();
    });
    await userEvent.type(dialog.getByRole("textbox", { name: "替换短语" }), "新词");
    await waitFor(async () => {
      await expect(dialog.getByRole("button", { name: "替换" })).toBeEnabled();
    });
    await userEvent.click(dialog.getByRole("button", { name: "替换" }));
    await waitFor(async () => {
      await expect(
        await dialog.findByText("替换已完成，但刷新失败。请重新搜索以恢复最新结果。"),
      ).toBeVisible();
      await expect(dialog.getByRole("button", { name: "替换" })).toBeDisabled();
      await expect(dialog.getByRole("button", { name: "搜索" })).toBeEnabled();
    });
    await userEvent.click(dialog.getByRole("button", { name: "搜索" }));
    await waitFor(async () => {
      await expect(await dialog.findByText("8 个匹配 Unit")).toBeVisible();
      await expect(dialog.getByRole("textbox", { name: "替换短语" })).toBeEnabled();
    });
    await expect(completedTransform).toHaveBeenCalledOnce();
  },
};
