import type { ApiClient } from "@/api/client";
import type { Result } from "@/shared/utility/result";

export type AppendTermbaseBody = {
  terms: { source: string; targets: string[]; comment?: string | null }[];
};

export type AppendTermbaseResult = { added: number; updated: number; unchanged: number };

function isAppendResult(value: unknown): value is AppendTermbaseResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const counts = value as Record<string, unknown>;
  return [counts["added"], counts["updated"], counts["unchanged"]].every(
    (count) => typeof count === "number" && Number.isSafeInteger(count) && count >= 0,
  );
}

export async function appendTermbase(
  client: ApiClient,
  id: string,
  document: AppendTermbaseBody,
): Promise<Result<AppendTermbaseResult>> {
  const result = await client.post<unknown>(`/termbases/${id}/append`, document);
  if (!result.success) return result;
  if (!isAppendResult(result.data)) {
    return { success: false, error: "追加结果格式无效", failureKind: "protocol" };
  }
  return { success: true, data: result.data };
}
