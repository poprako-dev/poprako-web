import { useMemo } from "react";
import { useAppStore } from "@/routes/business/session/session-store";
import type { MemberInfo } from "@/routes/business/identity/member";

export function useActiveTeam(): {
  activeMember: MemberInfo | null;
  activeTeamId: string | null;
  activeTeam: NonNullable<MemberInfo["team"]> | null;
  teams: MemberInfo[];
} {
  const loginState = useAppStore((s) => s.loginState);
  const selectedTeamId = useAppStore((s) => s.selectedTeamId);

  return useMemo(() => {
    const teams = loginState?.memberInfos ?? [];
    const activeMember =
      teams.find((member) => member.teamId === selectedTeamId) ?? teams[0] ?? null;

    return {
      activeMember,
      activeTeamId: activeMember?.teamId ?? null,
      activeTeam: activeMember?.team ?? null,
      teams,
    };
  }, [loginState, selectedTeamId]);
}
