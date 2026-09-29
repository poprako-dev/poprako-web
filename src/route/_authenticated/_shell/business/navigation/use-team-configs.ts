import { useMemo } from "react";
import { useReadySession } from "@/route/business/session/ready-session";
import { useRefreshLoginState } from "@/route/business/session/use-refresh-session";
import { toApiRequestError } from "@/route/business/request-error";
import { useCallback } from "react";
import type { TeamConfig } from "./app-sidebar-type";

export function useTeamConfigs(): { teamConfigs: TeamConfig[]; refreshTeams: () => Promise<void> } {
  const session = useReadySession();
  const refresh = useRefreshLoginState();
  const teamConfigs = useMemo(
    () =>
      session.memberInfos.map(({ team }) => ({
        id: team.id,
        name: team.name,
        short: team.name[0]?.toUpperCase() ?? "",
        desc: team.description,
        avatarUrl: team.avatarUrl,
        avatarThumbnailUrl: team.avatarThumbnailUrl,
      })),
    [session.memberInfos],
  );
  const refreshTeams = useCallback(async () => {
    const result = await refresh();
    if (!result.success) throw toApiRequestError(result);
  }, [refresh]);
  return { teamConfigs, refreshTeams };
}
