import { X } from "lucide-react";
import type { ChapterInfo, ComicInfo } from "@/types";
import type { Result } from "@/types/utils/result";
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
  onClose,
}: Props) {
  return (
    <>
      <div className="flex items-center gap-2">
        <div
          className="px-2 py-0.5 rounded-xs text-md opacity-80 font-black text-white leading-none"
          style={{ backgroundColor: "var(--color-green-500)" }}
        >
          #{comicInfo.index + 1}
        </div>
        <h1 className="text-lg font-black tracking-tight text-stone-700">
          {comicInfo.title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
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
        />
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-700 transition-colors p-1"
        >
          <X size={18} />
        </button>
      </div>
    </>
  );
}
