import type { ApiClient } from "@/api/client";
import type {
  ImportChapterIssuesRequest,
  ImportChapterIssuesResult,
  IssueResponse,
} from "./issue-contract";
import type { Result } from "@/shared/utility/result";

export function listChapterIssues(
  client: ApiClient,
  chapterId: string,
  signal?: AbortSignal,
): Promise<Result<IssueResponse[]>> {
  return client.get<IssueResponse[]>(`/chapters/${chapterId}/issues`, {
    ...(signal ? { signal } : {}),
  });
}

export function importChapterIssues(
  client: ApiClient,
  chapterId: string,
  input: ImportChapterIssuesRequest,
  signal?: AbortSignal,
): Promise<Result<ImportChapterIssuesResult>> {
  return client.post<ImportChapterIssuesResult>(`/chapters/${chapterId}/issues/import`, input, {
    ...(signal ? { signal } : {}),
  });
}
