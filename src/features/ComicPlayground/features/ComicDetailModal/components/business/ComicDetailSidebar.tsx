import type { RefObject } from "react";
import { useCallback, useRef, useState } from "react";
import {
  Archive,
  BookOpen,
  CheckSquare,
  CloudUpload,
  Download,
  Eraser,
  Image as ImageIcon,
  Languages,
  MoreHorizontal,
  Search,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import clsx from "clsx";
import { DropdownMenu } from "radix-ui";
import type { ChapterInfo, ComicInfo } from "@/types";
import ActionButton from "./ActionButton";
import LazyImage from "./LazyImage";
import StatItem from "./StatItem";
import type { CoverUploadState } from "../../types";

interface Props {
  comicInfo: ComicInfo;
  selectedChapter?: ChapterInfo | undefined;
  pagesLength: number;
  canUploadArtwork: boolean;
  onUploadArtwork: () => void;
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
}

export default function ComicDetailSidebar({
  comicInfo,
  selectedChapter,
  pagesLength: _pagesLength,
  canUploadArtwork,
  onUploadArtwork,
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
}: Props) {
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [menuBoundary, setMenuBoundary] = useState<Element | null>(null);
  const [menuSide, setMenuSide] = useState<"right" | "bottom">("right");
  const moreTriggerRef = useCallback((node: HTMLButtonElement | null) => {
    if (!node) {return;}
    const trigger = node;
    const boundary = node.closest("[data-comic-detail-boundary]");
    setMenuBoundary(boundary);
    function updateSide() {
      const available = (boundary?.getBoundingClientRect().right ?? window.innerWidth)
        - trigger.getBoundingClientRect().right;
      setMenuSide(available >= 156 ? "right" : "bottom");
    }
    updateSide();
    const observer = new ResizeObserver(updateSide);
    observer.observe(node);
    if (boundary) {observer.observe(boundary);}
    return () => { observer.disconnect(); };
  }, []);
  const handleOpenImportPicker = () => importFileInputRef.current?.click();
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
          <LazyImage
            src={coverUpload.localCoverUrl}
            alt={comicInfo.title}
            className="w-full h-full"
          />
        ) : (
          <ImageIcon
            size={24}
            className="group-hover:scale-110 transition-transform duration-300"
          />
        )}

        {/* Hover dim overlay */}
        <div className={clsx(
          "absolute inset-0 bg-black/0 group-hover:bg-black/[0.07] transition-colors",
          "duration-200 pointer-events-none z-1",
        )} />

        {coverUpload.isUploadingCover && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
            {coverUpload.coverUploadProgress !== null &&
              coverUpload.coverUploadProgress < 100 && (
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
                      strokeDashoffset={
                        100.531 *
                        (1 - coverUpload.coverUploadProgress / 100)
                      }
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
            <div className={clsx(
              "absolute inset-0 z-10 flex items-center justify-center",
              "pointer-events-none",
            )}>
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className={clsx(
                  "pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-sm",
                  "bg-slate-50/20 backdrop-blur-[1px] border border-slate-300/20",
                  "text-slate-400 hover:text-slate-600",
                  "hover:bg-slate-50/35 hover:border-slate-300/45",
                  "opacity-0 group-hover:opacity-100",
                  "transition-all active:scale-95",
                )}
                title="上传自定义封面"
              >
                <Upload className="h-3 w-3" strokeWidth={2.25} />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="bg-stone-100 rounded-sm border border-stone-200 px-2.5 py-0.5 mb-3 shrink-0">
        <StatItem
          icon={BookOpen}
          label="总页数"
          value={selectedChapter?.pageCount ?? "-"}
        />
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
              <ActionButton
                icon={Search}
                title="只读查看"
                onClick={onNavigateReadOnly}
              />
            )}
            {canTranslateOrProofread && (
              <ActionButton
                icon={CloudUpload}
                title="导入翻校"
                onClick={handleOpenImportPicker}
                disabled={isImportingData}
              />
            )}
            {canUploadArtwork && (
              <ActionButton icon={Upload} title="上传嵌稿" onClick={onUploadArtwork} />
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
        {(canDeleteChapterPages || canArchiveComic || isTeamAdmin) && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button ref={moreTriggerRef} type="button" className={clsx(
                "flex h-7 w-full items-center justify-center gap-1.5 rounded-sm",
                "text-[10px] font-semibold text-stone-400 hover:text-stone-700",
              )}>
                <MoreHorizontal size={13} />更多操作
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                side={menuSide}
                align="center"
                sideOffset={menuSide === "right" ? 20 : 8}
                collisionBoundary={menuBoundary}
                collisionPadding={8}
                sticky="always"
                className={clsx(
                  "z-100 min-w-32 rounded-md border border-stone-200 bg-stone-50 p-1",
                  "text-xs text-stone-600 shadow-md overflow-y-auto",
                  "max-h-(--radix-dropdown-menu-content-available-height)",
                  "max-w-(--radix-dropdown-menu-content-available-width)",
                )}>
                {[
                  { visible: canDeleteChapterPages && Boolean(selectedChapter),
                    label: "清空页面", icon: Eraser, action: onDeletePages,
                    disabled: isDeletingChapterPages },
                  { visible: canArchiveComic, label: "归档漫画", icon: Archive,
                    action: onArchiveComic, disabled: isArchivingComic },
                  { visible: isTeamAdmin, label: "删除漫画", icon: Trash2,
                    action: onDeleteComic, disabled: isDeletingComic },
                ].filter((item) => item.visible).map((item) => (
                  <DropdownMenu.Item key={item.label} onSelect={item.action}
                    disabled={item.disabled} className={clsx(
                      "flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 outline-none",
                      "data-highlighted:bg-stone-200 data-disabled:opacity-40",
                      item.label === "删除漫画" && "text-red-500",
                    )}>
                    <item.icon size={13} />{item.label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>
    </>
  );
}
