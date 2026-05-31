import clsx from "clsx";
import { X } from "lucide-react";
import type { ChapterInfo, ComicInfo } from "@/types";
import type { Result } from "@/types/utils/result";
import { useLongPress } from "@/hooks/useLongPress";
import ChapterOption from "./ChapterOption";
import type { ComicDetailModalProps } from "../../types";

type Props = {
  comicInfo: ComicInfo;
  chapters: ChapterInfo[];
  selectedChapter?: ChapterInfo;
  selectedChapterId: string | null;
  hasMore: boolean;
  isLoading: boolean;
  canCreateChapter: boolean;
  onLoadMore: () => void;
  onSelect: (chapterId: string | null) => void;
  onCreateChapter?: ComicDetailModalProps["onCreateChapter"];
  onCreate: (subtitle: string | undefined) => Promise<Result<string>>;
  onDeleteChapter?: ComicDetailModalProps["onDeleteChapter"];
  onDelete: (chapterId: string) => Promise<void>;
  onLongPressTitle?: () => void;
  onLongPressChapter?: (chapter: ChapterInfo) => void;
  onClose: () => void;
};

export default function ComicDetailHeader({
  comicInfo,
  chapters,
  selectedChapter,
  hasMore,
  isLoading,
  canCreateChapter,
  onLoadMore,
  onSelect,
  onCreateChapter,
  onCreate,
  onDeleteChapter,
  onDelete,
  onLongPressTitle,
  onLongPressChapter,
  onClose,
}: Props) {
  const titleLongPress = useLongPress({
    onLongPress: onLongPressTitle ?? (() => {}),
    threshold: 500,
  });

  const chapterOption = (
    <ChapterOption
      comicInfo={comicInfo}
      chapters={chapters}
      selectedChapter={selectedChapter}
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={onLoadMore}
      onSelect={onSelect}
      onCreateChapter={
        onCreateChapter && canCreateChapter
          ? async (subtitle) => onCreate(subtitle)
          : undefined
      }
      onDelete={onDeleteChapter ? async (id) => onDelete(id) : undefined}
      onLongPress={onLongPressChapter}
    />
  );

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="px-2 py-0.5 rounded-xs text-md opacity-80 font-black text-white leading-none shrink-0"
          style={{ backgroundColor: "var(--color-green-500)" }}
        >
          #{comicInfo.index + 1}
        </div>
        <h1
          {...titleLongPress}
          className={clsx(
            "text-lg font-black tracking-tight text-stone-700 min-w-0 flex-1",
            onLongPressTitle && "select-none touch-none",
          )}
          title={onLongPressTitle ? "长按修改作品信息" : undefined}
        >
          {comicInfo.title}
        </h1>
        <div className="hidden sm:block shrink-0">{chapterOption}</div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-700 transition-colors p-1 shrink-0"
        >
          <X size={18} />
        </button>
      </div>
      <div className="sm:hidden">{chapterOption}</div>
    </div>
  );
}
