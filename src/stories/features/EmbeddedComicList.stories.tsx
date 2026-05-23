import type { Meta, StoryObj } from "@storybook/react-vite";
import ComicTranslationList from "../../features/ComcList/components/business/EmbeddedComicList";
import type { ComicInfo } from "@/types/comic";
import type { ChapterInfo } from "@/types/chapter";
import type { AssignmentInfo } from "@/types/assignment";

const meta: Meta<typeof ComicTranslationList> = {
  title: "features/EmbeddedComicList",
  component: ComicTranslationList,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ComicTranslationList>;

const now = Date.now();

function makeMockComic(idx: number): ComicInfo {
  return {
    id: `comic-${idx}`,
    worksetId: `workset-0`,
    title: `测试漫画 ${idx + 1}`,
    author: `作者 ${idx + 1}`,
    description: "这是一部测试用的漫画",
    index: idx,
    chapterCount: 10 + idx,
    creatorId: "user-0",
    coverUrl: "",
    isCoverUploaded: false,
    lastActiveAt: now - 1000 * 60 * 60 * idx,
    createdAt: now,
    updatedAt: now,
  };
}

function makeMockChapter(comicIdx: number): ChapterInfo {
  return {
    id: `chapter-${comicIdx}`,
    comicId: `comic-${comicIdx}`,
    index: comicIdx + 1,
    subtitle: `第${comicIdx + 1}话`,
    isPinned: false,
    pageCount: 18 + comicIdx,
    totalUnitCount: 120 + comicIdx * 10,
    translatedUnitCount: 60 + comicIdx * 5,
    proofreadUnitCount: 30 + comicIdx * 2,
    uploadedAt: now - 1000 * 60 * 60 * 24 * 3,
    translatingAt: now - 1000 * 60 * 60 * 12,
    creatorId: "user-0",
    createdAt: now,
    updatedAt: now,
  };
}

const mockAssignments: AssignmentInfo[] = [
  {
    id: "a-1",
    chapterId: "chapter-0",
    userId: "translator-1",
    user: {
      id: "translator-1",
      name: "李翻译",
      qq: "",
      avatarUrl: "",
      isAvatarUploaded: false,
      isSuperAdmin: false,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    },
    assignedTranslatorAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "a-2",
    chapterId: "chapter-0",
    userId: "proofreader-1",
    user: {
      id: "proofreader-1",
      name: "王校对",
      qq: "",
      avatarUrl: "",
      isAvatarUploaded: false,
      isSuperAdmin: false,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    },
    assignedProofreaderAt: now,
    createdAt: now,
    updatedAt: now,
  },
];

const FULL_COMICS = Array.from({ length: 20 }, (_, i) => makeMockComic(i));

// 模拟分页：每次返回一页
function makePagedLoader(allComics: ComicInfo[], delay = 800) {
  return async (
    offset: number,
    limit: number,
  ): Promise<ComicInfo[] | string> => {
    await new Promise((r) => setTimeout(r, delay));
    return allComics.slice(offset, offset + limit);
  };
}

// ── Stories ──────────────────────────────────────────────────────────────
export const TranslatorMode: Story = {
  args: {
    mode: "translator",
    onLoadComics: makePagedLoader(FULL_COMICS),
    onLoadLatestChapter: async (comic: ComicInfo) => {
      await new Promise((r) => setTimeout(r, 300));
      return {
        success: true as const,
        data: makeMockChapter(Number(comic.id.replace("comic-", ""))),
      };
    },
    onLoadAssignments: async (_comic: ComicInfo) => {
      await new Promise((r) => setTimeout(r, 200));
      return { success: true as const, data: mockAssignments };
    },
  },
};

export const ReviewerMode: Story = {
  args: {
    mode: "reviewer",
    onLoadComics: makePagedLoader(FULL_COMICS),
    onLoadLatestChapter: async (comic: ComicInfo) => {
      await new Promise((r) => setTimeout(r, 300));
      return {
        success: true as const,
        data: makeMockChapter(Number(comic.id.replace("comic-", ""))),
      };
    },
    onLoadAssignments: async (_comic: ComicInfo) => {
      await new Promise((r) => setTimeout(r, 200));
      return { success: true as const, data: mockAssignments };
    },
  },
};

export const EmptyState: Story = {
  args: {
    mode: "translator",
    onLoadComics: async (_offset: number, _limit: number) => {
      await new Promise((r) => setTimeout(r, 600));
      return [];
    },
    onLoadLatestChapter: async () => ({ success: true as const, data: null }),
    onLoadAssignments: async (): Promise<{
      success: true;
      data: AssignmentInfo[];
    }> => ({ success: true as const, data: [] }),
  },
};

export const ErrorState: Story = {
  args: {
    mode: "translator",
    onLoadComics: async (_offset: number, _limit: number) => {
      await new Promise((r) => setTimeout(r, 600));
      return "服务器错误，请稍后重试";
    },
    onLoadLatestChapter: async () => ({ success: true as const, data: null }),
  },
};

export const SmallDataSet: Story = {
  name: "小数据集（3条）",
  args: {
    mode: "translator",
    onLoadComics: makePagedLoader(FULL_COMICS.slice(0, 3), 400),
    onLoadLatestChapter: async (comic: ComicInfo) => {
      await new Promise((r) => setTimeout(r, 200));
      return {
        success: true as const,
        data: makeMockChapter(Number(comic.id.replace("comic-", ""))),
      };
    },
    onLoadAssignments: async (): Promise<{
      success: true;
      data: AssignmentInfo[];
    }> => ({ success: true as const, data: [] }),
  },
};
