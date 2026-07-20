import { useState } from "react";
import clsx from "clsx";
import type { ComicInfo } from "@/types";
import type { ChapterInfo } from "@/types/chapter";
import type { AssignmentInfo } from "@/types/assignment";
import type { WorkflowStatus } from "@/types/workflow";
import type { ViewMode } from "@/features/ComicCard/types/types";
import {
  uploadWorkflowStatus,
  translateWorkflowStatus,
  proofreadWorkflowStatus,
  typesetWorkflowStatus,
  reviewWorkflowStatus,
  publishWorkflowStatus,
} from "@/types/chapter";
import WorkflowStepDropdown from "./WorkflowStepDropdown";

type Props = {
  comicInfo: ComicInfo;
  mode: ViewMode;
  onClick: () => void;
};

const WORKFLOW_STEPS = [
  {
    label: "图",
    field: "assignedRawProviderAt" as const,
    getStatus: uploadWorkflowStatus,
    getTime: (ch: ChapterInfo, s: WorkflowStatus) =>
      s === "completed" ? ch.uploadedAt : undefined,
  },
  {
    label: "翻",
    field: "assignedTranslatorAt" as const,
    getStatus: translateWorkflowStatus,
    getTime: (ch: ChapterInfo, s: WorkflowStatus) =>
      s === "ongoing"
        ? ch.translatingAt
        : s === "completed"
          ? ch.translatedAt
          : undefined,
  },
  {
    label: "校",
    field: "assignedProofreaderAt" as const,
    getStatus: proofreadWorkflowStatus,
    getTime: (ch: ChapterInfo, s: WorkflowStatus) =>
      s === "ongoing"
        ? ch.proofreadingAt
        : s === "completed"
          ? ch.proofreadAt
          : undefined,
  },
  {
    label: "嵌",
    field: "assignedTypesetterAt" as const,
    getStatus: typesetWorkflowStatus,
    getTime: (ch: ChapterInfo, s: WorkflowStatus) =>
      s === "ongoing"
        ? ch.typesettingAt
        : s === "completed"
          ? ch.typesetAt
          : undefined,
  },
  {
    label: "监",
    field: "assignedReviewerAt" as const,
    getStatus: reviewWorkflowStatus,
    getTime: (ch: ChapterInfo, s: WorkflowStatus) =>
      s === "completed" ? ch.reviewedAt : undefined,
  },
  {
    label: "传",
    field: "assignedPublisherAt" as const,
    getStatus: publishWorkflowStatus,
    getTime: (ch: ChapterInfo, s: WorkflowStatus) =>
      s === "completed" ? ch.publishedAt : undefined,
  },
];

const STATUS_CONFIG: Record<
  WorkflowStatus,
  { text: string; bg: string; dot: string }
> = {
  pending: {
    text: "text-slate-300",
    bg: "bg-slate-50",
    dot: "bg-slate-200",
  },
  ongoing: {
    text: "text-orange-400",
    bg: "bg-orange-50",
    dot: "bg-orange-300",
  },
  completed: {
    text: "text-emerald-500",
    bg: "bg-emerald-50",
    dot: "bg-emerald-400",
  },
  unset: {
    text: "text-slate-300",
    bg: "bg-slate-50",
    dot: "bg-slate-200",
  },
};

const ROLE_NAMES: Record<string, string> = {
  图: "图源",
  翻: "翻译",
  校: "校对",
  嵌: "嵌字",
  监: "监修",
  传: "上传",
};

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  pending: "待开始",
  ongoing: "进行中",
  completed: "已完成",
  unset: "未设置",
};

function getActivityStatusColor(lastActiveAt: number | undefined): string {
  if (!lastActiveAt) return "bg-stone-300";
  const diff = Date.now() - lastActiveAt;
  const threeMonths = 1000 * 60 * 60 * 24 * 90;
  const sixMonths = 1000 * 60 * 60 * 24 * 180;
  if (diff <= threeMonths) return "bg-[#2e5c33]";
  if (diff <= sixMonths) return "bg-amber-200";
  return "bg-stone-300";
}

