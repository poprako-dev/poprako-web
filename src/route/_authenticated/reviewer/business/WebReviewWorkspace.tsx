import { useEffect, useMemo } from "react";
import type { JSX } from "react";
import { useApiClient } from "@/route/business/api-context";
import { createChapterIssueSource } from "./issue/chapter-issue-source";
import { createArtworkPreviewLoader } from "./issue/artwork-preview-loader";
import { Reviewer } from "./Reviewer";
import type { ReviewerProject } from "./reviewer-props";
type Props = {
  project: ReviewerProject;
  startPageId: string;
  onImport?: (() => void) | undefined;
  onPageChange: (pageId: string) => void;
  onExit: () => void;
};
export function WebReviewWorkspace({
  project,
  startPageId,
  onImport,
  onPageChange,
  onExit,
}: Props): JSX.Element {
  const client = useApiClient();
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
