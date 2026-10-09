import { useCallback, useMemo } from "react";
import type { JSX } from "react";
import { useApiClient } from "@/route/business/api-context";
import { loadPageIssues } from "@/route/_authenticated/business/issue/issue-request";
import { useArtworkPages } from "./issue/use-artwork-pages";
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
  const pageIds = useMemo(() => project.pages.map((page) => page.id), [project]);
  const loadReviewPage = useArtworkPages(client, project.chapterId, pageIds);
  const loadIssues = useCallback(
    (pageId: string, signal: AbortSignal) => loadPageIssues(client, pageId, signal),
    [client],
  );
  return (
    <Reviewer
      project={project}
      startPageId={startPageId}
      loadReviewPage={loadReviewPage}
      loadIssues={loadIssues}
      onImport={onImport}
      onPageChange={onPageChange}
      onExit={onExit}
    />
  );
}
