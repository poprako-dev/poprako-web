import type { ReactElement } from "react";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { MemberInfo } from "@/route/business/identity/member";
import type { Role } from "@/route/business/identity/role";
import type { ImportChapterMode } from "@/route/_authenticated/business/chapter/chapter-input";
import type { Result } from "@/shared/utility/result";
import type { ExportProgressState } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";
import type { PendingChapterImport } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-import";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";
import { ArtworkUploadDialog } from "@/route/_authenticated/_shell/business/comic-detail/ArtworkUploadDialog";
import { ExportProgressDialog } from "@/route/_authenticated/_shell/business/comic-detail/ExportProgressDialog";
import { ImportTranslationDialog } from "@/route/_authenticated/_shell/business/comic-detail/ImportDialog";
import { MemberSelectorModal } from "@/route/_authenticated/_shell/business/comic-detail/MemberSelectorModal";
import { ComicDetailExportOptionsDialog } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailExportOptionsDialog";
import { ComicModifierModal } from "@/route/_authenticated/_shell/business/comic-detail/ComicModifierModal";
import { ChapterModifierModal } from "@/route/_authenticated/_shell/business/comic-detail/ChapterModifierModal";
import { ROLE_TITLE_LABEL } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";

export type PendingConfirmAction =
  | "delete-pages"
  | "archive-comic"
  | "delete-comic"
  | "export-data"
  | null;

type Props = {
  comicInfo: ComicInfo;
  artworkChapter: ChapterInfo | null;
  closeArtwork: () => void;
  onArtworkUploaded: () => void;
  isExportingData: boolean;
  exportProgress: ExportProgressState;
  cancelExport: () => void;
  pendingImport: PendingChapterImport | null;
  isImportingData: boolean;
  confirmImport: (mode: ImportChapterMode) => Promise<void>;
  cancelImport: () => void;
  memberSelectorRole: Role | null;
  selectedChapterId: string | null;
  onLoadAssignableMembers: (
    chapterId: string,
    args: {
      role: Role;
      keyword?: string | undefined;
      offset: number;
      limit: number;
    },
  ) => Promise<Result<MemberInfo[]>>;
  setIsMemberSelectorLoading: (loading: boolean) => void;
  isMemberSelectorLoading: boolean;
  isAddingAssignment: boolean;
  onAddAssignment: (userId: string) => Promise<void>;
  closeMemberSelector: () => void;
  pendingConfirmAction: PendingConfirmAction;
  setPendingConfirmAction: (action: PendingConfirmAction) => void;
  pagesLength: number;
  deleteAllChapterPages: () => Promise<void>;
  deleteComic: () => Promise<void>;
  archiveComic: () => Promise<void>;
  handleExportData: (options: { includeImages: boolean; withRawIdent: boolean }) => Promise<void>;
  showComicModifier: boolean;
  setShowComicModifier: (show: boolean) => void;
  onUpdateComic: (args: {
    title: string;
    author: string;
    description?: string | undefined;
  }) => Promise<Result<void>>;
  chapterToModify: ChapterInfo | null;
  setChapterToModify: (chapter: ChapterInfo | null) => void;
  onUpdateChapter: (chapterId: string, subtitle?: string) => Promise<Result<void>>;
  onWorkflowRecordsChanged: () => void;
  updateChapterLocal: (chapterId: string, subtitle?: string) => void;
};

