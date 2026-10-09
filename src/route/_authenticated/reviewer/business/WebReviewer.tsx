import { useEffect, useState } from "react";
import type { JSX } from "react";
import { useApiClient } from "@/route/business/api-context";
import { getChapter } from "@/route/_authenticated/business/chapter/chapter-request";
import { listPages } from "@/route/_authenticated/business/page/page-request";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { Reviewer } from "./Reviewer";
import type { ReviewerProject } from "./reviewer-props";
type Props = { chapterId: string; startPageId: string; onExit: () => void };
type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; project: ReviewerProject };
export function WebReviewer({ chapterId, startPageId, onExit }: Props): JSX.Element {
  const client = useApiClient();
  const [loaded, setLoaded] = useState<{
    chapterId: string;
    startPageId: string;
    state: State;
  } | null>(null);
  const state: State =
    loaded?.chapterId === chapterId && loaded.startPageId === startPageId
      ? loaded.state
      : { status: "loading" };
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let current = true;
    function setState(state: State): void {
      if (current) setLoaded({ chapterId, startPageId, state });
    }
    async function load(): Promise<void> {
      setState({ status: "loading" });
      try {
        const [chapter, pages] = await Promise.all([
          getChapter(client, chapterId),
          listPages(client, { chapterId }),
        ]);
        if (!current) return;
        if (!chapter.success) {
          setState({ status: "error", message: chapter.error });
          return;
        }
        if (!pages.success) {
          setState({ status: "error", message: pages.error });
          return;
        }
        if (!pages.data.some((page) => page.id === startPageId && page.chapterId === chapterId)) {
          setState({ status: "error", message: "页面不属于当前章节" });
          return;
        }
        setState({
          status: "ready",
          project: {
            chapterId,
            pages: pages.data
              .filter((page) => page.chapterId === chapterId)
              .sort((a, b) => a.index - b.index)
              .map((page) => ({ id: page.id, index: page.index })),
          },
        });
      } catch (error) {
        if (current) {
          console.error("[Reviewer] 加载页面失败", { chapterId, error });
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "页面加载失败",
          });
        }
      }
    }
    void load();
    return () => {
      current = false;
    };
  }, [client, chapterId, startPageId, retry]);
  if (state.status === "loading")
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingCircle aria-label="正在加载页面" />
      </div>
    );
  if (state.status === "error")
    return (
      <div role="alert" className="flex h-full items-center justify-center gap-3">
        <span>{state.message}</span>
        <button
          type="button"
          onClick={() => {
            setRetry((value) => value + 1);
          }}
          className="underline"
        >
          重试
        </button>
        <button type="button" onClick={onExit} className="underline">
          返回
        </button>
      </div>
    );
  return (
    <Reviewer
      key={chapterId + startPageId}
      project={state.project}
      startPageId={startPageId}
      loadRevisionPage={null}
      loadRevisionNotes={null}
      onExit={onExit}
    />
  );
}
