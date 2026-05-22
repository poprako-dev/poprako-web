import { useEffect, useState } from "react";
import clsx from "clsx";
import { Clock } from "lucide-react";
import type { ComicInfo } from "@/types";
import type { ChapterInfo } from "@/types/chapter";
import type { AssignmentInfo } from "@/types/assignment";
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
  }, [comicInfo.id]);

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
  }, [comicInfo.id]);

  const statusDotClass = chapter?.publishedAt
    ? "bg-emerald-500"
    : !chapter?.uploadedAt
      ? "bg-stone-300"
      : "bg-amber-500";

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
        "group relative w-full flex flex-col justify-between",
        "bg-white hover:bg-stone-50/40",
        "border border-stone-200 hover:border-stone-300",
        "rounded-sm overflow-hidden transition-all duration-150 cursor-pointer",
        "shadow-[0_1px_2px_rgba(0,0,0,0.01)]",
      )}
    >
      {/* 第一行：#序号 + 漫画名 - 副标题，右侧时间 + 状态点 */}
      <div className="flex items-center justify-between pt-2 pb-1.5 px-3 min-w-0 w-full">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-[10px] font-bold text-stone-400 font-mono shrink-0">
            #{comicInfo.index + 1}
          </span>
          <span className="text-[11px] font-bold text-stone-800 truncate">
            {comicInfo.title}
            {chapter?.subtitle ? ` - ${chapter.subtitle}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-3">
          <Clock className="w-3 h-3 text-stone-400" />
          <span className="text-[9px] text-stone-400 font-mono">
            {formatDate(comicInfo.lastActiveAt)}
          </span>
          <div className={clsx("w-1.5 h-1.5 rounded-full ml-1", statusDotClass)} />
        </div>
      </div>

      {/* 第二行：工作流通栏（6等分，标签 + 人数徽章） */}
      <div
        className={clsx(
          "w-full bg-stone-100/40 border-t border-stone-200/30",
          "shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.035)]",
        )}
      >
        <div
          className={clsx(
            "grid grid-cols-6 text-center select-none",
            "text-[10px] font-semibold font-mono text-stone-600/90",
          )}
        >
          {WORKFLOW_STEPS.map((step) => {
            const count = assignments.filter(
              (a) => a[step.field] != null,
            ).length;
            return (
              <div
                key={step.label}
                className="py-1 flex items-center justify-center"
              >
                <div className="flex items-center gap-0.5">
                  <span className="tracking-wide">{step.label}</span>
                  {count > 0 && (
                    <span
                      className={clsx(
                        "text-[8px] px-1 ml-0.5 rounded-full",
                        "font-bold leading-none scale-90 origin-center",
                        "bg-stone-200 text-stone-500",
                      )}
                    >
                      +{count}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
