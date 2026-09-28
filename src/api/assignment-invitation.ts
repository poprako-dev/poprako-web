import { decodeAssignment, type AssignmentResponse } from "./content-contract";
import type { ApiClient } from "./client";
import {
  decodeArray,
  decodeBoolean,
  decodeNumber,
  decodeObject,
  decodeString,
  decodeVoid,
} from "./contract";
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

function decodeInvitation(value: unknown): AssignmentInvitation {
  const record = decodeObject(value, "assignment invitation");
  return {
    id: decodeString(record["id"], "invitation.id"),
    chapterId: decodeString(record["chapterId"], "invitation.chapterId"),
    inviterId: decodeString(record["inviterId"], "invitation.inviterId"),
    inviteeQid: decodeString(record["inviteeQid"], "invitation.inviteeQid"),
    code: decodeString(record["code"], "invitation.code"),
    isPending: decodeBoolean(record["isPending"], "invitation.isPending"),
    roles: decodeNumber(record["roles"], "invitation.roles"),
    createdAt: decodeNumber(record["createdAt"], "invitation.createdAt"),
    updatedAt: decodeNumber(record["updatedAt"], "invitation.updatedAt"),
  };
}

function decodeCreated(value: unknown): CreatedAssignmentInvitation {
  const record = decodeObject(value, "created assignment invitation");
  return { id: decodeString(record["id"]), code: decodeString(record["code"]) };
}

export function listAssignmentInvitations(
  client: ApiClient,
  { chapterId, ...query }: ListArgs,
): Promise<Result<AssignmentInvitation[]>> {
  return client.get(`/chapters/${chapterId}/assignment-invitations`, {
    query,
    decode: (value) => decodeArray(value, decodeInvitation),
  });
}

export function createAssignmentInvitation(
  client: ApiClient,
  input: CreateArgs,
): Promise<Result<CreatedAssignmentInvitation>> {
  return client.post("/assignment-invitations", input, { decode: decodeCreated });
}

export function joinAssignmentInvitation(
  client: ApiClient,
  code: string,
): Promise<Result<AssignmentResponse>> {
  return client.post("/assignment-invitations/join", { code }, { decode: decodeAssignment });
}

export function deleteAssignmentInvitation(
  client: ApiClient,
  invitationId: string,
): Promise<Result<undefined>> {
  return client.delete(`/assignment-invitations/${invitationId}`, { decode: decodeVoid });
}
