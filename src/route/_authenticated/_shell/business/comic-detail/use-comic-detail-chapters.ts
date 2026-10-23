import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { DetailContract } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";
import type { Result } from "@/shared/utility/result";
import { useComicDetailChapterActions } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-chapter-actions";
import { useChapterCollection } from "./use-chapter-collection";
import { useLocatedChapter } from "./use-located-chapter";
import { useChapterRefresh } from "./use-chapter-refresh";
import {
  useComicDetailChapterLoading,
  useInitialComicDetailChapters,
} from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-chapter-loading";

type ShowToast = (message: string, type: ToastType) => void;
type Args = {
  comicId: string;
  pinnedChapter: ChapterInfo | null;
  initialChapterId?: string | null | undefined;
  onLoadChapter: DetailContract["onLoadChapter"];
  onLoadChapters: DetailContract["onLoadChapters"];
  showToast: ShowToast;
};

type ChapterState = {
  chapters: ChapterInfo[];
  setChapters: Dispatch<SetStateAction<ChapterInfo[]>>;
  selectedChapter: ChapterInfo | undefined;
  selectedChapterId: string | null;
  setSelectedChapterId: Dispatch<SetStateAction<string | null>>;
  chaptersHasMore: boolean;
  isChaptersLoading: boolean;
  isSelectedChapterAvailable: boolean;
  handleLoadMoreChapters: () => void;
  reloadLoadedChapters: () => Promise<ChapterInfo[] | null>;
  handleCreateChapter: (
    subtitle: string | undefined,
    presetAssignmentRoles: number | undefined,
    onCreateChapter?: DetailContract["onCreateChapter"],
  ) => Promise<Result<string>>;
  handleDeleteChapter: (
    chapterId: string,
    onDeleteChapter?: DetailContract["onDeleteChapter"],
  ) => Promise<void>;
  chaptersLimit: number;
};

const CHAPTERS_LIMIT = 20;

export function useComicDetailChapters(args: Args): ChapterState {
  const { chapters, listed, setChapters, setListed, setLocated } = useChapterCollection();
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    args.initialChapterId ?? args.pinnedChapter?.id ?? null,
  );
  const reloadLocated = useLocatedChapter({
    ...args,
    setLocated,
    setSelectedChapterId,
  });
  const loading = useChapterList(args, listed, setListed, setSelectedChapterId);
  const reload = useChapterRefresh(
    loading.reloadLoadedChapters,
    reloadLocated,
    chapters.length > listed.length,
  );
  const actions = useComicDetailChapterActions({
    comicId: args.comicId,
    selectedChapterId,
    setChapters,
    setSelectedChapterId,
    onLoadChapters: args.onLoadChapters,
    showToast: args.showToast,
  });
  return buildChapterState(
    chapters,
    setChapters,
    selectedChapterId,
    setSelectedChapterId,
    loading.chaptersHasMore,
    loading.isChaptersLoading,
    args.initialChapterId ? null : args.pinnedChapter,
    { ...loading, reloadLoadedChapters: reload },
    actions,
  );
}

function useChapterList(
  args: Args,
  chapters: ChapterInfo[],
  setChapters: Dispatch<SetStateAction<ChapterInfo[]>>,
  setSelectedChapterId: Dispatch<SetStateAction<string | null>>,
): ReturnType<typeof useComicDetailChapterLoading> &
  Pick<ChapterState, "chaptersHasMore" | "isChaptersLoading"> {
  const [chaptersHasMore, setChaptersHasMore] = useState(true);
  const [isChaptersLoading, setIsChaptersLoading] = useState(false);
  const chapterLoadingArgs = {
    comicId: args.comicId,
    initialChapterId: args.initialChapterId,
    pinnedChapterId: args.pinnedChapter?.id,
    chapters,
    hasMore: chaptersHasMore,
    isLoading: isChaptersLoading,
    setChapters,
    setSelectedChapterId,
    setChaptersHasMore,
    setIsChaptersLoading,
    onLoadChapters: args.onLoadChapters,
    showToast: args.showToast,
  };
  useInitialComicDetailChapters(chapterLoadingArgs);
  const loading = useComicDetailChapterLoading(chapterLoadingArgs);
  return { ...loading, chaptersHasMore, isChaptersLoading };
}

function buildChapterState(
  chapters: ChapterInfo[],
  setChapters: Dispatch<SetStateAction<ChapterInfo[]>>,
  selectedChapterId: string | null,
  setSelectedChapterId: Dispatch<SetStateAction<string | null>>,
  chaptersHasMore: boolean,
  isChaptersLoading: boolean,
  pinnedChapter: ChapterInfo | null,
  loading: ReturnType<typeof useComicDetailChapterLoading>,
  actions: ReturnType<typeof useComicDetailChapterActions>,
): ChapterState {
  const selectedChapter =
    chapters.find((chapter) => chapter.id === selectedChapterId) ??
    (pinnedChapter?.id === selectedChapterId ? pinnedChapter : undefined);
  const isSelectedChapterAvailable =
    selectedChapterId !== null &&
    (chapters.some((chapter) => chapter.id === selectedChapterId) ||
      pinnedChapter?.id === selectedChapterId);
  return {
    chapters,
    setChapters,
    selectedChapter,
    selectedChapterId,
    setSelectedChapterId,
    chaptersHasMore,
    isChaptersLoading,
    isSelectedChapterAvailable,
    handleLoadMoreChapters: loading.handleLoadMoreChapters,
    reloadLoadedChapters: loading.reloadLoadedChapters,
    handleCreateChapter: actions.handleCreateChapter,
    handleDeleteChapter: actions.handleDeleteChapter,
    chaptersLimit: CHAPTERS_LIMIT,
  };
}
