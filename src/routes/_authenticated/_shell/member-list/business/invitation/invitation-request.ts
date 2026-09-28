import { api } from "@/routes/business/request";
import type { Result } from "@/shared/utility/result";
import type {
  CreateInvitationArgs,
  InvitationInfo,
} from "@/routes/_authenticated/_shell/member-list/business/invitation/invitation";
import {
  type RawInvitationInfo,
  unwrapRawInvitationInfo,
} from "@/routes/_authenticated/_shell/member-list/business/invitation/raw-invitation";

type ListInvitationsArgs = {
  teamId: string;
  offset: number;
  limit: number;
  includes?: ("invitor" | "invitee")[] | undefined;
  isPending?: boolean | undefined;
};

export async function listInvitations(
  args: ListInvitationsArgs,
): Promise<Result<InvitationInfo[]>> {
  const result = await api.get<RawInvitationInfo[] | null>(
    `/teams/${args.teamId}/member-invitations`,
    {
      offset: args.offset,
      limit: args.limit,
      is_pending: args.isPending,
      incl: args.includes,
    },
  );

  if (!result.success) return result;

  return {
    success: true,
    data: result.data?.map((item) => unwrapRawInvitationInfo(item)) ?? [],
  };
}

type RawCreateInvitationBody = {
  team_id: string;
  invitee_qid: string;
  roles: number;
};

type CreateInvitationRes = {
  code: string;
};

export async function deleteInvitation(invitationId: string): Promise<Result<undefined>> {
  const result = await api.delete<undefined>(`/member-invitations/${invitationId}`);
  if (!result.success) return result;
  return { success: true, data: undefined };
}

export async function createInvitation(args: CreateInvitationArgs): Promise<Result<string>> {
  const body: RawCreateInvitationBody = {
    team_id: args.teamId,
    invitee_qid: args.inviteeQq,
    roles: args.roles,
  };

  const result = await api.post<CreateInvitationRes, RawCreateInvitationBody>(
    "/member-invitations",
    body,
  );

  if (!result.success) return result;

  return {
    success: true,
    data: result.data.code,
  };
}
