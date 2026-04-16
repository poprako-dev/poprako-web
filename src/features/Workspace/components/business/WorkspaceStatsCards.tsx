import type { LucideIcon } from "lucide-react";
import { Clock, Flame, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import type { UserStatsInfo } from "@/types/userStats";

type Props = {
  stats: UserStatsInfo | null;
  isLoading: boolean;
};

type StatCardProps = {
  icon: LucideIcon;
  value: number;
  isLoading: boolean;
  tone: "slate" | "orange" | "emerald";
  label: string;
};

function WorkspaceStatCard({
  icon: Icon,
  value,
  isLoading,
  tone,
  label,
}: StatCardProps) {
  const toneColors = {
    slate: {
      icon: "text-slate-400",
      value: "text-slate-600",
      label: "text-slate-400",
    },
    orange: {
      icon: "text-orange-400",
      value: "text-orange-500",
      label: "text-orange-400",
    },
    emerald: {
      icon: "text-emerald-400",
      value: "text-emerald-500",
      label: "text-emerald-400",
    },
  }[tone];

  return (
    <div
      className={clsx(
        "flex w-full items-center gap-1.5 py-1",
        "sm:w-auto sm:flex-col sm:items-start sm:gap-1 sm:px-3 sm:py-1.5",
      )}
    >
      {/* 左侧：icon + 标签 */}
      <div className={clsx("flex shrink-0 items-center gap-1")}>
        <Icon size={12} className={clsx(toneColors.icon)} />
        <span className={clsx("text-xs font-medium", toneColors.label)}>
          {label}
        </span>
      </div>

      {/* 连接细线（仅小屏） */}
      <div
        className={clsx(
          "flex-1 self-center border-b border-dashed border-slate-200",
          "sm:hidden",
        )}
      />

      {/* 右侧：数字 */}
      <span
        className={clsx(
          "shrink-0 text-lg font-bold leading-none",
          toneColors.value,
          isLoading && "animate-pulse",
        )}
      >
        {isLoading ? "-" : value}
      </span>
    </div>
  );
}

export default function WorkspaceStatsCards({ stats, isLoading }: Props) {
  return (
    <section
      className={clsx(
        "flex flex-col gap-0.5",
        "sm:flex-row sm:items-center sm:gap-1",
      )}
    >
      <WorkspaceStatCard
        icon={Clock}
        label="全部任务"
        value={stats?.totalAssignmentCount ?? 0}
        isLoading={isLoading}
        tone="slate"
      />
      <WorkspaceStatCard
        icon={Flame}
        label="进行中"
        value={stats?.activeAssignmentCount ?? 0}
        isLoading={isLoading}
        tone="orange"
      />
      <WorkspaceStatCard
        icon={CheckCircle2}
        label="已完成"
        value={stats?.finishedAssignmentCount ?? 0}
        isLoading={isLoading}
        tone="emerald"
      />
    </section>
  );
}
