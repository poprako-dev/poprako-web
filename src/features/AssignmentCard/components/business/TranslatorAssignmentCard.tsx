import type React from "react";
import clsx from "clsx";
import { FileText, CircleCheck, CheckCheck, Clock, Tag } from "lucide-react";
import type { AssignmentInfo } from "@/types/assignment";
import MultiProgressBar from "@/components/ui/MultiProgressBar";

type Props = {
  assignmentInfo: AssignmentInfo;
};

function formatDate(ts: number | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function DataTag({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <div className="flex items-center text-slate-500 bg-gray-100/80 px-1.5 py-1 rounded-sm min-w-0">
      <span className="text-slate-400 ml-1 w-5 shrink-0 flex items-center justify-center">
        {icon}
      </span>
      <span className="text-sm font-medium leading-none flex-1 text-center min-w-0">
        {value}
      </span>
    </div>
  );
}

// 翻译·校对版分工卡片
// 无状态受控组件，纯展示用
// 不规定高度，完全适配父容器 AssignmentCard
export default function TranslatorAssignmentCard({ assignmentInfo }: Props) {
  const { chapter } = assignmentInfo;
  const comic = chapter?.comic;

  const total = chapter?.totalUnitCount ?? 0;
  const translated = chapter?.translatedUnitCount ?? 0;
  const proofread = chapter?.proofreadUnitCount ?? 0;

  const translationPct = total > 0 ? Math.floor((translated / total) * 100) : 0;
  const proofreadPct = total > 0 ? Math.floor((proofread / total) * 100) : 0;
  const pageCount = chapter?.pageCount ?? 0;

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header：标题 + 话号 */}
      <div className="px-2 pt-2 pb-1 shrink-0">
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
              "text-xs font-mono text-slate-400",
              "bg-slate-100 px-1.5 py-0.5 rounded shrink-0",
            )}
          >
            #{chapter?.index}
          </span>
        </div>
      </div>

      {/* 主体区域：左封面 + 右侧三行统计 */}
      <div className="flex flex-1 px-2 pb-2 pt-1 gap-2 items-stretch min-h-0">
        <div className="w-16 h-full shrink-0 rounded overflow-hidden bg-slate-100" />

        <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <div className="flex items-center gap-1 shrink-0">
              <Clock size={14} strokeWidth={2.5} />
              <span className="font-medium">
                {formatDate(chapter?.updatedAt)}
              </span>
            </div>
            <span className="text-slate-300">·</span>
            <div className="flex items-center gap-1 shrink-0">
              <FileText size={14} strokeWidth={2.5} />
              <span className="font-medium">{pageCount}P</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <DataTag icon={<Tag size={18} strokeWidth={2.5} />} value={total} />
            <DataTag
              icon={<CircleCheck size={18} strokeWidth={2.5} />}
              value={translated}
            />
            <DataTag
              icon={<CheckCheck size={18} strokeWidth={2.5} />}
              value={proofread}
            />
          </div>

          <div className="pt-1">
            <MultiProgressBar
              fullWidth
              height={0.5}
              bars={[
                {
                  progressPercent: translationPct,
                  barColorClass: "bg-orange-200",
                },
                {
                  progressPercent: proofreadPct,
                  barColorClass: "bg-pink-200",
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
