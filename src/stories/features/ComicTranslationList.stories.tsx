import type { Meta, StoryObj } from "@storybook/react-vite";
import ComicTranslationList from "../../features/ComcList/components/business/ComicTranslationList";
import type { ComicInfo } from "@/types/comic";
import type { ChapterInfo } from "@/types/chapter";

const meta: Meta<typeof ComicTranslationList> = {
  title: "features/ComicTranslationList",
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
    worksetId: "workset-0",
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

const fullComics = Array.from({ length: 20 }, (_, index) => makeMockComic(index));

function makePagedLoader(allComics: ComicInfo[], delay = 800) {
  return async (
    offset: number,
    limit: number,
  ): Promise<ComicInfo[] | string> => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return allComics.slice(offset, offset + limit);
  };
}

export const TranslatorMode: Story = {
  args: {
    onLoadComics: makePagedLoader(fullComics),
    onLoadLatestChapter: async (comic: ComicInfo) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true as const,
        data: makeMockChapter(Number(comic.id.replace("comic-", ""))),
      };
    },
  },
};

export const EmptyState: Story = {
  args: {
    onLoadComics: async (_offset: number, _limit: number) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return [];
    },
    onLoadLatestChapter: async () => ({ success: true as const, data: null }),
  },
};

export const ErrorState: Story = {
  args: {
    onLoadComics: async (_offset: number, _limit: number) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return "服务器错误，请稍后重试";
    },
    onLoadLatestChapter: async () => ({ success: true as const, data: null }),
  },
};

export const SmallDataSet: Story = {
  name: "小数据集（3条）",
  args: {
    onLoadComics: makePagedLoader(fullComics.slice(0, 3), 400),
    onLoadLatestChapter: async (comic: ComicInfo) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return {
        success: true as const,
        data: makeMockChapter(Number(comic.id.replace("comic-", ""))),
      };
    },
  },
};