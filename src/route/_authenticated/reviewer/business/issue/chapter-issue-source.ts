import type { ApiClient } from "@/api/client";
import { loadChapterIssues } from "@/route/_authenticated/business/issue/issue-request";
import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";
export interface ChapterIssueSource {
  load: (id: string, signal: AbortSignal) => Promise<IssueInfo[]>;
  dispose: () => void;
}
export function createChapterIssueSource(client: ApiClient, chapterId: string): ChapterIssueSource {
  let request = new AbortController();
  let pending: Promise<IssueInfo[]> | null = null;
  async function load(id: string, signal: AbortSignal): Promise<IssueInfo[]> {
    if (request.signal.aborted) request = new AbortController();
    const currentRequest = request;
    pending ??= loadChapterIssues(client, chapterId, request.signal).catch((error: unknown) => {
      if (request === currentRequest) pending = null;
      throw error;
    });
    const issues = await pending;
    signal.throwIfAborted();
    return issues.filter((issue) => issue.pageArtworkId === id);
  }
  return {
    load,
    dispose() {
      request.abort();
      pending = null;
    },
  };
}
