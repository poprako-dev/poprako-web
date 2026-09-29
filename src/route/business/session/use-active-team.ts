import { useMemo } from "react";
import { useAppStore } from "@/route/business/session/session-store";
import type { MemberInfo } from "@/route/business/identity/member";
import type { TeamInfo } from "@/route/business/identity/team";
import { useReadySession } from "@/route/business/session/ready-session";

export type TeamSelection =
  | { status: "none"; teams: readonly MemberInfo[] }
  | {
      status: "ready";
      teams: readonly MemberInfo[];
      activeTeamId: string;
      activeMember: MemberInfo;
      activeTeam: TeamInfo;
    };

export function useTeamSelection(): TeamSelection {
  const session = useReadySession();
  const selectedTeamId = useAppStore((state) => state.selectedTeamId);

  return useMemo(() => {
    const teams = session.memberInfos;
    if (teams.length === 0) return { status: "none", teams };
    const activeMember = teams.find((member) => member.teamId === selectedTeamId) ?? teams[0];
    if (!activeMember?.team) {
      throw new Error("成员信息缺少团队详情");
    }
    return {
      status: "ready",
      teams,
      activeTeamId: activeMember.teamId,
      activeMember,
      activeTeam: activeMember.team,
    };
  }, [selectedTeamId, session]);
}
