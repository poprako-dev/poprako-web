import type { JSX } from "react";
import { StatusOptionBar } from "../StatusOptionBar";
import type { EditorSession } from "./use-editor-session";

type Props = {
  onPreloadMode: () => void;
  session: EditorSession;
  isAnnotationEditingEnabled: boolean;
  onToggleAnnotationEditing: (() => void) | undefined;
};

export function EditorToolbar({
  session,
  onPreloadMode,
  isAnnotationEditingEnabled,
  onToggleAnnotationEditing,
}: Props): JSX.Element {
  return (
    <div className="relative z-30 shrink-0 border-b-2 border-line-stone-200 bg-surface-stone-50">
      <StatusOptionBar
        isAnnotationEditingEnabled={isAnnotationEditingEnabled}
        onToggleAnnotationEditing={onToggleAnnotationEditing}
        currMode={session.isReadOnly ? "readOnly" : session.view}
        view={session.view}
        nextView={session.nextView ?? session.view}
        canSwitchView={session.canSwitchView && session.nextView !== undefined}
        isRelocationEnabled={session.isRelocationEnabled}
        isUnitCreationEnabled={session.isUnitCreationEnabled}
        isAutoFocusOnCreate={session.isAutoFocusOnCreate}
        proofreadPreviewVisibility={session.proofreadPreviewVisibility}
        isHighResolution={session.isHighResolution}
        isLoadingPage={session.isLoadingPage}
        onSwitchView={session.handleSwitchView}
        onPreloadMode={onPreloadMode}
        onRelocationClick={session.toggleRelocation}
        onUnitCreationClick={() => {
          session.setIsUnitCreationEnabled((value) => !value);
        }}
        onToggleAutoFocusClick={session.toggleAutoFocusOnCreate}
        onToggleProofreadPreviewClick={() => {
          session.setProofreadPreviewVisibility((value) =>
            value === "visible" ? "dimmed" : "visible",
          );
        }}
        onToggleImageQualityClick={session.handleToggleImageQuality}
      />
    </div>
  );
}
