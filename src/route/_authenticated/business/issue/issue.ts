import type { IssueResponse, ImportChapterIssuesRequest } from "@/api/issue/issue-contract";
export type IssueInfo = IssueResponse;
export type ChapterIssuesInput = ImportChapterIssuesRequest;
export type LoadIssues = (pageId: string, signal: AbortSignal) => Promise<IssueInfo[]>;
