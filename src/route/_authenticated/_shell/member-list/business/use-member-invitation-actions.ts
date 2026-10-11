import { useCallback } from "react";
import { deleteInvitation } from "@/api/member-invitation";
import {
  createInvitation,
  listInvitations,
} from "@/route/_authenticated/_shell/member-list/business/invitation/invitation-request";
import { useApiClient } from "@/route/business/api-context";
import type {
  CreateInvitationArgs,
  InvitationInfo,
} from "@/route/_authenticated/_shell/member-list/business/invitation/invitation";
import type { Result } from "@/shared/utility/result";

export function useMemberInvitationActions(activeTeamId: string | null): {
  loadInvitations: (offset: number, limit: number) => Promise<Result<InvitationInfo[]>>;
  createInvitationForTeam: (args: CreateInvitationArgs) => Promise<Result<string>>;
  deleteInvitationFromTeam: (invitationId: string) => Promise<Result<void>>;
} {
  const client = useApiClient();
  const loadInvitations = useCallback(
    async (offset: number, limit: number): Promise<Result<InvitationInfo[]>> => {
      if (!activeTeamId) {
        return { success: true, data: [] };
      }
      return listInvitations(client, { teamId: activeTeamId, offset, limit, isPending: true });
    },
    [activeTeamId, client],
  );
  const createInvitationForTeam = useCallback(
    async (args: CreateInvitationArgs): Promise<Result<string>> => createInvitation(client, args),
    [client],
  );
  const deleteInvitationFromTeam = useCallback(
    async (invitationId: string): Promise<Result<void>> => deleteInvitation(client, invitationId),
    [client],
  );
  return { loadInvitations, createInvitationForTeam, deleteInvitationFromTeam };
}
