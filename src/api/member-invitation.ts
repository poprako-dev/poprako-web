import type { ApiClient } from "@/api/client";
import type { Result } from "@/shared/utility/result";

export type ListInvitationsArgs = {
  teamId: string;
  offset: number;
  limit: number;
  includes?: ("invitor" | "invitee")[] | undefined;
  isPending?: boolean | undefined;
};

export type ApiInvitation = {
  id: string;
  code: string;
  inviteeQid: string;
  invitorId: string;
  isPending: boolean;
  roles: number;
  teamId: string;
};

export async function listInvitations(
  client: ApiClient,
  args: ListInvitationsArgs,
): Promise<Result<ApiInvitation[]>> {
  const result = await client.get<ApiInvitation[]>(`/teams/${args.teamId}/member-invitations`, {
    query: {
      offset: args.offset,
      limit: args.limit,
      isPending: args.isPending,
      incl: args.includes,
    },
  });
  return result;
}

export type CreateInvitationBody = {
  teamId: string;
  inviteeQid: string;
  roles: number;
};

export async function deleteInvitation(
  client: ApiClient,
  invitationId: string,
): Promise<Result<undefined>> {
  return client.delete<undefined>(`/member-invitations/${invitationId}`);
}

export async function createInvitation(
  client: ApiClient,
  args: CreateInvitationBody,
): Promise<Result<string>> {
  const body: CreateInvitationBody = {
    teamId: args.teamId,
    inviteeQid: args.inviteeQid,
    roles: args.roles,
  };
  const result = await client.post<{ id: string; code: string }>("/member-invitations", body);
  return result.success ? { success: true, data: result.data.code } : result;
}
