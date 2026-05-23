import type { Meta, StoryObj } from "@storybook/react-vite";
import ComicProgressItem from "@/features/ComicProgressList/components/ComicProgressItem";
import type { ComicInfo } from "@/types/comic";
import type { ChapterInfo } from "@/types/chapter";
import type { AssignmentInfo } from "@/types/assignment";
import type { Result } from "@/types/utils/result";
import type { ViewMode } from "@/features/ComicCard/types/types";

const now = Date.now();

// ── Mock Data ──────────────────────────────────────

const baseComic: ComicInfo = {
  id: "comic-1",
  worksetId: "ws-1",
  index: 0,
  title: "呪術廻戦",
  author: "芥見下々",
  description: "测试漫画",
  coverUrl: "",
  isCoverUploaded: false,
  chapterCount: 28,
  creatorId: "user-0",
  lastActiveAt: now - 1000 * 60 * 30,
  createdAt: now,
  updatedAt: now,
};

function makePinnedChapter(props?: Partial<ChapterInfo>): ChapterInfo {
  return {
    id: "chapter-1",
    comicId: "comic-1",
    index: 27,
    subtitle: "第27话",
    isPinned: true,
    pageCount: 22,
    totalUnitCount: 140,
    translatedUnitCount: 100,
    proofreadUnitCount: 80,
    uploadedAt: now - 1000 * 60 * 60 * 48,
    translatingAt: now - 1000 * 60 * 60 * 24,
    translatedAt: undefined,
    typesettingAt: undefined,
    typesetAt: undefined,
    proofreadingAt: undefined,
    proofreadAt: undefined,
    reviewedAt: undefined,
    publishedAt: undefined,
    creatorId: "user-0",
    createdAt: now - 1000 * 60 * 60 * 72,
    updatedAt: now,
    ...props,
  };
}

function makeTranslatorAssignment(userId: string, userName: string) {
  return {
    id: `a-${userId}`,
    chapterId: "chapter-1",
    userId,
    user: {
      id: userId,
      name: userName,
      qq: "",
      avatarUrl: "",
      isAvatarUploaded: false,
      isSuperAdmin: false,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    },
    assignedTranslatorAt: now - 1000 * 60 * 60 * 12,
    createdAt: now,
    updatedAt: now,
  } as AssignmentInfo;
}

function makeProofreaderAssignment(userId: string, userName: string) {
  return {
    id: `a-${userId}`,
    chapterId: "chapter-1",
    userId,
    user: {
      id: userId,
      name: userName,
      qq: "",
      avatarUrl: "",
      isAvatarUploaded: false,
      isSuperAdmin: false,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    },
    assignedProofreaderAt: now - 1000 * 60 * 60 * 6,
    createdAt: now,
    updatedAt: now,
  } as AssignmentInfo;
}

function makeTypesetterAssignment(userId: string, userName: string) {
  return {
    id: `a-${userId}`,
    chapterId: "chapter-1",
    userId,
    user: {
      id: userId,
      name: userName,
      qq: "",
      avatarUrl: "",
      isAvatarUploaded: false,
      isSuperAdmin: false,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    },
    assignedTypesetterAt: now - 1000 * 60 * 60 * 3,
    createdAt: now,
    updatedAt: now,
  } as AssignmentInfo;
}

function makeAssignments(extras?: AssignmentInfo[]): AssignmentInfo[] {
  const base = [
    makeTranslatorAssignment("user-t1", "李翻译"),
    makeProofreaderAssignment("user-p1", "王校对"),
  ];
  return extras ? [...base, ...extras] : base;
}

// ── Helper: build a story-ready wrapper ────────────

function createStoryComponent(
  comic: ComicInfo,
  chapterResult: Result<ChapterInfo | null>,
  assignmentResult: Result<AssignmentInfo[]>,
) {
  return () => (
    <div className="w-[720px] max-w-full">
      <ComicProgressItem
        comicInfo={comic}
        mode="translator"
        onLoadPinnedChapter={async () => chapterResult}
        onLoadAssignments={async () => assignmentResult}
        onClick={() => console.log("clicked:", comic.title)}
      />
    </div>
  );
}

// ── Meta ────────────────────────────────────────────

