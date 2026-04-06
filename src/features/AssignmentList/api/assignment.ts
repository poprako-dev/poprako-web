import { api } from "@/api/util";
import {
  unwrapRawAssignmentInfo,
  type RawAssignmentInfo,
} from "@/types/raw/assignment";

export async function listMyAssignments(
  offset: number,
  limit: number,
): Promise<
  import("@/types/utils/result").Result<
    ReturnType<typeof unwrapRawAssignmentInfo>[]
  >
> {
  const result = await api.get<RawAssignmentInfo[]>(
    `/assignments/mine`,
    { offset, limit },
    true,
  );

  if (!result.success) return result;
  return { success: true, data: result.data.map(unwrapRawAssignmentInfo) };
}
