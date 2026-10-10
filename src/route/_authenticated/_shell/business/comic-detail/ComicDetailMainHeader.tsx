import type { ReactElement } from "react";

import { ComicDetailHeader } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailHeader";

import type { ComicDetailMainViewProps } from "./ComicDetailMainView";

type Props = Pick<
  ComicDetailMainViewProps,
  | "comicInfo"
  | "activeMember"
  | "chapters"
  | "assignments"
  | "callbacks"
  | "onOpenComicModifier"
  | "onOpenChapterModifier"
  | "onClose"
  | "showToast"
>;

export function ComicDetailMainHeader({
  comicInfo,
  activeMember,
  chapters,
  assignments,
  callbacks,
  onOpenComicModifier,
  onOpenChapterModifier,
  onClose,
  showToast,
}: Props): ReactElement {
  async function copyTitle(): Promise<void> {
    try {
      await navigator.clipboard.writeText(`[${comicInfo.author}]${comicInfo.title}`);
      showToast("已复制格式化标题", "success");
    } catch (error: unknown) {
      console.error("[ComicDetailModal] 复制格式化标题失败:", error);
      showToast("复制失败，请重试", "error");
    }
  }

  return (
    <ComicDetailHeader
      comicInfo={comicInfo}
      activeMember={activeMember}
      chapters={chapters.chapters}
      selectedChapter={chapters.selectedChapter}
      selectedChapterId={chapters.selectedChapterId}
      hasMore={chapters.chaptersHasMore}
      isLoading={chapters.isChaptersLoading}
      canCreateChapter={assignments.canCreateChapter}
      onLoadMore={chapters.handleLoadMoreChapters}
      onSelect={chapters.setSelectedChapterId}
      onCreateChapter={callbacks.onCreateChapter}
      onCreate={(subtitle, presetAssignmentRoles) =>
        chapters.handleCreateChapter(subtitle, presetAssignmentRoles, callbacks.onCreateChapter)
      }
      onDeleteChapter={callbacks.onDeleteChapter}
      onDelete={(chapterId) => chapters.handleDeleteChapter(chapterId, callbacks.onDeleteChapter)}
      onLongPressTitle={assignments.isTeamAdmin ? onOpenComicModifier : undefined}
      onLongPressChapter={
        assignments.canManageChapterAssignments ? onOpenChapterModifier : undefined
      }
      onCopyTitle={() => {
        void copyTitle();
      }}
      onClose={onClose}
    />
  );
}
