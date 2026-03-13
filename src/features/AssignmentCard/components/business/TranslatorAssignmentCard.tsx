import type React from "react";
import clsx from "clsx";
import { FileText, Layers, Type, CheckCheck, Clock } from "lucide-react";
import type { AssignmentWithChapterInfo } from "@/types/assignment";
import MultiProgressBar from "@/components/ui/MultiProgressBar";

type Props = {
  assignmentInfo: AssignmentWithChapterInfo;
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

function DataTag({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-1 px-1.5 py-0.5",
        "bg-slate-100 rounded",
        "text-slate-500 shrink-0",
      )}
    >
      <span className="text-slate-400">{icon}</span>
      <span className="text-sm font-semibold leading-none">{value}</span>
    </div>
  );
}

// 无状态受控组件，纯展示用
// 不规定高度，完全适配父容器 AssignmentCard
export default function TranslatorAssignmentCard({ assignmentInfo }: Props) {
  const { chapter, roles } = assignmentInfo;
  const { comic } = chapter;

  const total = chapter.totalUnitCount;
  const translated = chapter.translatedUnitCount;
  const proofread = chapter.proofreadUnitCount;

  const translationPct = total > 0 ? Math.floor((translated / total) * 100) : 0;
  const proofreadPct = total > 0 ? Math.floor((proofread / total) * 100) : 0;

  return (
    <div className="flex flex-col w-full h-full">
      {/* 主体区域 */}
      <div className="flex flex-1 px-2 pb-2 pt-2 gap-2 items-center min-h-0">
        {/* 封面 */}
        <div className="w-18 h-full shrink-0 rounded overflow-hidden">
          <img
            src={chapter.coverUrl || comic.coverUrl}
            alt={comic.title}
            className="w-full h-full object-cover grayscale-20"
          />
        </div>

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
              {comic.title || "未命名"}
            </h3>
            <span
              className={clsx(
                "text-xs font-mono text-slate-400",
                "bg-slate-100 px-1.5 py-0.5 rounded shrink-0",
              )}
            >
              #{chapter.chapterNo}
            </span>
          </div>

          {/* 第二行：日期 + 职位 */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="flex items-center gap-1 shrink-0">
              <Clock size={14} />
              <span className="font-medium">
                {formatDate(chapter.updatedAt)}
              </span>
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <div className="flex gap-1.5 font-medium text-slate-500 text-sm">
              {getRoleLabels(roles).map((label, idx) => (
                <span key={idx}>{label}</span>
              ))}
            </div>
          </div>

          {/* 第三行：数据 Tag */}
          <div className="flex gap-1.5">
            <DataTag icon={<FileText size={16} />} value={chapter.pageCount} />
            <DataTag icon={<Layers size={16} />} value={total} />
            <DataTag icon={<Type size={16} />} value={translated} />
            <DataTag icon={<CheckCheck size={16} />} value={proofread} />
          </div>
        </div>
      </div>

      {/* Footer 进度条：橙色=翻译进度，粉色=校对进度 */}
      <div className="px-2 pb-2 pt-1 shrink-0">
        <MultiProgressBar
          fullWidth
          height={0.3125}
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
