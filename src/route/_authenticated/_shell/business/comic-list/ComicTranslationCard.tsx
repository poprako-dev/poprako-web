import type React from "react";
import clsx from "clsx";
import { FileText, Languages, CheckSquare, Clock, Tag, Hash } from "lucide-react";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import { MultiProgressBar } from "@/shared/component/MultiProgressBar";

type Props = {
  comicInfo: ComicInfo;
  chapter?: ChapterInfo | undefined;
  onClick: () => void;
};

function getActivityStatusColor(lastActiveAt: number | undefined): string {
  if (!lastActiveAt) {
    return "bg-surface-stone-300 text-ink-stone-600";
  }
  const diff = Date.now() - lastActiveAt;
  const threeMonths = 1000 * 60 * 60 * 24 * 90;
  if (diff <= threeMonths) {
    return "bg-surface-green-800 text-ink-white";
  }
  const sixMonths = 1000 * 60 * 60 * 24 * 180;
  if (diff <= sixMonths) {
    return "bg-surface-amber-200 text-ink-amber-700";
  }
  return "bg-surface-stone-300 text-ink-stone-600";
}

function formatDate(ts: number | undefined): string {
  if (!ts) {
    return "";
  }
  const d = new Date(ts);
  return `${String(d.getFullYear())}/${String(d.getMonth() + 1)}/${String(d.getDate())}`;
}

function DataTag({ icon, value }: { icon: React.ReactNode; value: number }): React.ReactElement {
  return (
    <div
      className={clsx(
        "flex flex-1 items-center justify-center gap-1 py-0.5",
        "text-[11px] font-semibold text-ink-stone-500",
      )}
    >
      <span className="text-text-muted-warm flex items-center justify-center">{icon}</span>
      <span className="leading-none">{value}</span>
    </div>
  );
}

export function ComicTranslationCard({ comicInfo, chapter, onClick }: Props): React.ReactElement {
  const displayChapter = chapter ?? comicInfo.pinnedChapter ?? null;

  const total = displayChapter?.totalUnitCount ?? 0;
  const translated = displayChapter?.translatedUnitCount ?? 0;
  const proofread = displayChapter?.proofreadUnitCount ?? 0;
  const translationPct = total > 0 ? Math.floor((translated / total) * 100) : 0;
  const proofreadPct = total > 0 ? Math.floor((proofread / total) * 100) : 0;
  const pageCount = displayChapter?.pageCount ?? 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!(e.key === "Enter" || e.key === " ")) {
          return;
        }

        e.preventDefault();
        onClick();
      }}
      className={clsx(
        "w-full h-26 flex",
        "bg-surface-stone-50/10 rounded-sm overflow-hidden shadow-xs",
        "border border-line-stone-200",
        "transition-all cursor-pointer duration-300",
        "hover:-translate-y-0.5 hover:shadow-sm",
        "p-2",
      )}
    >
      {/* 左侧封面 */}
      <div className="w-14 shrink-0 overflow-hidden bg-surface-stone-100 rounded-sm">
        {comicInfo.coverThumbnailUrl ? (
          <img
            src={comicInfo.coverThumbnailUrl}
            alt={comicInfo.title}
            className="w-full h-full object-cover grayscale-[0.3]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText size={20} className="text-icon-muted-warm" />
          </div>
        )}
      </div>

      {/* 右侧数据 */}
      <div className="flex-1 flex flex-col justify-between min-w-0 px-2 py-1">
        {/* 第一行：标题 + 序号指示 */}
        <div className="flex items-center justify-between gap-1.5">
          <h3 className={clsx("text-base font-bold text-ink-stone-700", "truncate leading-tight")}>
            {comicInfo.title || "未命名"}
          </h3>
          <div
            className={clsx(
              "flex items-center justify-center px-1.5 h-[14px] rounded-xs",
              "text-[10px] font-mono font-medium leading-none shrink-0",
              getActivityStatusColor(comicInfo.lastActiveAt),
            )}
          >
            #{comicInfo.index + 1}
          </div>
        </div>

        {/* 第二行：序号 + 日期 + 页数 */}
        <div className="flex items-center gap-1 text-[11px] text-text-muted-warm font-mono">
          <Hash size={11} strokeWidth={2.5} />
          <span>{displayChapter ? displayChapter.index + 1 : "—"}</span>
          <span className="text-ink-stone-200">|</span>
          <div className="flex items-center gap-1 shrink-0">
            <Clock size={11} strokeWidth={2.5} />
            <span className="tracking-tighter">{formatDate(comicInfo.lastActiveAt)}</span>
          </div>
          <span className="text-ink-stone-200">|</span>
          <div className="flex items-center gap-1 shrink-0">
            <FileText size={11} strokeWidth={2.5} />
            <span>{pageCount}P</span>
          </div>
        </div>

        {/* 第三行：统计标签 — 内陷式槽 */}
        <div className="flex rounded-[3px] bg-surface-stone-200/30 p-0.5">
          <DataTag icon={<Tag size={12} strokeWidth={2.5} />} value={total} />
          <DataTag icon={<Languages size={12} strokeWidth={2.5} />} value={translated} />
          <DataTag icon={<CheckSquare size={12} strokeWidth={2.5} />} value={proofread} />
        </div>

        {/* 第四行：进度条 */}
        <MultiProgressBar
          fullWidth
          height={0.5}
          bars={[
            { progressPercent: translationPct, barColor: "var(--progress-comic-translation)" },
            { progressPercent: proofreadPct, barColor: "var(--progress-proofread)" },
          ]}
        />
      </div>
    </div>
  );
}
