import type { JSX } from "react/jsx-runtime";
import { UnitList } from "../unit-list/UnitList";
import { DraftRecoveryNotice } from "../persistence/DraftRecoveryNotice";
import { EditorToolbar } from "./EditorToolbar";
import type { EditorSession } from "./use-editor-session";

type Props = {
  session: EditorSession;
};

export function EditorSidebar({ session }: Props): JSX.Element {
  return (
    <>
      <DraftRecoveryNotice
        store={session.drafts}
        pageId={session.project.pages[session.pageIndex]?.id}
        onRetry={session.retryRecovery}
      />
      <EditorToolbar session={session} />
      <div className="flex-1 overflow-y-auto bg-surface-stone-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
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
      </div>
    </>
  );
}
