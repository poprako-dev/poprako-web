import type { ApiClient } from "@/api/client";
import {
  decodeArray,
  decodeBoolean,
  decodeNumber,
  decodeObject,
  decodeString,
  decodeVoid,
} from "@/api/contract";
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

function decodeInvitation(value: unknown): ApiInvitation {
  const object = decodeObject(value, "member invitation");
  return {
    id: decodeString(object["id"], "member invitation.id"),
    code: decodeString(object["code"], "member invitation.code"),
    inviteeQid: decodeString(object["inviteeQid"], "member invitation.inviteeQid"),
    invitorId: decodeString(object["invitorId"], "member invitation.invitorId"),
    isPending: decodeBoolean(object["isPending"], "member invitation.isPending"),
    roles: decodeNumber(object["roles"], "member invitation.roles"),
    teamId: decodeString(object["teamId"], "member invitation.teamId"),
  };
}

function decodeCreatedInvitation(value: unknown): { id: string; code: string } {
  const object = decodeObject(value, "created invitation");
  return {
    id: decodeString(object["id"], "created invitation.id"),
    code: decodeString(object["code"], "created invitation.code"),
  };
}

export async function listInvitations(
  client: ApiClient,
  args: ListInvitationsArgs,
): Promise<Result<ApiInvitation[]>> {
  const result = await client.get(`/teams/${args.teamId}/member-invitations`, {
    query: {
      offset: args.offset,
      limit: args.limit,
      isPending: args.isPending,
      incl: args.includes,
    },
    decode: (value) => decodeArray(value, decodeInvitation, "member invitations"),
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
  return client.delete(`/member-invitations/${invitationId}`, { decode: decodeVoid });
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
  const result = await client.post("/member-invitations", body, {
    decode: decodeCreatedInvitation,
  });
  return result.success ? { success: true, data: result.data.code } : result;
}