const meta: Meta<typeof ComicProgressItem> = {
  title: "Features/ComicProgressList/ComicProgressItem",
  component: ComicProgressItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ComicProgressItem>;

// ── Stories ─────────────────────────────────────────

export const Default: Story = {
  name: "进行中（有顶置章节+翻译+校对）",
  render: createStoryComponent(
    baseComic,
    { success: true, data: makePinnedChapter() },
    { success: true, data: makeAssignments() },
  ),
};

export const ActiveWithin3Months: Story = {
  name: "3个月内活跃（绿色指示点）",
  render: createStoryComponent(
    {
      ...baseComic,
      index: 6,
      title: "チェンソーマン",
      lastActiveAt: now - 1000 * 60 * 60 * 24 * 10,
    },
    { success: true, data: makePinnedChapter() },
    { success: true, data: makeAssignments() },
  ),
};

export const ActiveWithin6Months: Story = {
  name: "6个月内活跃（黄色指示点）",
  render: createStoryComponent(
    {
      ...baseComic,
      index: 7,
      title: "鬼滅の刃",
      lastActiveAt: now - 1000 * 60 * 60 * 24 * 120,
    },
    {
      success: true,
      data: makePinnedChapter({ uploadedAt: now - 1000 * 60 * 60 * 24 * 30 }),
    },
    { success: true, data: makeAssignments() },
  ),
};

export const InactiveOver6Months: Story = {
  name: "超过6个月未活跃（灰色指示点）",
  render: createStoryComponent(
    {
      ...baseComic,
      index: 8,
      title: "HUNTER×HUNTER",
      lastActiveAt: now - 1000 * 60 * 60 * 24 * 200,
    },
    { success: true, data: null },
    { success: true, data: [] },
  ),
};

export const Published: Story = {
  name: "已发布（全流程完成）",
  render: createStoryComponent(
    { ...baseComic, index: 1, title: "ONE PIECE" },
    {
      success: true,
      data: makePinnedChapter({ publishedAt: now - 1000 * 60 * 60 }),
    },
    { success: true, data: makeAssignments() },
  ),
};

export const NoChapter: Story = {
  name: "无顶置章节（全灰 pending）",
  render: createStoryComponent(
    {
      ...baseComic,
      index: 2,
      title: "進撃の巨人",
      lastActiveAt: now - 1000 * 60 * 60 * 24 * 7,
    },
    { success: true, data: null },
    { success: true, data: [] },
  ),
};

export const AllRolesFilled: Story = {
  name: "所有流程岗位已分配",
  render: createStoryComponent(
    { ...baseComic, index: 3, title: "SPY×FAMILY" },
    {
      success: true,
      data: makePinnedChapter({
        translatedAt: now - 1000 * 60 * 60 * 12,
        proofreadAt: now - 1000 * 60 * 60 * 8,
        typesetAt: now - 1000 * 60 * 60 * 4,
      }),
    },
    {
      success: true,
      data: [
        makeTranslatorAssignment("user-t1", "李翻译"),
        makeProofreaderAssignment("user-p1", "王校对"),
        makeTypesetterAssignment("user-ts1", "赵嵌字"),
        {
          id: "a-user-r1",
          chapterId: "chapter-1",
          userId: "user-r1",
          user: {
            id: "user-r1",
            name: "孙质检",
            qq: "",
            avatarUrl: "",
            isAvatarUploaded: false,
            isSuperAdmin: false,
            lastActiveAt: now,
            createdAt: now,
            updatedAt: now,
          },
          assignedReviewerAt: now - 1000 * 60 * 60 * 2,
          createdAt: now,
          updatedAt: now,
        } as AssignmentInfo,
        {
          id: "a-user-pub1",
          chapterId: "chapter-1",
          userId: "user-pub1",
          user: {
            id: "user-pub1",
            name: "周发布",
            qq: "",
            avatarUrl: "",
            isAvatarUploaded: false,
            isSuperAdmin: false,
            lastActiveAt: now,
            createdAt: now,
            updatedAt: now,
          },
          assignedPublisherAt: now - 1000 * 60 * 60 * 1,
          createdAt: now,
          updatedAt: now,
        } as AssignmentInfo,
        {
          id: "a-user-rp1",
          chapterId: "chapter-1",
          userId: "user-rp1",
          user: {
            id: "user-rp1",
            name: "吴修图",
            qq: "",
            avatarUrl: "",
            isAvatarUploaded: false,
            isSuperAdmin: false,
            lastActiveAt: now,
            createdAt: now,
            updatedAt: now,
          },
          assignedRawProviderAt: now - 1000 * 60 * 60 * 72,
          createdAt: now,
          updatedAt: now,
        } as AssignmentInfo,
      ],
    },
  ),
};

export const NoAssignments: Story = {
  name: "无人分配（空徽章）",
  render: createStoryComponent(
    {
      ...baseComic,
      index: 4,
      title: "ドラゴンボール",
      lastActiveAt: now - 1000 * 60 * 60 * 24 * 3,
    },
    {
      success: true,
      data: makePinnedChapter({
        uploadedAt: now - 1000 * 60 * 60 * 24 * 2,
        translatingAt: now - 1000 * 60 * 60 * 12,
      }),
    },
    { success: true, data: [] },
  ),
};

export const LoadError: Story = {
  name: "加载失败（静默降级）",
  render: createStoryComponent(
    { ...baseComic, index: 5, title: "NARUTO" },
    { success: false, error: "Network error" },
    { success: false, error: "Network error" },
  ),
};

// ── Hover tooltip 测试 ────────────────────────────

const longNameMembers: AssignmentInfo[] = [
  makeTranslatorAssignment("user-t1", "超级长的翻译昵称测试用户"),
  makeTranslatorAssignment("user-t2", "李翻译二号机"),
  makeTranslatorAssignment("user-t3", "第三位翻译菌"),
  makeProofreaderAssignment("user-p1", "校对A"),
  makeProofreaderAssignment("user-p2", "校对B"),
];

export const HoverTooltip: Story = {
  name: "hover 分工浮层（多个成员，长短昵称）",
  render: createStoryComponent(
    { ...baseComic, index: 9, title: "ぼっち・ざ・ろっく！" },
    {
      success: true,
      data: makePinnedChapter({ translatingAt: now - 1000 * 60 * 60 * 12 }),
    },
    { success: true, data: longNameMembers },
  ),
};

export const HoverTooltipSingle: Story = {
  name: "hover 分工浮层（单个成员）",
  render: createStoryComponent(
    { ...baseComic, index: 10, title: "葬送のフリーレン" },
    {
      success: true,
      data: makePinnedChapter({ translatingAt: now - 1000 * 60 * 60 * 24 }),
    },
    {
      success: true,
      data: [makeTranslatorAssignment("user-sole", "唯一翻译者")],
    },
  ),
};
