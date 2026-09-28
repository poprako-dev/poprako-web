import { api } from "@/routes/business/request";
import type { WorksetInfo } from "@/routes/_authenticated/business/workset/workset";
import type { Result } from "@/shared/utility/result";
import type { RawWorksetInfo } from "@/routes/_authenticated/business/workset/raw-workset";
import { unwrapRawWorksetInfo } from "@/routes/_authenticated/business/workset/raw-workset";
import type {
  CreateWorksetArgs,
  ListWorksetArgs,
  RawCreateWorksetArgs,
  RawListWorksetArgs,
  RawUpdateWorksetArgs,
  UpdateWorksetArgs,
} from "@/routes/_authenticated/_shell/comic-playground/business/workset/workset-input";

export async function listWorksets(args: ListWorksetArgs): Promise<Result<WorksetInfo[]>> {
  const rawArgs: Omit<RawListWorksetArgs, "team_id"> = {
    offset: args.offset,
    limit: args.limit,
  };

  const res = await api.get<RawWorksetInfo[]>(`/teams/${args.teamId}/worksets`, rawArgs);
  if (!res.success) return res;

  return { success: true, data: res.data.map(unwrapRawWorksetInfo) };
}

export async function createWorkset(args: CreateWorksetArgs): Promise<Result<string>> {
  const rawArgs: RawCreateWorksetArgs = {
    team_id: args.teamId,
    name: args.name,
    description: args.description,
  };

  const res = await api.post<{ id: string }, RawCreateWorksetArgs>("/worksets", rawArgs);
  if (!res.success) return res;
  return { success: true, data: res.data.id };
}

export async function updateWorkset(
  id: string,
  args: UpdateWorksetArgs,
): Promise<Result<undefined>> {
  const rawArgs: RawUpdateWorksetArgs = {
    id,
    name: args.name,
    description: args.description,
  };

  const res = await api.put<undefined, RawUpdateWorksetArgs>(`/worksets/${id}`, rawArgs);
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function deleteWorkset(id: string): Promise<Result<undefined>> {
  const res = await api.delete<undefined>(`/worksets/${id}`);
  if (!res.success) return res;
  return { success: true, data: undefined };
}
