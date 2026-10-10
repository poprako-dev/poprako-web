import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
import { ComicDetailModeSwitch } from "./ComicDetailModeSwitch";
import { ComicDetailMoreActions } from "./ComicDetailMoreActions";
import { ArtworkDownloadButton } from "./ArtworkDownloadButton";
import type { JSX, RefObject, ReactElement } from "react";
import { useRef } from "react";
import {
  BookOpen,
  CheckSquare,
  CloudUpload,
  Database,
  Image as ImageIcon,
  Languages,
  Search,
  Tag,
  Upload,
} from "lucide-react";
import clsx from "clsx";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import { ActionButton } from "@/route/_authenticated/_shell/business/comic-detail/ActionButton";
import { LazyImage } from "@/route/_authenticated/_shell/business/comic-detail/LazyImage";
import { StatItem } from "@/route/_authenticated/_shell/business/comic-detail/StatItem";
import type { CoverUploadState } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";

type Props = {
  mode: ComicDetailMode;
  onModeChange: (mode: ComicDetailMode) => void;
  onArtworkExported: () => void;
  issueImportAction?: ReactElement | undefined;
  comicInfo: ComicInfo;
  selectedChapter?: ChapterInfo | undefined;
  pagesLength: number;
  canReadOnly: boolean;
  canUploadCover: boolean;
  canTranslateOrProofread: boolean;
  canDeleteChapterPages: boolean;
  canArchiveComic: boolean;
  isTeamAdmin: boolean;
  isDeletingChapterPages: boolean;
  isArchivingComic: boolean;
  isDeletingComic: boolean;
  isExportingData: boolean;
  isImportingData?: boolean | undefined;
  onNavigateReadOnly?: (() => void) | undefined;
  onExport?: (() => void) | undefined;
  onImportFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeletePages: () => void;
  onArchiveComic: () => void;
  onDeleteComic: () => void;
  coverInputRef: RefObject<HTMLInputElement | null>;
  coverUpload: CoverUploadState;
};

type CoverPreviewProps = Pick<
  Props,
  "comicInfo" | "canUploadCover" | "coverInputRef" | "coverUpload"
>;

function ComicDetailCoverPreview({
  comicInfo,
  canUploadCover,
  coverInputRef,
  coverUpload,
}: CoverPreviewProps): JSX.Element {
  return (
    <div
      className={clsx(
        "relative w-28 mx-auto aspect-3/4 bg-surface-stone-100 rounded-sm border border-line-stone-200",
        "flex items-center justify-center text-text-muted-cool mb-4 mt-2",
        "overflow-hidden shrink-0",
        "hover:border-line-slate-300 transition-colors group",
      )}
    >
      {coverUpload.localCoverUrl ? (
        <LazyImage
          src={coverUpload.localCoverUrl}
          alt={comicInfo.title}
          className="w-full h-full"
        />
      ) : (
        <ImageIcon size={24} className="group-hover:scale-110 transition-transform duration-300" />
      )}
      {/* Hover dim overlay */}
      <div
        className={clsx(
          "absolute inset-0 bg-surface-black/0 group-hover:bg-surface-black/[0.07] transition-colors",
          "duration-200 pointer-events-none z-1",
        )}
      />
      {coverUpload.isUploadingCover && (
        <CoverUploadProgress progress={coverUpload.coverUploadProgress} />
      )}
      {!coverUpload.isUploadingCover && canUploadCover && (
        <CoverUploadAction coverInputRef={coverInputRef} coverUpload={coverUpload} />
      )}
    </div>
  );
}

function CoverUploadProgress({ progress }: { progress: number | null }): JSX.Element {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface-black/40">
      {progress !== null && progress < 100 && (
        <>
          <svg
            className="h-10 w-10 -rotate-90 rounded-full bg-image-label-overlay"
            viewBox="0 0 40 40"
          >
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="3"
              strokeDasharray={100.531}
              strokeDashoffset={100.531 * (1 - progress / 100)}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
          </svg>
          <span className="absolute text-[11px] font-bold text-image-label-foreground">
            {progress}%
          </span>
        </>
      )}
    </div>
  );
}

