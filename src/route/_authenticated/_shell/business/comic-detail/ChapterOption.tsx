import { type JSX, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { MemberInfo } from "@/route/business/identity/member";
import type { Result } from "@/shared/utility/result";
import { ChapterCreatorModal } from "@/route/_authenticated/_shell/business/comic-detail/ChapterCreatorModal";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";
import {
  useChapterDropdownEffects,
  useChapterPointerHandlers,
} from "@/route/_authenticated/_shell/business/comic-detail/use-chapter-option-interactions";

type Props = {
  comicInfo: ComicInfo;
  activeMember: MemberInfo | null;
  chapters: ChapterInfo[];
  selectedChapter?: ChapterInfo | undefined;
  hasMore: boolean;
  isLoading?: boolean | undefined;
  onLoadMore: () => void;
  onSelect: (id: string) => void;
  onCreateChapter?:
    | ((subtitle?: string, presetAssignmentRoles?: number) => Promise<Result<string>>)
    | undefined;
  onDelete?: ((id: string) => void) | undefined;
  onLongPress?: ((chapter: ChapterInfo) => void) | undefined;
};

type ChapterOptionEntryProps = {
  chapter: ChapterInfo;
  isSelected: boolean;
  onLongPress?: Props["onLongPress"];
  onDelete?: Props["onDelete"];
  onSelect: Props["onSelect"];
  closeDropdown: () => void;
  setPendingDeleteId: (chapterId: string) => void;
  pointerHandlers: ReturnType<typeof useChapterPointerHandlers>;
};

function ChapterOptionEntry({
  chapter,
  isSelected,
  onLongPress,
  onDelete,
  onSelect,
  closeDropdown,
  setPendingDeleteId,
  pointerHandlers,
}: ChapterOptionEntryProps): JSX.Element {
  const itemClassName = clsx(
    "flex-1 flex items-center gap-2 text-left",
    "px-2 py-1.5 rounded-sm transition-colors pr-6",
    isSelected
      ? "bg-surface-slate-100 text-ink-slate-700"
      : "text-text-muted-cool hover:bg-surface-slate-50",
  );
  const chapterLabel = (
    <>
      <span className="text-[10px] font-black italic text-text-muted-cool w-4 shrink-0">
        #{chapter.index + 1}
      </span>
      <span className="text-[11px] font-bold truncate">{chapter.subtitle || "无标题"}</span>
    </>
  );

  return (
    <div className="group relative flex items-center shrink-0">
      {onLongPress ? (
        <div
          role="button"
          tabIndex={0}
          onPointerDown={pointerHandlers.handleChapterPointerDown(chapter)}
          onPointerUp={pointerHandlers.handleChapterPointerUp()}
          onPointerCancel={pointerHandlers.handleChapterPointerCancel()}
          onPointerLeave={pointerHandlers.handleChapterPointerCancel()}
          onContextMenu={pointerHandlers.handleChapterContextMenu()}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            onSelect(chapter.id);
            closeDropdown();
          }}
          className={clsx(itemClassName, "select-none touch-none cursor-pointer")}
          title="长按修改章节信息"
        >
          {chapterLabel}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            onSelect(chapter.id);
            closeDropdown();
          }}
          className={itemClassName}
        >
          {chapterLabel}
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setPendingDeleteId(chapter.id);
          }}
          className={clsx(
            "absolute right-1 p-1 rounded",
            "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity",
            "text-text-muted-cool hover:text-text-rose",
          )}
        >
          <Trash2 className="w-3 h-3" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}

export function ChapterOption({
  comicInfo,
  activeMember,
  chapters,
  selectedChapter,
  hasMore,
  isLoading,
  onLoadMore,
  onSelect,
  onCreateChapter,
  onDelete,
  onLongPress,
}: Props): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const pointerHandlers = useChapterPointerHandlers({ onLongPress, onSelect, setIsOpen });
  useChapterDropdownEffects({
    isOpen,
    hasMore,
    isLoading,
    setIsOpen,
    dropdownRef,
    observerRef,
    onLoadMore,
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {selectedChapter ? (
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
          className={clsx(
            "flex items-center gap-2 px-2 py-0.5",
            "border rounded-sm bg-surface-white/50 transition-colors",
            isOpen ? "border-line-slate-300" : "border-line-slate-100 hover:border-line-slate-200",
          )}
        >
          <span className="text-sm font-black italic text-text-muted-cool">
            #{selectedChapter.index + 1}
          </span>
          {selectedChapter.subtitle && (
            <>
              <div className="w-px h-2.5 bg-surface-slate-200 mx-0.5" />
              <span
                className={clsx(
                  "text-xs font-bold text-ink-slate-600",
                  "uppercase tracking-widest",
                )}
              >
                {selectedChapter.subtitle}
              </span>
            </>
          )}
          <ChevronDown size={12} className="text-icon-muted-cool ml-1" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
          className={clsx(
            "flex items-center gap-2 px-2 py-0.5 text-[10px] text-text-muted-cool",
            "border border-line-slate-100 rounded-sm bg-surface-white/50 transition-colors",
            "hover:border-line-slate-200",
          )}
        >
          选择章节
          <ChevronDown size={12} />
        </button>
      )}

      {isOpen && (
        <div
          className={clsx(
            "absolute top-full right-0 mt-1 w-48 z-15",
            "bg-surface-white rounded-md border border-line-slate-200 shadow-lg",
          )}
        >
          <div
            className={clsx(
              "flex flex-col p-1.5 gap-0.5 max-h-60 overflow-y-auto",
              "scrollbar-thin scrollbar-thumb-scrollbar-slate-200 overscroll-contain",
            )}
          >
            <div className="pb-1 shrink-0">
              {onCreateChapter && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowCreator(true);
                  }}
                  className={clsx(
                    "w-full flex items-center justify-center gap-1.5",
                    "py-1.5 rounded-sm border border-dashed border-line-slate-200",
                    "text-text-muted-cool hover:text-text-muted-cool hover:bg-surface-slate-50",
                    "transition-colors text-[11px]",
                  )}
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                  新建章节
                </button>
              )}
            </div>

            {chapters.map((chapter) => (
              <ChapterOptionEntry
                key={chapter.id}
                chapter={chapter}
                isSelected={selectedChapter?.id === chapter.id}
                onLongPress={onLongPress}
                onDelete={onDelete}
                onSelect={onSelect}
                closeDropdown={() => {
                  setIsOpen(false);
                }}
                setPendingDeleteId={setPendingDeleteId}
                pointerHandlers={pointerHandlers}
              />
            ))}

            {hasMore && (
              <div
                ref={observerRef}
                className="h-8 w-full flex items-center justify-center shrink-0"
              >
                <Loader2 className="w-3.5 h-3.5 text-icon-muted-cool animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}
      {showCreator && onCreateChapter && (
        <ChapterCreatorModal
          comicInfo={comicInfo}
          activeMember={activeMember}
          onCreateChapter={onCreateChapter}
          onClose={() => {
            setShowCreator(false);
          }}
        />
      )}
      {pendingDeleteId && onDelete && (
        <ConfirmDialog
          title="确认删除章节"
          description="删除章节后，该章节下的所有页面也将被删除。此操作不可撤销。"
          onConfirm={() => {
            onDelete(pendingDeleteId);
            setPendingDeleteId(null);
          }}
          onCancel={() => {
            setPendingDeleteId(null);
          }}
        />
      )}
    </div>
  );
}
