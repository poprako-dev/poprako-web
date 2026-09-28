import { useCallback, useEffect, useState } from "react";
import { useAppStore } from "@/routes/business/session/session-store";
import { listMyMembers } from "@/routes/business/identity/member-request";
import type { TeamConfig } from "@/routes/_authenticated/_shell/business/navigation/app-sidebar-type";

function deriveTeamConfigs(
  loginState: ReturnType<typeof useAppStore.getState>["loginState"],
): TeamConfig[] {
  if (!loginState?.memberInfos) return [];
  return loginState.memberInfos.flatMap((member) => {
    const team = member.team;
    if (!team) return [];
    return [
      {
        id: team.id,
        name: team.name,
        short: team.name[0]?.toUpperCase() ?? "",
        desc: team.description,
        avatarUrl: team.avatarUrl,
        avatarThumbnailUrl: team.avatarThumbnailUrl,
      },
    ];
  });
}

export function useTeamConfigs(): {
  teamConfigs: TeamConfig[];
  refreshTeams: () => Promise<void>;
} {
  const loginState = useAppStore((s) => s.loginState);

  const [teamConfigs, setTeamConfigs] = useState<TeamConfig[]>(() => deriveTeamConfigs(loginState));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect, @eslint-react/set-state-in-effect
    setTeamConfigs(deriveTeamConfigs(loginState));
  }, [loginState]);

  const refreshTeams = useCallback(async () => {
    const state = useAppStore.getState().loginState;
    if (!state) return;
    const memberInfos = await listMyMembers({ ownerId: state.userInfo.id });
    const newLoginState = { userInfo: state.userInfo, memberInfos };
    useAppStore.getState().setLoginState(newLoginState);
    setTeamConfigs(deriveTeamConfigs(newLoginState));
  }, []);

  return { teamConfigs, refreshTeams };
}
