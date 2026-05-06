import { api } from "./util";
import type { Result } from "@/types/utils/result";
import type { InvitationInfo, CreateInvitationArgs } from "@/types/invitation";
import {
  unwrapRawInvitationInfo,
  type RawInvitationInfo,
} from "@/types/raw/invitation";

type ListInvitationsArgs = {
  teamId: string;
  offset: number;
  limit: number;
  includes?: Array<"invitor" | "invitee">;
  pending?: boolean;
};

export async function listInvitations(
  args: ListInvitationsArgs,
): Promise<Result<InvitationInfo[]>> {
  const result = await api.get<RawInvitationInfo[] | null>(
    "/member-invitations",
    {
    team_id: args.teamId,
    offset: args.offset,
    limit: args.limit,
    pending: args.pending,
    includes: args.includes,
    },
  );

  if (!result.success) return result;

  return {
    success: true,
    data: (result.data ?? []).map(unwrapRawInvitationInfo),
  };
}

type RawCreateInvitationBody = {
  team_id: string;
  invitee_qid: string;
  role_mask: number;
};

type CreateInvitationRes = {
  invitation_code: string;
};

export async function deleteInvitation(
  invitationId: string,
): Promise<Result<void>> {
  const result = await api.delete<void>(`/member-invitations/${invitationId}`);
  if (!result.success) return result;
  return { success: true, data: undefined };
}

export async function createInvitation(
  args: CreateInvitationArgs,
): Promise<Result<string>> {
  const body: RawCreateInvitationBody = {
    team_id: args.teamId,
    invitee_qid: args.inviteeQq,
    role_mask: args.roles,
  };

  const result = await api.post<CreateInvitationRes, RawCreateInvitationBody>(
    "/member-invitations",
    body,
  );

  if (!result.success) return result;

  return {
    success: true,
    data: result.data.invitation_code,
  };
}
