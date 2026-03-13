import { useEffect, useState } from "react";
import clsx from "clsx";
import { Clock } from "lucide-react";
import type { ReviewerAssignmentWithChapterInfo } from "@/types/assignment";
import type { WorkflowStatus } from "@/types/workflow";
import type { LoadedAssignment } from "./AssignmentCard";
import {
  uploadWorkflowStatus,
  translateWorkflowStatus,
  proofreadWorkflowStatus,
  typesetWorkflowStatus,
  reviewWorkflowStatus,
  publishWorkflowStatus,
} from "@/types/chapter";

type Props = {
  assignmentInfo: ReviewerAssignmentWithChapterInfo;
  onLoadAssignments: (chapterId: string) => Promise<LoadedAssignment[]>;
};

const ROLE_MAP = [
  { bit: 1, label: "图" },
  { bit: 2, label: "翻" },
  { bit: 4, label: "校" },
  { bit: 8, label: "嵌" },
  { bit: 16, label: "监" },
  { bit: 32, label: "传" },
];

function getRoleLabels(roles: number): string[] {
  const labels = ROLE_MAP.filter((r) => roles & r.bit).map((r) => r.label);
  return labels.length > 0 ? labels : ["员"];
}

function formatDate(ts: number | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

type DisplayStatus = "pending" | "in_progress" | "completed";

const STATUS_CONFIG: Record<
  DisplayStatus,
  { text: string; bg: string; line: string }
> = {
  pending: {
    text: "text-slate-300",
    bg: "bg-slate-50/40",
    line: "bg-slate-100",
  },
  in_progress: {
    text: "text-orange-300",
    bg: "bg-orange-50/40",
    line: "bg-orange-200",
  },
  completed: {
    text: "text-emerald-400",
    bg: "bg-emerald-50/50",
    line: "bg-emerald-300",
  },
};

function WorkflowTag({
  label,
  status,
}: {
  label: string;
  status: WorkflowStatus;
}) {
  const cfg = STATUS_CONFIG[status as DisplayStatus] ?? STATUS_CONFIG.pending;

  return (
    <div
      className={clsx(
        "relative flex-1 h-6",
        "flex items-center justify-center",
        "rounded-sm transition-all duration-300",
        cfg.bg,
      )}
    >
      <span
        className={clsx("text-[10px] font-bold tracking-widest z-10", cfg.text)}
      >
        {label}
      </span>
      <div
        className={clsx(
          "absolute bottom-0 left-0 right-0 h-[2.5px] rounded-b-sm",
          cfg.line,
        )}
      />
    </div>
  );
}

// 无状态受控组件，纯展示用
// 展示监制 / 审校视角：日期、职位、页数、工作流各阶段状态
// 不规定高度，完全适配父容器 AssignmentCard
export default function ReviewerAssignmentCard({
  assignmentInfo,
  onLoadAssignments,
}: Props) {
  const { chapter, roles } = assignmentInfo;
  const { comic } = chapter;

  const [details, setDetails] = useState<LoadedAssignment[]>([]);

  useEffect(() => {
    let active = true;
    onLoadAssignments(chapter.id)
      .then((res) => {
        if (active) setDetails(res);
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, [chapter.id, onLoadAssignments]);

  return (
    <div className="flex flex-col w-full h-full">
      {/* 主体区域 */}
      <div className="group flex flex-1 px-3 pt-3 gap-3 items-center min-h-0">
        {/* 封面 */}
        <div className="w-16 h-full shrink-0 rounded overflow-hidden">
          <img
            src={chapter.coverUrl || comic.coverUrl}
            alt={comic.title}
            className={clsx(
              "w-full h-full object-cover grayscale-20",
              "transition-transform duration-700 group-hover:scale-105",
            )}
          />
        </div>

        {/* 右侧详情 */}
        <div className="flex-1 flex flex-col pt-1 gap-1.5 min-w-0 h-full">
          {/* 第一行：标题 + 话号 */}
          <div className="flex items-center gap-3">
            <h3
              className={clsx(
                "text-base font-bold text-slate-700",
                "truncate flex-1 leading-none",
              )}
            >
              {comic.title || "未命名"}
            </h3>
            <span
              className={clsx(
                "text-xs font-mono text-slate-400 shrink-0",
                "bg-slate-50 px-2 py-0.5 rounded flex items-center h-5 leading-none",
              )}
            >
              #{chapter.chapterNo}
            </span>
          </div>

          {/* 第二行：日期 + 职位 + 页数 */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1 shrink-0">
              <Clock size={12} className="opacity-60" />
              <span className="font-mono tracking-tight leading-none pt-0.5">
                {formatDate(chapter.updatedAt)}
              </span>
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <div className="flex gap-1.5 font-medium text-slate-400/70 items-center">
              {getRoleLabels(roles).map((label, idx) => (
                <span key={idx} className="leading-none pt-0.5">
                  {label}
                </span>
              ))}
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <span className="font-mono font-medium text-slate-400/70 leading-none pt-0.5">
              {chapter.pageCount}P
            </span>
          </div>

          {/* 第三行：2列3行的分配人员名单 */}
          <div
            className={clsx(
              "grid grid-cols-2 gap-x-2 gap-y-1.5 mt-1",
              "text-[11px] text-slate-500 overflow-hidden",
            )}
          >
            {ROLE_MAP.map((roleDef) => {
              const matchedUsers = details.filter(
                (d) => (d.roles & roleDef.bit) !== 0,
              );
              const names =
                matchedUsers
                  .map((u) => u.user?.name || u.userName || u.userId)
                  .join(", ") || "-";

              return (
                <div
                  key={roleDef.bit}
                  className="flex items-center gap-1 min-w-0"
                  title={names !== "-" ? names : undefined}
                >
                  <span className="text-slate-400 shrink-0 leading-none">
                    {roleDef.label}:
                  </span>
                  <span className="truncate leading-none font-medium">
                    {names}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer 进度条 */}
      <div className="px-3 pb-2 pt-1.5 shrink-0 flex gap-1 w-full mt-auto">
        <WorkflowTag label="图" status={uploadWorkflowStatus(chapter)} />
        <WorkflowTag label="翻" status={translateWorkflowStatus(chapter)} />
        <WorkflowTag label="校" status={proofreadWorkflowStatus(chapter)} />
        <WorkflowTag label="嵌" status={typesetWorkflowStatus(chapter)} />
        <WorkflowTag label="监" status={reviewWorkflowStatus(chapter)} />
        <WorkflowTag label="传" status={publishWorkflowStatus(chapter)} />
      </div>
    </div>
  );
}
