import type { useEditorState } from "./use-editor-state";
import type { useEditorUnitActions } from "./use-editor-unit-actions";
import type { useUnitPersistence } from "../persistence/use-unit-persistence";
import type { useEditorKeyboard } from "./use-editor-keyboard";
import type { EditorProps } from "./editor-props";
import type { translatorCompletionStage } from "../contract/access";
import type { createEditorSearchCoordinator } from "./editor-search-coordinator";
import type { useDetachableSpecialCharsBar } from "../preference/use-detachable-special-chars-bar";
import type { UnitTextPart } from "../contract/unit-search-transform";
export type EditorSession = Pick<
  ReturnType<typeof useEditorState>,
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
> &
  Pick<
    ReturnType<typeof useEditorUnitActions>,
    | "doDeleteUnit"
    | "handleAddUnit"
    | "handleDeleteUnit"
    | "handleFocusUnit"
    | "handleModifyUnit"
    | "handleMoveUnit"
    | "handlePageImageLoad"
    | "handleReorderUnit"
    | "handleRequestSpecialChar"
    | "handleSpecialCharInserted"
    | "handleSpecialCharUse"
    | "handleToggleBubble"
  > &
  Pick<
    ReturnType<typeof useUnitPersistence>,
    "handleExit" | "handleNavigate" | "saveState" | "saving" | "retryRecovery"
  > &
  Pick<ReturnType<typeof useEditorKeyboard>, "handleSwitchView"> &
  Pick<
    EditorProps,
    | "onListPageUnitDiffStats"
    | "onListPageUnitFlaggedStats"
    | "onResolveUser"
    | "project"
    | "terminology"
    | "drafts"
  > & {
    completionStage: ReturnType<typeof translatorCompletionStage>;
    handleCompleteStage: () => Promise<void>;
    handleToggleImageQuality: () => Promise<void>;
    isSpecialCharsBarVisible: boolean;
    searchCoordinator: ReturnType<typeof createEditorSearchCoordinator>;
    specialCharsBar: ReturnType<typeof useDetachableSpecialCharsBar>;
    unitSearchPart: UnitTextPart;
    canInsertSpecialChar: boolean;
    handleSave: () => Promise<void>;
  };
