import { useEffect, useState } from "react";
import clsx from "clsx";
import { Clock, FileText } from "lucide-react";
import type { AssignmentInfo } from "@/types/assignment";
import type { WorkflowStatus } from "@/types/workflow";
import {
  uploadWorkflowStatus,
  translateWorkflowStatus,
  proofreadWorkflowStatus,
  typesetWorkflowStatus,
  reviewWorkflowStatus,
  publishWorkflowStatus,
} from "@/types/chapter";

type Props = {
  assignmentInfo: AssignmentInfo;
  onLoadAssignments: (chapterId: string) => Promise<AssignmentInfo[]>;
};

const ROLE_MAP = [
  { label: "图", field: "assignedRawProviderAt" as const },
  { label: "翻", field: "assignedTranslatorAt" as const },
  { label: "校", field: "assignedProofreaderAt" as const },
  { label: "嵌", field: "assignedTypesetterAt" as const },
  { label: "监", field: "assignedReviewerAt" as const },
  { label: "传", field: "assignedPublisherAt" as const },
];

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
    line: "bg-emerald-200",
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
        className={clsx(
          "text-[12px] font-extrabold tracking-widest z-10",
          cfg.text,
        )}
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

// 监修版分工卡片
// 无状态受控组件，纯展示用
// 展示监制 / 审校视角：日期、职位、页数、工作流各阶段状态
// 不规定高度，完全适配父容器 AssignmentCard
export default function ReviewerAssignmentCard({
  assignmentInfo,
  onLoadAssignments,
}: Props) {
  const { chapter } = assignmentInfo;
  const comic = chapter?.comic;

  const [details, setDetails] = useState<AssignmentInfo[]>([]);

  useEffect(() => {
    if (!chapter) return;
    let active = true;
    onLoadAssignments(chapter.id)
      .then((res) => {
        if (active) setDetails(res);
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, [chapter?.id, onLoadAssignments]);

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header：标题 + 话号 */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <div className="flex items-center gap-3">
          <h3
            className={clsx(
              "text-base font-bold text-slate-700",
              "truncate flex-1 leading-none",
            )}
          >
            {comic?.title || "未命名"}
          </h3>
          <span
            className={clsx(
              "text-xs font-mono text-slate-400 shrink-0",
              "bg-slate-50 px-2 py-0.5 rounded flex items-center h-5 leading-none",
            )}
          >
            #{chapter?.index}
          </span>
        </div>
      </div>

      {/* 主体区域：左封面 + 右侧三行 */}
      <div className="group flex flex-1 px-3 pb-2 pt-1 gap-3 items-stretch min-h-0">
        <div className="w-16 h-full shrink-0 rounded overflow-hidden bg-slate-100" />

        <div className="flex-1 flex flex-col min-w-0 h-full justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="flex items-center gap-1 shrink-0">
              <Clock size={12} />
              <span className="font-mono tracking-tight leading-none pt-0.5">
                {formatDate(chapter?.updatedAt)}
              </span>
            </div>
            <div className="h-3 w-px bg-slate-400" />
            <div className="flex items-center gap-1 shrink-0">
              <FileText size={12} />
              <span className="font-mono leading-none pt-0.5">
                {chapter?.pageCount ?? 0}P
              </span>
            </div>
          </div>

          <div
            className={clsx(
              "grid grid-cols-2 gap-x-2 gap-y-1.5",
              "text-[12px] text-slate-500 overflow-hidden",
            )}
          >
            {ROLE_MAP.map((roleDef) => {
              const matchedUsers = details.filter(
                (d) => d[roleDef.field] !== undefined,
              );
              const names =
                matchedUsers.map((u) => u.user?.name || u.userId).join(", ") ||
                "-";

              return (
                <div
                  key={roleDef.label}
                  className="flex items-center gap-1 min-w-0"
                  title={names !== "-" ? names : undefined}
                >
                  <span className="text-slate-400 shrink-0 leading-none">
                    {roleDef.label}:
                  </span>
                  <span className="truncate leading-none font-semibold">
                    {names}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="shrink-0 flex gap-1 w-full pt-1">
            {chapter && (
              <>
                <WorkflowTag
                  label="图"
                  status={uploadWorkflowStatus(chapter)}
                />
                <WorkflowTag
                  label="翻"
                  status={translateWorkflowStatus(chapter)}
                />
                <WorkflowTag
                  label="校"
                  status={proofreadWorkflowStatus(chapter)}
                />
                <WorkflowTag
                  label="嵌"
                  status={typesetWorkflowStatus(chapter)}
                />
                <WorkflowTag
                  label="监"
                  status={reviewWorkflowStatus(chapter)}
                />
                <WorkflowTag
                  label="传"
                  status={publishWorkflowStatus(chapter)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
