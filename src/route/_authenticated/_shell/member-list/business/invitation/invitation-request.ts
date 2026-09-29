import type { ApiClient } from "@/api/client";
import {
  listInvitations as listResponses,
  createInvitation as createResponse,
} from "@/api/member-invitation";
import type { ApiInvitation, ListInvitationsArgs } from "@/api/member-invitation";
import type { CreateInvitationArgs, InvitationInfo } from "./invitation";
import type { Result } from "@/shared/utility/result";
function toInvitationInfo(invitation: ApiInvitation): InvitationInfo {
  return {
    id: invitation.id,
    invitationCode: invitation.code,
    inviteeQq: invitation.inviteeQid,
    invitorId: invitation.invitorId,
    isPending: invitation.isPending,
    roles: invitation.roles,
  };
}

export async function listInvitations(
  client: ApiClient,
  args: ListInvitationsArgs,
): Promise<Result<InvitationInfo[]>> {
  const result = await listResponses(client, args);
  return result.success ? { success: true, data: result.data.map(toInvitationInfo) } : result;
}
export function createInvitation(
  client: ApiClient,
  args: CreateInvitationArgs,
): Promise<Result<string>> {
  const { inviteeQq, ...value } = args;
  return createResponse(client, { ...value, inviteeQid: inviteeQq });
}
