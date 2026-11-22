import type { JSX } from "react/jsx-runtime";
import { Check, Loader2, Save } from "lucide-react";
import { FloatingActionGroup } from "@/shared/component/FloatingActionGroup";
import { floatingActionCellClass } from "@/shared/component/floating-action-cell";
import { ReadOnlyPageActions } from "@/route/_authenticated/translator/business/page-statistic/ReadOnlyPageActions";
import type { EditorSession } from "./use-editor-session";

export type CanvasActionSession = Pick<
  EditorSession,
  | "isReadOnly"
  | "isLoadingPage"
  | "saving"
  | "saveState"
  | "completionStage"
  | "isCompletingStage"
  | "hasCompletedStage"
  | "project"
  | "pageIndex"
  | "isPageStatsOpen"
  | "setIsPageStatsOpen"
  | "onListPageUnitDiffStats"
  | "handleNavigate"
  | "handleSave"
  | "setIsCompleteConfirmOpen"
>;

type Props = {
  session: CanvasActionSession;
};

function saveStatusLabel(session: CanvasActionSession): string {
  const { saveState, saving } = session;
  if (saveState.storageError) return "草稿存储错误";
  if (saveState.error) return saveState.refreshError ? "等待远端核对" : "保存失败，修改已保留";
  if (saving) return "保存中";
  return saveState.dirty ? "待保存" : "已保存";
}

export function CanvasActionBar({ session }: Props): JSX.Element {
  const saveStatus = saveStatusLabel(session);
  const currentPage = session.project.pages[session.pageIndex];
  return (
    <FloatingActionGroup label="页面操作" className="absolute bottom-2 right-2">
      {!session.isReadOnly && (
        <button
          type="button"
          title={`保存 · ${saveStatus}`}
          aria-label={`保存 · ${saveStatus}`}
          disabled={session.isLoadingPage}
          onClick={() => void session.handleSave()}
          className={floatingActionCellClass}
        >
          {session.saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={20} strokeWidth={2.25} />
          )}
        </button>
      )}
      {!session.isReadOnly && session.completionStage && (
        <button
          type="button"
          title={session.completionStage === "proofread" ? "完成校对" : "完成翻译"}
          aria-label={session.completionStage === "proofread" ? "完成校对" : "完成翻译"}
          disabled={session.isLoadingPage || session.isCompletingStage || session.hasCompletedStage}
          onClick={() => {
            session.setIsCompleteConfirmOpen(true);
          }}
          className={floatingActionCellClass}
        >
          {session.isCompletingStage ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Check size={20} strokeWidth={2.5} />
          )}
        </button>
      )}
      {currentPage && (
        <ReadOnlyPageActions
          key={session.project.id}
          pages={session.project.pages}
          currentPageId={currentPage.id}
          isDisabled={session.isLoadingPage || session.saving}
          showNextEditedPage={session.isReadOnly}
          appearance="joined"
          isOpen={session.isPageStatsOpen}
          onOpenChange={session.setIsPageStatsOpen}
          onListPageUnitDiffStats={session.onListPageUnitDiffStats}
          onNavigate={session.handleNavigate}
        />
      )}
    </FloatingActionGroup>
  );
}
