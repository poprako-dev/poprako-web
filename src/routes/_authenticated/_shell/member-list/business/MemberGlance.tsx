import { type JSX, useCallback, useState } from "react";
import { listMembers, updateMemberRole } from "@/routes/business/identity/member-request";
import {
  createInvitation,
  deleteInvitation,
  listInvitations,
} from "@/routes/_authenticated/_shell/member-list/business/invitation/invitation-request";
import { useActiveTeam } from "@/routes/business/session/use-active-team";
import type { MemberInfo } from "@/routes/business/identity/member";
import type {
  CreateInvitationArgs,
  InvitationInfo,
} from "@/routes/_authenticated/_shell/member-list/business/invitation/invitation";
import type { Result } from "@/shared/utility/result";
import { hasRole } from "@/routes/business/identity/role";
import { roleMask } from "@/routes/business/identity/role";
import type { RoleFilter } from "@/routes/_authenticated/_shell/member-list/business/member-list-type";
import { MemberList } from "@/routes/_authenticated/_shell/member-list/business/MemberList";
import { MemberInvitorModal } from "@/routes/_authenticated/_shell/member-list/business/MemberInvitorModal";
import { MemberDetailModal } from "@/routes/_authenticated/_shell/member-list/business/MemberDetailModal";

export function MemberGlance(): JSX.Element {
  const { activeTeamId, activeMember } = useActiveTeam();
  const [fuzzyName, setFuzzyName] = useState("");
  const [activeRole, setActiveRole] = useState<RoleFilter | null>(null);
  const [isInvitorOpen, setIsInvitorOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberInfo | null>(null);
  // 成员角色变更后自增，触发列表重新拉取
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdmin = activeMember !== null && hasRole(activeMember, "admin");

  const handleLoadMembers = useCallback(
    async (offset: number, limit: number): Promise<Result<MemberInfo[]>> => {
      if (!activeTeamId) {
        return { success: true, data: [] };
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
        return result;
      }

      return result;
    },
    [activeRole, activeTeamId, fuzzyName],
  );

  const handleLoadInvitations = useCallback(
    async (offset: number, limit: number): Promise<Result<InvitationInfo[]>> => {
      if (!activeTeamId) return { success: true, data: [] };
      return listInvitations({
        teamId: activeTeamId,
        offset,
        limit,
        isPending: true,
      });
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

  const handleUpdateRole = useCallback(async (id: string, roles: number): Promise<Result<void>> => {
    const result = await updateMemberRole({ id, roles });
    if (result.success) {
      // 触发列表整体刷新，获取服务端最新角色
      setRefreshKey((key) => key + 1);
    }
    return result;
  }, []);

  return (
    <div className="h-full w-full min-w-0 overflow-x-hidden p-4 sm:p-6">
      <MemberList
        key={refreshKey}
        fuzzyName={fuzzyName}
        onChangeFuzzyName={setFuzzyName}
        activeRole={activeRole}
        onChangeRole={setActiveRole}
        onCreateMember={() => {
          setIsInvitorOpen(true);
        }}
        onLoadMembers={handleLoadMembers}
        onMemberClick={isAdmin ? setSelectedMember : undefined}
      />

      {isInvitorOpen && activeTeamId && (
        <MemberInvitorModal
          teamId={activeTeamId}
          onClose={() => {
            setIsInvitorOpen(false);
          }}
          onLoadInvitations={handleLoadInvitations}
          onCreateInvitation={handleCreateInvitation}
          onDeleteInvitation={handleDeleteInvitation}
        />
      )}

      {selectedMember !== null && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => {
            setSelectedMember(null);
          }}
          onUpdateRole={handleUpdateRole}
        />
      )}
    </div>
  );
}
