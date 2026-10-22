import type { AssignmentResponse } from "./content-contract";
import type { ApiClient } from "./client";
import type { Result } from "@/shared/utility/result";

export type AssignmentInvitation = {
  id: string;
  chapterId: string;
  inviterId: string;
  inviteeQid: string;
  code: string;
  isPending: boolean;
  roles: number;
  createdAt: number;
  updatedAt: number;
};

type ListArgs = {
  chapterId: string;
  isPending?: boolean;
  offset: number;
  limit: number;
};

type CreateArgs = { chapterId: string; inviteeQid: string; roles: number };
export type CreatedAssignmentInvitation = { id: string; code: string };

export function listAssignmentInvitations(
  client: ApiClient,
  { chapterId, ...query }: ListArgs,
): Promise<Result<AssignmentInvitation[]>> {
  return client.get<AssignmentInvitation[]>(`/chapters/${chapterId}/assignment-invitations`, {
    query,
  });
}

export function createAssignmentInvitation(
  client: ApiClient,
  input: CreateArgs,
): Promise<Result<CreatedAssignmentInvitation>> {
  return client.post<CreatedAssignmentInvitation>("/assignment-invitations", input);
}

export function joinAssignmentInvitation(
  client: ApiClient,
  code: string,
): Promise<Result<AssignmentResponse>> {
  return client.post<AssignmentResponse>("/assignment-invitations/join", { code });
}

export function deleteAssignmentInvitation(
  client: ApiClient,
  invitationId: string,
): Promise<Result<undefined>> {
  return client.delete<undefined>(`/assignment-invitations/${invitationId}`);
}
