import type {
  AssignmentInvitationInfo,
  CreateAssignmentInvitationArgs,
  CreateAssignmentInvitationResult,
} from "../assignmentInvitation";

export type RawAssignmentInvitationInfo = {
  id: string;
  chapter_id: string;
  code: string;
  invitee_qid: string;
  inviter_id: string;
  pending: boolean;
  roles: number;
  created_at: number;
  updated_at: number;
};

export type RawCreateAssignmentInvitationArgs = {
  chapter_id: string;
  invitee_qid: string;
  roles: number;
};

export type RawCreateAssignmentInvitationResult = {
  id: string;
  code: string;
};

export function unwrapRawAssignmentInvitationInfo(
  raw: RawAssignmentInvitationInfo,
): AssignmentInvitationInfo {
  return {
    id: raw.id,
    chapterId: raw.chapter_id,
    invitationCode: raw.code,
    inviteeQq: raw.invitee_qid,
    inviterId: raw.inviter_id,
    pending: raw.pending,
    roles: raw.roles,
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
    roles: args.roles,
  };
}

export function unwrapRawCreateAssignmentInvitationResult(
  raw: RawCreateAssignmentInvitationResult,
): CreateAssignmentInvitationResult {
  return {
    id: raw.id,
    invitationCode: raw.code,
  };
}
