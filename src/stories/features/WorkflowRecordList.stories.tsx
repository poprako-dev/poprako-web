import { useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor, within } from "storybook/test";
import WorkflowRecordList from
  "@/features/ComicPlayground/features/ComicDetailModal/components/business/WorkflowRecordList";
import type {
  WorkflowRecordState,
} from "@/features/ComicPlayground/features/ComicDetailModal/hook/useComicDetailWorkflowRecords";
import {
  shortWorkflowRecordUserId,
} from "@/features/ComicPlayground/features/ComicDetailModal/workflowRecord";
import type {
  ChapterWorkflowRecord,
  ChapterWorkflowRecordEvent,
} from "@/types/chapterWorkflowRecord";
import { roleMask } from "@/types/role";

const CHAPTER_ID = "chapter_story";
const NOW = new Date(2026, 7, 19, 10, 30).getTime();
const LONG_SUBTITLE =
  "在黎明到来之前所有未被说出口的约定与漫长告别都会再次相遇";

const USER_NAMES: Record<string, string> = {
  actor_admin: "Mori",
  actor_translator: "Aki",
  actor_long: "Bartholomew Thaddeus McAllister IV",
  subject_aki: "Aki",
  subject_former: "已退出成员",
};

function getUserLabel(userId: string): string {
  return USER_NAMES[userId] ?? shortWorkflowRecordUserId(userId);
}

function makeRecord(
  id: string,
  event: ChapterWorkflowRecordEvent,
  options: {
    actorUserId?: string | null;
    createdAt?: number;
  } = {},
): ChapterWorkflowRecord {
  return {
    id,
    chapterId: CHAPTER_ID,
    actorUserId: options.actorUserId === undefined
      ? "actor_admin"
      : options.actorUserId,
    event,
    createdAt: options.createdAt ?? NOW,
  };
}

function makeState(
  overrides: Partial<WorkflowRecordState> = {},
): WorkflowRecordState {
  return {
    records: [],
    hasMore: false,
    loadedOnce: true,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    loadMoreError: null,
    ...overrides,
  };
}

const ALL_EVENT_RECORDS: ChapterWorkflowRecord[] = [
  makeRecord("record_10", {
    kind: "stage_transitioned",
    data: {
      stage: "translate",
      previousPhase: "active",
      nextPhase: "completed",
      origin: "translation_import",
    },
  }, { actorUserId: "actor_translator", createdAt: NOW }),
  makeRecord("record_9", {
    kind: "translation_exported",
    data: { format: "label_plus" },
  }, { actorUserId: "actor_translator", createdAt: NOW - 15 * 60_000 }),
  makeRecord("record_8", {
    kind: "translation_imported",
    data: {
      format: "poprako",
      importedPageCount: 32,
      importedUnitCount: 120,
    },
  }, { actorUserId: "actor_translator", createdAt: NOW - 30 * 60_000 }),
  makeRecord("record_7", {
    kind: "assignment_deleted",
    data: {
      subjectUserId: "subject_former",
      previousRoles: roleMask(["proofreader"]),
    },
  }, { createdAt: NOW - 45 * 60_000 }),
  makeRecord("record_6", {
    kind: "assignment_roles_updated",
    data: {
      subjectUserId: "subject_aki",
      previousRoles: roleMask(["translator"]),
      nextRoles: roleMask(["translator", "proofreader"]),
    },
  }, { createdAt: NOW - 60 * 60_000 }),
  makeRecord("record_5", {
    kind: "assignment_created",
    data: {
      subjectUserId: "subject_aki",
      roles: roleMask(["translator"]),
    },
  }, { createdAt: NOW - 75 * 60_000 }),
  makeRecord(
    "record_4",
    { kind: "chapter_unpinned" },
    { createdAt: NOW - 90 * 60_000 },
  ),
  makeRecord(
    "record_3",
    { kind: "chapter_pinned" },
    { createdAt: NOW - 105 * 60_000 },
  ),
  makeRecord("record_2", {
    kind: "chapter_subtitle_updated",
    data: { previousSubtitle: "", nextSubtitle: "深渊回响" },
  }, { createdAt: NOW - 120 * 60_000 }),
  makeRecord(
    "record_1",
    { kind: "chapter_created" },
    { actorUserId: null, createdAt: NOW - 135 * 60_000 },
  ),
];

