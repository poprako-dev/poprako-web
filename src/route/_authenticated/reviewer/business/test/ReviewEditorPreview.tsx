import { useMemo, useState } from "react";
import type { JSX } from "react";
import { Reviewer } from "../Reviewer";
import { createIssueStoryArgs } from "./issue-story-fixture";
import { ReviewMemorySource, type ReviewScenario } from "./review-memory-source";

type Props = { scenario: ReviewScenario; startPageId?: string; unavailable?: boolean };

export function ReviewEditorPreview({
  scenario,
  startPageId = "page-1",
  unavailable = false,
}: Props): JSX.Element {
  const fixture = useMemo(() => {
    const args = createIssueStoryArgs();
    return { ...args, editing: new ReviewMemorySource(args.loadIssues, scenario) };
  }, [scenario]);
  const [exited, setExited] = useState(false);
  if (exited)
    return (
      <div className="flex h-full items-center justify-center bg-surface-stone-100">
        <button
          type="button"
          title="返回监修"
          onClick={() => {
            setExited(false);
          }}
          className="rounded-md border border-line-stone-200 bg-surface-white px-4 py-2 text-sm text-ink-stone-700"
        >
          返回监修
        </button>
      </div>
    );
  return (
    <Reviewer
      {...fixture}
      startPageId={startPageId}
      loadReviewPage={unavailable ? null : fixture.loadReviewPage}
      onExit={() => {
        setExited(true);
      }}
    />
  );
}
