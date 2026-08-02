import type {
  InvitationInfo,
  CreateInvitationArgs,
  UpdateInvitationArgs,
} from "../invitation";

export type RawInvitationInfo = {
  id: string;
  code: string;
  invitee_qid: string;
  invitor_id: string;
  is_pending: boolean;
  roles: number;
  team_id: string;
};

export function unwrapRawInvitationInfo(
  raw: RawInvitationInfo,
): InvitationInfo {
  return {
    id: raw.id,
    invitationCode: raw.code,
    inviteeQq: raw.invitee_qid,
    invitorId: raw.invitor_id,
    isPending: raw.is_pending,
    roles: raw.roles,
    createdAt: 0,
  } as InvitationInfo;
}

export type RawCreateInvitationArgs = {
  invitee_qid: string;
  roles: number;
  team_id: string;
};
export function unwrapRawCreateInvitationArgs(
  raw: RawCreateInvitationArgs,
): CreateInvitationArgs {
  return {
    teamId: raw.team_id,
    inviteeQq: raw.invitee_qid,
    roles: raw.roles,
  } as CreateInvitationArgs;
}

export type RawUpdateInvitationArgs = {
  id: string;
  roles?: number;
};
export function unwrapRawUpdateInvitationArgs(
  raw: RawUpdateInvitationArgs,
): UpdateInvitationArgs {
  return {
    id: raw.id,
    roles: raw.roles,
  } as UpdateInvitationArgs;
}
