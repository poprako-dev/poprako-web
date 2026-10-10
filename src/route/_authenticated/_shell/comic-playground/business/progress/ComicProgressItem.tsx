import { type JSX, useState } from "react";
import clsx from "clsx";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { ViewMode } from "@/route/_authenticated/_shell/business/comic-list/comic-card-type";
import { ComicProgressDesktop } from "@/route/_authenticated/_shell/comic-playground/business/progress/ComicProgressDesktop";
import { ComicProgressIdentity } from "@/route/_authenticated/_shell/comic-playground/business/progress/ComicProgressIdentity";
import { ComicProgressMobile } from "@/route/_authenticated/_shell/comic-playground/business/progress/ComicProgressMobile";

type Props = {
  comicInfo: ComicInfo;
  mode: ViewMode;
  onClick: () => void;
};

function getActivityStatusColor(lastActiveAt: number | undefined): string {
  if (!lastActiveAt) return "bg-surface-stone-300";
  const threeMonths = 1000 * 60 * 60 * 24 * 90;
  const sixMonths = 1000 * 60 * 60 * 24 * 180;
  const diff = Date.now() - lastActiveAt;
  if (diff <= threeMonths) return "bg-activity-recent";
  if (diff <= sixMonths) return "bg-surface-amber-200";
  return "bg-surface-stone-300";
}

export function ComicProgressItem({ comicInfo, mode: _mode, onClick }: Props): JSX.Element {
  const chapter: ChapterInfo | null = comicInfo.pinnedChapter ?? null;
  const [assignments] = useState<AssignmentInfo[]>(comicInfo.pinnedChapterAssignments ?? []);
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const [showCover, setShowCover] = useState(false);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [showMobileProgress, setShowMobileProgress] = useState(false);
  const statusDotClass = getActivityStatusColor(comicInfo.lastActiveAt);
  const isExpanded = showCover || Boolean(hoveredStep) || showTitleDropdown || showMobileProgress;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!(event.key === "Enter" || event.key === " ")) return;
        event.preventDefault();
        onClick();
      }}
      className={clsx(
        "group relative w-full flex items-center gap-2 px-3 py-2",
        "bg-surface-stone-50/10 hover:bg-surface-stone-50/40",
        "border border-line-stone-200 hover:border-line-stone-200",
        "rounded-sm transition-all duration-150 cursor-pointer",
        "hover:-translate-y-0.5 shadow-xs",
        "shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-sm",
        "py-2",
        isExpanded && "z-10",
      )}
    >
      <ComicProgressIdentity
        comicInfo={comicInfo}
        chapter={chapter}
        statusDotClass={statusDotClass}
        showCover={showCover}
        setShowCover={setShowCover}
        showTitleDropdown={showTitleDropdown}
        setShowTitleDropdown={setShowTitleDropdown}
      />
      <ComicProgressDesktop
        chapter={chapter}
        assignments={assignments}
        hoveredStep={hoveredStep}
        setHoveredStep={setHoveredStep}
      />
      <ComicProgressMobile
        chapter={chapter}
        assignments={assignments}
        isOpen={showMobileProgress}
        onToggle={() => {
          setShowMobileProgress((previous) => !previous);
        }}
      />
    </div>
  );
}
