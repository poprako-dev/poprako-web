import type { JSX } from "react/jsx-runtime";
import type { ReactNode } from "react";
import clsx from "clsx";
import { CaseSensitive, Command, ReplaceAll, SquareArrowRight } from "lucide-react";
import { TranslatorPaginator } from "@/route/_authenticated/translator/business/page-statistic/TranslatorPaginator";
import { ToolboxDropdown } from "@/shared/component/toolbox-dropdown/ToolboxDropdown";
import { Canvas } from "@/route/_authenticated/translator/business/canvas/Canvas";
import type { ToolboxOption } from "@/shared/component/toolbox-dropdown/toolbox-option";
import { CanvasActionBar } from "./CanvasActionBar";
import type { EditorSession } from "./use-editor-session";

type Props = {
  terminologyBar?: ReactNode;
  session: Pick<
    EditorSession,
    | "project"
    | "drafts"
    | "onListPageUnitDiffStats"
    | "onListPageUnitFlaggedStats"
    | "terminology"
    | "pageIndex"
    | "unitBuf"
    | "focusedUnitId"
    | "view"
    | "proofreadPreviewVisibility"
    | "isReadOnly"
    | "canEditView"
    | "imageUrl"
    | "isLoadingPage"
    | "isUnitCreationEnabled"
    | "setIsShortcutPanelOpen"
    | "setIsSpecialCharPanelOpen"
    | "setIsUnitSearchTransformOpen"
    | "isCompletingStage"
    | "hasCompletedStage"
    | "setIsCompleteConfirmOpen"
    | "isPageStatsOpen"
    | "setIsPageStatsOpen"
    | "canvasRef"
    | "saving"
    | "saveState"
    | "handleNavigate"
    | "handleExit"
    | "handleToggleBubble"
    | "handleMoveUnit"
    | "handleAddUnit"
    | "handleFocusUnit"
    | "handlePageImageLoad"
    | "handleDeleteUnit"
    | "handleSave"
    | "completionStage"
  >;
};

function toolboxOptions(session: Props["session"]): ToolboxOption[] {
  if (session.isReadOnly) return [];
  return [
    {
      icon: <Command size={20} />,
      title: "快捷键说明",
      onClick: () => {
        session.setIsShortcutPanelOpen(true);
      },
    },
    {
      icon: <CaseSensitive size={20} />,
      title: "特殊符号面板",
      onClick: () => {
        session.setIsSpecialCharPanelOpen(true);
      },
    },
    {
      icon: <ReplaceAll size={20} />,
      title: "搜索与替换",
      onClick: () => {
        session.setIsUnitSearchTransformOpen(true);
      },
    },
  ];
}

export function EditorCanvas({ session, terminologyBar }: Props): JSX.Element {
  const {
    project,
    onListPageUnitFlaggedStats,
    pageIndex,
    unitBuf,
    focusedUnitId,
    view,
    proofreadPreviewVisibility,
    isReadOnly,
    canEditView,
    imageUrl,
    isLoadingPage,
    isUnitCreationEnabled,
    isCompletingStage,
    canvasRef,
    handleNavigate,
    handleExit,
    handleToggleBubble,
    handleMoveUnit,
    handleAddUnit,
    handleFocusUnit,
    handlePageImageLoad,
    handleDeleteUnit,
  } = session;
  const options = toolboxOptions(session);

  return (
    <div className="@container relative w-full h-full bg-surface-stone-700">
      <Canvas
        ref={canvasRef}
        imageSrc={imageUrl}
        units={unitBuf}
        mode={view}
        isLoading={isLoadingPage}
        isUnitCreationEnabled={canEditView ? isUnitCreationEnabled : false}
        focusedUnitId={focusedUnitId}
        onFocusUnit={handleFocusUnit}
        onMoveUnit={handleMoveUnit}
        onAddUnit={handleAddUnit}
        onDeleteUnit={handleDeleteUnit}
        onToggleBubble={handleToggleBubble}
        onImageLoad={handlePageImageLoad}
        enableReadOnly={!canEditView || isLoadingPage || isCompletingStage}
        proofreadPreviewVisibility={proofreadPreviewVisibility}
      />
      {!isReadOnly && terminologyBar}
      <div className="absolute top-2 left-2 flex items-center gap-2">
        {!isReadOnly && <ToolboxDropdown options={options} direction="down" />}
        <button
          type="button"
          title="退出"
          aria-label="退出翻译器"
          onClick={() => {
            void handleExit().catch((error: unknown) => {
              console.error("[Translator] 退出失败:", error);
            });
          }}
          className={clsx(
            "flex size-8 items-center justify-center rounded-md border",
            "border-line-gray-200 bg-surface-white/85 text-ink-gray-700 shadow-sm",
            "transition-colors hover:bg-surface-white hover:text-ink-gray-900",
          )}
        >
          <SquareArrowRight size={20} />
        </button>
      </div>
      <CanvasActionBar session={session} />
      <div className="absolute top-2 right-2">
        <TranslatorPaginator
          drafts={session.drafts}
          key={`${project.id}-${String(isReadOnly)}`}
          pages={project.pages}
          currentPageIndex={pageIndex}
          currentPageHasDraft={!isLoadingPage && session.saveState.dirty}
          currentUnits={isLoadingPage ? undefined : unitBuf}
          isEnabled={!isReadOnly}
          onLoad={onListPageUnitFlaggedStats}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
}