export function ComicDetailModalDialogs({
  comicInfo,
  artworkChapter,
  closeArtwork,
  onArtworkUploaded,
  isExportingData,
  exportProgress,
  cancelExport,
  pendingImport,
  isImportingData,
  confirmImport,
  cancelImport,
  memberSelectorRole,
  selectedChapterId,
  onLoadAssignableMembers,
  setIsMemberSelectorLoading,
  isMemberSelectorLoading,
  isAddingAssignment,
  onAddAssignment,
  closeMemberSelector,
  pendingConfirmAction,
  setPendingConfirmAction,
  pagesLength,
  deleteAllChapterPages,
  deleteComic,
  archiveComic,
  handleExportData,
  showComicModifier,
  setShowComicModifier,
  onUpdateComic,
  chapterToModify,
  setChapterToModify,
  onUpdateChapter,
  onWorkflowRecordsChanged,
  updateChapterLocal,
}: Props): ReactElement {
  return (
    <>
      {artworkChapter && (
        <ArtworkUploadDialog
          chapterId={artworkChapter.id}
          chapterLabel={`第 ${String(artworkChapter.index + 1)} 话 · ${artworkChapter.subtitle}`}
          onClose={closeArtwork}
          onUploaded={onArtworkUploaded}
        />
      )}
      <ExportProgressDialog
        open={isExportingData}
        title={exportProgress.title}
        description={exportProgress.description}
        progress={exportProgress.progress}
        onCancel={cancelExport}
      />
      {pendingImport && (
        <ImportTranslationDialog
          fileName={pendingImport.file.name}
          loading={isImportingData}
          onConfirm={(mode) => {
            void confirmImport(mode);
          }}
          onCancel={cancelImport}
        />
      )}
      {memberSelectorRole && selectedChapterId && (
        <MemberSelectorModal
          title={`添加「${ROLE_TITLE_LABEL[memberSelectorRole]}」成员`}
          chapterId={selectedChapterId}
          role={memberSelectorRole}
          onLoadMembers={onLoadAssignableMembers}
          setIsLoading={setIsMemberSelectorLoading}
          isSubmitting={isMemberSelectorLoading || isAddingAssignment}
          onSelectUser={(userId) => {
            void onAddAssignment(userId);
          }}
          onClose={closeMemberSelector}
        />
      )}
      {pendingConfirmAction === "delete-pages" && (
        <ConfirmDialog
          title="确认清空页面"
          description={
            `即将删除当前章节下的 ${String(pagesLength)} 页，` +
            "删除后才能重新上传页面，此操作不可撤销。"
          }
          confirmLabel="清空"
          onConfirm={() => {
            setPendingConfirmAction(null);
            void deleteAllChapterPages();
          }}
          onCancel={() => {
            setPendingConfirmAction(null);
          }}
        />
      )}
      {pendingConfirmAction === "delete-comic" && (
        <ConfirmDialog
          title="确认删除漫画"
          description={
            `即将删除《${comicInfo.title}》，` + "其章节与页面数据也会一并删除，此操作不可撤销。"
          }
          confirmLabel="删除"
          onConfirm={() => {
            setPendingConfirmAction(null);
            void deleteComic();
          }}
          onCancel={() => {
            setPendingConfirmAction(null);
          }}
        />
      )}
      {pendingConfirmAction === "archive-comic" && (
        <ConfirmDialog
          title="确认归档漫画"
          description={
            `即将归档漫画《${comicInfo.title}》及其全部章节，` + "归档后将从当前漫画列表移除。"
          }
          confirmLabel="归档"
          onConfirm={() => {
            setPendingConfirmAction(null);
            void archiveComic();
          }}
          onCancel={() => {
            setPendingConfirmAction(null);
          }}
        />
      )}
      <ComicDetailExportOptionsDialog
        open={pendingConfirmAction === "export-data"}
        onCancel={() => {
          setPendingConfirmAction(null);
        }}
        onExport={(options) => {
          setPendingConfirmAction(null);
          void handleExportData(options);
        }}
      />
      {showComicModifier && (
        <ComicModifierModal
          comicInfo={comicInfo}
          onUpdate={onUpdateComic}
          onClose={() => {
            setShowComicModifier(false);
          }}
        />
      )}
      {chapterToModify && (
        <ChapterModifierModal
          chapter={chapterToModify}
          onUpdate={async (args) => {
            const result = await onUpdateChapter(chapterToModify.id, args.subtitle);
            if (result.success) {
              updateChapterLocal(chapterToModify.id, args.subtitle);
              onWorkflowRecordsChanged();
            }
            return result;
          }}
          onClose={() => {
            setChapterToModify(null);
          }}
        />
      )}
    </>
  );
}
