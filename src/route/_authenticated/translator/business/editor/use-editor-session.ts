import { useCallback, useRef } from "react";
import { unitId } from "@/route/_authenticated/translator/business/unit/unit";
import { useDetachableSpecialCharsBar } from "@/route/_authenticated/translator/business/preference/use-detachable-special-chars-bar";
import type { UnitTextPart } from "@/route/_authenticated/translator/business/contract/unit-search-transform";
import { useUnitPersistence } from "@/route/_authenticated/translator/business/persistence/use-unit-persistence";
import { translatorCompletionStage } from "@/route/_authenticated/translator/business/contract/access";
import type { EditorProps } from "./editor-props";
import { useEditorState, type EditorState } from "./use-editor-state";
import { useEditorUnitActions } from "./use-editor-unit-actions";
import { useEditorKeyboard } from "./use-editor-keyboard";
import { createEditorSearchCoordinator } from "./editor-search-coordinator";
import { useEditorPageLoader } from "./use-editor-page-loader";
import { createEditorSessionActions } from "./use-editor-session-actions";
import type { EditorSession } from "./editor-session-type";
import { assembleEditorSession } from "./editor-session-assembler";
export type { EditorSession } from "./editor-session-type";

type Persistence = ReturnType<typeof useUnitPersistence>;
type Actions = ReturnType<typeof useEditorUnitActions>;
type SearchCoordinator = ReturnType<typeof createEditorSearchCoordinator>;
type SpecialCharsBar = ReturnType<typeof useDetachableSpecialCharsBar>;
type CompletionStage = ReturnType<typeof translatorCompletionStage>;
type SessionCollaborators = {
  persistence: Persistence;
  actions: Actions;
  keyboard: ReturnType<typeof useEditorKeyboard>;
  commands: ReturnType<typeof createEditorSessionActions>;
  completionStage: CompletionStage;
  canInsertSpecialChar: boolean;
  isSpecialCharsBarVisible: boolean;
  specialCharsBar: SpecialCharsBar;
  searchCoordinator: SearchCoordinator;
  unitSearchPart: UnitTextPart;
};

export function useEditorSession(props: EditorProps): EditorSession {
  const state = useEditorState(props);
  const collaborators = useEditorCollaborators(props, state);
  return assembleEditorSession({
    props,
    state,
    ...collaborators,
  });
}

function useEditorCollaborators(props: EditorProps, state: EditorState): SessionCollaborators {
  const completionStage = translatorCompletionStage(props);
  const { persistence, pageGenerationRef } = useEditorPersistenceSetup(props, state);
  const specialBar = useEditorSpecialCharsBar(props, state);
  const canInsertSpecialChar = canInsertSpecialCharacter(state, specialBar.visible);
  const { commands, actions, keyboard } = useEditorActionCollaborators(
    props,
    state,
    persistence,
    completionStage,
    pageGenerationRef,
    canInsertSpecialChar,
  );
  const unitSearchPart = editorSearchPart(state.view);
  const searchCoordinator = createEditorSearchCoordinatorForSession(
    props,
    state,
    persistence,
    actions,
    unitSearchPart,
  );
  return {
    persistence,
    actions,
    keyboard,
    commands,
    completionStage,
    canInsertSpecialChar,
    isSpecialCharsBarVisible: specialBar.visible,
    specialCharsBar: specialBar.bar,
    searchCoordinator,
    unitSearchPart,
  };
}

function useEditorPersistenceSetup(
  props: EditorProps,
  state: EditorState,
): { persistence: Persistence; pageGenerationRef: ReturnType<typeof useEditorPageLoader> } {
  const loadPageRef = useRef<((index: number, targetUnitId?: string) => Promise<void>) | null>(
    null,
  );
  const loadPage = useCallback((index: number, targetUnitId?: string) => {
    const callback = loadPageRef.current;
    return callback ? callback(index, targetUnitId) : Promise.resolve();
  }, []);
  const persistence = useUnitPersistence({
    drafts: props.drafts,
    canWrite: props.canWrite,
    registerLeaveGuard: props.registerLeaveGuard,
    onSaveUnits: props.onSaveUnits,
    onReloadUnits: props.onLoadUnits,
    onExit: props.onExit,
    showToast: state.showToast,
    loadPage,
    setUnitBuf: state.setUnitBuf,
    autoSaveEnabled:
      !state.isLoadingPage &&
      !state.isReadOnly &&
      !state.isUnitSearchTransformOpen &&
      !state.isCompletingStage,
  });
  const pageGenerationRef = useEditorPageLoader(props, state, persistence, loadPageRef, loadPage);
  return { persistence, pageGenerationRef };
}

function useEditorActionCollaborators(
  props: EditorProps,
  state: EditorState,
  persistence: Persistence,
  completionStage: CompletionStage,
  pageGenerationRef: ReturnType<typeof useEditorPageLoader>,
  canInsertSpecialChar: boolean,
): Pick<SessionCollaborators, "commands" | "actions" | "keyboard"> {
  const commands = createEditorSessionActions(
    props,
    state,
    persistence,
    completionStage,
    pageGenerationRef,
  );
  const actions = useEditorUnitActions({
    ...props,
    ...state,
    ...persistence,
    canInsertSpecialChar,
  });
  const keyboard = useEditorKeyboard({
    ...props,
    ...state,
    ...persistence,
    ...actions,
    handleSave: commands.handleSave,
  });
  return { commands, actions, keyboard };
}

function useEditorSpecialCharsBar(
  props: EditorProps,
  state: EditorState,
): {
  visible: boolean;
  bar: SpecialCharsBar;
} {
  const suspended = isSpecialCharsBarSuspended(state);
  const visible = !state.isReadOnly && !suspended;
  const bar = useDetachableSpecialCharsBar({
    enabled: visible,
    interactionKey: JSON.stringify([
      props.project.id,
      state.pageIndex,
      state.focusedUnitId,
      state.view,
      state.isLoadingPage,
      state.isCompletingStage,
      state.canEditView,
    ]),
  });
  return { visible, bar };
}

function isSpecialCharsBarSuspended(state: EditorState): boolean {
  return (
    state.isShortcutPanelOpen ||
    state.isSpecialCharPanelOpen ||
    state.isUnitSearchTransformOpen ||
    state.deleteConfirmUnitId !== undefined ||
    state.isCompleteConfirmOpen
  );
}

function canInsertSpecialCharacter(state: EditorState, barVisible: boolean): boolean {
  return (
    state.canEditView &&
    !state.isLoadingPage &&
    !state.isCompletingStage &&
    barVisible &&
    state.unitBuf.some((unit) => unitId(unit) === state.focusedUnitId)
  );
}

function editorSearchPart(view: EditorState["view"]): UnitTextPart {
  return view === "translate" ? "translatedText" : "proofreadText";
}

function createEditorSearchCoordinatorForSession(
  props: EditorProps,
  state: EditorState,
  persistence: Persistence,
  actions: Actions,
  part: UnitTextPart,
): SearchCoordinator {
  return createEditorSearchCoordinator({
    dataSource: props.unitSearchTransform,
    part,
    currentPageId: props.project.pages[state.pageIndex]?.id,
    flush: () => persistence.flushIfDirty(false),
    runExclusive: persistence.runExclusive,
    refreshCurrentPage: persistence.refreshUnits,
    navigate: actions.handleSearchResultNavigate,
  });
}
