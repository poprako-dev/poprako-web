import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { RefObject } from "react";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalCaughtError } from "@/route/business/request-error";
import { useShortcutActions } from "../editor/use-shortcut-actions";
import { shouldIgnoreTranslatorKey } from "../editor/keyboard-scope";
import type { ConfigurableShortcut } from "../shortcut/base-translator-type";
import type { CanvasHandle } from "../canvas/Canvas";
import type { LoadRevisionNotes, RevisionNote } from "./revision-note";
import { includesRevisionLayer } from "./revision-page";
import type { LoadRevisionPage, RevisionPage } from "./revision-page";
import { createRevisionPageController } from "./revision-page-controller";
import { useRevisionPreview } from "./use-revision-preview";
type Args = {
  pageId: string;
  pageIndex: number;
  pageCount: number;
  active: boolean;
  loadRevisionNotes: LoadRevisionNotes;
  loadRevisionPage: LoadRevisionPage;
  shortcuts: ConfigurableShortcut[];
  relocation: boolean;
  onToggleRelocation: () => void;
  onToggleVisible: () => void;
  onNavigate: (index: number) => Promise<void>;
  canvasRef: RefObject<CanvasHandle | null>;
};
export type RevisionWorkspace = {
  page: RevisionPage | null;
  notes: RevisionNote[];
  focusedId: string | null;
  layerId: string | null;
  isolated: boolean;
  preview: ReturnType<typeof useRevisionPreview>;
  loading: boolean;
  error: string | null;
  retry: () => void;
  select: (id: string, relocate: boolean) => void;
  selectLayer: (id: string | null) => void;
  toggleIsolated: () => void;
  onImageError: () => void;
};
export function useRevisionWorkspace({
  pageId,
  pageIndex,
  pageCount,
  active,
  loadRevisionNotes,
  loadRevisionPage,
  shortcuts,
  relocation,
  onToggleRelocation,
  onToggleVisible,
  onNavigate,
  canvasRef,
}: Args): RevisionWorkspace {
  const controller = useMemo(
    () => createRevisionPageController(loadRevisionNotes, loadRevisionPage),
    [loadRevisionNotes, loadRevisionPage],
  );
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const [focus, setFocus] = useState<{ pageId: string; id: string } | null>(null);
  const focusedId = focus?.pageId === pageId ? focus.id : null;
  const [selection, setSelection] = useState<{ pageId: string; id: string | null } | null>(null);
  const layerId = selection?.pageId === pageId ? selection.id : null;
  const [isolated, setIsolated] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [statePageId, setStatePageId] = useState(pageId);
  if (statePageId !== pageId) {
    setStatePageId(pageId);
    setFocus(null);
    setSelection(null);
    setIsolated(false);
    setImageFailed(false);
  }

  const showToast = useToastStore((state) => state.showToast);
  const ready = snapshot.pageId === pageId && snapshot.status === "ready";
  const page = ready ? snapshot.page : null;
  const layer = page?.layers.find((item) => item.id === layerId);
  const isolatedActive = isolated && Boolean(layer?.canPreview);
  const preview = useRevisionPreview(page, layerId, isolatedActive && active);
  const notes = snapshot.notes.filter((note) =>
    includesRevisionLayer(page?.layers ?? [], layerId, note.layerId),
  );

  useEffect(() => {
    if (!active) return;
    const current = controller.getSnapshot();
    if (current.pageId !== pageId || current.status !== "ready") void controller.load(pageId);
    return () => {
      controller.cancel();
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
    void controller.load(pageId);
  }
  function select(id: string, relocate: boolean): void {
    if (!ready) return;
    setFocus({ pageId, id });
    const rect = notes.find((note) => note.id === id)?.rect;
    if (relocate && relocation && rect)
      canvasRef.current?.centerOn(rect.xCoord + rect.width / 2, rect.yCoord + rect.height / 2);
  }
  function selectLayer(id: string | null): void {
    setSelection({ pageId, id });
    setFocus(null);
    const bounds = page?.layers.find((item) => item.id === id)?.bounds;
    if (relocation && bounds)
      canvasRef.current?.centerOn(
        bounds.xCoord + bounds.width / 2,
        bounds.yCoord + bounds.height / 2,
      );
  }
  function navigate(index: number): void {
    if (index < 0 || index >= pageCount || index === pageIndex) return;
    void onNavigate(index).catch((error: unknown) => {
      showLocalCaughtError(error, showToast, "翻页失败，请重试");
    });
  }
  function moveSelection(direction: number): void {
    if (!ready || notes.length === 0) return;
    const index = notes.findIndex((note) => note.id === focusedId);
    const nextIndex =
      index < 0
        ? direction > 0
          ? 0
          : notes.length - 1
        : (index + direction + notes.length) % notes.length;
    const next = notes[nextIndex];
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
      if (event.key === "Escape" && !shouldIgnoreTranslatorKey(event)) setFocus(null);
    }
    globalThis.addEventListener("keydown", clear);
    return () => {
      globalThis.removeEventListener("keydown", clear);
    };
  }, [active]);

  return {
    page,
    notes: ready ? notes : [],
    focusedId,
    layerId,
    isolated: isolatedActive,
    preview,
    loading: !ready && snapshot.status !== "error",
    error: imageFailed ? "图片加载失败" : snapshot.error,
    retry,
    select,
    selectLayer,
    toggleIsolated() {
      setIsolated((value) => !value);
    },
    onImageError() {
      setImageFailed(true);
    },
  };
}
