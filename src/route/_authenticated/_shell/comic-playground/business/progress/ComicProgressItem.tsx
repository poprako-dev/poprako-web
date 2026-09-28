import { hasRole } from "@/route/business/identity/role";
import { type JSX, useState } from "react";
import clsx from "clsx";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { WorkflowStatus } from "@/route/_authenticated/business/chapter/workflow";
import type { ViewMode } from "@/route/_authenticated/_shell/business/comic-list/comic-card-type";
import {
  proofreadWorkflowStatus,
  publishWorkflowStatus,
  reviewWorkflowStatus,
  translateWorkflowStatus,
  typesetWorkflowStatus,
  uploadWorkflowStatus,
} from "@/route/_authenticated/business/chapter/chapter";
import { WorkflowStepDropdown } from "@/route/_authenticated/_shell/comic-playground/business/progress/WorkflowStepDropdown";

type Props = {
  comicInfo: ComicInfo;
  mode: ViewMode;
  onClick: () => void;
};

const WORKFLOW_STEPS = [
  {
    label: "图",
    field: "rawProvider" as const,
    getStatus: uploadWorkflowStatus,
  },
  {
    label: "翻",
    field: "translator" as const,
    getStatus: translateWorkflowStatus,
  },
  {
    label: "校",
    field: "proofreader" as const,
    getStatus: proofreadWorkflowStatus,
  },
  {
    label: "嵌",
    field: "typesetter" as const,
    getStatus: typesetWorkflowStatus,
  },
  {
    label: "监",
    field: "reviewer" as const,
    getStatus: reviewWorkflowStatus,
  },
  {
    label: "传",
    field: "publisher" as const,
    getStatus: publishWorkflowStatus,
  },
];

