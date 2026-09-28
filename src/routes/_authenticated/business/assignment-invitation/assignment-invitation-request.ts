import { api } from "@/routes/business/request";
import type { Result } from "@/shared/utility/result";
import type {
  AssignmentInvitationInfo,
  CreateAssignmentInvitationArgs,
  CreateAssignmentInvitationResult,
  ListAssignmentInvitationsArgs,
} from "@/routes/_authenticated/business/assignment-invitation/assignment-invitation";
import {
  unwrapRawAssignmentInvitationInfo,
  wrapCreateAssignmentInvitationArgs,
  unwrapRawCreateAssignmentInvitationResult,
  type RawAssignmentInvitationInfo,
  type RawCreateAssignmentInvitationResult,
} from "@/routes/_authenticated/business/assignment-invitation/raw-assignment-invitation";

export async function listAssignmentInvitations(
  args: ListAssignmentInvitationsArgs,
): Promise<Result<AssignmentInvitationInfo[]>> {
  const result = await api.get<RawAssignmentInvitationInfo[]>(
    `/chapters/${args.chapterId}/assignment-invitations`,
    {
      is_pending: args.isPending,
      offset: args.offset,
      limit: args.limit,
    },
  );
  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: result.data.map((item) => unwrapRawAssignmentInvitationInfo(item)),
  };
}

export async function createAssignmentInvitation(
  args: CreateAssignmentInvitationArgs,
): Promise<Result<CreateAssignmentInvitationResult>> {
  const result = await api.post<
    RawCreateAssignmentInvitationResult,
    ReturnType<typeof wrapCreateAssignmentInvitationArgs>
  >("/assignment-invitations", wrapCreateAssignmentInvitationArgs(args));
  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: unwrapRawCreateAssignmentInvitationResult(result.data),
  };
}

export async function joinAssignmentInvitation(invitationCode: string): Promise<Result<undefined>> {
  const result = await api.post<undefined, { code: string }>("/assignment-invitations/join", {
    code: invitationCode,
  });
  if (!result.success) {
    return result;
  }

  return { success: true, data: undefined };
}

export async function deleteAssignmentInvitation(invitationId: string): Promise<Result<undefined>> {
  const result = await api.delete<undefined>(`/assignment-invitations/${invitationId}`);
  if (!result.success) {
    return result;
  }

  return { success: true, data: undefined };
}
