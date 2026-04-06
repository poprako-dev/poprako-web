import { api } from "@/api/util";
import { toWorksetInfo } from "@/types/workset";
import type { WorksetInfo } from "@/types/workset";
import type { Result } from "@/types/utils/result";
import type { RawWorksetInfo } from "@/types/raw/workset";
import type {
  ListWorksetArgs,
  RawListWorksetArgs,
  CreateWorksetArgs,
  RawCreateWorksetArgs,
  UpdateWorksetArgs,
  RawUpdateWorksetArgs,
} from "../types/workset";

export async function listWorksets(
  args: ListWorksetArgs,
): Promise<Result<WorksetInfo[]>> {
  const rawArgs: RawListWorksetArgs = {
    team_id: args.teamId,
    offset: args.offset,
    limit: args.limit,
    includes: args.includes,
  };

  const res = await api.get<RawWorksetInfo[]>("/worksets", rawArgs);
  if (!res.success) return res;

  const items = Array.isArray(res.data) ? res.data : [];
  return { success: true, data: items.map((raw) => toWorksetInfo(raw)!) };
}

export async function createWorkset(
  args: CreateWorksetArgs,
): Promise<Result<string>> {
  const rawArgs: RawCreateWorksetArgs = {
    team_id: args.teamId,
    name: args.name,
    description: args.description,
  };

  const res = await api.post<{ id: string }, RawCreateWorksetArgs>(
    "/worksets",
    rawArgs,
  );
  if (!res.success) return res;
  return { success: true, data: (res.data as { id: string }).id };
}

export async function updateWorkset(
  id: string,
  args: UpdateWorksetArgs,
): Promise<Result<void>> {
  const rawArgs: RawUpdateWorksetArgs = {
    id,
    name: args.name,
    description: args.description,
  };

  const res = await api.put<void, RawUpdateWorksetArgs>(
    `/worksets/${id}`,
    rawArgs,
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function deleteWorkset(id: string): Promise<Result<void>> {
  const res = await api.delete<void>(`/worksets/${id}`);
  if (!res.success) return res;
  return { success: true, data: undefined };
}