const STATUS_CONFIG: Record<WorkflowStatus, { text: string; bg: string; dot: string }> = {
  pending: {
    text: "text-muted-foreground",
    bg: "bg-muted",
    dot: "bg-border",
  },
  ongoing: {
    text: "text-status-warning",
    bg: "bg-status-warning/10",
    dot: "bg-status-warning",
  },
  completed: {
    text: "text-status-success",
    bg: "bg-status-success/10",
    dot: "bg-status-success",
  },
  unset: {
    text: "text-muted-foreground",
    bg: "bg-muted",
    dot: "bg-border",
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
  if (!lastActiveAt) return "bg-border";
  const threeMonths = 1000 * 60 * 60 * 24 * 90;
  const sixMonths = 1000 * 60 * 60 * 24 * 180;
  const diff = Date.now() - lastActiveAt;
  if (diff <= threeMonths) return "bg-status-success";
  if (diff <= sixMonths) return "bg-status-warning";
  return "bg-border";
}

function formatDate(ts: number | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${String(d.getFullYear())}/${String(d.getMonth() + 1)}/${String(d.getDate())}`;
}

export function ComicProgressItem({
  comicInfo,
  mode: _mode,
  // mode is reserved for future differentiated rendering
  onClick,
}: Props): JSX.Element {
  const chapter: ChapterInfo | null = comicInfo.pinnedChapter ?? null;
  const [assignments] = useState<AssignmentInfo[]>(comicInfo.pinnedChapterAssignments ?? []);
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
        if (!(e.key === "Enter" || e.key === " ")) {
          return;
        }

        e.preventDefault();
        onClick();
      }}
      className={clsx(
        "group relative w-full flex items-center gap-2 px-3 py-2",
        "bg-muted hover:bg-muted",
        "border border-border hover:border-border",
        "rounded-sm transition-all duration-150 cursor-pointer",
        "hover:-translate-y-0.5 shadow-xs",
        "shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-sm",
        "py-2",
        (showCover || Boolean(hoveredStep) || showTitleDropdown || showMobileProgress) && "z-10",
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
        <span // eslint-disable-line jsx-a11y/no-static-element-interactions
          className={clsx(
            "relative text-xs font-mono text-muted-foreground",
            "bg-surface-hover px-2 py-0.5 rounded shrink-0",
          )}
          onMouseEnter={() => {
            setShowCover(true);
          }}
          onMouseLeave={() => {
            setShowCover(false);
          }}
        >
          #{comicInfo.index + 1}
          {showCover && comicInfo.coverThumbnailUrl && (
            <div
              className={clsx(
                "absolute top-full left-1/2 -translate-x-1/2 mt-3.5 z-20",
                "w-20 h-28 rounded-sm overflow-hidden shadow-md",
                "border border-border bg-surface-hover",
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
        <div // eslint-disable-line jsx-a11y/no-static-element-interactions
          className="relative min-w-0"
          onMouseEnter={() => {
            setShowTitleDropdown(true);
          }}
          onMouseLeave={() => {
            setShowTitleDropdown(false);
          }}
        >
          <h3 className={clsx("text-base font-bold text-foreground", "truncate min-w-0")}>
            {comicInfo.title || "未命名"}
          </h3>
          {showTitleDropdown && comicInfo.title && (
            <div
              className={clsx(
                "absolute top-full left-0 mt-3.5 z-20",
                "bg-surface-panel border border-border rounded-sm shadow-sm",
                "py-1.5 px-2.5 w-60",
              )}
            >
              <p className="text-sm font-bold text-muted-foreground break-words">
                {comicInfo.title}
              </p>
            </div>
          )}
        </div>

        {/* 章节信息 */}
        <span className="text-[11px] text-muted-foreground truncate shrink-0 max-w-[120px]">
          {chapter?.index ? `[#${String(chapter.index)}]` : "—"}
        </span>
      </div>

      {/* ===== 右对齐：六个进度槽 (桌面版) ===== */}
      <div className="hidden sm:flex items-center gap-1 shrink-0">
        {WORKFLOW_STEPS.map((step) => {
          const matched = assignments.filter((a) => hasRole(a, step.field));
          const status = chapter ? step.getStatus(chapter) : ("pending" as WorkflowStatus);
          const cfg = STATUS_CONFIG[status];
          const names = matched.map((a) => a.user?.name ?? a.userId).filter(Boolean);

          return (
            <div key={step.label} className="relative">
              <div // eslint-disable-line jsx-a11y/no-static-element-interactions
                className={clsx(
                  "w-9 h-6 rounded-xs flex items-center justify-center",
                  "text-xs font-bold font-mono select-none",
                  "transition-colors duration-150",
                  cfg.bg,
                  cfg.text,
                )}
                onMouseEnter={() => {
                  setHoveredStep(step.label);
                }}
                onMouseLeave={() => {
                  setHoveredStep(null);
                }}
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
                <WorkflowStepDropdown status={status} names={names} />
              )}
            </div>
          );
        })}
      </div>

      {/* ===== 移动版：紧凑 accent bar ===== */}
      <div className="flex sm:hidden items-center shrink-0">
        <div className="relative">
          <button
            type="button"
            className="flex rounded-xs overflow-hidden cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileProgress((prev) => !prev);
            }}
          >
            {WORKFLOW_STEPS.map((step) => {
              const status = chapter ? step.getStatus(chapter) : ("pending" as WorkflowStatus);

              const cfg = STATUS_CONFIG[status];
              return <div key={step.label} className={clsx("h-2 w-3 shrink-0", cfg.dot)} />;
            })}
          </button>
          {showMobileProgress && chapter && (
            <div
              className={clsx(
                "absolute top-full right-0 mt-4.5 z-20",
                "bg-surface-panel border border-border rounded-sm shadow-sm",
                "py-1.5 px-2.5",
              )}
            >
              <div className="flex flex-col gap-1.5 text-xs whitespace-nowrap">
                {WORKFLOW_STEPS.map((step) => {
                  const status = step.getStatus(chapter);
                  const matched = assignments.filter((a) => hasRole(a, step.field));
                  const names = matched.map((a) => a.user?.name ?? a.userId).filter(Boolean);

                  return (
                    <div key={step.label}>
                      <div className="text-muted-foreground">
                        <span className="font-bold">{ROLE_NAMES[step.label]}：</span>
                        <span className="italic">{STATUS_LABELS[status]}</span>
                      </div>
                      <div className="text-muted-foreground italic">
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
