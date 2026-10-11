import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
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
type ReviewSnapshot = ReturnType<ReturnType<typeof createReviewPageController>["getSnapshot"]>;
type ReviewController = ReturnType<typeof createReviewPageController>;
type ReviewFocus = ReturnType<typeof useReviewFocus>;
type ReviewImageFailure = ReturnType<typeof useReviewImageFailure>;
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
  const { controller, snapshot } = useReviewPageState(loadIssues, loadReviewPage);
  const { focus, imageFailure } = useReviewLocalState(pageId);
  const { issuesReady, page } = getReviewPageDisplay(snapshot, pageId);
  const issues = snapshot.issues;
  useReviewControllerLifecycle(active, controller, pageId);
  const select = useReviewInteractions({
    pageId,
    pageIndex,
    pageCount,
    issues,
    issuesReady,
    relocation,
    canvasRef,
    focus: focus.set,
    focusedId: focus.focusedId,
    shortcuts,
    active,
    onNavigate,
    onToggleRelocation,
    onToggleVisible,
    clearFocus: focus.clear,
  });

  return buildReviewWorkspace({
    pageId,
    snapshot,
    page,
    issues,
    issuesReady,
    focus,
    imageFailure,
    controller,
    select,
  });
}

function useReviewLocalState(pageId: string): {
  focus: ReviewFocus;
  imageFailure: ReviewImageFailure;
} {
  return {
    focus: useReviewFocus(pageId),
    imageFailure: useReviewImageFailure(pageId),
  };
}

function getReviewPageDisplay(
  snapshot: ReviewSnapshot,
  pageId: string,
): { page: ReviewPage | null; issuesReady: boolean } {
  const ready = snapshot.pageId === pageId && snapshot.status === "ready";
  return {
    page: ready ? snapshot.page : null,
    issuesReady: snapshot.pageId === pageId && snapshot.issuesStatus === "ready",
  };
}

function useReviewPageState(
  loadIssues: LoadIssues,
  loadReviewPage: LoadReviewPage,
): { controller: ReviewController; snapshot: ReviewSnapshot } {
  const controller = useMemo(
    () => createReviewPageController(loadIssues, loadReviewPage),
    [loadIssues, loadReviewPage],
  );
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  return { controller, snapshot };
}

function useReviewInteractions(input: {
  pageId: string;
  pageIndex: number;
  pageCount: number;
  issues: IssueInfo[];
  issuesReady: boolean;
  relocation: boolean;
  canvasRef: RefObject<CanvasHandle | null>;
  focus: (focus: { pageId: string; id: string } | null) => void;
  focusedId: string | null;
  shortcuts: ConfigurableShortcut[];
  active: boolean;
  onNavigate: (index: number) => Promise<void>;
  onToggleRelocation: () => void;
  onToggleVisible: () => void;
  clearFocus: () => void;
}): (id: string, relocate: boolean) => void {
  const showToast = useToastStore((state) => state.showToast);
  const select = createReviewIssueSelection(input);
  const navigate = createReviewNavigation(
    input.pageIndex,
    input.pageCount,
    input.onNavigate,
    showToast,
  );
  useReviewShortcuts({
    active: input.active,
    pageIndex: input.pageIndex,
    shortcuts: input.shortcuts,
    navigate,
    onToggleRelocation: input.onToggleRelocation,
    onToggleVisible: input.onToggleVisible,
    moveSelection: (direction) => {
      moveReviewSelection(input.issues, input.issuesReady, input.focusedId, select, direction);
    },
  });
  useReviewEscapeKey(input.active, input.clearFocus);
  return select;
}

