import { useEffect, useState } from "react";
import clsx from "clsx";
import { Clock, FileText } from "lucide-react";
import type { ChapterInfo, ComicInfo } from "@/types";
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
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import type { Result } from "@/types/utils/result";

type Props = {
  comicInfo: ComicInfo;
  // 返回当前漫画的顶置章节信息，如果没有章节则返回 null，如果发生错误则返回错误信息字符串
  onLoadPinnedChapter: (
    comicInfo: ComicInfo,
  ) => Promise<Result<ChapterInfo | null>>;
  // 返回当前漫画的分配信息列表，如果发生错误则返回错误信息字符串
  onLoadAssignments: (
    comicInfo: ComicInfo,
  ) => Promise<Result<AssignmentInfo[]>>;
};

const ROLE_MAP = [
  {
    label: "图",
    field: "assignedRawProviderAt" as const,
    getStatus: uploadWorkflowStatus,
  },
  {
    label: "翻",
    field: "assignedTranslatorAt" as const,
    getStatus: translateWorkflowStatus,
  },
  {
    label: "校",
    field: "assignedProofreaderAt" as const,
    getStatus: proofreadWorkflowStatus,
  },
  {
    label: "嵌",
    field: "assignedTypesetterAt" as const,
    getStatus: typesetWorkflowStatus,
  },
  {
    label: "监",
    field: "assignedReviewerAt" as const,
    getStatus: reviewWorkflowStatus,
  },
  {
    label: "传",
    field: "assignedPublisherAt" as const,
    getStatus: publishWorkflowStatus,
  },
];

function formatDate(ts: number | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

type DisplayStatus = "pending" | "ongoing" | "completed";

const STATUS_CONFIG: Record<
  DisplayStatus,
  { text: string; bg: string; line: string }
> = {
  pending: {
    text: "text-slate-300",
    bg: "bg-slate-50/40",
    line: "bg-slate-100",
  },
  ongoing: {
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

function RoleTag({
  label,
  names,
  status,
}: {
  label: string;
  names: string;
  status: WorkflowStatus;
}) {
  const cfg = STATUS_CONFIG[status as DisplayStatus] ?? STATUS_CONFIG.pending;

  return (
    <div
      className={clsx(
        "relative flex min-w-0 items-center gap-2 px-2 py-1.5",
        "overflow-hidden transition-all duration-300",
        cfg.bg,
      )}
      title={names !== "-" ? names : undefined}
    >
      <span
        className={clsx(
          "shrink-0 text-[12px] font-extrabold leading-none tracking-widest",
          cfg.text,
        )}
      >
        {label}
      </span>
      <span className="truncate text-[12px] font-semibold leading-none text-slate-600">
        {names}
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

// 监修版漫画卡片
// 无状态受控组件，纯展示用
// 以漫画为入口，自动加载最新章节及其分工信息
// 展示监制 / 审校视角：日期、职位、页数、工作流各阶段状态
export default function ReviewerComicCard({
  comicInfo,
  onLoadPinnedChapter,
  onLoadAssignments,
}: Props) {
  const { showToast } = useToastStore();
  const [chapter, setChapter] = useState<ChapterInfo | null>(null);
  const [details, setDetails] = useState<AssignmentInfo[]>([]);

  useEffect(() => {
    let active = true;
    onLoadPinnedChapter(comicInfo)
      .then((res) => {
        if (!active) return;
        if (!res.success) {
          console.error("[ReviewerComicCard] 加载最新章节失败:", res);
          showToast("加载章节失败", "error");
          return;
        }
        setChapter(res.data);
      })
      .catch((err) => {
        if (!active) return;
        console.error("[ReviewerComicCard] 加载最新章节异常:", err);
        showToast("加载章节失败", "error");
      });
    return () => {
      active = false;
    };
  }, [comicInfo.id]);

  useEffect(() => {
    let active = true;
    onLoadAssignments(comicInfo)
      .then((res) => {
        if (!active) return;
        if (!res.success) {
          console.error("[ReviewerComicCard] 加载分工信息失败:", res);
          showToast("加载分工信息失败", "error");
          return;
        }
        setDetails(res.data);
      })
      .catch((err) => {
        if (!active) return;
        console.error("[ReviewerComicCard] 加载分工信息异常:", err);
        showToast("加载分工信息失败", "error");
      });
    return () => {
      active = false;
    };
  }, [comicInfo.id]);

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header：标题 + 话号 */}
      <div className="px-3 py-2 shrink-0 bg-slate-50">
        <div className="flex items-center gap-3">
          <h3
            className={clsx(
              "text-base font-bold text-slate-700",
              "truncate flex-1 leading-none",
            )}
          >
            {comicInfo.title || "未命名"}
          </h3>
          <span
            className={clsx(
              "text-xs font-mono text-slate-400 shrink-0",
              "bg-slate-50 px-2 py-0.5 rounded flex items-center h-5 leading-none",
            )}
          >
            #{comicInfo.index + 1}
          </span>
        </div>
      </div>

      {/* 主体区域：左封面 + 右侧三行 */}
      <div className="group flex flex-1 px-3 pb-2 pt-1 gap-3 items-stretch min-h-0">
        <div className="w-16 h-full shrink-0 rounded overflow-hidden bg-slate-100">
          {comicInfo.coverUrl && (
            <img
              src={comicInfo.coverUrl}
              alt={comicInfo.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0 h-full justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="flex items-center gap-1 shrink-0">
              <Clock size={12} />
              <span className="font-mono tracking-tight leading-none pt-0.5">
                {formatDate(comicInfo.lastActiveAt)}
              </span>
            </div>
            <span className="text-slate-300">·</span>
            <div className="flex items-center gap-1 shrink-0">
              <FileText size={12} />
              <span className="font-mono leading-none pt-0.5">
                {chapter?.pageCount ?? 0}P
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 overflow-hidden text-[12px]">
            {ROLE_MAP.map((roleDef) => {
              const matchedUsers = details.filter(
                (detail) => detail[roleDef.field] != null,
              );
              const names =
                matchedUsers
                  .map((detail) => detail.user?.name || detail.userId)
                  .join(", ") || "-";
              const status = chapter
                ? roleDef.getStatus(chapter)
                : ("pending" as WorkflowStatus);

              return (
                <RoleTag
                  key={roleDef.label}
                  label={roleDef.label}
                  names={names}
                  status={status}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
