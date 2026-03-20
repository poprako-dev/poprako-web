import clsx from "clsx";
import type { ChapterInfo, ComicInfo } from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { ViewMode } from "../../types/types";
import TranslatorComicCard from "./TranslatorComicCard";
import ReviewerComicCard from "./ReviewerComicCard";

type Props = {
  comicInfo: ComicInfo;
  mode: ViewMode;
  onLoadLatestChapter: (
    comicInfo: ComicInfo,
  ) => Promise<ChapterInfo | null | string>;
  onLoadAssignments?: (
    comicInfo: ComicInfo,
  ) => Promise<AssignmentInfo[] | string>;
  onClick: () => void;
};

// 漫画卡片的容器
// 固定高度、宽度自适应的细长卡片容器
// mode 由父组件注入，自身不负责切换
export default function ComicCard({
  comicInfo,
  mode,
  onClick,
  onLoadLatestChapter,
  onLoadAssignments,
}: Props) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "w-full flex flex-col",
        "bg-white rounded-lg overflow-hidden shadow-md",
        "border border-slate-200",
        "transition-all cursor-pointer duration-300",
        "hover:bg-slate-50",
        mode === "translator" ? "h-30" : "h-36",
      )}
    >
      {mode === "translator" && (
        <TranslatorComicCard
          comicInfo={comicInfo}
          onLoadLatestChapter={onLoadLatestChapter}
        />
      )}
      {mode === "reviewer" && (
        <ReviewerComicCard
          comicInfo={comicInfo}
          onLoadLatestChapter={onLoadLatestChapter}
          onLoadAssignments={onLoadAssignments!}
        />
      )}
    </div>
  );
}
