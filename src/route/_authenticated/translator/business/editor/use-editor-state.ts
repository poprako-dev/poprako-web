import type { ConfigurableShortcut } from "@/shared/utility/shortcut";
import {
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import type { UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";
import type { TranslatorMode } from "@/route/_authenticated/translator/business/unit/translator-mode";
import type { PageImageQuality } from "@/route/_authenticated/business/page/page";
import type { CanvasHandle } from "@/route/_authenticated/translator/business/canvas/Canvas";
import { useShortcuts } from "@/shared/hook/use-shortcuts";
import { useRelocationPreference } from "@/shared/hook/use-relocation-preference";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { useSpecialChars } from "@/route/_authenticated/translator/business/preference/use-special-chars";
import type { ProofreadPreviewVisibility } from "@/route/_authenticated/translator/business/contract/preview";
import type { SpecialCharInsertRequest } from "@/route/_authenticated/translator/business/unit-list/UnitList";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
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

type EditorOptions = Pick<
  EditorProps,
  "project" | "onLoadPageImage" | "canTranslate" | "canProofread" | "startPageId" | "startMode"
>;

type StateSetter<Value> = Dispatch<SetStateAction<Value>>;
type EditorPageState = {
  initialPageIndex: number;
  pageIndex: number;
  setPageIndex: StateSetter<number>;
  unitBuf: UnitInfo[];
  setUnitBuf: StateSetter<UnitInfo[]>;
  focusedUnitId: string | undefined;
  setFocusedUnitId: StateSetter<string | undefined>;
  imageUrl: string | null;
  setImageUrl: StateSetter<string | null>;
  isHighResolution: boolean;
  setIsHighResolution: StateSetter<boolean>;
  isLoadingPage: boolean;
  setIsLoadingPage: StateSetter<boolean>;
  imageQuality: PageImageQuality;
};
type EditorModeState = {
  availableModes: TranslatorMode[];
  mode: TranslatorMode;
  storedViewState: TranslatorViewState;
  setViewState: StateSetter<TranslatorViewState>;
  viewState: TranslatorViewState;
  view: TranslatorMode;
  proofreadPreviewVisibility: ProofreadPreviewVisibility;
  setProofreadPreviewVisibility: StateSetter<ProofreadPreviewVisibility>;
  isReadOnly: boolean;
  canSwitchView: boolean;
  nextView: TranslatorMode | undefined;
  canEditView: boolean;
};
type EditorPanelState = {
  isUnitCreationEnabled: boolean;
  setIsUnitCreationEnabled: StateSetter<boolean>;
  isShortcutPanelOpen: boolean;
  setIsShortcutPanelOpen: StateSetter<boolean>;
  isSpecialCharPanelOpen: boolean;
  setIsSpecialCharPanelOpen: StateSetter<boolean>;
  isUnitSearchTransformOpen: boolean;
  setIsUnitSearchTransformOpen: StateSetter<boolean>;
  specialCharInsertRequest: SpecialCharInsertRequest | undefined;
  setSpecialCharInsertRequest: StateSetter<SpecialCharInsertRequest | undefined>;
  deleteConfirmUnitId: string | undefined;
  setDeleteConfirmUnitId: StateSetter<string | undefined>;
  isCompletingStage: boolean;
  setIsCompletingStage: StateSetter<boolean>;
  hasCompletedStage: boolean;
  setHasCompletedStage: StateSetter<boolean>;
  isCompleteConfirmOpen: boolean;
  setIsCompleteConfirmOpen: StateSetter<boolean>;
  isPageStatsOpen: boolean;
  setIsPageStatsOpen: StateSetter<boolean>;
};
type EditorReferenceState = {
  canvasRef: RefObject<CanvasHandle | null>;
  lastSpecialCharRef: RefObject<string | null>;
  specialCharRequestIdRef: RefObject<number>;
  relocationSuppressedUnitIdRef: RefObject<string | null>;
  pendingCenteredUnitIdRef: RefObject<string | null>;
};
type EditorPreferenceState = {
  isRelocationEnabled: boolean;
  toggleRelocation: () => void;
  showToast: (message: string, type: ToastType) => void;
  allChars: ReturnType<typeof useSpecialChars>["allChars"];
  favoriteChars: ReturnType<typeof useSpecialChars>["favoriteChars"];
  fixedShortcuts: ReturnType<typeof useShortcuts>["fixedShortcuts"];
  configurableShortcuts: ConfigurableShortcut[];
  updateConfigurableShortcuts: ReturnType<typeof useShortcuts>["updateConfigurableShortcuts"];
  activeShortcuts: ConfigurableShortcut[];
};
type EditorStateValue = EditorPageState &
  EditorModeState &
  EditorPanelState &
  EditorReferenceState &
  EditorPreferenceState;

export function useEditorState(options: EditorOptions): EditorStateValue {
  const modes = useTranslatorModeState(options);
  const page = useEditorPageState(options);
  const panels = useEditorPanelState();
  const references = useEditorReferenceState();
  const preferences = useEditorPreferenceState(options, modes, page);
  return { ...modes, ...page, ...panels, ...references, ...preferences };
}

function useEditorPageState(options: EditorOptions): EditorPageState {
  const initialPageIndex = resolveInitialPageIndex(options.project.pages, options.startPageId);
  const [pageIndex, setPageIndex] = useState(initialPageIndex);
  const [unitBuf, setUnitBuf] = useState<UnitInfo[]>([]);
  const [focusedUnitId, setFocusedUnitId] = useState<string | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isHighResolution, setIsHighResolution] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const imageQuality: PageImageQuality = isHighResolution ? "original" : "optimized";
  return {
    initialPageIndex,
    pageIndex,
    setPageIndex,
    unitBuf,
    setUnitBuf,
    focusedUnitId,
    setFocusedUnitId,
    imageUrl,
    setImageUrl,
    isHighResolution,
    setIsHighResolution,
    isLoadingPage,
    setIsLoadingPage,
    imageQuality,
  };
}

function useTranslatorModeState(options: EditorOptions): EditorModeState {
  const availableModes = useMemo(
    () =>
      availableTranslatorModes({
        canTranslate: options.canTranslate,
        canProofread: options.canProofread,
      }),
    [options.canProofread, options.canTranslate],
  );
  const mode = useMemo(
    () =>
      initialTranslatorMode(
        availableModes,
        options.startMode === "auto" ? undefined : options.startMode,
      ),
    [availableModes, options.startMode],
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
  const canEditView =
    !isReadOnly && (view === "translate" ? options.canTranslate : options.canProofread);
  return {
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
  };
}

function useEditorPanelState(): EditorPanelState {
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
  return {
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
  };
}

function useEditorReferenceState(): EditorReferenceState {
  const canvasRef = useRef<CanvasHandle>(null);
  const lastSpecialCharRef = useRef<string | null>(null);
  const specialCharRequestIdRef = useRef(0);
  const relocationSuppressedUnitIdRef = useRef<string | null>(null);
  const pendingCenteredUnitIdRef = useRef<string | null>(null);
  return {
    canvasRef,
    lastSpecialCharRef,
    specialCharRequestIdRef,
    relocationSuppressedUnitIdRef,
    pendingCenteredUnitIdRef,
  };
}

function useEditorPreferenceState(
  options: EditorOptions,
  modes: EditorModeState,
  page: EditorPageState,
): EditorPreferenceState {
  const { isRelocationEnabled, toggleRelocation } = useRelocationPreference();
  const showToast = useToastStore((s) => s.showToast);
  const { allChars, favoriteChars } = useSpecialChars();
  useEditorImagePreloader(options, page);
  const { fixedShortcuts, configurableShortcuts, updateConfigurableShortcuts } = useShortcuts();
  const activeShortcuts = filterActiveShortcuts(configurableShortcuts, modes.isReadOnly);
  return {
    isRelocationEnabled,
    toggleRelocation,
    showToast,
    allChars,
    favoriteChars,
    fixedShortcuts,
    configurableShortcuts,
    updateConfigurableShortcuts,
    activeShortcuts,
  };
}

function useEditorImagePreloader(
  options: EditorOptions,
  page: ReturnType<typeof useEditorPageState>,
): void {
  usePageImagePreloader({
    pages: options.project.pages,
    currentPageIndex: page.pageIndex,
    quality: page.imageQuality,
    onLoadPageImage: options.onLoadPageImage,
  });
}

function filterActiveShortcuts(
  shortcuts: ConfigurableShortcut[],
  isReadOnly: boolean,
): ConfigurableShortcut[] {
  const available = isReadOnly
    ? shortcuts.filter((shortcut) =>
        [
          "nextMarker",
          "prevMarker",
          "pageUp",
          "pageDown",
          "toggleMode",
          "toggleProofreadPreview",
        ].includes(shortcut.action),
      )
    : shortcuts;
  return available.filter((shortcut) => shortcut.action !== "toggleMode");
}
export type EditorState = EditorStateValue;
