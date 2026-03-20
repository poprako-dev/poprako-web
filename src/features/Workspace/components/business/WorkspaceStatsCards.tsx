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
  const toneClass = {
    slate: {
      icon: "text-slate-400",
      value: "text-slate-600",
      label: "text-slate-500",
    },
    orange: {
      icon: "text-orange-400",
      value: "text-orange-500",
      label: "text-orange-500",
    },
    emerald: {
      icon: "text-emerald-400",
      value: "text-emerald-500",
      label: "text-emerald-500",
    },
  }[tone];

  const iconBg = {
    slate: "bg-slate-100",
    orange: "bg-orange-50",
    emerald: "bg-emerald-50",
  }[tone];

  return (
    <div
      className={clsx(
        "flex-1 min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm",
        "p-4 flex items-center gap-4",
      )}
    >
      <div className={clsx("flex items-center gap-3")}>
        <div
          className={clsx(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            iconBg,
          )}
        >
          <Icon size={20} className={clsx(toneClass.icon)} />
        </div>

        <div className={clsx("flex flex-col")}>
          <span className={clsx("text-sm font-medium", toneClass.label)}>
            {label}
          </span>
          <span
            className={clsx(
              "text-lg font-medium mt-0.5 text-slate-400 md:hidden",
              isLoading && "animate-pulse",
            )}
          >
            {isLoading ? "-" : value}
          </span>
        </div>
      </div>

      <div className={clsx("ml-auto hidden md:block")}>
        <span
          className={clsx(
            "text-4xl font-black leading-none",
            toneClass.value,
            isLoading && "animate-pulse",
          )}
        >
          {isLoading ? "-" : value}
        </span>
      </div>
    </div>
  );
}

export default function WorkspaceStatsCards({ stats, isLoading }: Props) {
  return (
    <section className={clsx("mb-4 flex flex-row gap-2")}>
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
