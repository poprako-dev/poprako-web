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
        <h1 className="text-lg font-black tracking-tight text-stone-700">
          {comicInfo.title}
        </h1>
        <ChapterOption
          comicInfo={comicInfo}
          chapters={chapters}
          selectedChapter={selectedChapter}
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={onLoadMore}
          onSelect={onSelect}
          onCreateChapter={
            onCreateChapter && canCreateChapter ? async (subtitle) => onCreate(subtitle) : undefined
          }
          onDelete={onDeleteChapter ? async (id) => onDelete(id) : undefined}
        />
      </div>
      <button
        onClick={onClose}
        className="text-stone-400 hover:text-stone-700 transition-colors p-1"
      >
        <X size={18} />
      </button>
    </>
  );
}
