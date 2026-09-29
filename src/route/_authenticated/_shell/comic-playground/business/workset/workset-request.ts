import type { ApiClient } from "@/api/client";
import * as worksetApi from "@/api/workset/workset-api";
import { toWorksetInfo } from "@/route/_authenticated/business/content-adapter";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import type { Result } from "@/shared/utility/result";
import type { CreateWorksetArgs, ListWorksetArgs, UpdateWorksetArgs } from "./workset-input";
export async function listWorksets(
  client: ApiClient,
  args: ListWorksetArgs,
): Promise<Result<WorksetInfo[]>> {
  const result = await worksetApi.listWorksets(client, args.teamId, args.offset, args.limit);
  return result.success ? { success: true, data: result.data.map(toWorksetInfo) } : result;
}
export function createWorkset(client: ApiClient, args: CreateWorksetArgs): Promise<Result<string>> {
  return worksetApi.createWorkset(client, args);
}
export function updateWorkset(
  client: ApiClient,
  id: string,
  args: UpdateWorksetArgs,
): Promise<Result<undefined>> {
  return worksetApi.updateWorkset(client, id, args);
}
export function deleteWorkset(client: ApiClient, id: string): Promise<Result<undefined>> {
  return worksetApi.deleteWorkset(client, id);
}
