import type { JSX as TranslatorImportedType0 } from "react/jsx-runtime";
import clsx from "clsx";
import { UnitList } from "@/route/_authenticated/translator/business/unit-list/UnitList";
import { StatusOptionBar } from "@/route/_authenticated/translator/business/StatusOptionBar";
import type { EditorSession } from "./use-editor-session";
type Props = { session: EditorSession };
export function EditorSidebar({ session }: Props): TranslatorImportedType0.Element {
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
  function saveStatusLabel():
    | "已保存，刷新失败"
    | "保存失败，修改已保留"
    | "保存中"
    | "待保存"
    | "已保存" {
    if (saveState.error) {
      return saveState.refreshError ? "已保存，刷新失败" : "保存失败，修改已保留";
    }
    if (saving) return "保存中";
    return saveState.dirty ? "待保存" : "已保存";
  }

  return (
    <>
      <div className="flex items-center border-b-2 border-border shrink-0 bg-surface-panel">
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
          "flex-1 overflow-y-auto bg-surface-hover",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
        )}
      >
        <UnitList
          units={unitBuf}
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
