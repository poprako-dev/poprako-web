import { Workspace } from "@/features/Workspace";
import { listMyAssignments } from "@/features/AssignmentList/api/assignment";
import type { UserStatsInfo } from "@/types/userStats";
import type { AssignmentInfo } from "@/types/assignment";
import { api } from "@/api/util";
import {
  unwrapRawAssignmentInfo,
  type RawAssignmentInfo,
} from "@/types/raw/assignment";

async function loadMyStats(): Promise<UserStatsInfo | string> {
  const result = await api.get<UserStatsInfo>(
    "/users/me/stats",
    undefined,
    true,
  );
  if (typeof result === "string") return result;
  return result;
}

async function loadMyAssignments(
  offset: number,
  limit: number,
): Promise<AssignmentInfo[] | string> {
  const result = await listMyAssignments(offset, limit);
  return result ?? "加载分工列表失败";
}

async function loadAssignments(
  chapterId: string,
): Promise<AssignmentInfo[] | string> {
  const result = await api.get<RawAssignmentInfo[]>(
    `/assignments`,
    { chapterId },
    true,
  );
  if (typeof result === "string") return result;
  if (Array.isArray(result)) return result.map(unwrapRawAssignmentInfo);
  return "加载章节分工失败";
}

export default function WorkspacePage() {
  return (
    <div className="h-full">
      <Workspace
        onLoadMyStats={loadMyStats}
        onMyLoadAssignments={loadMyAssignments}
        onLoadAssignments={loadAssignments}
      />
    </div>
  );
}
