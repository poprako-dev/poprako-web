import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  canApplyWorkflowTransition,
  type ChapterInfo,
} from "@/route/_authenticated/business/chapter/chapter";
import type { WorkflowTransition } from "@/route/_authenticated/business/chapter/chapter-input";
import type { DetailContract } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { Result } from "@/shared/utility/result";
import { applyWorkflowTransition } from "@/route/_authenticated/_shell/business/comic-detail/utils";
import { showLocalApiFailure } from "@/route/business/request-error";

type Args = {
  comicId: string;
  selectedChapterId: string | null;
  selectedChapter: ChapterInfo | undefined;
  onTransiteWorkflow: DetailContract["onTransiteWorkflow"];
  onDeleteComic: DetailContract["onDeleteComic"];
  onArchiveComic: DetailContract["onArchiveComic"];
  setChapters: Dispatch<SetStateAction<ChapterInfo[]>>;
  setIsDeletingComic: (value: boolean) => void;
  setIsArchivingComic: (value: boolean) => void;
  handleWorkflowRecordsChanged: () => void;
  showToast: (message: string, type: ToastType) => void;
};

interface Actions {
  handleTransition: (transition: WorkflowTransition) => Promise<Result<void>>;
  handleDeleteCurrentComic: () => Promise<void>;
  handleArchiveCurrentComic: () => Promise<void>;
  handleUpdateChapterLocal: (chapterId: string, subtitle?: string) => void;
}

export function useComicDetailModalActions({
  comicId,
  selectedChapterId,
  selectedChapter,
  onTransiteWorkflow,
  onDeleteComic,
  onArchiveComic,
  setChapters,
  setIsDeletingComic,
  setIsArchivingComic,
  handleWorkflowRecordsChanged,
  showToast,
}: Args): Actions {
  const handleTransition = useTransitionAction({
    selectedChapterId,
    selectedChapter,
    onTransiteWorkflow,
    setChapters,
    handleWorkflowRecordsChanged,
    showToast,
  });
  const removals = useComicRemovalActions({
    comicId,
    onDeleteComic,
    onArchiveComic,
    setIsDeletingComic,
    setIsArchivingComic,
    showToast,
  });
  const handleUpdateChapterLocal = useCallback(
    (chapterId: string, subtitle?: string): void => {
      setChapters((previous) =>
        previous.map((chapter) =>
          chapter.id === chapterId ? { ...chapter, subtitle: subtitle ?? "" } : chapter,
        ),
      );
    },
    [setChapters],
  );

  return { handleTransition, ...removals, handleUpdateChapterLocal };
}

type TransitionArgs = Pick<
  Args,
  | "selectedChapterId"
  | "selectedChapter"
  | "onTransiteWorkflow"
  | "setChapters"
  | "handleWorkflowRecordsChanged"
  | "showToast"
>;

function useTransitionAction({
  selectedChapterId,
  selectedChapter,
  onTransiteWorkflow,
  setChapters,
  handleWorkflowRecordsChanged,
  showToast,
}: TransitionArgs): Actions["handleTransition"] {
  return useCallback(
    async (transition: WorkflowTransition): Promise<Result<void>> => {
      if (!selectedChapterId || !selectedChapter) {
        return { success: false, error: "未选择章节" };
      }
      if (!canApplyWorkflowTransition(selectedChapter, transition)) {
        return {
          success: false,
          error: "当前章节状态已更新，不能重复推进该流程",
        };
      }
      const result = await onTransiteWorkflow(selectedChapterId, transition);
      if (!result.success) {
        console.error("[ComicDetailModal] 推进流程失败:", result);
        showLocalApiFailure(result, showToast, "操作失败");
        return result;
      }
      setChapters((previous) =>
        previous.map((chapter) =>
          chapter.id === selectedChapterId ? applyWorkflowTransition(chapter, transition) : chapter,
        ),
      );
      handleWorkflowRecordsChanged();
      return result;
    },
    [
      selectedChapterId,
      selectedChapter,
      onTransiteWorkflow,
      setChapters,
      handleWorkflowRecordsChanged,
      showToast,
    ],
  );
}

type ComicRemovalArgs = Pick<
  Args,
  | "comicId"
  | "onDeleteComic"
  | "onArchiveComic"
  | "setIsDeletingComic"
  | "setIsArchivingComic"
  | "showToast"
>;

function useComicRemovalActions({
  comicId,
  onDeleteComic,
  onArchiveComic,
  setIsDeletingComic,
  setIsArchivingComic,
  showToast,
}: ComicRemovalArgs): Pick<Actions, "handleDeleteCurrentComic" | "handleArchiveCurrentComic"> {
  const handleDeleteCurrentComic = useCallback(async (): Promise<void> => {
    setIsDeletingComic(true);
    const result = await onDeleteComic(comicId);
    setIsDeletingComic(false);
    if (!result.success) {
      console.error("[ComicDetailModal] 删除漫画失败:", result);
      showLocalApiFailure(result, showToast);
      return;
    }
    showToast("漫画删除成功", "success");
  }, [comicId, onDeleteComic, setIsDeletingComic, showToast]);

  const handleArchiveCurrentComic = useCallback(async (): Promise<void> => {
    setIsArchivingComic(true);
    const result = await onArchiveComic(comicId);
    setIsArchivingComic(false);
    if (!result.success) {
      console.error("[ComicDetailModal] 归档漫画失败:", result);
      showLocalApiFailure(result, showToast);
      return;
    }
    showToast("漫画归档成功", "success");
  }, [comicId, onArchiveComic, setIsArchivingComic, showToast]);
  return { handleDeleteCurrentComic, handleArchiveCurrentComic };
}
