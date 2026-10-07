import type { JSX } from "react/jsx-runtime";
import { UnitList } from "../unit-list/UnitList";
import { DraftRecoveryNotice } from "../persistence/DraftRecoveryNotice";
import type { ReadOnlyView } from "../revision-note/revision-note";
import { EditorToolbar } from "./EditorToolbar";
import type { EditorSession } from "./use-editor-session";

import type { RevisionWorkspace } from "../revision-note/use-revision-workspace";
import { RevisionNoteList } from "../revision-note/RevisionNoteList";
type Props = {
  revision?: RevisionWorkspace | null;
  session: EditorSession;
  readOnlyView?: ReadOnlyView;
  onSwitchReadOnlyView?: (() => void) | undefined;
};

export function EditorSidebar({
  session,
  revision,
  readOnlyView,
  onSwitchReadOnlyView,
}: Props): JSX.Element {
  return (
    <>
      <DraftRecoveryNotice
        store={session.drafts}
        pageId={session.project.pages[session.pageIndex]?.id}
        onRetry={session.retryRecovery}
      />
      <EditorToolbar
        session={session}
        revision={revision}
        readOnlyView={readOnlyView}
        onSwitchReadOnlyView={onSwitchReadOnlyView}
      />
      <div className="flex-1 overflow-y-auto bg-surface-stone-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
        {revision ? (
          <RevisionNoteList
            notes={revision.notes}
            layers={revision.page?.layers ?? []}
            focusedId={revision.focusedId}
            onSelect={(id) => {
              revision.select(id, true);
            }}
          />
        ) : (
          <UnitList
            units={session.unitBuf}
            pendingUnitIds={session.saveState.pendingUnitIds}
            focusedUnitId={session.focusedUnitId}
            mode={session.view}
            onFocusUnit={session.handleFocusUnit}
            editing={
              session.canEditView
                ? { modifyUnit: session.handleModifyUnit, reorderUnit: session.handleReorderUnit }
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
        )}
      </div>
    </>
  );
}
