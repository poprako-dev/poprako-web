import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/app";
import { listMyMembers } from "@/api/member";
import type { TeamConfig } from "../types/types";

function deriveTeamConfigs(
  loginState: ReturnType<typeof useAppStore.getState>["loginState"],
): TeamConfig[] {
  if (!loginState?.memberInfos) return [];
  return loginState.memberInfos
    .filter((m) => m.team)
    .map((m) => {
      const team = m.team!;
      return {
        id: team.id,
        name: team.name,
        short: team.name[0].toUpperCase(),
        desc: team.description,
        avatarUrl: team.avatarUrl,
        isAvatarUploaded: team.isAvatarUploaded,
      };
    });
}

export function useTeamConfigs() {
  const loginState = useAppStore((s) => s.loginState);
  const setLoginState = useAppStore((s) => s.setLoginState);

  const [teamConfigs, setTeamConfigs] = useState<TeamConfig[]>(() =>
    deriveTeamConfigs(loginState),
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTeamConfigs(deriveTeamConfigs(loginState));
  }, [loginState]);

  const refreshTeams = useCallback(async () => {
    const state = useAppStore.getState().loginState;
    if (!state) return;
    const memberInfos = await listMyMembers();
    const newLoginState = { userInfo: state.userInfo, memberInfos };
    setLoginState(newLoginState);
    setTeamConfigs(deriveTeamConfigs(newLoginState));
  }, [setLoginState]);

  return { teamConfigs, refreshTeams };
}
