import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";
import type { CanvasHandle } from "@/shared/component/PageCanvas";
import type { PageRect } from "@/shared/utility/page-geometry";
import { usePageInteraction } from "@/shared/hook/use-page-interaction";
import { useRelocationPreference } from "@/shared/hook/use-relocation-preference";
import type {
  EditorState,
  EditorCommands,
  CompletionActions,
  ReviewEditor,
} from "./review-editor-types";
import { useReviewWorkspace, type ReviewWorkspace } from "../issue/use-review-workspace";
import type { ReviewerProps } from "../reviewer-props";
import { ReviewSession } from "./review-session";
import { pageIsDirty, ReviewPageError, message, type ReviewerEditing } from "./review-editing";
import { useIssueGesture } from "./use-issue-gesture";
import { useReviewEditorLifecycle } from "./use-review-editor-lifecycle";

export type EditableReviewerProps = ReviewerProps & { editing: ReviewerEditing };

function useEditorState(props: EditableReviewerProps): EditorState {
  const session = useMemo(() => new ReviewSession(props.editing), [props.editing]);
  const pages = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [pageIndex, setPageIndex] = useState(() =>
    props.project.pages.findIndex((page) => page.id === props.startPageId),
  );
  const pageId = props.project.pages[pageIndex]?.id ?? "";
  const page = pages[pageId];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusInput, setFocusInput] = useState<string | null>(null);
  const [drawing, setDrawing] = useState<{ id: string | null } | null>(null);
  const [visible, setVisible] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const relocation = useRelocationPreference();
  return {
    session,
    pages,
    page,
    pageIndex,
    pageId,
    setPageIndex,
    selectedId,
    select: setSelectedId,
    focusInput,
    setFocusInput,
    drawing,
    setDrawing,
    visible,
    setVisible,
    deleteId,
    setDeleteId,
    confirmComplete,
    setConfirmComplete,
    completing,
    setCompleting,
    completed,
    setCompleted,
    error,
    setError,
    canvasRef,
    relocation,
  };
}
type State = EditorState;

function editorCommands(state: State, props: EditableReviewerProps): EditorCommands {
  async function perform(operation: () => Promise<void>): Promise<void> {
    state.setError(null);
    try {
      await operation();
    } catch (error) {
      state.setError(message(error));
    }
  }
  async function navigate(index: number): Promise<void> {
    const page = props.project.pages[index];
    if (!page || state.completing) return;
    await perform(async () => {
      if (state.page) await state.session.leave(state.pageId);
      state.setDrawing(null);
      state.select(null);
      state.setFocusInput(null);
      state.setPageIndex(index);
      props.onPageChange?.(page.id);
    });
  }
  function modify(id: string, patch: Partial<IssueInfo>): void {
    if (!state.page || state.completing || state.completed) return;
    state.session.commit(
      state.pageId,
      state.session
        .page(state.pageId)
        .issues.map((issue) => (issue.id === id ? { ...issue, ...patch } : issue)),
    );
  }
  function select(id: string | null, relocate = false): void {
    state.setFocusInput(null);
    state.select(id);
    const rect = state.page?.issues.find((issue) => issue.id === id)?.rect;
    if (relocate && rect && state.relocation.isRelocationEnabled)
      state.canvasRef.current?.centerOn(
        rect.xCoord + rect.width / 2,
        rect.yCoord + rect.height / 2,
      );
  }
  return {
    perform,
    navigate,
    modify,
    add: (rect) => {
      addIssue(state, rect);
    },
    select,
  };
}

function useEditorPreview(
  state: State,
  props: EditableReviewerProps,
  navigate: (index: number) => Promise<void>,
): ReviewWorkspace {
  const load = useCallback(
    (id: string, signal: AbortSignal) => state.session.load(id, signal),
    [state.session],
  );
  return useReviewWorkspace({
    pageId: state.pageId,
    pageIndex: state.pageIndex,
    pageCount: props.project.pages.length,
    active: Boolean(state.pageId),
    loadReviewPage: props.loadReviewPage,
    loadIssues: load,
    shortcuts: [],
    relocation: false,
    onToggleRelocation: state.relocation.toggleRelocation,
    onToggleVisible: () => {
      state.setVisible((visible) => !visible);
    },
    onNavigate: navigate,
    canvasRef: state.canvasRef,
  });
}

export function useReviewEditor(props: EditableReviewerProps): ReviewEditor {
  const state = useEditorState(props);
  const commands = editorCommands(state, props);
  const review = useEditorPreview(state, props, commands.navigate);
  const interaction = usePageInteraction({ imageSrc: review.page?.composite.source ?? null });
  const gesture = useIssueGesture({
    imageRef: interaction.imgRef,
    onCommit: (id, rect) => {
      const target = id ?? state.drawing?.id;
      if (target) {
        commands.modify(target, { rect });
        state.setFocusInput(target);
      } else commands.add(rect);
    },
    onCancel: () => {
      state.setDrawing(null);
    },
  });
  const actions = completionActions(state, props, commands.perform);
  const editor = {
    ...state,
    ...commands,
    ...actions,
    review,
    interaction,
    gesture,
    disabled: !state.page || Boolean(state.page.blocked) || state.completing || state.completed,
    status: saveLabel(state),
    props,
  };
  useReviewEditorLifecycle(editor);
  const { page, setDrawing } = state;
  useEffect(() => {
    if (page?.blocked) setDrawing(null);
  }, [page?.blocked, setDrawing]);
  return editor;
}
export type { ReviewEditor } from "./review-editor-types";

function saveLabel(state: State): string {
  if (state.page?.storageError) return "草稿存储失败";
  if (state.page?.blocked) return "等待核对";
  if (state.page?.saving) return "保存中";
  if (state.page?.error) return "保存失败，修改已保留";
  return state.page && pageIsDirty(state.page) ? "待保存" : "已保存";
}

function completionActions(
  state: State,
  props: EditableReviewerProps,
  perform: (run: () => Promise<void>) => Promise<void>,
): CompletionActions {
  async function complete(): Promise<void> {
    if (state.completing || state.completed) return;
    state.setCompleting(true);
    await perform(async () => {
      await completePages(state, props);
      state.setCompleted(true);
      state.setConfirmComplete(false);
    });
    state.setCompleting(false);
  }
  function save(): void {
    state.setError(null);
    if (state.page) void state.session.save(state.pageId).catch(() => undefined);
  }
  function exit(): void {
    if (state.completing) return;
    void perform(async () => {
      if (state.page) await state.session.leave(state.pageId);
      props.onExit();
    });
  }
  return { complete, save, exit };
}

function addIssue(state: State, rect: PageRect | null): void {
  if (!state.page || state.page.blocked || state.completing || state.completed) return;
  const page = state.session.page(state.pageId);
  const id = crypto.randomUUID();
  const issue: IssueInfo = {
    id,
    pageArtworkId: state.pageId,
    index: page.issues.length,
    variant: "居中",
    note: "",
    rect,
  };
  state.session.commit(state.pageId, [...page.issues, issue]);
  state.select(id);
  state.setFocusInput(id);
  state.setVisible(true);
}

async function completePages(state: State, props: EditableReviewerProps): Promise<void> {
  try {
    await state.session.complete(props.project.pages.map((page) => page.id));
  } catch (error) {
    if (error instanceof ReviewPageError) {
      state.setPageIndex(props.project.pages.findIndex((page) => page.id === error.pageId));
      state.select(null);
      state.setFocusInput(null);
      state.setDrawing(null);
      state.setConfirmComplete(false);
      props.onPageChange?.(error.pageId);
    }
    throw error;
  }
}