function moveReviewSelection(
  issues: IssueInfo[],
  ready: boolean,
  focusedId: string | null,
  select: (id: string, relocate: boolean) => void,
  direction: number,
): void {
  if (!ready || issues.length === 0) return;
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

function buildReviewWorkspace(input: {
  pageId: string;
  snapshot: ReviewSnapshot;
  page: ReviewPage | null;
  issues: IssueInfo[];
  issuesReady: boolean;
  focus: ReturnType<typeof useReviewFocus>;
  imageFailure: ReturnType<typeof useReviewImageFailure>;
  controller: ReviewController;
  select: (id: string, relocate: boolean) => void;
}): ReviewWorkspace {
  const { pageId, snapshot, page, issues, issuesReady, focus, imageFailure, controller, select } =
    input;
  return {
    page,
    issues: issuesReady ? issues : [],
    focusedId: focus.focusedId,
    loading: isReviewPageLoading(snapshot, pageId),
    error: imageFailure.failed ? "图片加载失败" : snapshot.error,
    progress: snapshot.pageId === pageId ? snapshot.progress : null,
    cancelled: snapshot.pageId === pageId && snapshot.status === "cancelled",
    cancel: controller.cancelPage,
    retry: () => {
      retryReviewPage(controller, imageFailure);
    },
    issuesError: snapshot.pageId === pageId ? snapshot.issuesError : null,
    issuesLoading: snapshot.pageId !== pageId || snapshot.issuesStatus === "loading",
    retryIssues: () => {
      void controller.retryIssues();
    },
    select,
    onImageError: imageFailure.fail,
  };
}

function isReviewPageLoading(snapshot: ReviewSnapshot, pageId: string): boolean {
  return snapshot.pageId !== pageId || snapshot.status === "loading" || snapshot.status === "idle";
}

function retryReviewPage(controller: ReviewController, imageFailure: ReviewImageFailure): void {
  imageFailure.reset();
  void controller.retryPage();
}

function useReviewFocus(pageId: string): {
  focusedId: string | null;
  set: (focus: { pageId: string; id: string } | null) => void;
  clear: () => void;
} {
  const [focus, setFocus] = useState<{ pageId: string; id: string } | null>(null);
  const [statePageId, setStatePageId] = useState(pageId);
  if (statePageId !== pageId) {
    setStatePageId(pageId);
    setFocus(null);
  }
  const clear = useCallback(() => {
    setFocus(null);
  }, []);
  return {
    focusedId: focus?.pageId === pageId ? focus.id : null,
    set: setFocus,
    clear,
  };
}

function useReviewImageFailure(pageId: string): {
  failed: boolean;
  fail: () => void;
  reset: () => void;
} {
  const [failed, setFailed] = useState(false);
  const [statePageId, setStatePageId] = useState(pageId);
  if (statePageId !== pageId) {
    setStatePageId(pageId);
    setFailed(false);
  }
  const fail = (): void => {
    setFailed(true);
  };
  const reset = (): void => {
    setFailed(false);
  };
  return { failed, fail, reset };
}

function useReviewControllerLifecycle(
  active: boolean,
  controller: ReturnType<typeof createReviewPageController>,
  pageId: string,
): void {
  useEffect(() => {
    if (!active) return;
    const current = controller.getSnapshot();
    if (current.pageId !== pageId || current.status !== "ready") void controller.load(pageId);
    return () => {
      controller.dispose();
    };
  }, [active, controller, pageId]);
  useEffect(() => {
    return () => {
      controller.dispose();
    };
  }, [controller]);
}

function createReviewIssueSelection(input: {
  pageId: string;
  issues: IssueInfo[];
  issuesReady: boolean;
  relocation: boolean;
  canvasRef: RefObject<CanvasHandle | null>;
  focus: (focus: { pageId: string; id: string } | null) => void;
}): (id: string, relocate: boolean) => void {
  return (id: string, relocate: boolean): void => {
    if (!input.issuesReady) return;
    input.focus({ pageId: input.pageId, id });
    const rect = input.issues.find((issue) => issue.id === id)?.rect;
    if (relocate && input.relocation && rect) {
      input.canvasRef.current?.centerOn(
        rect.xCoord + rect.width / 2,
        rect.yCoord + rect.height / 2,
      );
    }
  };
}

function createReviewNavigation(
  pageIndex: number,
  pageCount: number,
  onNavigate: (index: number) => Promise<void>,
  showToast: ReturnType<typeof useToastStore.getState>["showToast"],
): (index: number) => void {
  return (index: number): void => {
    if (index < 0 || index >= pageCount || index === pageIndex) return;
    void onNavigate(index).catch((error: unknown) => {
      showLocalCaughtError(error, showToast, "翻页失败，请重试");
    });
  };
}

function useReviewShortcuts(input: {
  active: boolean;
  pageIndex: number;
  shortcuts: ConfigurableShortcut[];
  navigate: (index: number) => void;
  onToggleRelocation: () => void;
  onToggleVisible: () => void;
  moveSelection: (direction: number) => void;
}): void {
  useShortcutActions(
    {
      nextMarker: () => {
        input.moveSelection(1);
      },
      prevMarker: () => {
        input.moveSelection(-1);
      },
      pageUp: () => {
        input.navigate(input.pageIndex - 1);
      },
      pageDown: () => {
        input.navigate(input.pageIndex + 1);
      },
      toggleRelocation: input.onToggleRelocation,
      toggleProofreadPreview: input.onToggleVisible,
    },
    input.shortcuts,
    !input.active,
  );
}

function useReviewEscapeKey(active: boolean, clearFocus: () => void): void {
  useEffect(() => {
    if (!active) return;
    function clear(event: KeyboardEvent): void {
      if (event.key === "Escape" && !shouldIgnoreWorkbenchKey(event)) clearFocus();
    }
    globalThis.addEventListener("keydown", clear);
    return () => {
      globalThis.removeEventListener("keydown", clear);
    };
  }, [active, clearFocus]);
}
