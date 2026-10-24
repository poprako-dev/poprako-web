import { useEffect, useMemo } from "react";
import type { JSX } from "react";
import { useApiClient } from "@/route/business/api-context";
import { createChapterIssueSource } from "./issue/chapter-issue-source";
import { createArtworkPreviewLoader } from "./issue/artwork-preview-loader";
import { Reviewer } from "./Reviewer";
import type { ReviewerProject } from "./reviewer-props";
import { createReviewHttpSource } from "./editor/review-http-source";
type Props = {
  project: ReviewerProject;
  editorAccountId?: string | undefined;
  startPageId: string;
  onImport?: (() => void) | undefined;
  onPageChange: (pageId: string) => void;
  onExit: () => void;
};
export function WebReviewWorkspace({
  project,
  editorAccountId,
  startPageId,
  onImport,
  onPageChange,
  onExit,
}: Props): JSX.Element {
  const client = useApiClient();
  const editing = useMemo(
    () =>
      editorAccountId
        ? createReviewHttpSource(client, project.chapterId, editorAccountId)
        : undefined,
    [client, project.chapterId, editorAccountId],
  );
  const chapterIssues = useMemo(() => {
    return createChapterIssueSource(client, project.chapterId);
  }, [client, project.chapterId]);
  useEffect(
    () => () => {
      chapterIssues.dispose();
    },
    [chapterIssues],
  );
  const loadReviewPage = useMemo(
    () => createArtworkPreviewLoader(client, project),
    [client, project],
  );
  return (
    <Reviewer
      {...(editing ? { editing } : {})}
      project={project}
      startPageId={startPageId}
      loadReviewPage={loadReviewPage}
      loadIssues={chapterIssues.load}
      onImport={onImport}
      onPageChange={onPageChange}
      onExit={onExit}
    />
  );
}
