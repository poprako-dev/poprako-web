import type { ApiClient } from "@/api/client";
import type { Result } from "@/shared/utility/result";

export type ComicArchives = Record<string, string[]>;

export function exportComicArchives(
  client: ApiClient,
  teamId: string,
  months: readonly string[] | undefined,
  signal: AbortSignal,
): Promise<Result<ComicArchives>> {
  return client.get<ComicArchives>(`/teams/${teamId}/comic-archives/export`, {
    query: { month: months },
    signal,
  });
}
