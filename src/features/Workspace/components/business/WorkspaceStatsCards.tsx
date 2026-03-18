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

  return (
    <div
      className={clsx(
        "flex-1 min-w-0 h-fit rounded-lg border border-slate-200 bg-white",
      )}
    >
      {/* Mobile: only centered number */}
      <div
        className={clsx("flex h-16 items-center justify-center md:hidden p-3")}
      >
        <span
          className={clsx(
            "text-2xl font-black leading-none",
            toneClass.value,
            isLoading && "animate-pulse",
          )}
        >
          {isLoading ? "-" : value}
        </span>
      </div>

      {/* Desktop: icon + label above, number below */}
      <div className={clsx("hidden md:flex flex-col items-center gap-3 p-4")}>
        <div className={clsx("flex items-center gap-2")}>
          <Icon size={18} className={clsx(toneClass.icon)} />
          <span className={clsx("text-sm font-medium", toneClass.label)}>
            {label}
          </span>
        </div>
        <div>
          <span
            className={clsx(
              "text-3xl font-black leading-none",
              toneClass.value,
              isLoading && "animate-pulse",
            )}
          >
            {isLoading ? "-" : value}
          </span>
        </div>
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
