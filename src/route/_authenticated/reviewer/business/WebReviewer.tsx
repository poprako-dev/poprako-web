import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { useApiClient } from "@/route/business/api-context";
import { useAppStore } from "@/route/business/session/session-store";
import { getChapter } from "@/route/_authenticated/business/chapter/chapter-request";
import { listPages } from "@/route/_authenticated/business/page/page-request";
import { getIssueAssignment } from "@/route/_authenticated/business/issue/issue-request";
import { canImportIssues } from "@/route/_authenticated/business/issue/issue-import";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { WebReviewWorkspace } from "./WebReviewWorkspace";
import { IssueImportDialog } from "@/route/_authenticated/business/issue/IssueImportDialog";
import type { ReviewerProject } from "./reviewer-props";

type Props = { chapterId: string; startPageId: string; onExit: () => void };
type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      project: ReviewerProject;
      canImport: boolean;
      permissionError: string | null;
      initialPageId: string;
    };

export function WebReviewer({ chapterId, startPageId, onExit }: Props): JSX.Element {
  const client = useApiClient();
  const generation = useAppStore((state) => state.generation);
  const userId = useAppStore((state) => state.loginState?.userInfo.id);
  const [retry, setRetry] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const currentPageRef = useRef({ chapterId, entryPageId: startPageId, id: startPageId });
  const [loaded, setLoaded] = useState<{ key: string; state: State } | null>(null);
  const key = `${chapterId}:${startPageId}:${String(generation)}:${String(retry)}:${userId ?? ""}`;
  const state: State = loaded?.key === key ? loaded.state : { status: "loading" };

  useEffect(() => {
    let current = true;
    async function load(): Promise<void> {
      try {
        const [chapter, pages, assignment] = await Promise.all([
          getChapter(client, chapterId),
          listPages(client, { chapterId }),
          userId
            ? getIssueAssignment(client, chapterId, userId)
            : Promise.resolve({ success: true as const, data: undefined }),
        ]);
        if (!current) return;
        if (!chapter.success) {
          setLoaded({ key, state: { status: "error", message: chapter.error } });
          return;
        }
        if (!pages.success) {
          setLoaded({ key, state: { status: "error", message: pages.error } });
          return;
        }
        if (!pages.data.some((page) => page.id === startPageId && page.chapterId === chapterId)) {
          setLoaded({ key, state: { status: "error", message: "页面不属于当前章节" } });
          return;
        }
        const orderedPages = pages.data
          .filter((page) => page.chapterId === chapterId)
          .sort((a, b) => a.index - b.index)
          .map((page) => ({ id: page.id, index: page.index }));
        const selected = currentPageRef.current;
        const initialPageId =
          selected.chapterId === chapterId &&
          selected.entryPageId === startPageId &&
          orderedPages.some((page) => page.id === selected.id)
            ? selected.id
            : startPageId;
        setLoaded({
          key,
          state: {
            status: "ready",
            project: { chapterId, pages: orderedPages },
            canImport: assignment.success && canImportIssues(chapter.data, assignment.data),
            permissionError: assignment.success ? null : assignment.error,
            initialPageId,
          },
        });
      } catch (error) {
        if (!current) return;
        console.error("[Reviewer] 加载页面失败", { chapterId, error });
        setLoaded({
          key,
          state: {
            status: "error",
            message: error instanceof Error ? error.message : "页面加载失败",
          },
        });
      }
    }
    void load();
    return () => {
      current = false;
    };
  }, [client, chapterId, startPageId, userId, key]);

  useEffect(() => {
    function refresh(): void {
      if (document.visibilityState === "visible" && !importOpen) setRetry((value) => value + 1);
    }
    document.addEventListener("visibilitychange", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [importOpen]);

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
    <>
      {state.permissionError && (
        <div role="alert" className="absolute z-40 bg-surface-white p-2 text-sm text-text-danger">
          导入权限加载失败：{state.permissionError}
          <button
            type="button"
            onClick={() => {
              setRetry((value) => value + 1);
            }}
            className="ml-2 underline"
          >
            重试
          </button>
        </div>
      )}
      <WebReviewWorkspace
        key={key}
        project={state.project}
        startPageId={state.initialPageId}
        onImport={
          state.canImport
            ? () => {
                setImportOpen(true);
              }
            : undefined
        }
        onPageChange={(id) => {
          currentPageRef.current = { chapterId, entryPageId: startPageId, id };
        }}
        onExit={onExit}
      />
      {importOpen && state.canImport && (
        <IssueImportDialog
          key={key}
          chapterId={chapterId}
          pageIds={state.project.pages.map((page) => page.id)}
          onImported={() => {
            setImportOpen(false);
            setRetry((value) => value + 1);
          }}
          onClose={() => {
            setImportOpen(false);
          }}
        />
      )}
    </>
  );
}
