import { useCallback, useState } from "react";
import { useToastStore } from "@/components/ui/NotificationToast";
import { listMembers, updateMemberRole } from "@/api/member";
import {
  listInvitations,
  createInvitation,
  deleteInvitation,
} from "@/api/invitation";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import type { MemberInfo } from "@/types/member";
import type { CreateInvitationArgs, InvitationInfo } from "@/types/invitation";
import type { Result } from "@/types/utils/result";
import { hasRole } from "@/types/role";
import { roleMask } from "@/types/role";
import type { RoleFilter } from "../../types/types";
import MemberList from "./MemberList";
import MemberInvitorModal from "./MemberInvitorModal";
import MemberDetailModal from "./MemberDetailModal";

export default function MemberGlance() {
  const { activeTeamId, activeMember } = useActiveTeam();
  const { showToast } = useToastStore();
  const [fuzzyName, setFuzzyName] = useState("");
  const [activeRole, setActiveRole] = useState<RoleFilter | null>(null);
  const [isInvitorOpen, setIsInvitorOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberInfo | null>(
    null,
  );

  const isAdmin =
    activeMember !== null && hasRole(activeMember, "admin");

  const handleLoadMembers = useCallback(
    async (offset: number, limit: number): Promise<MemberInfo[] | string> => {
      if (!activeTeamId) {
        return [];
      }

      const result = await listMembers({
        teamId: activeTeamId,
        offset,
        limit,
        includes: ["user"],
        userNicknameKeyword: fuzzyName.trim() || undefined,
        role: activeRole ? roleMask([activeRole]) : undefined,
      });

      if (!result.success) {
        showToast(result.error, "error");
        return result.error;
      }

      return result.data;
    },
    [activeRole, activeTeamId, fuzzyName, showToast],
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

  const handleUpdateRole = useCallback(
    async (id: string, roles: number): Promise<Result<void>> => {
      return updateMemberRole({ id, role_mask: roles });
    },
    [],
  );

  return (
    <div className="h-full w-full min-w-0 overflow-x-hidden p-4 sm:p-6">
      <MemberList
        fuzzyName={fuzzyName}
        onChangeFuzzyName={setFuzzyName}
        activeRole={activeRole}
        onChangeRole={setActiveRole}
        onCreateMember={() => setIsInvitorOpen(true)}
        onLoadMembers={handleLoadMembers}
        onMemberClick={isAdmin ? setSelectedMember : undefined}
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

      {selectedMember !== null && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onUpdateRole={handleUpdateRole}
        />
      )}
    </div>
  );
}