const EDGE_RECORDS: ChapterWorkflowRecord[] = [
  makeRecord("edge_long_subtitle", {
    kind: "chapter_subtitle_updated",
    data: {
      previousSubtitle: "无声序章",
      nextSubtitle: LONG_SUBTITLE,
    },
  }, { actorUserId: "actor_long" }),
  makeRecord("edge_all_roles", {
    kind: "assignment_created",
    data: {
      subjectUserId: "subject_aki",
      roles: roleMask([
        "rawProvider",
        "translator",
        "proofreader",
        "typesetter",
        "redrawer",
        "reviewer",
        "publisher",
        "admin",
      ]),
    },
  }, { createdAt: NOW - 20 * 60_000 }),
  makeRecord("edge_manual", {
    kind: "stage_transitioned",
    data: {
      stage: "typeset_redraw",
      previousPhase: "pending",
      nextPhase: "active",
      origin: "manual",
    },
  }, { createdAt: NOW - 40 * 60_000 }),
  makeRecord("edge_raw_check", {
    kind: "stage_transitioned",
    data: {
      stage: "raw_provide",
      previousPhase: "active",
      nextPhase: "completed",
      origin: "raw_provide_check",
    },
  }, { createdAt: NOW - 60 * 60_000 }),
  makeRecord(
    "edge_fallback",
    { kind: "chapter_pinned" },
    {
      actorUserId: "user_workflow_1234567890abcdef",
      createdAt: NOW - 80 * 60_000,
    },
  ),
  makeRecord(
    "edge_system",
    { kind: "chapter_created" },
    {
      actorUserId: null,
      createdAt: new Date(2025, 11, 3, 21, 7).getTime(),
    },
  ),
];

function makePaginationRecords(
  prefix: string,
  count: number,
  startMinute: number,
): ChapterWorkflowRecord[] {
  return Array.from({ length: count }, (_, index) => makeRecord(
    `${prefix}_${index + 1}`,
    {
      kind: "chapter_subtitle_updated",
      data: {
        previousSubtitle: index === 0 ? "" : `${prefix} ${index}`,
        nextSubtitle: `${prefix} ${index + 1}`,
      },
    },
    { createdAt: NOW - (startMinute + index) * 60_000 },
  ));
}

const FIRST_PAGE = makePaginationRecords("最新记录", 16, 0);
const SECOND_PAGE = makePaginationRecords("更早记录", 8, 30);
const paginationLoadMore = fn();

const meta: Meta<typeof WorkflowRecordList> = {
  title: "Features/WorkflowRecordList",
  component: WorkflowRecordList,
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-stone-100 p-4">
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
  name: "全部 10 种事件",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const items = await canvas.findAllByRole("listitem");
    expect(items).toHaveLength(10);
    for (const item of items) {
      expect(item.querySelectorAll("p")).toHaveLength(1);
    }
    expect(canvas.getByText("创建了章节")).toBeInTheDocument();
    expect(canvas.getByText("翻校数据导出")).toBeInTheDocument();
    expect(canvas.getByText("翻校数据导入")).toBeInTheDocument();
    expect(canvasElement.querySelectorAll("[data-workflow-variable]").length)
      .toBeGreaterThan(10);
  },
};

export const FormattingEdges: Story = {
  name: "格式边界与长内容",
  args: {
    state: makeState({ records: EDGE_RECORDS }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(await canvas.findByText("系统")).toBeInTheDocument();
    expect(canvas.getByText("user_w…cdef")).toBeInTheDocument();
    expect(canvas.getByText("2025年12月03日 21:07")).toBeInTheDocument();
    expect(canvas.getByText(LONG_SUBTITLE, { exact: false }))
      .toBeInTheDocument();
    expect(canvas.getByText("嵌字")).toBeInTheDocument();
    expect(canvas.getByText("已开始")).toBeInTheDocument();
    expect(canvas.getByText("手动推进")).toBeInTheDocument();
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
    expect(await canvas.findByRole("status", {
      name: "正在加载活动记录",
    })).toBeInTheDocument();
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
    expect(await canvas.findByText("活动记录加载失败")).toBeInTheDocument();
    expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};

export const RefreshErrorWithRecords: Story = {
  name: "刷新失败但保留记录",
  args: {
    state: makeState({ records: ALL_EVENT_RECORDS, error: "刷新失败" }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(await canvas.findByText("最新记录刷新失败")).toBeInTheDocument();
    expect(canvas.queryByRole("button")).not.toBeInTheDocument();
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
    expect(await canvas.findByRole("status", {
      name: "正在加载更早记录",
    })).toBeInTheDocument();
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
    expect(await canvas.findByText("更早记录加载失败")).toBeInTheDocument();
    expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};

function InteractivePaginationDemo() {
  const [state, setState] = useState<WorkflowRecordState>(() => makeState({
    records: FIRST_PAGE,
    hasMore: true,
  }));
  const loadingRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleLoadMore = () => {
    paginationLoadMore();
    if (loadingRef.current) return;
    loadingRef.current = true;
    setState((current) => ({ ...current, isLoadingMore: true }));
    timeoutRef.current = window.setTimeout(() => {
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
    expect(scrollContainer).not.toBeNull();
    scrollContainer!.scrollTop = scrollContainer!.scrollHeight;
    scrollContainer!.dispatchEvent(new Event("scroll"));

    expect(await canvas.findByRole("status", {
      name: "正在加载更早记录",
    })).toBeInTheDocument();
    await waitFor(() => {
      expect(canvas.getByText(/修改为“更早记录 1”/)).toBeInTheDocument();
    });
    expect(paginationLoadMore).toHaveBeenCalledOnce();
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
