import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor, within } from "storybook/test";
import { WorkflowRecordList } from "@/route/_authenticated/_shell/business/comic-detail/WorkflowRecordList";
import type { WorkflowRecordState } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-workflow-records";
import {
  ALL_EVENT_RECORDS,
  CHAPTER_ID,
  EDGE_RECORDS,
  FIRST_PAGE,
  getUserLabel,
  LONG_SUBTITLE,
  makeState,
  paginationLoadMore,
  SECOND_PAGE,
} from "./test/workflow-record-list-story-fixtures.ts";

const meta: Meta<typeof WorkflowRecordList> = {
  title: "Features/WorkflowRecordList",
  component: WorkflowRecordList,
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-surface-stone-100 p-4">
        <div className="mx-auto h-[min(640px,calc(100vh-32px))] w-full max-w-240">
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    chapterId: CHAPTER_ID,
    state: makeState({ records: ALL_EVENT_RECORDS }),
    getUserLabel,
    onLoadMore: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof WorkflowRecordList>;

export const AllEvents: Story = {
  name: "全部 11 种事件与来源",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const items = await canvas.findAllByRole("listitem");
    await expect(items).toHaveLength(12);
    for (const item of items) {
      await expect(item.querySelectorAll("p")).toHaveLength(1);
    }
    await expect(canvas.getByText(/创建了章节/)).toBeInTheDocument();
    await expect(canvas.getAllByText(/翻校数据导出/).length).toBeGreaterThan(0);
    await expect(canvas.getAllByText(/翻校数据导入/).length).toBeGreaterThan(0);
    await expect(canvas.getByText(/嵌稿上传推进/)).toBeInTheDocument();
    await expect(canvas.getByText(/嵌稿导出/)).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll("[data-workflow-variable]").length).toBeGreaterThan(
      10,
    );
  },
};

export const FormattingEdges: Story = {
  name: "格式边界与长内容",
  args: {
    state: makeState({ records: EDGE_RECORDS }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("系统")).toBeInTheDocument();
    await expect(canvas.getByText("user_w…cdef")).toBeInTheDocument();
    await expect(canvas.getByText(/2025年12月03日 21:07/)).toBeInTheDocument();
    await expect(canvas.getByText(LONG_SUBTITLE, { exact: false })).toBeInTheDocument();
    await expect(canvas.getByText("嵌字")).toBeInTheDocument();
    await expect(canvas.getByText("已开始")).toBeInTheDocument();
    await expect(canvas.getByText("手动推进")).toBeInTheDocument();
  },
};

export const NoChapter: Story = {
  name: "未选择章节",
  args: { chapterId: null },
};

export const InitialLoading: Story = {
  name: "首次加载",
  args: {
    state: makeState({ loadedOnce: false, isLoading: true }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("status", {
        name: "正在加载活动记录",
      }),
    ).toBeInTheDocument();
  },
};

export const Empty: Story = {
  name: "空记录",
  args: { state: makeState() },
};

export const InitialError: Story = {
  name: "首次加载失败",
  args: {
    state: makeState({ error: "网络连接失败" }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("活动记录加载失败")).toBeInTheDocument();
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};

export const RefreshErrorWithRecords: Story = {
  name: "刷新失败但保留记录",
  args: {
    state: makeState({ records: ALL_EVENT_RECORDS, error: "刷新失败" }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("最新记录刷新失败")).toBeInTheDocument();
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};

export const LoadingMore: Story = {
  name: "正在加载更早记录",
  args: {
    state: makeState({
      records: ALL_EVENT_RECORDS,
      hasMore: true,
      isLoadingMore: true,
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("status", {
        name: "正在加载更早记录",
      }),
    ).toBeInTheDocument();
  },
};

export const LoadMoreError: Story = {
  name: "更早记录加载失败",
  args: {
    state: makeState({
      records: ALL_EVENT_RECORDS,
      hasMore: true,
      loadMoreError: "请求超时",
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("更早记录加载失败")).toBeInTheDocument();
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};

function InteractivePaginationDemo(): ReactElement {
  const [state, setState] = useState<WorkflowRecordState>(() =>
    makeState({
      records: FIRST_PAGE,
      hasMore: true,
    }),
  );
  const loadingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const handleLoadMore = (): void => {
    paginationLoadMore();
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    setState((current) => ({ ...current, isLoadingMore: true }));
    timeoutRef.current = setTimeout(() => {
      setState((current) => ({
        ...current,
        records: [...current.records, ...SECOND_PAGE],
        hasMore: false,
        isLoadingMore: false,
      }));
      loadingRef.current = false;
    }, 450);
  };

  return (
    <WorkflowRecordList
      chapterId={CHAPTER_ID}
      state={state}
      getUserLabel={getUserLabel}
      onLoadMore={handleLoadMore}
    />
  );
}

export const InteractivePagination: Story = {
  name: "交互分页",
  render: () => <InteractivePaginationDemo />,
  play: async ({ canvasElement }) => {
    paginationLoadMore.mockClear();
    const canvas = within(canvasElement);
    const list = await canvas.findByRole("list");
    const scrollContainer = list.closest(".overflow-y-auto");
    await expect(scrollContainer).not.toBeNull();
    if (!scrollContainer) {
      return;
    }
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
    scrollContainer.dispatchEvent(new Event("scroll"));

    await expect(
      await canvas.findByRole("status", {
        name: "正在加载更早记录",
      }),
    ).toBeInTheDocument();
    await waitFor(async () => {
      const items = await canvas.findAllByRole("listitem");
      await expect(items.some((item) => item.textContent.includes("更早记录 1"))).toBe(true);
    });
    await expect(paginationLoadMore).toHaveBeenCalledOnce();
  },
};

export const Mobile: Story = {
  name: "移动端长内容",
  args: {
    state: makeState({ records: [...EDGE_RECORDS, ...ALL_EVENT_RECORDS] }),
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