function CoverUploadAction({
  coverInputRef,
  coverUpload,
}: Pick<CoverPreviewProps, "coverInputRef" | "coverUpload">): JSX.Element {
  return (
    <>
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={coverUpload.handleCoverFileChange}
      />
      <div
        className={clsx(
          "absolute inset-0 z-10 flex items-center justify-center",
          "pointer-events-none",
        )}
      >
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          className={clsx(
            "pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-sm",
            "bg-surface-slate-50 border border-line-slate-300",
            "text-text-muted-cool hover:text-ink-slate-600",
            "hover:bg-surface-slate-100 hover:border-line-slate-400",
            "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            "transition-all active:scale-95",
          )}
          title="上传自定义封面"
        >
          <Upload className="h-3 w-3" strokeWidth={2.25} />
        </button>
      </div>
    </>
  );
}

export function ComicDetailSidebar({
  mode,
  onModeChange,
  onArtworkExported,
  issueImportAction,
  comicInfo,
  selectedChapter,
  pagesLength: _pagesLength,
  canReadOnly,
  canUploadCover,
  canTranslateOrProofread,
  canDeleteChapterPages,
  canArchiveComic,
  isTeamAdmin,
  isDeletingChapterPages,
  isArchivingComic,
  isDeletingComic,
  isExportingData,
  isImportingData,
  onNavigateReadOnly,
  onExport,
  onImportFileChange,
  onDeletePages,
  onArchiveComic,
  onDeleteComic,
  coverInputRef,
  coverUpload,
}: Props): JSX.Element {
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const handleOpenImportPicker = (): void => importFileInputRef.current?.click();
  return (
    <>
      <div className="min-h-0 sm:flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-scrollbar-stone-200">
        <ComicDetailCoverPreview
          comicInfo={comicInfo}
          canUploadCover={canUploadCover}
          coverInputRef={coverInputRef}
          coverUpload={coverUpload}
        />

        <div className="bg-surface-stone-100 rounded-sm border border-line-stone-200 px-2.5 py-0.5 mb-3 shrink-0">
          <StatItem icon={BookOpen} label="总页数" value={selectedChapter?.pageCount ?? "-"} />
          {mode === "translator" && (
            <>
              <StatItem
                icon={Tag}
                label="总单元数"
                value={selectedChapter?.totalUnitCount ?? "-"}
              />
              <StatItem
                icon={Languages}
                label="已翻译"
                value={selectedChapter?.translatedUnitCount ?? "-"}
              />
              <StatItem
                icon={CheckSquare}
                label="已校对"
                value={selectedChapter?.proofreadUnitCount ?? "-"}
              />
            </>
          )}
        </div>

        {!selectedChapter && (
          <p
            className={clsx(
              "text-[10px] sm:text-[9px] text-text-muted-cool",
              "text-center leading-relaxed mb-2 shrink-0",
            )}
          >
            请从上方选择或创建一个章节
          </p>
        )}

        <div className="flex flex-col gap-1 shrink-0">
          {selectedChapter && (
            <>
              {canReadOnly && onNavigateReadOnly && (
                <ActionButton icon={Search} title="只读查看" onClick={onNavigateReadOnly} />
              )}
              {mode === "translator" && canTranslateOrProofread && (
                <ActionButton
                  icon={CloudUpload}
                  title="导入翻校"
                  onClick={handleOpenImportPicker}
                  disabled={isImportingData}
                />
              )}
              {mode === "reviewer" && issueImportAction}
              {mode === "reviewer" && canReadOnly && (
                <ArtworkDownloadButton
                  chapterId={selectedChapter.id}
                  onExported={onArtworkExported}
                />
              )}
              {onExport && (
                <ActionButton
                  icon={Database}
                  title="下载数据"
                  onClick={onExport}
                  disabled={isExportingData}
                />
              )}
              <input
                ref={importFileInputRef}
                type="file"
                accept=".json,.txt,application/json,text/plain"
                className="hidden"
                onChange={onImportFileChange}
              />
            </>
          )}
          <ComicDetailMoreActions
            hasChapter={Boolean(selectedChapter)}
            canDeleteChapterPages={canDeleteChapterPages}
            canArchiveComic={canArchiveComic}
            isTeamAdmin={isTeamAdmin}
            isDeletingChapterPages={isDeletingChapterPages}
            isArchivingComic={isArchivingComic}
            isDeletingComic={isDeletingComic}
            onDeletePages={onDeletePages}
            onArchiveComic={onArchiveComic}
            onDeleteComic={onDeleteComic}
          />
        </div>
      </div>
      <ComicDetailModeSwitch mode={mode} onChange={onModeChange} />
    </>
  );
}
