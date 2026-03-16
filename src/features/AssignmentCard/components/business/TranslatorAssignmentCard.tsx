import type React from "react";
import clsx from "clsx";
import { FileText, Layers, Type, CheckCheck, Clock, User } from "lucide-react";
import type { AssignmentInfo } from "@/types/assignment";
import MultiProgressBar from "@/components/ui/MultiProgressBar";

type Props = {
  assignmentInfo: AssignmentInfo;
};

const ROLE_MAP = [
  { label: "图", field: "assignedRawProviderAt" as const },
  { label: "翻", field: "assignedTranslatorAt" as const },
  { label: "校", field: "assignedProofreaderAt" as const },
  { label: "嵌", field: "assignedTypesetterAt" as const },
  { label: "监", field: "assignedReviewerAt" as const },
  { label: "传", field: "assignedPublisherAt" as const },
];

function getRoleLabels(assignment: AssignmentInfo): string[] {
  const labels = ROLE_MAP.filter((r) => assignment[r.field] !== undefined).map(
    (r) => r.label,
  );
  return labels.length > 0 ? labels : ["员"];
}

function formatDate(ts: number | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function DataTag({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <div className="flex items-center gap-1.5 text-slate-500">
      <span className="text-slate-300 mr-4 ml-1">{icon}</span>
      <span className="text-base font-bold leading-none">{value}</span>
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

  return (
    <div className="flex flex-col w-full h-full">
      {/* 主体区域 */}
      <div className="flex flex-1 px-2 pb-2 pt-2 gap-2 items-center min-h-0">
        {/* 封面占位 */}
        <div className="w-18 h-full shrink-0 rounded overflow-hidden bg-slate-100" />

        {/* 右侧详情 */}
        <div className="flex-1 flex flex-col justify-center gap-2 min-w-0">
          {/* 第一行：标题 + 话号 */}
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

          {/* 第二行：日期 + 职位 */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="flex items-center gap-1 shrink-0">
              <Clock size={14} />
              <span className="font-medium">
                {formatDate(chapter?.updatedAt)}
              </span>
            </div>
            <div className="h-3 w-px bg-slate-400" />
            <div className="flex items-center gap-1.5 font-medium text-slate-500">
              <div className="flex items-center gap-1 shrink-0">
                <User size={14} className="text-slate-400" />
              </div>
              {getRoleLabels(assignmentInfo).map((label, idx) => (
                <span key={idx}>{label}</span>
              ))}
            </div>
          </div>

          {/* 第三行：数据 Tag 2×2 grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <DataTag
              icon={<FileText size={24} strokeWidth={2.5} />}
              value={chapter?.pageCount ?? 0}
            />
            <DataTag
              icon={<Layers size={24} strokeWidth={2.5} />}
              value={total}
            />
            <DataTag
              icon={<Type size={24} strokeWidth={2.5} />}
              value={translated}
            />
            <DataTag
              icon={<CheckCheck size={24} strokeWidth={2.5} />}
              value={proofread}
            />
          </div>
        </div>
      </div>

      {/* Footer 进度条：橙色=翻译进度，粉色=校对进度 */}
      <div className="px-2 pb-2 pt-1 shrink-0">
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
  );
}
