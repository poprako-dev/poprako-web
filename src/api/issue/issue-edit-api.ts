import type { Result } from "@/shared/utility/result";
import type { ApiClient } from "@/api/client";
import type {
  PageIssuesResponse,
  SavePageIssuesRequest,
  SavePageIssuesResponse,
  IssueVariantsResponse,
  RenameIssueVariantRequest,
  RenameIssueVariantResponse,
} from "./issue-contract";

export function getPageIssues(
  client: ApiClient,
  pageId: string,
  signal?: AbortSignal,
): Promise<Result<PageIssuesResponse>> {
  return client.get<PageIssuesResponse>(`/page-artworks/${pageId}/issues`, { signal });
}

export function savePageIssues(
  client: ApiClient,
  pageId: string,
  input: SavePageIssuesRequest,
  saveId: string,
): Promise<Result<SavePageIssuesResponse>> {
  return client.post<SavePageIssuesResponse>(`/page-artworks/${pageId}/issues/save`, input, {
    query: { saveId },
  });
}

export function listIssueVariants(
  client: ApiClient,
  chapterId: string,
): Promise<Result<IssueVariantsResponse>> {
  return client.get<IssueVariantsResponse>(`/chapters/${chapterId}/issues/variants`);
}

export function renameIssueVariant(
  client: ApiClient,
  chapterId: string,
  input: RenameIssueVariantRequest,
): Promise<Result<RenameIssueVariantResponse>> {
  return client.post<RenameIssueVariantResponse>(
    `/chapters/${chapterId}/issues/variants/rename`,
    input,
  );
}
