import type { Dispatch } from "react";
import type { SetStateAction } from "react";
import type { RefObject } from "react";
import type { ToastType } from "../../../../../shared/component/notification-toast/notification-toast-type";
import type { CharItem } from "@/route/_authenticated/translator/business/preference/use-special-chars";
import type { FixedShortcut } from "../shortcut/base-translator-type";
import type { ConfigurableShortcut } from "../shortcut/base-translator-type";
import { useMemo, useRef, useState } from "react";
import type { UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";
import type { TranslatorMode } from "@/route/_authenticated/translator/business/unit/translator-mode";
import type { PageImageQuality } from "@/route/_authenticated/business/page/page";
import type { CanvasHandle } from "@/route/_authenticated/translator/business/canvas/Canvas";
import { useShortcuts } from "@/route/_authenticated/translator/business/preference/use-shortcuts";
import { useRelocationPreference } from "@/route/_authenticated/translator/business/preference/use-relocation-preference";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { useSpecialChars } from "@/route/_authenticated/translator/business/preference/use-special-chars";
import type { ProofreadPreviewVisibility } from "@/route/_authenticated/translator/business/contract/preview";
import type { SpecialCharInsertRequest } from "@/route/_authenticated/translator/business/unit-list/UnitList";
import {
  resolveInitialPageIndex,
  usePageImagePreloader,
} from "@/route/_authenticated/translator/business/editor/use-page-image-preloader";
import {
  availableTranslatorModes,
  initialTranslatorMode,
} from "@/route/_authenticated/translator/business/contract/access";
import type { EditorProps } from "./editor-props";
type TranslatorViewState = {
  entryMode: TranslatorMode;
  view: TranslatorMode;
};

function initialViewState(entryMode: TranslatorMode): TranslatorViewState {
  return {
    entryMode,
    view: entryMode,
  };
}

export function useEditorState({
  project,
  onLoadPageImage,
  canTranslate,
  canProofread,
  startPageId,
  startMode,
}: Pick<
  EditorProps,
  "project" | "onLoadPageImage" | "canTranslate" | "canProofread" | "startPageId" | "startMode"
>): {
  initialPageIndex: number;
  pageIndex: number;
  setPageIndex: Dispatch<SetStateAction<number>>;
  unitBuf: UnitInfo[];
  setUnitBuf: Dispatch<SetStateAction<UnitInfo[]>>;
  focusedUnitId: string | undefined;
  setFocusedUnitId: Dispatch<SetStateAction<string | undefined>>;
  availableModes: TranslatorMode[];
  mode: TranslatorMode;
  storedViewState: TranslatorViewState;
  setViewState: Dispatch<SetStateAction<TranslatorViewState>>;
  viewState: TranslatorViewState;
  view: TranslatorMode;
  proofreadPreviewVisibility: ProofreadPreviewVisibility;
  setProofreadPreviewVisibility: Dispatch<SetStateAction<ProofreadPreviewVisibility>>;
  isReadOnly: boolean;
  canSwitchView: boolean;
  nextView: TranslatorMode | undefined;
  canEditView: boolean;
  imageUrl: string | null;
  setImageUrl: Dispatch<SetStateAction<string | null>>;
  isHighResolution: boolean;
  setIsHighResolution: Dispatch<SetStateAction<boolean>>;
  isLoadingPage: boolean;
  setIsLoadingPage: Dispatch<SetStateAction<boolean>>;
  imageQuality: PageImageQuality;
  isRelocationEnabled: boolean;
  toggleRelocation: () => void;
  isUnitCreationEnabled: boolean;
  setIsUnitCreationEnabled: Dispatch<SetStateAction<boolean>>;
  isShortcutPanelOpen: boolean;
  setIsShortcutPanelOpen: Dispatch<SetStateAction<boolean>>;
  isSpecialCharPanelOpen: boolean;
  setIsSpecialCharPanelOpen: Dispatch<SetStateAction<boolean>>;
  isUnitSearchTransformOpen: boolean;
  setIsUnitSearchTransformOpen: Dispatch<SetStateAction<boolean>>;
  specialCharInsertRequest: SpecialCharInsertRequest | undefined;
  setSpecialCharInsertRequest: Dispatch<SetStateAction<SpecialCharInsertRequest | undefined>>;
  deleteConfirmUnitId: string | undefined;
  setDeleteConfirmUnitId: Dispatch<SetStateAction<string | undefined>>;
  isCompletingStage: boolean;
  setIsCompletingStage: Dispatch<SetStateAction<boolean>>;
  hasCompletedStage: boolean;
  setHasCompletedStage: Dispatch<SetStateAction<boolean>>;
  isCompleteConfirmOpen: boolean;
  setIsCompleteConfirmOpen: Dispatch<SetStateAction<boolean>>;
  isPageStatsOpen: boolean;
  setIsPageStatsOpen: Dispatch<SetStateAction<boolean>>;
  canvasRef: RefObject<CanvasHandle | null>;
  lastSpecialCharRef: RefObject<string | null>;
  specialCharRequestIdRef: RefObject<number>;
  relocationSuppressedUnitIdRef: RefObject<string | null>;
  pendingCenteredUnitIdRef: RefObject<string | null>;
  showToast: (message: string, type: ToastType) => void;
  allChars: CharItem[];
  favoriteChars: string[];
  fixedShortcuts: FixedShortcut[];
  configurableShortcuts: ConfigurableShortcut[];
  updateConfigurableShortcuts: (next: ConfigurableShortcut[]) => void;
  activeShortcuts: ConfigurableShortcut[];
} {
  const initialPageIndex = resolveInitialPageIndex(project.pages, startPageId);
  const [pageIndex, setPageIndex] = useState(initialPageIndex);
  const [unitBuf, setUnitBuf] = useState<UnitInfo[]>([]);
  const [focusedUnitId, setFocusedUnitId] = useState<string | undefined>(undefined);
  const availableModes = useMemo(
    () => availableTranslatorModes({ canTranslate, canProofread }),
    [canProofread, canTranslate],
  );
  const mode = useMemo(
    () => initialTranslatorMode(availableModes, startMode === "auto" ? undefined : startMode),
    [availableModes, startMode],
  );
  const [storedViewState, setStoredViewState] = useState<TranslatorViewState>(() =>
    initialViewState(mode),
  );
  const viewState = storedViewState.entryMode === mode ? storedViewState : initialViewState(mode);
  if (storedViewState !== viewState) {
    setStoredViewState(viewState);
  }
  const { view } = viewState;
  const [proofreadPreviewVisibility, setProofreadPreviewVisibility] =
    useState<ProofreadPreviewVisibility>("visible");

  const isReadOnly = view === "readOnly";
  const canSwitchView = mode !== "readOnly" && availableModes.length > 1;
  const nextView = availableModes[(availableModes.indexOf(view) + 1) % availableModes.length];
  const canEditView = !isReadOnly && (view === "translate" ? canTranslate : canProofread);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isHighResolution, setIsHighResolution] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const imageQuality: PageImageQuality = isHighResolution ? "original" : "optimized";
  const { isRelocationEnabled, toggleRelocation } = useRelocationPreference();
  const [isUnitCreationEnabled, setIsUnitCreationEnabled] = useState(true);
  const [isShortcutPanelOpen, setIsShortcutPanelOpen] = useState(false);
  const [isSpecialCharPanelOpen, setIsSpecialCharPanelOpen] = useState(false);
  const [isUnitSearchTransformOpen, setIsUnitSearchTransformOpen] = useState(false);
  const [specialCharInsertRequest, setSpecialCharInsertRequest] = useState<
    SpecialCharInsertRequest | undefined
  >(undefined);
  const [deleteConfirmUnitId, setDeleteConfirmUnitId] = useState<string | undefined>(undefined);
  const [isCompletingStage, setIsCompletingStage] = useState(false);
  const [hasCompletedStage, setHasCompletedStage] = useState(false);
  const [isCompleteConfirmOpen, setIsCompleteConfirmOpen] = useState(false);
  const [isPageStatsOpen, setIsPageStatsOpen] = useState(false);

  const canvasRef = useRef<CanvasHandle>(null);
  const lastSpecialCharRef = useRef<string | null>(null);
  const specialCharRequestIdRef = useRef(0);
  const relocationSuppressedUnitIdRef = useRef<string | null>(null);
  const pendingCenteredUnitIdRef = useRef<string | null>(null);

  const showToast = useToastStore((s) => s.showToast);
  const { allChars, favoriteChars } = useSpecialChars();

  usePageImagePreloader({
    pages: project.pages,
    currentPageIndex: pageIndex,
    quality: imageQuality,
    onLoadPageImage,
  });

  const { fixedShortcuts, configurableShortcuts, updateConfigurableShortcuts } = useShortcuts();

  const activeShortcuts = (() => {
    let shortcuts = configurableShortcuts;
    if (isReadOnly) {
      shortcuts = shortcuts.filter((s) =>
        [
          "nextMarker",
          "prevMarker",
          "pageUp",
          "pageDown",
          "toggleMode",
          "toggleProofreadPreview",
        ].includes(s.action),
      );
    }
    shortcuts = shortcuts.filter((s) => s.action !== "toggleMode");
    return shortcuts;
  })();

  return {
    initialPageIndex,
    pageIndex,
    setPageIndex,
    unitBuf,
    setUnitBuf,
    focusedUnitId,
    setFocusedUnitId,
    availableModes,
    mode,
    storedViewState,
    setViewState: setStoredViewState,
    viewState,
    view,
    proofreadPreviewVisibility,
    setProofreadPreviewVisibility,
    isReadOnly,
    canSwitchView,
    nextView,
    canEditView,
    imageUrl,
    setImageUrl,
    isHighResolution,
    setIsHighResolution,
    isLoadingPage,
    setIsLoadingPage,
    imageQuality,
    isRelocationEnabled,
    toggleRelocation,
    isUnitCreationEnabled,
    setIsUnitCreationEnabled,
    isShortcutPanelOpen,
    setIsShortcutPanelOpen,
    isSpecialCharPanelOpen,
    setIsSpecialCharPanelOpen,
    isUnitSearchTransformOpen,
    setIsUnitSearchTransformOpen,
    specialCharInsertRequest,
    setSpecialCharInsertRequest,
    deleteConfirmUnitId,
    setDeleteConfirmUnitId,
    isCompletingStage,
    setIsCompletingStage,
    hasCompletedStage,
    setHasCompletedStage,
    isCompleteConfirmOpen,
    setIsCompleteConfirmOpen,
    isPageStatsOpen,
    setIsPageStatsOpen,
    canvasRef,
    lastSpecialCharRef,
    specialCharRequestIdRef,
    relocationSuppressedUnitIdRef,
    pendingCenteredUnitIdRef,
    showToast,
    allChars,
    favoriteChars,
    fixedShortcuts,
    configurableShortcuts,
    updateConfigurableShortcuts,
    activeShortcuts,
  };
}
export type EditorState = ReturnType<typeof useEditorState>;
