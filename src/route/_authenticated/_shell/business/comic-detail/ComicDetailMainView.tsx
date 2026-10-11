import { useState } from "react";

import { ArtworkUploadDialog } from "./ArtworkUploadDialog";
import { usePageArtworks } from "@/route/_authenticated/business/artwork/use-page-artworks";
import { artworkPermissions } from "@/route/_authenticated/business/artwork/artwork";
import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
import type { ReactElement, RefObject } from "react";
import type { ComicDetailView } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailContent";
import type { DetailContract } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";
import type { PendingConfirmAction } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailModalDialogs";
import type { useComicDetailChapters } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-chapters";
import type { useComicDetailAssignments } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-assignments";
import type { useComicDetailPages } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-pages";
import type { useComicDetailExport } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-export";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";

import { ComicDetailContent } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailContent";
import { ComicDetailModalLayout } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailModalLayout";

import { Button } from "@/shared/component/Button";

import { ComicDetailMainHeader } from "./ComicDetailMainHeader";
import { ComicDetailMainSidebar } from "./ComicDetailMainSidebar";
import { ComicDetailMainPages } from "./ComicDetailMainPages";

export type ComicDetailMainViewProps = {
  mode: ComicDetailMode;
  onModeChange: (mode: ComicDetailMode) => void;
  comicInfo: DetailContract["comicInfo"];
  activeMember: DetailContract["activeMember"];
  onClose: DetailContract["onClose"];
  chapters: ReturnType<typeof useComicDetailChapters>;
  assignments: ReturnType<typeof useComicDetailAssignments>;
  pages: ReturnType<typeof useComicDetailPages>;
  exportState: Pick<
    ReturnType<typeof useComicDetailExport>,
    | "canUploadCover"
    | "coverUpload"
    | "isExportingData"
    | "isImportingData"
    | "handleImportFileChange"
  >;
  callbacks: Pick<
    DetailContract,
    | "onCreateChapter"
    | "onDeleteChapter"
    | "onUpdateComic"
    | "onUpdateChapter"
    | "onArchiveComic"
    | "onDeleteComic"
    | "onNavigateToWorkbench"
    | "onDeleteChapterPages"
    | "onExportChapter"
  >;
  activeView: ComicDetailView;
  onChangeView: (view: ComicDetailView) => void;
  workflowPanel: ReactElement;
  isArchivingComic: boolean;
  isDeletingComic: boolean;
  coverInputRef: RefObject<HTMLInputElement | null>;
  onArtworkExported: () => void;
  onOpenComicModifier: () => void;
  onOpenChapterModifier: (chapter: ChapterInfo) => void;
  onConfirmAction: (action: PendingConfirmAction) => void;
  showToast: (message: string, type: ToastType) => void;
};

type Props = ComicDetailMainViewProps;

export function ComicDetailMainView(props: Props): ReactElement {
  const {
    mode,
    chapters,
    assignments,
    pages,
    callbacks,
    activeView,
    onChangeView,
    workflowPanel,
    onArtworkExported,
  } = props;
  const selectedChapterId = chapters.selectedChapterId;
  const artworks = usePageArtworks(selectedChapterId, mode === "reviewer");
  const permissions = artworkPermissions(
    chapters.selectedChapter,
    assignments.currentAssignment,
    assignments.isTeamAdmin,
  );
  const [uploadFiles, setUploadFiles] = useState<{ chapterId: string; files: File[] } | null>(null);

  return (
    <>
      {uploadFiles?.chapterId === selectedChapterId && selectedChapterId && permissions.images && (
        <ArtworkUploadDialog
          key={selectedChapterId}
          chapterId={selectedChapterId}
          chapterLabel={chapters.selectedChapter?.subtitle ?? "嵌稿"}
          initialFiles={uploadFiles.files}
          canArchive={permissions.archive}
          onClose={() => {
            setUploadFiles(null);
          }}
          onPagesChanged={artworks.reload}
          onUploaded={onArtworkExported}
        />
      )}
      <ComicDetailModalLayout
        header={<ComicDetailMainHeader {...props} />}
        sidebar={<ComicDetailMainSidebar {...props} artworks={artworks} />}
        content={
          <ComicDetailContent
            activeView={activeView}
            chapterId={chapters.selectedChapterId}
            pageList={
              <>
                {mode === "translator" && pages.pageRecoveryNeeded && (
                  <div role="alert" className="flex items-center gap-2 p-2">
                    <span>页面信息加载失败</span>
                    <Button
                      onClick={() => {
                        void pages.reloadCurrentPages();
                      }}
                    >
                      重新加载页面
                    </Button>
                  </div>
                )}
                {mode === "translator" && pages.chapterStatsRecoveryNeeded && (
                  <div role="alert" className="flex items-center gap-2 p-2">
                    <span>页面已清空，章节统计刷新失败</span>
                    <Button
                      onClick={() => {
                        void pages.retryChapterStats();
                      }}
                    >
                      重新加载章节信息
                    </Button>
                  </div>
                )}
                <ComicDetailMainPages
                  mode={mode}
                  chapters={chapters}
                  assignments={assignments}
                  pages={pages}
                  callbacks={callbacks}
                  artworks={artworks}
                  permissions={permissions}
                  setUploadFiles={setUploadFiles}
                />
              </>
            }
            workflowPanel={workflowPanel}
            onChangeView={onChangeView}
          />
        }
      />
    </>
  );
}
