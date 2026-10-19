import type { ApiClient } from "@/api/client";
import {
  createTeamTermbase as createTeamTermbaseApi,
  importTeamTermbase as importTeamTermbaseApi,
  listTeamTermbases as listTeamTermbasesApi,
} from "@/api/terminology/termbase";
import type { Result } from "@/shared/utility/result";
import type { TermbaseInfo } from "./termbase";
import type { ImportTermbaseResult } from "./termbase-input";
import type { CreateTermbaseArgs, ListTermbasesArgs } from "./terminology-contract";
import { toTermbaseInfo } from "./termbase-request";

export async function listTeamTermbases(
  client: ApiClient,
  teamId: string,
  args: ListTermbasesArgs,
): Promise<Result<TermbaseInfo[]>> {
  const result = await listTeamTermbasesApi(client, teamId, args);
  if (!result.success) return result;
  return { success: true, data: result.data.map(toTermbaseInfo) };
}

export async function createTeamTermbase(
  client: ApiClient,
  teamId: string,
  args: CreateTermbaseArgs,
): Promise<Result<string>> {
  const result = await createTeamTermbaseApi(client, { teamId, ...args });
  if (!result.success) return result;
  return { success: true, data: result.data.id };
}

export function importTeamTermbase(
  client: ApiClient,
  teamId: string,
  content: string,
): Promise<Result<ImportTermbaseResult>> {
  let document: unknown;
  try {
    document = JSON.parse(content);
  } catch (error) {
    console.error("[TeamTerminology] 解析术语库 JSON 失败", error);
    return Promise.resolve({ success: false, error: "术语库文件不是有效的 JSON" });
  }
  return importTeamTermbaseApi(client, teamId, document);
}
