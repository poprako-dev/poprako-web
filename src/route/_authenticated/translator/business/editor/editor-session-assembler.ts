import type { UnitTextPart } from "@/route/_authenticated/translator/business/contract/unit-search-transform";
import type { useUnitPersistence } from "@/route/_authenticated/translator/business/persistence/use-unit-persistence";
import type { translatorCompletionStage } from "@/route/_authenticated/translator/business/contract/access";
import type { EditorProps } from "./editor-props";
import type { EditorState } from "./use-editor-state";
import type { useEditorUnitActions } from "./use-editor-unit-actions";
import type { useEditorKeyboard } from "./use-editor-keyboard";
import type { createEditorSearchCoordinator } from "./editor-search-coordinator";
import type { createEditorSessionActions } from "./use-editor-session-actions";
import type { useDetachableSpecialCharsBar } from "@/route/_authenticated/translator/business/preference/use-detachable-special-chars-bar";
import type { EditorSession } from "./editor-session-type";

type Persistence = ReturnType<typeof useUnitPersistence>;
type Actions = ReturnType<typeof useEditorUnitActions>;
type Keyboard = ReturnType<typeof useEditorKeyboard>;
type SearchCoordinator = ReturnType<typeof createEditorSearchCoordinator>;
type SpecialCharsBar = ReturnType<typeof useDetachableSpecialCharsBar>;
type CompletionStage = ReturnType<typeof translatorCompletionStage>;

type SessionAppearanceState = Pick<
  EditorSession,
  | "canEditView"
  | "canSwitchView"
  | "canvasRef"
  | "configurableShortcuts"
  | "deleteConfirmUnitId"
  | "fixedShortcuts"
  | "focusedUnitId"
  | "hasCompletedStage"
  | "imageUrl"
  | "isCompleteConfirmOpen"
  | "isCompletingStage"
  | "isHighResolution"
  | "isLoadingPage"
  | "isPageStatsOpen"
  | "isReadOnly"
  | "isRelocationEnabled"
  | "isShortcutPanelOpen"
  | "isSpecialCharPanelOpen"
  | "isUnitCreationEnabled"
  | "isUnitSearchTransformOpen"
  | "nextView"
  | "pageIndex"
  | "proofreadPreviewVisibility"
  | "unitBuf"
  | "view"
>;

export function assembleEditorSession(input: {
  props: EditorProps;
  state: EditorState;
  persistence: Persistence;
  actions: Actions;
  keyboard: Keyboard;
  commands: ReturnType<typeof createEditorSessionActions>;
  completionStage: CompletionStage;
  canInsertSpecialChar: boolean;
  isSpecialCharsBarVisible: boolean;
  specialCharsBar: SpecialCharsBar;
  searchCoordinator: SearchCoordinator;
  unitSearchPart: UnitTextPart;
}): EditorSession {
  return {
    ...sessionAppearance(input.state),
    ...sessionActions(input.actions, input.commands, input.keyboard, input.canInsertSpecialChar),
    ...sessionData(
      input.props,
      input.persistence,
      input.completionStage,
      input.searchCoordinator,
      input.unitSearchPart,
    ),
    isSpecialCharsBarVisible: input.isSpecialCharsBarVisible,
    specialCharsBar: input.specialCharsBar,
  };
}

function sessionAppearance(
  state: EditorState,
): Pick<
  EditorSession,
  | "canEditView"
  | "canSwitchView"
  | "canvasRef"
  | "configurableShortcuts"
  | "deleteConfirmUnitId"
  | "fixedShortcuts"
  | "focusedUnitId"
  | "hasCompletedStage"
  | "imageUrl"
  | "isCompleteConfirmOpen"
  | "isCompletingStage"
  | "isHighResolution"
  | "isLoadingPage"
  | "isPageStatsOpen"
  | "isReadOnly"
  | "isRelocationEnabled"
  | "isShortcutPanelOpen"
  | "isSpecialCharPanelOpen"
  | "isUnitCreationEnabled"
  | "isUnitSearchTransformOpen"
  | "nextView"
  | "pageIndex"
  | "proofreadPreviewVisibility"
  | "setDeleteConfirmUnitId"
  | "setIsCompleteConfirmOpen"
  | "setIsPageStatsOpen"
  | "setIsShortcutPanelOpen"
  | "setIsSpecialCharPanelOpen"
  | "setIsUnitCreationEnabled"
  | "setIsUnitSearchTransformOpen"
  | "setProofreadPreviewVisibility"
  | "specialCharInsertRequest"
  | "toggleRelocation"
  | "unitBuf"
  | "updateConfigurableShortcuts"
  | "view"
> {
  return {
    ...sessionAppearanceState(state),
    ...sessionAppearanceControls(state),
  };
}

