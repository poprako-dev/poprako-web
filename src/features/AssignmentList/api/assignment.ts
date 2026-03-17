import { api } from "@/api/util";
import {
  unwrapRawAssignmentInfo,
  type RawAssignmentInfo,
} from "@/types/raw/assignment";

export async function listMyAssignments(offset: number, limit: number) {
  const assignmets = await api.get<RawAssignmentInfo[]>(
    `/assignments/mine`,
    {
      offset,
      limit,
    },
    true,
  );

  if (typeof assignmets === "string") {
    return assignmets;
  }
  if (Array.isArray(assignmets)) {
    return assignmets.map(unwrapRawAssignmentInfo);
  }
}
