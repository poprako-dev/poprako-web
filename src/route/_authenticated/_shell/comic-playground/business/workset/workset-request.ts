import type { ApiClient } from "@/api/client";
import * as worksetApi from "@/api/workset/workset-api";
import { toWorksetInfo } from "@/route/_authenticated/business/content-adapter";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import type { Result } from "@/shared/utility/result";
import type { CreateWorksetArgs, ListWorksetArgs, UpdateWorksetArgs } from "./workset-input";
import { invalidateWorksets } from "./workset-cache";
import { useAppStore } from "@/route/business/session/session-store";
export async function listWorksets(
  client: ApiClient,
  args: ListWorksetArgs,
): Promise<Result<WorksetInfo[]>> {
  const result = await worksetApi.listWorksets(
    client,
    args.teamId,
    args.offset,
    args.limit,
    args.signal,
  );
  return result.success ? { success: true, data: result.data.map(toWorksetInfo) } : result;
}
export async function createWorkset(
  client: ApiClient,
  args: CreateWorksetArgs,
): Promise<Result<string>> {
  const generation = useAppStore.getState().generation;
  const result = await worksetApi.createWorkset(client, args);
  if (result.success) invalidateWorksets(client, generation, args.teamId);
  return result;
}
export async function updateWorkset(
  client: ApiClient,
  id: string,
  args: UpdateWorksetArgs,
): Promise<Result<undefined>> {
  const generation = useAppStore.getState().generation;
  const result = await worksetApi.updateWorkset(client, id, args);
  if (result.success) invalidateWorksets(client, generation);
  return result;
}
export async function deleteWorkset(client: ApiClient, id: string): Promise<Result<undefined>> {
  const generation = useAppStore.getState().generation;
  const result = await worksetApi.deleteWorkset(client, id);
  if (result.success) invalidateWorksets(client, generation);
  return result;
}
