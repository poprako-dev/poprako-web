import type { Meta, StoryObj } from "@storybook/react-vite";
import ComicDetailModal from "@/features/ComicPlayground/features/ComicDetailModal/components/business/ComicDetailModal";
import type { ComicInfo } from "@/types/comic";
import type { ChapterInfo } from "@/types/chapter";
import type { PageInfo } from "@/types/page";
import type { AssignmentInfo } from "@/types/assignment";
import type { UserInfo } from "@/types/user";

const now = Date.now();

// ── Mock Builders ─────────────────────────────────

function makeUser(id: string, name: string): UserInfo {
  return {
    id,
    name,
    qq: "",
    avatarUrl: "",
    isAvatarUploaded: false,
    isSuperAdmin: false,
    createdAt: now,
    updatedAt: now,
  };
}

const mockComic: ComicInfo = {
  id: "comic-1",
  worksetId: "ws-1",
  title: "咒术回战",
  author: "芥见下下",
  description: "全球风靡的奇幻热血漫画",
  index: 0,
  chapterCount: 15,
  creatorId: "user-0",
  coverUrl: "",
  isCoverUploaded: false,
  lastActiveAt: now - 1000 * 60 * 60 * 2,
  createdAt: now,
  updatedAt: now,
};

function makeChapter(
  idx: number,
  extraFlags?: Partial<ChapterInfo>,
): ChapterInfo {
  return {
    id: `chapter-${idx}`,
    comicId: "comic-1",
    index: idx,
    subtitle: idx === 12 ? "宿命对决" : idx === 13 ? "深渊回响" : "",
    isPinned: idx === 12,
    pageCount: 22 + idx,
    totalUnitCount: 140 + idx * 8,
    translatedUnitCount: 60 + idx * 4,
    proofreadUnitCount: 30 + idx * 2,
    uploadedAt: now - 1000 * 60 * 60 * 24,
    translatingAt: now - 1000 * 60 * 60,
    creatorId: "user-0",
    createdAt: now,
    updatedAt: now,
    ...extraFlags,
  };
}

const MOCK_CHAPTERS: ChapterInfo[] = [12, 13, 14, 15].map((i) =>
  makeChapter(i),
);

const pinnedChapter = makeChapter(12, { isPinned: true });

function makePages(chapterId: string, count: number): PageInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `page-${chapterId}-${i + 1}`,
    chapterId,
    index: i + 1,
    imageUrl: "",
    isUploaded: i < count - 3,
    totalUnitCount: 10 + (i % 4),
    translatedUnitCount: i % 3 === 0 ? 10 + (i % 4) : i % 2,
    proofreadUnitCount: i % 5 === 0 ? 10 + (i % 4) : 0,
    creatorId: "user-0",
    createdAt: now,
    updatedAt: now,
  }));
}

function makeAssignments(chapterId: string): AssignmentInfo[] {
  return [
    {
      id: "a1",
      chapterId,
      userId: "u-kira",
      user: makeUser("u-kira", "Kira"),
      assignedRawProviderAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a2",
      chapterId,
      userId: "u-mio",
      user: makeUser("u-mio", "Mio"),
      assignedRawProviderAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a3",
      chapterId,
      userId: "u-aki",
      user: makeUser("u-aki", "Aki"),
      assignedTranslatorAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a4",
      chapterId,
      userId: "u-sora",
      user: makeUser("u-sora", "Sora"),
      assignedTranslatorAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a5",
      chapterId,
      userId: "u-lin",
      user: makeUser("u-lin", "Lin"),
      assignedProofreaderAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a6",
      chapterId,
      userId: "u-baka",
      user: makeUser("u-baka", "Baka"),
      assignedTypesetterAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a7",
      chapterId,
      userId: "u-yuki",
      user: makeUser("u-yuki", "Yuki"),
      assignedTypesetterAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a8",
      chapterId,
      userId: "u-kira2",
      user: makeUser("u-kira2", "Kira"),
      assignedReviewerAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a9",
      chapterId,
      userId: "u-sys",
      user: makeUser("u-sys", "System"),
      assignedPublisherAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// Simulate async page delay
function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

const meta: Meta<typeof ComicDetailModal> = {
  title: "Features/ComicDetailModal",
  component: ComicDetailModal,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-slate-100/60 flex items-center justify-center p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ComicDetailModal>;

export const Default: Story = {
  name: "默认（有置顶章节）",
  args: {
    comicInfo: mockComic,
    pinnedChapter,
    onLoadChapters: async (args) => {
      await delay(200);
      const sliced = MOCK_CHAPTERS.slice(args.offset, args.offset + args.limit);
      return { success: true, data: sliced };
    },
    onLoadAssignments: async (chapterId) => {
      await delay(150);
      return { success: true, data: makeAssignments(chapterId) };
    },
    onLoadPages: async (chapterId) => {
      await delay(200);
      return { success: true, data: makePages(chapterId, 10) };
    },
    onTransiteWorkflow: async (_chapterId, transition) => {
      await delay(300);
      console.log("workflow transition:", transition);
      return { success: true, data: undefined };
    },
    onRemoveAssignment: async (_chapterId, userId) => {
      await delay(200);
      console.log("remove assignment:", userId);
      return { success: true, data: undefined };
    },
    onClose: () => console.log("closed"),
  },
};

export const NoPinnedChapter: Story = {
  name: "无置顶章节",
  args: {
    ...Default.args,
    pinnedChapter: null,
  },
};

export const EmptyPages: Story = {
  name: "无页面数据",
  args: {
    ...Default.args,
    onLoadPages: async () => {
      await delay(100);
      return { success: true, data: [] };
    },
  },
};

export const AllCompleted: Story = {
  name: "全部工作流完成",
  args: {
    ...Default.args,
    onLoadChapters: async (args) => {
      await delay(200);
      const completedChapters = MOCK_CHAPTERS.map((ch) => ({
        ...ch,
        uploadedAt: now,
        translatedAt: now,
        proofreadAt: now,
        typesetAt: now,
        reviewedAt: now,
        publishedAt: now,
      })).slice(args.offset, args.offset + args.limit);
      return { success: true, data: completedChapters };
    },
  },
};

export const LoadError: Story = {
  name: "加载失败",
  args: {
    ...Default.args,
    onLoadChapters: async () => {
      await delay(300);
      return { success: false, error: "网络连接失败" };
    },
  },
};
