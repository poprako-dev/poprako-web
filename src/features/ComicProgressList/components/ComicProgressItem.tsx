import { useEffect, useState } from "react";
import clsx from "clsx";
import type { ComicInfo } from "@/types";
import type { ChapterInfo } from "@/types/chapter";
import type { AssignmentInfo } from "@/types/assignment";
import type { WorkflowStatus } from "@/types/workflow";
import type { ViewMode } from "@/features/ComicCard/types/types";
import type { Result } from "@/types/utils/result";
import {
  uploadWorkflowStatus,
  translateWorkflowStatus,
  proofreadWorkflowStatus,
  typesetWorkflowStatus,
  reviewWorkflowStatus,
  publishWorkflowStatus,
} from "@/types/chapter";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import WorkflowStepDropdown from "./WorkflowStepDropdown";

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
      s === "ongoing" ? ch.translatingAt : s === "completed" ? ch.translatedAt : undefined,
  },
  {
    label: "校",
    field: "assignedProofreaderAt" as const,
    getStatus: proofreadWorkflowStatus,
    getTime: (ch: ChapterInfo, s: WorkflowStatus) =>
      s === "ongoing" ? ch.proofreadingAt : s === "completed" ? ch.proofreadAt : undefined,
  },
  {
    label: "嵌",
    field: "assignedTypesetterAt" as const,
    getStatus: typesetWorkflowStatus,
    getTime: (ch: ChapterInfo, s: WorkflowStatus) =>
      s === "ongoing" ? ch.typesettingAt : s === "completed" ? ch.typesetAt : undefined,
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
  onLoadPinnedChapter,
  onLoadAssignments,
  onClick,
}: Props) {
  const { showToast } = useToastStore();
  const [chapter, setChapter] = useState<ChapterInfo | null>(null);
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([]);
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const [showCover, setShowCover] = useState(false);

  useEffect(() => {
    let active = true;
    onLoadPinnedChapter(comicInfo)
      .then((res) => {
        if (!active) return;
        if (!res.success) {
          console.error("[ComicProgressItem] 加载顶置章节失败:", res);
          showToast("加载章节失败", "error");
          return;
        }
        setChapter(res.data);
      })
      .catch((err) => {
        if (!active) return;
        console.error("[ComicProgressItem] 加载顶置章节异常:", err);
        showToast("加载章节失败", "error");
      });
    return () => {
      active = false;
    };
  }, [comicInfo, onLoadPinnedChapter, showToast]);

  useEffect(() => {
    let active = true;
    onLoadAssignments(comicInfo)
      .then((res) => {
        if (!active) return;
        if (!res.success) {
          console.error("[ComicProgressItem] 加载分工信息失败:", res);
          showToast("加载分工信息失败", "error");
          return;
        }
        setAssignments(res.data);
      })
      .catch((err) => {
        if (!active) return;
        console.error("[ComicProgressItem] 加载分工信息异常:", err);
        showToast("加载分工信息失败", "error");
      });
    return () => {
      active = false;
    };
  }, [comicInfo, onLoadAssignments, showToast]);

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
        "group relative w-full flex items-center gap-3 px-3 py-2",
        "bg-stone-50/10 hover:bg-stone-50/40",
        "border border-stone-200 hover:border-stone-200",
        "rounded-md transition-all duration-150 cursor-pointer",
        "hover:-translate-y-0.5 shadow-xs",
        "shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-sm",
        "py-2",
        (showCover || hoveredStep) && "z-10",
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
          {showCover && comicInfo.coverUrl && (
            <div
              className={clsx(
                "absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20",
                "w-20 h-28 rounded-sm overflow-hidden shadow-md",
                "border border-stone-200 bg-stone-100",
              )}
            >
              <img
                src={comicInfo.coverUrl}
                alt={comicInfo.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </span>

        {/* 漫画标题 */}
        <h3
          className={clsx(
            "text-sm font-bold text-slate-700",
            "truncate shrink-0 max-w-[200px]",
          )}
        >
          {comicInfo.title || "未命名"}
        </h3>

        {/* 章节信息 */}
        <span className="text-[11px] text-slate-400 truncate shrink-0 max-w-[180px]">
          {chapter?.index ? `[#${chapter.index}]` : "—"}
        </span>
      </div>

      {/* ===== 右对齐：六个进度槽 ===== */}
      <div className="flex items-center gap-1 shrink-0">
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
                  "w-10 h-7 rounded-xs flex items-center justify-center",
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
    </div>
  );
}
