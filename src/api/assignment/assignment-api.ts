import { decodeAssignment } from "@/api/content-contract";
import type { AssignmentResponse } from "@/api/content-contract";
import type { ApiClient } from "@/api/client";
import { decodeArray, decodeVoid } from "@/api/contract";
import type { Result } from "@/shared/utility/result";

export type ListAssignmentsQuery = (
  | { chapterId: string; ownerId?: never }
  | { ownerId: string; chapterId?: never }
) & {
  includes?: readonly string[] | undefined;
  offset: number;
  limit: number;
};

export function listAssignments(
  client: ApiClient,
  query: ListAssignmentsQuery,
): Promise<Result<AssignmentResponse[]>> {
  return client.get("/assignments", {
    query: {
      chapterId: query.chapterId,
      ownerId: query.ownerId,
      incl: query.includes,
      offset: query.offset,
      limit: query.limit,
    },
    decode: (value) => decodeArray(value, decodeAssignment, "assignments"),
  });
}

export function upsertAssignment(
  client: ApiClient,
  chapterId: string,
  userId: string,
  roles: number,
): Promise<Result<undefined>> {
  return client.put(
    `/chapters/${chapterId}/assignments/${userId}/roles`,
    {
      chapterId,
      userId,
      roles,
    },
    { decode: decodeVoid },
  );
}

export function deleteAssignment(
  client: ApiClient,
  assignmentId: string,
): Promise<Result<undefined>> {
  return client.delete(`/assignments/${assignmentId}`, { decode: decodeVoid });
}
