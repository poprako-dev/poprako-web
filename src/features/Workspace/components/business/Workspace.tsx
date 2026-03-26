import { useState, useEffect } from "react";
import type { AssignmentInfo } from "@/types/assignment";
import type { UserStatsInfo } from "@/types/userStats";
import type { WorkspaceTab } from "../../types/types";
import WorkspaceLayout from "../../layouts/WorkspaceLayout";
import WorkspaceHeaderNav from "./WorkspaceHeaderNav";
import WorkspaceStatsCards from "./WorkspaceStatsCards";
import AssignmentList from "@/features/AssignmentList/components/business/AssignmentList";
import { useAppStore } from "@/store/app";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import clsx from "clsx";

type Props = {
  onLoadMyStats: () => Promise<UserStatsInfo | string>;
  onMyLoadAssignments: (
    offset: number,
    limit: number,
  ) => Promise<AssignmentInfo[] | string>;
  onLoadAssignments: (chapterId: string) => Promise<AssignmentInfo[] | string>;
};

// 个人工作区组件，会直接放置在 WorkspacePage 中，展示个人工作区的相关内容
// 所以自身不设定高度，而是适应父组件
//
// 这一层仍然不直接接触 API 的调用，而是通过回调获取数据
export default function Workspace({
  onLoadMyStats,
  onMyLoadAssignments,
  onLoadAssignments,
}: Props) {
  const loginState = useAppStore((s) => s.loginState);
  const { showToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("workspace");
  const [stats, setStats] = useState<UserStatsInfo | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setIsStatsLoading(true);
      try {
        const result = await onLoadMyStats();
        if (typeof result === "string") {
          console.error("Failed to load user stats:", result);
          showToast(result, "error");
        } else {
          setStats(result);
        }
      } catch (err) {
        console.error("Unexpected error loading user stats:", err);
        showToast("加载统计信息失败", "error");
      } finally {
        setIsStatsLoading(false);
      }
    };

    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userName = loginState?.userInfo.name ?? "用户";

  const workspaceBody = (
    <div className={clsx("flex h-full min-h-0 flex-col")}>
      <div className={clsx("mb-3")}>
        <p className={clsx("text-md text-slate-400")}>欢迎回来</p>
        <h1 className={clsx("mt-0.5 ml-1 text-3xl font-bold text-slate-700")}>
          {userName}
        </h1>
      </div>

      <WorkspaceStatsCards stats={stats} isLoading={isStatsLoading} />

      <div className={clsx("flex-1 min-h-0")}>
        <AssignmentList
          mode="translator"
          onMyLoadAssignments={onMyLoadAssignments}
          onLoadChapterAssignments={onLoadAssignments}
        />
      </div>
    </div>
  );

  const symbolsBody = (
    <div
      className={clsx(
        "flex h-48 items-center justify-center text-sm text-slate-400",
      )}
    >
      特殊符号功能开发中
    </div>
  );

  return (
    <WorkspaceLayout
      header={
        <WorkspaceHeaderNav activeTab={activeTab} onTabChange={setActiveTab} />
      }
      body={activeTab === "workspace" ? workspaceBody : symbolsBody}
    />
  );
}
