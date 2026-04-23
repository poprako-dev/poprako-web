import { useCallback, useEffect, useMemo, useState } from "react";
import { useToastStore } from "@/components/ui/NotificationToast";
import { listMembers } from "@/api/member";
import { listInvitations, createInvitation, deleteInvitation } from "@/api/invitation";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import type { MemberInfo } from "@/types/member";
import type { CreateInvitationArgs, InvitationInfo } from "@/types/invitation";
import type { Result } from "@/types/utils/result";
import { hasRole } from "@/types/role";
import type { RoleFilter } from "../../types/types";
import MemberList from "./MemberList";
import MemberInvitorModal from "./MemberInvitorModal";

function matchesName(member: MemberInfo, fuzzyName: string) {
  const keyword = fuzzyName.trim().toLowerCase();
  if (!keyword) return true;

  const name = member.user?.name?.toLowerCase() ?? "";
  const qq = member.user?.qq?.toLowerCase() ?? "";
  return name.includes(keyword) || qq.includes(keyword);
}

function matchesRoles(member: MemberInfo, activeRoles: RoleFilter[]) {
  if (activeRoles.length === 0) return true;
  return activeRoles.every((role) => hasRole(member, role));
}

export default function MemberGlance() {
  const { activeTeamId } = useActiveTeam();
  const { showToast } = useToastStore();
  const [fuzzyName, setFuzzyName] = useState("");
  const [activeRoles, setActiveRoles] = useState<RoleFilter[]>([]);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [isInvitorOpen, setIsInvitorOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadMembers = async () => {
      if (!activeTeamId) {
        setMembers([]);
        return;
      }

      const result = await listMembers({
        teamId: activeTeamId,
        offset: 0,
        limit: 200,
        includes: ["user"],
      });

      if (isCancelled) return;

      if (!result.success) {
        setMembers([]);
        showToast(result.error, "error");
        return;
      }

      setMembers(result.data);
    };

    loadMembers();

    return () => {
      isCancelled = true;
    };
  }, [activeTeamId, showToast]);

  const filteredMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          matchesName(member, fuzzyName) && matchesRoles(member, activeRoles),
      ),
    [activeRoles, fuzzyName, members],
  );

  const handleLoadMembers = useCallback(
    async (offset: number, limit: number): Promise<MemberInfo[] | string> => {
      return filteredMembers.slice(offset, offset + limit);
    },
    [filteredMembers],
  );

  const handleLoadInvitations = useCallback(
    async (offset: number, limit: number): Promise<Result<InvitationInfo[]>> => {
      if (!activeTeamId) return { success: true, data: [] };
      return listInvitations({ teamId: activeTeamId, offset, limit });
    },
    [activeTeamId],
  );

  const handleCreateInvitation = useCallback(
    async (args: CreateInvitationArgs): Promise<Result<string>> => {
      return createInvitation(args);
    },
    [],
  );

  const handleDeleteInvitation = useCallback(
    async (invitationId: string): Promise<Result<void>> => {
      return deleteInvitation(invitationId);
    },
    [],
  );

  return (
    <div className="h-full w-full min-w-0 overflow-x-hidden p-4 sm:p-6">
      <MemberList
        fuzzyName={fuzzyName}
        onChangeFuzzyName={setFuzzyName}
        activeRoles={activeRoles}
        onChangeRoles={setActiveRoles}
        onCreateMember={() => setIsInvitorOpen(true)}
        onLoadMembers={handleLoadMembers}
      />

      {isInvitorOpen && activeTeamId && (
        <MemberInvitorModal
          teamId={activeTeamId}
          onClose={() => setIsInvitorOpen(false)}
          onLoadInvitations={handleLoadInvitations}
          onCreateInvitation={handleCreateInvitation}
          onDeleteInvitation={handleDeleteInvitation}
        />
      )}
    </div>
  );
}
