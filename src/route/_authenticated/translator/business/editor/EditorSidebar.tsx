import { useState } from "react";
import type { JSX } from "react/jsx-runtime";
import { UnitList } from "../unit-list/UnitList";
import type { UnitItemComponent } from "../unit-list/UnitListItem";
import { DraftRecoveryNotice } from "../persistence/DraftRecoveryNotice";
import { EditorToolbar } from "./EditorToolbar";
import type { EditorSession } from "./use-editor-session";
import type { UnitAnnotationSource } from "../contract/unit-annotations";

type Props = {
  ItemComponent: UnitItemComponent;
  onPreloadMode: () => void;
  session: EditorSession;
  annotations?: UnitAnnotationSource | undefined;
};

export function EditorSidebar({
  session,
  annotations,
  ItemComponent,
  onPreloadMode,
}: Props): JSX.Element {
  const [isAnnotationEditingEnabled, setIsAnnotationEditingEnabled] = useState(false);
  return (
    <>
      <DraftRecoveryNotice
        store={session.drafts}
        pageId={session.project.pages[session.pageIndex]?.id}
        onRetry={session.retryRecovery}
      />
      <EditorToolbar
        session={session}
        onPreloadMode={onPreloadMode}
        isAnnotationEditingEnabled={isAnnotationEditingEnabled}
        onToggleAnnotationEditing={
          annotations
            ? () => {
                setIsAnnotationEditingEnabled((value) => !value);
              }
            : undefined
        }
      />
      <div className="flex-1 overflow-y-auto bg-surface-stone-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
        <UnitList
          ItemComponent={ItemComponent}
          annotations={annotations}
          isAnnotationEditingEnabled={isAnnotationEditingEnabled}
          units={session.unitBuf}
          pendingUnitIds={session.saveState.pendingUnitIds}
          focusedUnitId={session.focusedUnitId}
          mode={session.view}
          onFocusUnit={session.handleFocusUnit}
          editing={
            session.canEditView
              ? {
                  modifyUnit: session.handleModifyUnit,
                  reorderUnit: session.handleReorderUnit,
                  proofreadAllUnits: session.handleProofreadAllUnits,
                }
              : null
          }
          onResolveUser={session.onResolveUser}
          enableReadOnly={
            !session.canEditView || session.isLoadingPage || session.isCompletingStage
          }
          specialCharInsertRequest={session.specialCharInsertRequest}
          specialCharsBar={session.specialCharsBar}
          onSpecialCharUse={session.handleSpecialCharUse}
          onSpecialCharInserted={session.handleSpecialCharInserted}
        />
      </div>
    </>
  );
}
