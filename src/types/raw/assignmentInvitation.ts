import type {
  AssignmentInvitationInfo,
  CreateAssignmentInvitationArgs,
  CreateAssignmentInvitationResult,
} from "../assignmentInvitation";

export type RawAssignmentInvitationInfo = {
  id: string;
  chapter_id: string;
  invitation_code: string;
  invitee_qid: string;
  inviter_id: string;
  pending: boolean;
  role_mask: number;
  created_at: number;
  updated_at: number;
};

export type RawCreateAssignmentInvitationArgs = {
  chapter_id: string;
  invitee_qid: string;
  role_mask: number;
};

export type RawCreateAssignmentInvitationResult = {
  id: string;
  invitation_code: string;
};

export function unwrapRawAssignmentInvitationInfo(
  raw: RawAssignmentInvitationInfo,
): AssignmentInvitationInfo {
  return {
    id: raw.id,
    chapterId: raw.chapter_id,
    invitationCode: raw.invitation_code,
    inviteeQq: raw.invitee_qid,
    inviterId: raw.inviter_id,
    pending: raw.pending,
    roles: raw.role_mask,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function wrapCreateAssignmentInvitationArgs(
  args: CreateAssignmentInvitationArgs,
): RawCreateAssignmentInvitationArgs {
  return {
    chapter_id: args.chapterId,
    invitee_qid: args.inviteeQq,
    role_mask: args.roles,
  };
}

export function unwrapRawCreateAssignmentInvitationResult(
  raw: RawCreateAssignmentInvitationResult,
): CreateAssignmentInvitationResult {
  return {
    id: raw.id,
    invitationCode: raw.invitation_code,
  };
}
