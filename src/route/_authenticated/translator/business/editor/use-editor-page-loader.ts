import { useEffect, useRef, type RefObject } from "react";
import { showLocalCaughtError } from "@/route/business/request-error";
import type { EditorProps } from "./editor-props";
import type { EditorState } from "./use-editor-state";
import type { useUnitPersistence } from "../persistence/use-unit-persistence";

type Persistence = ReturnType<typeof useUnitPersistence>;
type LoadPage = (index: number, targetUnitId?: string) => Promise<void>;
type LoadPageRef = RefObject<LoadPage | null>;
type PageLoadContext = {
  props: EditorProps;
  state: EditorState;
  persistence: Persistence;
  generationRef: RefObject<number>;
};

export function useEditorPageLoader(
  props: EditorProps,
  state: EditorState,
  persistence: Persistence,
  loadPageRef: LoadPageRef,
  loadPage: LoadPage,
): RefObject<number> {
  const generationRef = useRef(0);
  useEffect(
    () => () => {
      generationRef.current += 1;
    },
    [],
  );
  const loadPageCurrent = (index: number, targetUnitId?: string): Promise<void> =>
    loadEditorPage({ props, state, persistence, generationRef }, index, targetUnitId);
  useEffect(() => {
    loadPageRef.current = loadPageCurrent;
  });
  useInitialEditorPage(props, state, loadPage);
  return generationRef;
}

function useInitialEditorPage(props: EditorProps, state: EditorState, loadPage: LoadPage): void {
  useEffect(() => {
    if (props.project.pages.length === 0) return;
    void loadPage(state.initialPageIndex).catch((error: unknown) => {
      console.error("[BaseTranslator] 初始页面加载失败", error);
      showLocalCaughtError(error, state.showToast, "页面加载失败，请重试");
    });
  }, [loadPage, props.project.pages.length, state.initialPageIndex, state.showToast]);
}

async function loadEditorPage(
  context: PageLoadContext,
  index: number,
  targetUnitId?: string,
): Promise<void> {
  const page = context.props.project.pages[index];
  if (!page) return;
  const generation = ++context.generationRef.current;
  context.state.setIsLoadingPage(true);
  try {
    const [units, image] = await loadPageData(context.props, context.state, page.id);
    if (generation !== context.generationRef.current) return;
    context.state.setPageIndex(index);
    context.persistence.setLoadedUnits(page.id, units);
    context.state.setImageUrl(image);
    context.state.relocationSuppressedUnitIdRef.current = null;
    context.state.pendingCenteredUnitIdRef.current = targetUnitId ?? null;
    context.state.setFocusedUnitId(targetUnitId);
  } finally {
    if (generation === context.generationRef.current) context.state.setIsLoadingPage(false);
  }
}

async function loadPageData(
  props: EditorProps,
  state: EditorState,
  pageId: string,
): Promise<[Awaited<ReturnType<EditorProps["onLoadUnits"]>>, string]> {
  const units = props.drafts
    ? props.drafts.ready.then(
        () => props.drafts?.getState().drafts[pageId]?.units ?? props.onLoadUnits(pageId),
      )
    : props.onLoadUnits(pageId);
  const image = props.onLoadPageImage(pageId, state.imageQuality);
  return await Promise.all([units, image]);
}
