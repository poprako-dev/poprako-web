import { api } from "./util";
import type { Result } from "@/types/utils/result";
import type {
  AssignmentInvitationInfo,
  CreateAssignmentInvitationArgs,
  CreateAssignmentInvitationResult,
  ListAssignmentInvitationsArgs,
} from "@/types/assignmentInvitation";
import {
  unwrapRawAssignmentInvitationInfo,
  wrapCreateAssignmentInvitationArgs,
  unwrapRawCreateAssignmentInvitationResult,
  type RawAssignmentInvitationInfo,
  type RawCreateAssignmentInvitationResult,
} from "@/types/raw/assignmentInvitation";

export async function listAssignmentInvitations(
  args: ListAssignmentInvitationsArgs,
): Promise<Result<AssignmentInvitationInfo[]>> {
  const result = await api.get<RawAssignmentInvitationInfo[]>(
    "/assignment-invitations",
    {
      chapter_id: args.chapterId,
      pending: args.pending,
      offset: args.offset,
      limit: args.limit,
    },
  );
  if (!result.success) return result;

  return {
    success: true,
    data: (result.data ?? []).map(unwrapRawAssignmentInvitationInfo),
  };
}

export async function createAssignmentInvitation(
  args: CreateAssignmentInvitationArgs,
): Promise<Result<CreateAssignmentInvitationResult>> {
  const result = await api.post<
    RawCreateAssignmentInvitationResult,
    ReturnType<typeof wrapCreateAssignmentInvitationArgs>
  >(
    "/assignment-invitations",
    wrapCreateAssignmentInvitationArgs(args),
  );
  if (!result.success) return result;

  return {
    success: true,
    data: unwrapRawCreateAssignmentInvitationResult(result.data),
  };
}

export async function joinAssignmentInvitation(
  invitationCode: string,
): Promise<Result<void>> {
  const result = await api.post<void, { invitation_code: string }>(
    "/assignment-invitations/join",
    { invitation_code: invitationCode },
  );
  if (!result.success) return result;

  return { success: true, data: undefined };
}

export async function deleteAssignmentInvitation(
  invitationId: string,
): Promise<Result<void>> {
  const result = await api.delete<void>(`/assignment-invitations/${invitationId}`);
  if (!result.success) return result;

  return { success: true, data: undefined };
}
