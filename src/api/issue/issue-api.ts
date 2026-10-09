import type { ApiClient } from "@/api/client";
import { decodeArray, decodeNumber, decodeObject } from "@/api/contract";
import { decodeIssue } from "./issue-contract";
import type {
  ImportChapterIssuesRequest,
  ImportChapterIssuesResult,
  IssueResponse,
} from "./issue-contract";
import type { Result } from "@/shared/utility/result";

export function listPageIssues(
  client: ApiClient,
  pageId: string,
  signal?: AbortSignal,
): Promise<Result<IssueResponse[]>> {
  return client.get(`/pages/${pageId}/issues`, {
    decode: (value) => decodeArray(value, decodeIssue, "issues"),
    ...(signal ? { signal } : {}),
  });
}

function decodeImportResult(value: unknown): ImportChapterIssuesResult {
  const object = decodeObject(value, "issue import result");
  return {
    importedPageCount: decodeNumber(object["importedPageCount"], "importedPageCount"),
    importedIssueCount: decodeNumber(object["importedIssueCount"], "importedIssueCount"),
  };
}

export function importChapterIssues(
  client: ApiClient,
  chapterId: string,
  input: ImportChapterIssuesRequest,
  signal?: AbortSignal,
): Promise<Result<ImportChapterIssuesResult>> {
  return client.post(`/chapters/${chapterId}/issues/import`, input, {
    decode: decodeImportResult,
    ...(signal ? { signal } : {}),
  });
}