function sessionAppearanceState(state: EditorState): SessionAppearanceState {
  return {
    canEditView: state.canEditView,
    canSwitchView: state.canSwitchView,
    canvasRef: state.canvasRef,
    configurableShortcuts: state.configurableShortcuts,
    deleteConfirmUnitId: state.deleteConfirmUnitId,
    fixedShortcuts: state.fixedShortcuts,
    focusedUnitId: state.focusedUnitId,
    hasCompletedStage: state.hasCompletedStage,
    imageUrl: state.imageUrl,
    isCompleteConfirmOpen: state.isCompleteConfirmOpen,
    isCompletingStage: state.isCompletingStage,
    isHighResolution: state.isHighResolution,
    isLoadingPage: state.isLoadingPage,
    isPageStatsOpen: state.isPageStatsOpen,
    isReadOnly: state.isReadOnly,
    isRelocationEnabled: state.isRelocationEnabled,
    isShortcutPanelOpen: state.isShortcutPanelOpen,
    isSpecialCharPanelOpen: state.isSpecialCharPanelOpen,
    isUnitCreationEnabled: state.isUnitCreationEnabled,
    isUnitSearchTransformOpen: state.isUnitSearchTransformOpen,
    nextView: state.nextView,
    pageIndex: state.pageIndex,
    proofreadPreviewVisibility: state.proofreadPreviewVisibility,
    unitBuf: state.unitBuf,
    view: state.view,
  };
}

function sessionAppearanceControls(
  state: EditorState,
): Pick<
  EditorSession,
  | "setDeleteConfirmUnitId"
  | "setIsCompleteConfirmOpen"
  | "setIsPageStatsOpen"
  | "setIsShortcutPanelOpen"
  | "setIsSpecialCharPanelOpen"
  | "setIsUnitCreationEnabled"
  | "setIsUnitSearchTransformOpen"
  | "setProofreadPreviewVisibility"
  | "specialCharInsertRequest"
  | "toggleRelocation"
  | "updateConfigurableShortcuts"
> {
  return {
    setDeleteConfirmUnitId: state.setDeleteConfirmUnitId,
    setIsCompleteConfirmOpen: state.setIsCompleteConfirmOpen,
    setIsPageStatsOpen: state.setIsPageStatsOpen,
    setIsShortcutPanelOpen: state.setIsShortcutPanelOpen,
    setIsSpecialCharPanelOpen: state.setIsSpecialCharPanelOpen,
    setIsUnitCreationEnabled: state.setIsUnitCreationEnabled,
    setIsUnitSearchTransformOpen: state.setIsUnitSearchTransformOpen,
    setProofreadPreviewVisibility: state.setProofreadPreviewVisibility,
    specialCharInsertRequest: state.specialCharInsertRequest,
    toggleRelocation: state.toggleRelocation,
    updateConfigurableShortcuts: state.updateConfigurableShortcuts,
  };
}

function sessionActions(
  actions: Actions,
  commands: ReturnType<typeof createEditorSessionActions>,
  keyboard: Keyboard,
  canInsertSpecialChar: boolean,
): Pick<
  EditorSession,
  | "canInsertSpecialChar"
  | "doDeleteUnit"
  | "handleAddUnit"
  | "handleCompleteStage"
  | "handleDeleteUnit"
  | "handleFocusUnit"
  | "handleModifyUnit"
  | "handleMoveUnit"
  | "handlePageImageLoad"
  | "handleReorderUnit"
  | "handleRequestSpecialChar"
  | "handleSave"
  | "handleSpecialCharInserted"
  | "handleSpecialCharUse"
  | "handleSwitchView"
  | "handleToggleBubble"
  | "handleToggleImageQuality"
> {
  return {
    canInsertSpecialChar,
    doDeleteUnit: actions.doDeleteUnit,
    handleAddUnit: actions.handleAddUnit,
    handleCompleteStage: commands.handleCompleteStage,
    handleDeleteUnit: actions.handleDeleteUnit,
    handleFocusUnit: actions.handleFocusUnit,
    handleModifyUnit: actions.handleModifyUnit,
    handleMoveUnit: actions.handleMoveUnit,
    handlePageImageLoad: actions.handlePageImageLoad,
    handleReorderUnit: actions.handleReorderUnit,
    handleRequestSpecialChar: actions.handleRequestSpecialChar,
    handleSave: commands.handleSave,
    handleSpecialCharInserted: actions.handleSpecialCharInserted,
    handleSpecialCharUse: actions.handleSpecialCharUse,
    handleSwitchView: keyboard.handleSwitchView,
    handleToggleBubble: actions.handleToggleBubble,
    handleToggleImageQuality: commands.handleToggleImageQuality,
  };
}

function sessionData(
  props: EditorProps,
  persistence: Persistence,
  completionStage: CompletionStage,
  searchCoordinator: SearchCoordinator,
  unitSearchPart: UnitTextPart,
): Pick<
  EditorSession,
  | "completionStage"
  | "drafts"
  | "handleExit"
  | "handleNavigate"
  | "onListPageUnitDiffStats"
  | "onListPageUnitFlaggedStats"
  | "onResolveUser"
  | "project"
  | "saveState"
  | "saving"
  | "retryRecovery"
  | "searchCoordinator"
  | "terminology"
  | "unitSearchPart"
> {
  return {
    completionStage,
    drafts: props.drafts,
    handleExit: persistence.handleExit,
    handleNavigate: persistence.handleNavigate,
    onListPageUnitDiffStats: props.onListPageUnitDiffStats,
    onListPageUnitFlaggedStats: props.onListPageUnitFlaggedStats,
    onResolveUser: props.onResolveUser,
    project: props.project,
    retryRecovery: persistence.retryRecovery,
    saveState: persistence.saveState,
    saving: persistence.saving,
    searchCoordinator,
    terminology: props.terminology,
    unitSearchPart,
  };
}
