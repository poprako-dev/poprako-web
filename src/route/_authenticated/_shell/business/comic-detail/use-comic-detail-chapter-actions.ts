import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { showLocalApiFailure } from "@/route/business/request-error";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { Result } from "@/shared/utility/result";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { DetailContract } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";
import { pickFallbackChapterId } from "@/route/_authenticated/_shell/business/comic-detail/utils";

type ShowToast = (message: string, type: ToastType) => void;
type Args = {
  comicId: string;
  selectedChapterId: string | null;
  setChapters: Dispatch<SetStateAction<ChapterInfo[]>>;
  setSelectedChapterId: Dispatch<SetStateAction<string | null>>;
  onLoadChapters: DetailContract["onLoadChapters"];
  showToast: ShowToast;
};

async function reloadFirstChapters(
  comicId: string,
  onLoadChapters: DetailContract["onLoadChapters"],
): ReturnType<NonNullable<DetailContract["onLoadChapters"]>> {
  return await onLoadChapters({ comicId, offset: 0, limit: 20 });
}

interface ChapterActions {
  handleCreateChapter: (
    subtitle: string | undefined,
    presetAssignmentRoles: number | undefined,
    onCreateChapter?: DetailContract["onCreateChapter"],
  ) => Promise<Result<string>>;
  handleDeleteChapter: (
    chapterId: string,
    onDeleteChapter?: DetailContract["onDeleteChapter"],
  ) => Promise<void>;
}

export function useComicDetailChapterActions(args: Args): ChapterActions {
  return {
    handleCreateChapter: useCreateChapter(args),
    handleDeleteChapter: useDeleteChapter(args),
  };
}

function useCreateChapter(args: Args): ChapterActions["handleCreateChapter"] {
  const { comicId, setChapters, setSelectedChapterId, onLoadChapters } = args;
  return useCallback(
    async (
      subtitle: string | undefined,
      presetAssignmentRoles: number | undefined,
      onCreateChapter?: DetailContract["onCreateChapter"],
    ): Promise<Result<string>> => {
      if (!onCreateChapter) return { success: false, error: "未提供创建章节能力" };
      const res = await onCreateChapter({ comicId, subtitle, presetAssignmentRoles });
      if (!res.success) return res;
      const reloaded = await reloadFirstChapters(comicId, onLoadChapters);
      if (reloaded.success) {
        setChapters(reloaded.data);
        setSelectedChapterId(reloaded.data[0]?.id ?? null);
      }
      return res;
    },
    [comicId, onLoadChapters, setChapters, setSelectedChapterId],
  );
}

function useDeleteChapter(args: Args): ChapterActions["handleDeleteChapter"] {
  const {
    comicId,
    selectedChapterId,
    setChapters,
    setSelectedChapterId,
    onLoadChapters,
    showToast,
  } = args;
  return useCallback(
    async (
      chapterId: string,
      onDeleteChapter?: DetailContract["onDeleteChapter"],
    ): Promise<void> => {
      if (!onDeleteChapter) return;
      const res = await onDeleteChapter(chapterId);
      if (!res.success) {
        showLocalApiFailure(res, showToast, "删除失败");
        return;
      }
      await updateAfterDelete(
        {
          comicId,
          selectedChapterId,
          setChapters,
          setSelectedChapterId,
          onLoadChapters,
          showToast,
        },
        chapterId,
      );
    },
    [comicId, onLoadChapters, selectedChapterId, setChapters, setSelectedChapterId, showToast],
  );
}

async function updateAfterDelete(args: Args, chapterId: string): Promise<void> {
  if (args.selectedChapterId !== chapterId) {
    args.setChapters((previous) => previous.filter((chapter) => chapter.id !== chapterId));
    return;
  }
  const reloaded = await reloadFirstChapters(args.comicId, args.onLoadChapters);
  if (reloaded.success) {
    args.setChapters(reloaded.data);
    args.setSelectedChapterId(pickFallbackChapterId(reloaded.data));
    return;
  }
  showLocalApiFailure(reloaded, args.showToast, "刷新章节失败");
  args.setChapters((previous) => previous.filter((chapter) => chapter.id !== chapterId));
  args.setSelectedChapterId(null);
}
