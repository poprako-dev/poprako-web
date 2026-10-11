import { type JSX, useCallback, useState } from "react";
import { updateMemberRoles } from "@/api/identity/identity-api";
import { useTeamSelection } from "@/route/business/session/use-active-team";
import { useApiClient } from "@/route/business/api-context";
import type { MemberInfo } from "@/route/business/identity/member";
import type { Result } from "@/shared/utility/result";
import { hasRole } from "@/route/business/identity/role";
import type { RoleFilter } from "@/route/_authenticated/_shell/member-list/business/member-list-type";
import { MemberList } from "@/route/_authenticated/_shell/member-list/business/MemberList";
import { MemberInvitorModal } from "@/route/_authenticated/_shell/member-list/business/MemberInvitorModal";
import { MemberDetailModal } from "@/route/_authenticated/_shell/member-list/business/MemberDetailModal";
import { useMemberGlanceLoader } from "@/route/_authenticated/_shell/member-list/business/use-member-glance-loader";
import { useMemberInvitationActions } from "@/route/_authenticated/_shell/member-list/business/use-member-invitation-actions";

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

  const handleLoadMembers = useMemberGlanceLoader(activeTeamId, fuzzyName, activeRole);
  const { loadInvitations, createInvitationForTeam, deleteInvitationFromTeam } =
    useMemberInvitationActions(activeTeamId);

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
          onLoadInvitations={loadInvitations}
          onCreateInvitation={createInvitationForTeam}
          onDeleteInvitation={deleteInvitationFromTeam}
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
