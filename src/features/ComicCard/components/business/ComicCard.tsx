import clsx from "clsx";
import type { ChapterInfo, ComicInfo } from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { ViewMode } from "../../types/types";
import TranslatorComicCard from "./TranslatorComicCard";
import ReviewerComicCard from "./ReviewerComicCard";
import type { Result } from "@/types/utils/result";

type Props = {
  comicInfo: ComicInfo;
  mode: ViewMode;
  onLoadPinnedChapter: (
    comicInfo: ComicInfo,
  ) => Promise<Result<ChapterInfo | null>>;
  onLoadAssignments: (
    comicInfo: ComicInfo,
  ) => Promise<Result<AssignmentInfo[]>>;
  onClick: () => void;
};

// 漫画卡片的容器
// 固定高度、宽度自适应的细长卡片容器
// mode 由父组件注入，自身不负责切换
export default function ComicCard({
  comicInfo,
  mode,
  onClick,
  onLoadPinnedChapter,
  onLoadAssignments,
}: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={clsx(
        "w-full flex flex-col",
        "bg-stone-50/10 rounded-sm overflow-hidden shadow-xs",
        "border border-slate-200",
        "transition-all cursor-pointer duration-300",
        "hover:-translate-y-0.5 hover:shadow-sm",
        "h-36",
      )}
    >
      {mode === "translator" && (
        <TranslatorComicCard
          comicInfo={comicInfo}
          onLoadPinnedChapter={onLoadPinnedChapter}
        />
      )}
      {mode === "reviewer" && (
        <ReviewerComicCard
          comicInfo={comicInfo}
          onLoadPinnedChapter={onLoadPinnedChapter}
          onLoadAssignments={onLoadAssignments!}
        />
      )}
    </div>
  );
}
