import type { JSX } from "react";
import { StatusOptionBar } from "../StatusOptionBar";
import type { EditorSession } from "./use-editor-session";

type Props = {
  session: EditorSession;
};

function saveStatusLabel(session: EditorSession): string {
  const { saveState, saving } = session;
  if (saveState.storageError) return "草稿存储错误";
  if (saveState.error) return saveState.refreshError ? "等待远端核对" : "保存失败，修改已保留";
  if (saving) return "保存中";
  return saveState.dirty ? "待保存" : "已保存";
}

export function EditorToolbar({ session }: Props): JSX.Element {
  return (
    <div className="relative z-30 shrink-0 border-b-2 border-line-stone-200 bg-surface-stone-50">
      <StatusOptionBar
        currMode={session.view}
        view={session.view}
        nextView={session.nextView ?? session.view}
        canSwitchView={session.canSwitchView && session.nextView !== undefined}
        isRelocationEnabled={session.isRelocationEnabled}
        isUnitCreationEnabled={session.isUnitCreationEnabled}
        proofreadPreviewVisibility={session.proofreadPreviewVisibility}
        isHighResolution={session.isHighResolution}
        isLoadingPage={session.isLoadingPage}
        onSwitchView={session.handleSwitchView}
        onRelocationClick={session.toggleRelocation}
        onUnitCreationClick={() => {
          session.setIsUnitCreationEnabled((value) => !value);
        }}
        onToggleProofreadPreviewClick={() => {
          session.setProofreadPreviewVisibility((value) =>
            value === "visible" ? "dimmed" : "visible",
          );
        }}
        onToggleImageQualityClick={session.handleToggleImageQuality}
        onSaveClick={session.handleSave}
        saving={session.saving}
        saveStatus={saveStatusLabel(session)}
      />
    </div>
  );
}
