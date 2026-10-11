import { ArtworkList } from "./artwork/ArtworkList";

import type { usePageArtworks } from "@/route/_authenticated/business/artwork/use-page-artworks";
import type { artworkPermissions } from "@/route/_authenticated/business/artwork/artwork";

import type { ReactElement } from "react";

import { PageList } from "@/route/_authenticated/_shell/business/comic-detail/page/PageList";
import { Button } from "@/shared/component/Button";
import { LoadingCircle } from "@/shared/component/LoadingCircle";

import type { ComicDetailMainViewProps } from "./ComicDetailMainView";

import type { Dispatch, SetStateAction } from "react";

type Props = Pick<
  ComicDetailMainViewProps,
  "mode" | "pages" | "assignments" | "chapters" | "callbacks"
> & {
  artworks: ReturnType<typeof usePageArtworks>;
  permissions: ReturnType<typeof artworkPermissions>;
  setUploadFiles: Dispatch<SetStateAction<{ chapterId: string; files: File[] } | null>>;
};

export function ComicDetailMainPages({
  mode,
  pages,
  assignments,
  chapters,
  callbacks,
  artworks,
  permissions,
  setUploadFiles,
}: Props): ReactElement {
  const selectedChapterId = chapters.selectedChapterId;
  const navigateToWorkbench = callbacks.onNavigateToWorkbench;
  const canClickPage = assignments.canTranslateOrProofread || assignments.canReadOnly;
  const canUploadNewRawPages = assignments.canUploadRawPages && Boolean(chapters.selectedChapterId);
  const canReuploadRawPages = assignments.canUploadRawPages;
  return mode === "reviewer" ? (
    <div>
      {artworks.loading && artworks.pages.length === 0 && (
        <div role="status" className="flex items-center justify-center gap-2 p-4">
          <LoadingCircle size={18} />
          <span>正在读取嵌稿…</span>
        </div>
      )}
      {artworks.error && (
        <div role="alert" className="p-2 text-sm text-text-danger">
          {artworks.error}
          <Button onClick={artworks.reload}>重新加载嵌稿</Button>
        </div>
      )}
      {!artworks.loading || artworks.pages.length > 0 ? (
        <ArtworkList
          pages={artworks.pages}
          issueCounts={artworks.issueCounts}
          canUpload={permissions.images}
          onChanged={artworks.reload}
          onUpload={(files) => {
            if (selectedChapterId) setUploadFiles({ chapterId: selectedChapterId, files });
          }}
          onOpen={(id) => {
            if (selectedChapterId) navigateToWorkbench(selectedChapterId, id, true, "reviewer");
          }}
        />
      ) : null}
    </div>
  ) : pages.isPagesLoading ? (
    <div className="flex h-full items-center justify-center">
      <LoadingCircle size={22} aria-label="正在加载页面" />
    </div>
  ) : (
    <PageList
      mode={mode}
      pages={pages.pages}
      enableClick={canClickPage}
      onClickPage={
        canClickPage
          ? (pageId) => {
              if (!chapters.selectedChapterId) return;
              callbacks.onNavigateToWorkbench(
                chapters.selectedChapterId,
                pageId,
                !assignments.canTranslateOrProofread || undefined,
                mode,
              );
            }
          : undefined
      }
      onAddPages={canUploadNewRawPages ? pages.handleAddRawPages : undefined}
      canReuploadPage={canReuploadRawPages ? () => true : undefined}
      isPageReuploading={(pageId) => pages.reuploadingPageIds[pageId] === true}
      onReuploadPage={
        canReuploadRawPages
          ? (pageId, file) => {
              void pages.handleReuploadPage(pageId, file);
            }
          : undefined
      }
      reuploadAccept="image/*"
      accept="image/*"
      uploadProgressByPageId={pages.uploadProgressByPageId}
      uploadStatusByPageId={pages.uploadStatusByPageId}
      uploadErrorByPageId={pages.uploadErrorByPageId}
    />
  );
}
