import type {
  InvitationInfo,
  CreateInvitationArgs,
  UpdateInvitationArgs,
} from "../invitation";

export type RawInvitationInfo = {
  id: string;
  invitation_code: string;
  invitee_qid: string;
  invitor_id: string;
  pending: boolean;
  role_mask: number;
  team_id: string;
  created_at: number;
};

export function unwrapRawInvitationInfo(
  raw: RawInvitationInfo,
): InvitationInfo {
  return {
    id: raw.id,
    invitationCode: raw.invitation_code,
    inviteeQq: raw.invitee_qid,
    invitorId: raw.invitor_id,
    pending: raw.pending,
    roles: raw.role_mask,
    createdAt: raw.created_at,
  } as InvitationInfo;
}

export type RawCreateInvitationArgs = {
  invitee_qid: string;
  role_mask: number;
  team_id: string;
};
export function unwrapRawCreateInvitationArgs(
  raw: RawCreateInvitationArgs,
): CreateInvitationArgs {
  return {
    teamId: raw.team_id,
    inviteeQq: raw.invitee_qid,
    roles: raw.role_mask,
  } as CreateInvitationArgs;
}

export type RawUpdateInvitationArgs = {
  id: string;
  role_mask?: number;
};
export function unwrapRawUpdateInvitationArgs(
  raw: RawUpdateInvitationArgs,
): UpdateInvitationArgs {
  return {
    id: raw.id,
    roles: raw.role_mask,
  } as UpdateInvitationArgs;
}