function formatDate(ts: number | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ComicProgressItem({
  comicInfo,
  // mode is reserved for future differentiated rendering
  onClick,
}: Props) {
  const chapter: ChapterInfo | null = comicInfo.pinnedChapter ?? null;
  const [assignments] = useState<AssignmentInfo[]>(
    comicInfo.pinnedChapterAssignments ?? [],
  );
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const [showCover, setShowCover] = useState(false);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [showMobileProgress, setShowMobileProgress] = useState(false);

  const statusDotClass = getActivityStatusColor(comicInfo.lastActiveAt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={clsx(
        "group relative w-full flex items-center gap-2 px-3 py-2",
        "bg-stone-50/10 hover:bg-stone-50/40",
        "border border-stone-200 hover:border-stone-200",
        "rounded-sm transition-all duration-150 cursor-pointer",
        "hover:-translate-y-0.5 shadow-xs",
        "shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-sm",
        "py-2",
        (showCover || hoveredStep || showTitleDropdown || showMobileProgress) &&
          "z-10",
      )}
    >
      {/* ===== 左对齐：indicator dot + 序号 + 标题 + 章节 ===== */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* 活跃度 indicator dot */}
        <div
          title={
            comicInfo.lastActiveAt
              ? `上次活跃: ${formatDate(comicInfo.lastActiveAt)}`
              : "无活跃记录"
          }
          className={clsx("w-1.5 h-2 rounded-xs shrink-0", statusDotClass)}
        />

        {/* 漫画序号 */}
        <span
          className={clsx(
            "relative text-xs font-mono text-slate-400",
            "bg-slate-100 px-2 py-0.5 rounded shrink-0",
          )}
          onMouseEnter={() => setShowCover(true)}
          onMouseLeave={() => setShowCover(false)}
        >
          #{comicInfo.index + 1}
          {showCover && comicInfo.coverThumbnailUrl && (
            <div
              className={clsx(
                "absolute top-full left-1/2 -translate-x-1/2 mt-3.5 z-20",
                "w-20 h-28 rounded-sm overflow-hidden shadow-md",
                "border border-stone-200 bg-stone-100",
              )}
            >
              <img
                src={comicInfo.coverThumbnailUrl}
                alt={comicInfo.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </span>

        {/* 漫画标题 */}
        <div
          className="relative min-w-0"
          onMouseEnter={() => setShowTitleDropdown(true)}
          onMouseLeave={() => setShowTitleDropdown(false)}
        >
          <h3
            className={clsx(
              "text-base font-bold text-slate-700",
              "truncate min-w-0",
            )}
          >
            {comicInfo.title || "未命名"}
          </h3>
          {showTitleDropdown && comicInfo.title && (
            <div
              className={clsx(
                "absolute top-full left-0 mt-3.5 z-20",
                "bg-white/95 border border-stone-200 rounded-sm shadow-sm",
                "py-1.5 px-2.5 w-60",
              )}
            >
              <p className="text-sm font-bold text-stone-500 break-words">
                {comicInfo.title}
              </p>
            </div>
          )}
        </div>

        {/* 章节信息 */}
        <span className="text-[11px] text-slate-400 truncate shrink-0 max-w-[120px]">
          {chapter?.index ? `[#${chapter.index}]` : "—"}
        </span>
      </div>

      {/* ===== 右对齐：六个进度槽 (桌面版) ===== */}
      <div className="hidden sm:flex items-center gap-1 shrink-0">
        {WORKFLOW_STEPS.map((step) => {
          const matched = assignments.filter((a) => a[step.field] != null);
          const status = chapter
            ? step.getStatus(chapter)
            : ("pending" as WorkflowStatus);
          const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
          const names = matched
            .map((a) => a.user?.name ?? a.userId)
            .filter(Boolean);

          return (
            <div key={step.label} className="relative">
              <div
                className={clsx(
                  "w-9 h-6 rounded-xs flex items-center justify-center",
                  "text-xs font-bold font-mono select-none",
                  "transition-colors duration-150",
                  cfg.bg,
                  cfg.text,
                )}
                onMouseEnter={() => setHoveredStep(step.label)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {step.label}
              </div>
              <div
                className={clsx(
                  "absolute left-0 top-1/2 -translate-y-1/2",
                  "w-1 h-2.5 rounded-full",
                  cfg.dot,
                )}
              />
              {hoveredStep === step.label && chapter && (
                <WorkflowStepDropdown
                  status={status}
                  time={step.getTime(chapter, status)}
                  names={names}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ===== 移动版：紧凑 accent bar ===== */}
      <div className="flex sm:hidden items-center shrink-0">
        <div className="relative">
          <div
            className="flex rounded-xs overflow-hidden cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileProgress((prev) => !prev);
            }}
          >
            {WORKFLOW_STEPS.map((step) => {
              const status = chapter
                ? step.getStatus(chapter)
                : ("pending" as WorkflowStatus);
              const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
              return (
                <div
                  key={step.label}
                  className={clsx("h-2 w-3 shrink-0", cfg.dot)}
                />
              );
            })}
          </div>
          {showMobileProgress && chapter && (
            <div
              className={clsx(
                "absolute top-full right-0 mt-4.5 z-20",
                "bg-white/95 border border-stone-200 rounded-sm shadow-sm",
                "py-1.5 px-2.5",
              )}
            >
              <div className="flex flex-col gap-1.5 text-xs whitespace-nowrap">
                {WORKFLOW_STEPS.map((step) => {
                  const status = step.getStatus(chapter);
                  const time = step.getTime(chapter, status);
                  const matched = assignments.filter(
                    (a) => a[step.field] != null,
                  );
                  const names = matched
                    .map((a) => a.user?.name ?? a.userId)
                    .filter(Boolean);

                  return (
                    <div key={step.label}>
                      <div className="text-stone-500">
                        <span className="font-bold">
                          {ROLE_NAMES[step.label]}：
                        </span>
                        <span className="italic">{STATUS_LABELS[status]}</span>
                        <span className="font-bold"> 时间：</span>
                        <span className="italic">
                          {time ? formatDate(time) : "—"}
                        </span>
                      </div>
                      <div className="text-stone-400 italic">
                        {names.length > 0 ? names.join("、") : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
