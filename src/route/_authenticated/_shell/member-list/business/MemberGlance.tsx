import { deleteInvitation } from "@/api/member-invitation";
import { type JSX, useCallback, useState } from "react";
import { listMembers, updateMemberRoles } from "@/api/identity/identity-api";
import {
  createInvitation,
  listInvitations,
} from "@/route/_authenticated/_shell/member-list/business/invitation/invitation-request";
import { useTeamSelection } from "@/route/business/session/use-active-team";
import { useApiClient } from "@/route/business/api-context";
import type { MemberInfo } from "@/route/business/identity/member";
import type {
  CreateInvitationArgs,
  InvitationInfo,
} from "@/route/_authenticated/_shell/member-list/business/invitation/invitation";
import type { Result } from "@/shared/utility/result";
import { hasRole } from "@/route/business/identity/role";
import { roleMask } from "@/route/business/identity/role";
import { toMemberInfo } from "@/route/business/identity/api-adapter";
import type { RoleFilter } from "@/route/_authenticated/_shell/member-list/business/member-list-type";
import { MemberList } from "@/route/_authenticated/_shell/member-list/business/MemberList";
import { MemberInvitorModal } from "@/route/_authenticated/_shell/member-list/business/MemberInvitorModal";
import { MemberDetailModal } from "@/route/_authenticated/_shell/member-list/business/MemberDetailModal";

export function MemberGlance(): JSX.Element {
  const client = useApiClient();
  const selection = useTeamSelection();
  const activeTeamId = selection.status === "ready" ? selection.activeTeamId : null;
  const [fuzzyName, setFuzzyName] = useState("");
  const [activeRole, setActiveRole] = useState<RoleFilter | null>(null);
  const [isInvitorOpen, setIsInvitorOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberInfo | null>(null);
  // 成员角色变更后自增，触发列表重新拉取
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdmin = selection.status === "ready" && hasRole(selection.activeMember, "admin");

  const handleLoadMembers = useCallback(
    async (offset: number, limit: number): Promise<Result<MemberInfo[]>> => {
      if (!activeTeamId) {
        return { success: true, data: [] };
      }

      const result = await listMembers(client, {
        teamId: activeTeamId,
        offset,
        limit,
        includes: ["user"],
        nickname: fuzzyName.trim() || undefined,
        role: activeRole ? roleMask([activeRole]) : undefined,
      });

      if (!result.success) {
        return result;
      }

      return { success: true, data: result.data.map(toMemberInfo) };
    },
    [activeRole, activeTeamId, client, fuzzyName],
  );

  const handleLoadInvitations = useCallback(
    async (offset: number, limit: number): Promise<Result<InvitationInfo[]>> => {
      if (!activeTeamId) return { success: true, data: [] };
      return listInvitations(client, {
        teamId: activeTeamId,
        offset,
        limit,
        isPending: true,
      });
    },
    [activeTeamId, client],
  );

  const handleCreateInvitation = useCallback(
    async (args: CreateInvitationArgs): Promise<Result<string>> => {
      return createInvitation(client, args);
    },
    [client],
  );

  const handleDeleteInvitation = useCallback(
    async (invitationId: string): Promise<Result<void>> => {
      return deleteInvitation(client, invitationId);
    },
    [client],
  );

  const handleUpdateRole = useCallback(
    async (id: string, roles: number): Promise<Result<void>> => {
      const result = await updateMemberRoles(client, id, roles);
      if (result.success) {
        // 触发列表整体刷新，获取服务端最新角色
        setRefreshKey((key) => key + 1);
      }
      return result;
    },
    [client],
  );

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
