import type { JSX } from "react";
import { StatusOptionBar } from "../StatusOptionBar";
import type { ReadOnlyView } from "../revision-note/revision-note";
import type { EditorSession } from "./use-editor-session";

import type { RevisionWorkspace } from "../revision-note/use-revision-workspace";
import { RevisionLayerMenu } from "../revision-note/RevisionLayerMenu";
type Props = {
  revision?: RevisionWorkspace | null | undefined;
  session: EditorSession;
  readOnlyView?: ReadOnlyView | undefined;
  onSwitchReadOnlyView?: (() => void) | undefined;
};

function saveStatusLabel(session: EditorSession): string {
  const { saveState, saving } = session;
  if (saveState.storageError) return "草稿存储错误";
  if (saveState.error) return saveState.refreshError ? "等待远端核对" : "保存失败，修改已保留";
  if (saving) return "保存中";
  return saveState.dirty ? "待保存" : "已保存";
}

export function EditorToolbar({
  session,
  revision,
  readOnlyView = "unit",
  onSwitchReadOnlyView,
}: Props): JSX.Element {
  return (
    <div className="relative z-30 shrink-0 border-b-2 border-line-stone-200 bg-surface-stone-50">
      <StatusOptionBar
        imageControl={revision ? <RevisionLayerMenu revision={revision} /> : undefined}
        currMode={session.view}
        view={session.view}
        nextView={session.nextView ?? session.view}
        canSwitchView={session.canSwitchView && session.nextView !== undefined}
        readOnlyView={readOnlyView}
        onSwitchReadOnlyView={onSwitchReadOnlyView}
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
