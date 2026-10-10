import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { RefObject } from "react";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalCaughtError } from "@/route/business/request-error";
import { useShortcutActions } from "@/shared/hook/use-shortcut-actions";
import { shouldIgnoreWorkbenchKey } from "@/shared/utility/keyboard-scope";
import type { ConfigurableShortcut } from "@/shared/utility/shortcut";
import type { CanvasHandle } from "@/shared/component/PageCanvas";
import type { LoadIssues, IssueInfo } from "@/route/_authenticated/business/issue/issue";
import type { LoadReviewPage, ReviewPage } from "./review-page";
import { createReviewPageController } from "./review-page-controller";
import type { ReviewLoadProgress } from "./review-load-progress";
type Args = {
  pageId: string;
  pageIndex: number;
  pageCount: number;
  active: boolean;
  loadIssues: LoadIssues;
  loadReviewPage: LoadReviewPage;
  shortcuts: ConfigurableShortcut[];
  relocation: boolean;
  onToggleRelocation: () => void;
  onToggleVisible: () => void;
  onNavigate: (index: number) => Promise<void>;
  canvasRef: RefObject<CanvasHandle | null>;
};
export type ReviewWorkspace = {
  page: ReviewPage | null;
  issues: IssueInfo[];
  focusedId: string | null;
  loading: boolean;
  error: string | null;
  progress: ReviewLoadProgress | null;
  cancelled: boolean;
  cancel: () => void;
  issuesError: string | null;
  issuesLoading: boolean;
  retryIssues: () => void;
  retry: () => void;
  select: (id: string, relocate: boolean) => void;
  onImageError: () => void;
};
export function useReviewWorkspace({
  pageId,
  pageIndex,
  pageCount,
  active,
  loadIssues,
  loadReviewPage,
  shortcuts,
  relocation,
  onToggleRelocation,
  onToggleVisible,
  onNavigate,
  canvasRef,
}: Args): ReviewWorkspace {
  const controller = useMemo(
    () => createReviewPageController(loadIssues, loadReviewPage),
    [loadIssues, loadReviewPage],
  );
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const [focus, setFocus] = useState<{ pageId: string; id: string } | null>(null);
  const focusedId = focus?.pageId === pageId ? focus.id : null;
  const [imageFailed, setImageFailed] = useState(false);
  const [statePageId, setStatePageId] = useState(pageId);
  if (statePageId !== pageId) {
    setStatePageId(pageId);
    setFocus(null);
    setImageFailed(false);
  }

  const showToast = useToastStore((state) => state.showToast);
  const ready = snapshot.pageId === pageId && snapshot.status === "ready";
  const issuesReady = snapshot.pageId === pageId && snapshot.issuesStatus === "ready";
  const page = ready ? snapshot.page : null;
  const issues = snapshot.issues;

  useEffect(() => {
    if (!active) return;
    const current = controller.getSnapshot();
    if (current.pageId !== pageId || current.status !== "ready") void controller.load(pageId);
    return () => {
      controller.dispose();
    };
  }, [active, controller, pageId]);
  useEffect(
    () => () => {
      controller.dispose();
    },
    [controller],
  );

  function retry(): void {
    setImageFailed(false);
    void controller.retryPage();
  }
  function select(id: string, relocate: boolean): void {
    if (!issuesReady) return;
    setFocus({ pageId, id });
    const rect = issues.find((issue) => issue.id === id)?.rect;
    if (relocate && relocation && rect)
      canvasRef.current?.centerOn(rect.xCoord + rect.width / 2, rect.yCoord + rect.height / 2);
  }
  function navigate(index: number): void {
    if (index < 0 || index >= pageCount || index === pageIndex) return;
    void onNavigate(index).catch((error: unknown) => {
      showLocalCaughtError(error, showToast, "翻页失败，请重试");
    });
  }
  function moveSelection(direction: number): void {
    if (!issuesReady || issues.length === 0) return;
    const index = issues.findIndex((issue) => issue.id === focusedId);
    const nextIndex =
      index < 0
        ? direction > 0
          ? 0
          : issues.length - 1
        : (index + direction + issues.length) % issues.length;
    const next = issues[nextIndex];
    if (next) select(next.id, true);
  }
  useShortcutActions(
    {
      nextMarker: () => {
        moveSelection(1);
      },
      prevMarker: () => {
        moveSelection(-1);
      },
      pageUp: () => {
        navigate(pageIndex - 1);
      },
      pageDown: () => {
        navigate(pageIndex + 1);
      },
      toggleRelocation: onToggleRelocation,
      toggleProofreadPreview: () => {
        onToggleVisible();
      },
    },
    shortcuts,
    !active,
  );
  useEffect(() => {
    if (!active) return;
    function clear(event: KeyboardEvent): void {
      if (event.key === "Escape" && !shouldIgnoreWorkbenchKey(event)) setFocus(null);
    }
    globalThis.addEventListener("keydown", clear);
    return () => {
      globalThis.removeEventListener("keydown", clear);
    };
  }, [active]);

  return {
    page,
    issues: issuesReady ? issues : [],
    focusedId,
    loading:
      snapshot.pageId !== pageId || snapshot.status === "loading" || snapshot.status === "idle",
    error: imageFailed ? "图片加载失败" : snapshot.error,
    progress: snapshot.pageId === pageId ? snapshot.progress : null,
    cancelled: snapshot.pageId === pageId && snapshot.status === "cancelled",
    cancel: controller.cancelPage,
    retry,
    issuesError: snapshot.pageId === pageId ? snapshot.issuesError : null,
    issuesLoading: snapshot.pageId !== pageId || snapshot.issuesStatus === "loading",
    retryIssues() {
      void controller.retryIssues();
    },
    select,
    onImageError() {
      setImageFailed(true);
    },
  };
}
