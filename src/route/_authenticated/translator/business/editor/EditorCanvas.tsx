import type { JSX } from "react/jsx-runtime";
import clsx from "clsx";
import { CaseSensitive, Check, Command, Loader2, ReplaceAll, SquareArrowRight } from "lucide-react";
import { TranslatorPaginator } from "@/route/_authenticated/translator/business/page-statistic/TranslatorPaginator";
import { ToolboxDropdown } from "@/shared/component/toolbox-dropdown/ToolboxDropdown";
import { unitId, unitIsBubble } from "@/route/_authenticated/translator/business/unit/unit";
import { Canvas } from "@/route/_authenticated/translator/business/canvas/Canvas";
import { TerminologyLookupBar } from "@/route/_authenticated/translator/business/terminology/TerminologyLookupBar";
import { ReadOnlyPageActions } from "@/route/_authenticated/translator/business/page-statistic/ReadOnlyPageActions";
import type { EditorSession } from "./use-editor-session";
type Props = { session: EditorSession };
export function EditorCanvas({ session }: Props): JSX.Element {
  const {
    project,
    onListPageUnitDiffStats,
    onListPageUnitFlaggedStats,
    terminology,
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
    setIsShortcutPanelOpen,
    setIsSpecialCharPanelOpen,
    setIsUnitSearchTransformOpen,
    isCompletingStage,
    hasCompletedStage,
    setIsCompleteConfirmOpen,
    isPageStatsOpen,
    setIsPageStatsOpen,
    canvasRef,
    unitBufRef,
    saving,
    handleNavigate,
    handleExit,
    handleModifyUnit,
    handleMoveUnit,
    handleAddUnit,
    handleFocusUnit,
    handlePageImageLoad,
    handleDeleteUnit,
    completionStage,
  } = session;
  const toolboxOptions = isReadOnly
    ? []
    : [
        {
          icon: <Command size={20} />,
          title: "快捷键说明",
          onClick: () => {
            setIsShortcutPanelOpen(true);
          },
        },
        {
          icon: <CaseSensitive size={20} />,
          title: "特殊符号面板",
          onClick: () => {
            setIsSpecialCharPanelOpen(true);
          },
        },
        {
          icon: <ReplaceAll size={20} />,
          title: "搜索与替换",
          onClick: () => {
            setIsUnitSearchTransformOpen(true);
          },
        },
      ];

  function handleToggleBubble(targetId: string): void {
    const targetUnit = unitBufRef.current.find((unit) => unitId(unit) === targetId);
    if (targetUnit) {
      handleModifyUnit(targetId, { isBubble: !unitIsBubble(targetUnit) });
    }
  }

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
      {!isReadOnly && <TerminologyLookupBar dataSource={terminology} />}
      <div className="absolute top-2 left-2 flex items-center gap-2">
        {!isReadOnly && <ToolboxDropdown options={toolboxOptions} direction="down" />}
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
      {!isReadOnly && completionStage && (
        <div className="absolute bottom-2 right-2">
          <button
            type="button"
            title={completionStage === "proofread" ? "完成校对" : "完成翻译"}
            aria-label={completionStage === "proofread" ? "完成校对" : "完成翻译"}
            disabled={isLoadingPage || isCompletingStage || hasCompletedStage}
            onClick={() => {
              setIsCompleteConfirmOpen(true);
            }}
            className={clsx(
              "flex size-8 items-center justify-center rounded-md border",
              "border-line-gray-200 bg-surface-white/85 text-ink-gray-700 shadow-sm",
              "transition-colors hover:border-line-green-200 hover:bg-surface-green-50",
              "hover:text-ink-green-600 disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {isCompletingStage ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Check size={20} strokeWidth={2.5} />
            )}
          </button>
        </div>
      )}
      {isReadOnly && project.pages[pageIndex] && (
        <div className="absolute bottom-2 right-2">
          <ReadOnlyPageActions
            key={project.id}
            pages={project.pages}
            currentPageId={project.pages[pageIndex].id}
            isDisabled={isLoadingPage || saving}
            isOpen={isPageStatsOpen}
            onOpenChange={setIsPageStatsOpen}
            onListPageUnitDiffStats={onListPageUnitDiffStats}
            onNavigate={handleNavigate}
          />
        </div>
      )}
      <div className="absolute top-2 right-2">
        <TranslatorPaginator
          key={`${project.id}-${String(isReadOnly)}`}
          pages={project.pages}
          currentPageIndex={pageIndex}
          currentUnits={isLoadingPage ? undefined : unitBuf}
          isEnabled={!isReadOnly}
          onLoad={onListPageUnitFlaggedStats}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
}
