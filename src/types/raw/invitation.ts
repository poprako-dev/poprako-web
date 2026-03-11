import type {
  InvitationInfo,
  CreateInvitationArgs,
  UpdateInvitationArgs,
} from "../invitation";

export type RawInvitationInfo = {
  id: string;
  invitation_code: string;
  invitee_qq: string;
  invitor_id: string;
  pending: boolean;
  roles: number;
  created_at: number;
};

export function unwrapRawInvitationInfo(
  raw: RawInvitationInfo,
): InvitationInfo {
  return {
    id: raw.id,
    invitationCode: raw.invitation_code,
    inviteeQq: raw.invitee_qq,
    invitorId: raw.invitor_id,
    pending: raw.pending,
    roles: raw.roles,
    createdAt: raw.created_at,
  } as InvitationInfo;
}

export type RawCreateInvitationArgs = {
  invitee_qq: string;
  roles: number;
  team_id: string;
};
export function unwrapRawCreateInvitationArgs(
  raw: RawCreateInvitationArgs,
): CreateInvitationArgs {
  return {
    teamId: raw.team_id,
    inviteeQq: raw.invitee_qq,
    roles: raw.roles,
  } as CreateInvitationArgs;
}

export type RawUpdateInvitationArgs = {
  id: string;
  roles?: number;
  team_id?: string;
};
export function unwrapRawUpdateInvitationArgs(
  raw: RawUpdateInvitationArgs,
): UpdateInvitationArgs {
  return {
    id: raw.id,
    roles: raw.roles,
    teamId: raw.team_id,
  } as UpdateInvitationArgs;
}
