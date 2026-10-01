import type { JSX } from "react/jsx-runtime";
import clsx from "clsx";
import { UnitList } from "@/route/_authenticated/translator/business/unit-list/UnitList";
import { StatusOptionBar } from "@/route/_authenticated/translator/business/StatusOptionBar";
import { DraftRecoveryNotice } from "../persistence/DraftRecoveryNotice";
import type { EditorSession } from "./use-editor-session";
type Props = {
  session: Pick<
    EditorSession,
    | "drafts"
    | "project"
    | "pageIndex"
    | "retryRecovery"
    | "onResolveUser"
    | "unitBuf"
    | "focusedUnitId"
    | "view"
    | "proofreadPreviewVisibility"
    | "setProofreadPreviewVisibility"
    | "canSwitchView"
    | "nextView"
    | "canEditView"
    | "isHighResolution"
    | "isLoadingPage"
    | "isRelocationEnabled"
    | "toggleRelocation"
    | "isUnitCreationEnabled"
    | "setIsUnitCreationEnabled"
    | "specialCharInsertRequest"
    | "isCompletingStage"
    | "saving"
    | "saveState"
    | "handleSpecialCharUse"
    | "handleSpecialCharInserted"
    | "handleModifyUnit"
    | "handleReorderUnit"
    | "handleFocusUnit"
    | "specialCharsBar"
    | "handleSave"
    | "handleToggleImageQuality"
    | "handleSwitchView"
  >;
};
export function EditorSidebar({ session }: Props): JSX.Element {
  const {
    onResolveUser,
    unitBuf,
    focusedUnitId,
    view,
    proofreadPreviewVisibility,
    setProofreadPreviewVisibility,
    canSwitchView,
    nextView,
    canEditView,
    isHighResolution,
    isLoadingPage,
    isRelocationEnabled,
    toggleRelocation,
    isUnitCreationEnabled,
    setIsUnitCreationEnabled,
    specialCharInsertRequest,
    isCompletingStage,
    saving,
    saveState,
    handleSpecialCharUse,
    handleSpecialCharInserted,
    handleModifyUnit,
    handleReorderUnit,
    handleFocusUnit,
    specialCharsBar,
    handleSave,
    handleToggleImageQuality,
    handleSwitchView,
  } = session;
  function saveStatusLabel(): string {
    if (saveState.storageError) return "草稿存储错误";
    if (saveState.error) {
      return saveState.refreshError ? "等待远端核对" : "保存失败，修改已保留";
    }
    if (saving) return "保存中";
    return saveState.dirty ? "待保存" : "已保存";
  }

  return (
    <>
      <DraftRecoveryNotice
        store={session.drafts}
        pageId={session.project.pages[session.pageIndex]?.id}
        onRetry={session.retryRecovery}
      />
      <div className="flex items-center border-b-2 border-line-stone-200 shrink-0 bg-surface-stone-50">
        <div className="flex-1 min-w-0">
          <StatusOptionBar
            currMode={view}
            view={view}
            nextView={nextView ?? view}
            canSwitchView={canSwitchView && nextView !== undefined}
            isRelocationEnabled={isRelocationEnabled}
            isUnitCreationEnabled={isUnitCreationEnabled}
            proofreadPreviewVisibility={proofreadPreviewVisibility}
            isHighResolution={isHighResolution}
            isLoadingPage={isLoadingPage}
            onSwitchView={handleSwitchView}
            onRelocationClick={toggleRelocation}
            onUnitCreationClick={() => {
              setIsUnitCreationEnabled((v) => !v);
            }}
            onToggleProofreadPreviewClick={() => {
              setProofreadPreviewVisibility((v) => (v === "visible" ? "dimmed" : "visible"));
            }}
            onToggleImageQualityClick={handleToggleImageQuality}
            onSaveClick={handleSave}
            saving={saving}
            saveStatus={saveStatusLabel()}
          />
        </div>
      </div>
      <div
        className={clsx(
          "flex-1 overflow-y-auto bg-surface-stone-100",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
        )}
      >
        <UnitList
          units={unitBuf}
          pendingUnitIds={saveState.pendingUnitIds}
          focusedUnitId={focusedUnitId}
          mode={view}
          onFocusUnit={handleFocusUnit}
          editing={
            canEditView ? { modifyUnit: handleModifyUnit, reorderUnit: handleReorderUnit } : null
          }
          onResolveUser={onResolveUser}
          enableReadOnly={!canEditView || isLoadingPage || isCompletingStage}
          specialCharInsertRequest={specialCharInsertRequest}
          specialCharsBar={specialCharsBar}
          onSpecialCharUse={handleSpecialCharUse}
          onSpecialCharInserted={handleSpecialCharInserted}
        />
      </div>
    </>
  );
}
