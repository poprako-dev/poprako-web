import type { ChangeEvent, RefObject } from "react";
import {
  BookOpen,
  CheckSquare,
  CloudUpload,
  Download,
  Eraser,
  Hash,
  Image as ImageIcon,
  Languages,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import clsx from "clsx";
import type { ChapterInfo, ComicInfo } from "@/types";
import ActionButton from "./ActionButton";
import LazyImage from "./LazyImage";
import StatItem from "./StatItem";
import type { CoverUploadState } from "../../types";

type Props = {
  comicInfo: ComicInfo;
  selectedChapter?: ChapterInfo;
  pagesLength: number;
  canReadOnly: boolean;
  canUploadCover: boolean;
  canDeleteChapterPages: boolean;
  canUploadRawPages: boolean;
  isTeamAdmin: boolean;
  isDeletingChapterPages: boolean;
  isDeletingComic: boolean;
  isImportingData: boolean;
  isExportingData: boolean;
  onNavigateReadOnly?: () => void;
  onOpenImportPicker?: () => void;
  onExport?: () => void;
  onDeletePages: () => void;
  onDeleteComic: () => void;
  importFileInputRef: RefObject<HTMLInputElement | null>;
  onImportFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  coverInputRef: RefObject<HTMLInputElement | null>;
  coverUpload: CoverUploadState;
};

export default function ComicDetailSidebar({
  comicInfo,
  selectedChapter,
  canReadOnly,
  canUploadCover,
  canDeleteChapterPages,
  canUploadRawPages,
  isTeamAdmin,
  isDeletingChapterPages,
  isDeletingComic,
  isImportingData,
  isExportingData,
  onNavigateReadOnly,
  onOpenImportPicker,
  onExport,
  onDeletePages,
  onDeleteComic,
  importFileInputRef,
  onImportFileChange,
  coverInputRef,
  coverUpload,
}: Props) {
  return (
    <>
      <div
        className={clsx(
          "relative w-28 mx-auto aspect-3/4 bg-stone-100 rounded-sm border border-stone-200",
          "flex items-center justify-center text-slate-200 mb-4 mt-2",
          "overflow-hidden shrink-0",
          "hover:border-slate-300 transition-colors group",
        )}
      >
        {coverUpload.localCoverUrl ? (
          <LazyImage src={coverUpload.localCoverUrl} alt={comicInfo.title} className="w-full h-full" />
        ) : (
          <ImageIcon
            size={24}
            className="group-hover:scale-110 transition-transform duration-300"
          />
        )}

        {/* Hover dim overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.07] transition-colors duration-200 pointer-events-none z-[1]" />

        {coverUpload.isUploadingCover && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
            {coverUpload.coverUploadProgress !== null && coverUpload.coverUploadProgress < 100 && (
              <>
                <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
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
                    strokeDashoffset={100.531 * (1 - (coverUpload.coverUploadProgress ?? 0) / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out"
                  />
                </svg>
                <span className="absolute text-[11px] font-bold text-white/90">
                  {coverUpload.coverUploadProgress}%
                </span>
              </>
            )}
          </div>
      )}

        {!coverUpload.isUploadingCover && canUploadCover && (
          <>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={coverUpload.handleCoverFileChange}
            />
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <button
                onClick={() => coverInputRef.current?.click()}
                className={clsx(
                  "pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-sm",
                  "bg-slate-50/20 backdrop-blur-[1px] border border-slate-300/20",
                  "text-slate-400 hover:text-slate-600",
                  "hover:bg-slate-50/35 hover:border-slate-300/45",
                  "opacity-0 group-hover:opacity-100",
                  "transition-all active:scale-95",
                )}
                title="上传封面"
              >
                <Upload className="h-3 w-3" strokeWidth={2.25} />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="bg-stone-100 rounded-sm border border-stone-200 px-2.5 py-0.5 mb-3 shrink-0">
        <StatItem icon={BookOpen} label="总页数" value={selectedChapter?.pageCount ?? "-"} />
        <StatItem icon={Hash} label="总单元数" value={selectedChapter?.totalUnitCount ?? "-"} />
        <StatItem icon={Languages} label="已翻译" value={selectedChapter?.translatedUnitCount ?? "-"} />
        <StatItem icon={CheckSquare} label="已校对" value={selectedChapter?.proofreadUnitCount ?? "-"} />
      </div>

      {!selectedChapter && (
        <p
          className={clsx(
            "text-[10px] sm:text-[9px] text-slate-300",
            "text-center leading-relaxed mb-2 shrink-0",
          )}
        >
          请从上方选择或创建一个章节
        </p>
      )}

      <div className="flex flex-col gap-1 shrink-0">
        {selectedChapter && (
          <>
            {canReadOnly && (
              <ActionButton icon={Search} title="只读查看" onClick={onNavigateReadOnly} />
            )}
            {canDeleteChapterPages && (
              <ActionButton
                icon={Eraser}
                title="清空页面"
                onClick={onDeletePages}
                disabled={isDeletingChapterPages}
              />
            )}
            {canUploadRawPages && (
              <ActionButton
                icon={CloudUpload}
                title="导入翻校"
                onClick={onOpenImportPicker}
                disabled={isImportingData}
              />
            )}
            <ActionButton
              icon={Download}
              title="下载数据"
              onClick={onExport}
              disabled={isExportingData}
            />
            <input
              ref={importFileInputRef}
              type="file"
              accept=".json,.txt,application/json,text/plain"
              className="hidden"
              onChange={onImportFileChange}
            />
          </>
        )}
        {isTeamAdmin && (
          <ActionButton
            icon={Trash2}
            title="删除漫画"
            onClick={onDeleteComic}
            disabled={isDeletingComic}
            danger
          />
        )}
      </div>
    </>
  );
}
