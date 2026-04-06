import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronDown, Trash2, Plus, Loader2 } from "lucide-react";
import type { ChapterInfo } from "@/types";

type Props = {
  chapters: ChapterInfo[];
  selectedChapter?: ChapterInfo;
  hasMore: boolean;
  isLoading?: boolean;
  onLoadMore: () => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete?: (id: string) => void;
};

export default function ChapterOption({
  chapters,
  selectedChapter,
  hasMore,
  isLoading,
  onLoadMore,
  onSelect,
  onCreate,
  onDelete,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !hasMore || !observerRef.current || isLoading) return;
    const ob = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        onLoadMore();
      }
    });
    ob.observe(observerRef.current);
    return () => ob.disconnect();
  }, [isOpen, hasMore, isLoading, onLoadMore]);

  return (
    <div className="relative" ref={dropdownRef}>
      {selectedChapter ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "flex items-center gap-2 px-2 py-0.5",
            "border rounded-sm bg-white/50 transition-colors",
            isOpen
              ? "border-slate-300"
              : "border-slate-100 hover:border-slate-200",
          )}
        >
          <span className="text-sm font-black italic text-slate-400">
            #{selectedChapter.index}
          </span>
          {selectedChapter.subtitle && (
            <>
              <div className="w-px h-2.5 bg-slate-200 mx-0.5" />
              <span
                className={clsx(
                  "text-xs font-bold text-slate-600",
                  "uppercase tracking-widest",
                )}
              >
                {selectedChapter.subtitle}
              </span>
            </>
          )}
          <ChevronDown size={12} className="text-slate-400 ml-1" />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "flex items-center gap-2 px-2 py-0.5 text-[10px] text-slate-400",
            "border border-slate-100 rounded-sm bg-white/50 transition-colors",
            "hover:border-slate-200",
          )}
        >
          选择章节
          <ChevronDown size={12} />
        </button>
      )}

      {isOpen && (
        <div
          className={clsx(
            "absolute top-full left-0 mt-1 w-48 z-10",
            "bg-white rounded-md border border-slate-200 shadow-lg",
          )}
        >
          <div className="flex flex-col p-1.5 gap-0.5 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 overscroll-contain">
            <button
              onClick={() => {
                setIsOpen(false);
                onCreate();
              }}
              className={clsx(
                "sticky top-0 z-10 w-full flex items-center justify-center gap-1.5 shrink-0",
                "py-1.5 rounded-sm border border-dashed border-slate-200 bg-white/90 backdrop-blur-sm",
                "text-slate-400 hover:text-slate-500 hover:bg-slate-50",
                "transition-colors text-[11px] mb-1",
              )}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              新建章节
            </button>

            {chapters.map((ch) => (
              <div
                key={ch.id}
                className="group relative flex items-center shrink-0"
              >
                <button
                  onClick={() => {
                    onSelect(ch.id);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    "flex-1 flex items-center gap-2 text-left",
                    "px-2 py-1.5 rounded-sm transition-colors pr-6",
                    selectedChapter?.id === ch.id
                      ? "bg-slate-100 text-slate-700"
                      : "text-slate-500 hover:bg-slate-50",
                  )}
                >
                  <span className="text-[10px] font-black italic text-slate-400 w-4 shrink-0">
                    #{ch.index}
                  </span>
                  <span className="text-[11px] font-bold truncate">
                    {ch.subtitle || "无标题"}
                  </span>
                </button>
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(ch.id);
                    }}
                    className={clsx(
                      "absolute right-1 p-1 rounded",
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      "text-slate-300 hover:text-rose-400",
                    )}
                  >
                    <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            ))}

            {hasMore && (
              <div
                ref={observerRef}
                className="h-8 w-full flex items-center justify-center shrink-0"
              >
                <Loader2 className="w-3.5 h-3.5 text-slate-300 animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
