import type { JSX as TranslatorImportedType0 } from "react/jsx-runtime";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";
import { ShortcutPanel } from "@/routes/_authenticated/translator/business/shortcut/ShortcutPanel";
import { SpecialCharPanel } from "@/routes/_authenticated/translator/business/special-character/SpecialCharPanel";
import { UnitSearchTransformDialog } from "@/routes/_authenticated/translator/business/search-transform/UnitSearchTransformDialog";
import { FloatingSpecialCharsBar } from "@/routes/_authenticated/translator/business/FloatingSpecialCharsBar";
import type { EditorSession } from "./use-editor-session";
type Props = { session: EditorSession };
export function EditorDialog({ session }: Props): TranslatorImportedType0.Element {
  const {
    project,
    unitSearchTransform,
    pageIndex,
    isShortcutPanelOpen,
    setIsShortcutPanelOpen,
    isSpecialCharPanelOpen,
    setIsSpecialCharPanelOpen,
    isUnitSearchTransformOpen,
    setIsUnitSearchTransformOpen,
    deleteConfirmUnitId,
    setDeleteConfirmUnitId,
    isCompletingStage,
    isCompleteConfirmOpen,
    setIsCompleteConfirmOpen,
    fixedShortcuts,
    configurableShortcuts,
    updateConfigurableShortcuts,
    pendingAction,
    saving,
    runExclusive,
    flushIfDirty,
    handleRetryPendingAction,
    handleDiscardPendingAction,
    handleRequestSpecialChar,
    handleRefreshCurrentPage,
    handleSearchResultNavigate,
    doDeleteUnit,
    isSpecialCharsBarVisible,
    canInsertSpecialChar,
    specialCharsBar,
    handleCompleteStage,
    completionStage,
    unitSearchPart,
  } = session;
  return (
    <>
      {isSpecialCharsBarVisible && (
        <FloatingSpecialCharsBar
          controller={specialCharsBar}
          isDisabled={!canInsertSpecialChar}
          onInsert={handleRequestSpecialChar}
        />
      )}
      {isShortcutPanelOpen && (
        <ShortcutPanel
          fixedShortcuts={fixedShortcuts}
          configurableShortcuts={configurableShortcuts}
          onUpdateConfigurableShortcuts={updateConfigurableShortcuts}
          onClose={() => {
            setIsShortcutPanelOpen(false);
          }}
        />
      )}
      {isSpecialCharPanelOpen && (
        <SpecialCharPanel
          onClose={() => {
            setIsSpecialCharPanelOpen(false);
          }}
        />
      )}
      {isUnitSearchTransformOpen && project.pages[pageIndex] && (
        <UnitSearchTransformDialog
          pages={project.pages}
          part={unitSearchPart}
          currentPageId={project.pages[pageIndex].id}
          dataSource={unitSearchTransform}
          onBeforeSearch={() => flushIfDirty(false)}
          runExclusive={runExclusive}
          onRefreshCurrentPage={handleRefreshCurrentPage}
          onNavigate={handleSearchResultNavigate}
          onClose={() => {
            setIsUnitSearchTransformOpen(false);
          }}
        />
      )}
      {pendingAction && (
        <ConfirmDialog
          title="保存失败，是否继续？"
          description="可以选择再次重试保存；或放弃本页未保存修改并继续操作。"
          confirmLabel="再次重试"
          cancelLabel="放弃并继续"
          loading={saving}
          onConfirm={() => {
            void handleRetryPendingAction().catch((error: unknown) => {
              console.error("[Translator] 保存重试失败:", error);
            });
          }}
          onCancel={() => {
            void handleDiscardPendingAction().catch((error: unknown) => {
              console.error("[Translator] 放弃未保存修改失败:", error);
            });
          }}
        />
      )}
      {deleteConfirmUnitId !== undefined && (
        <ConfirmDialog
          title="确认删除"
          description="该文本块包含已翻译或已校对内容，删除后不可恢复。确定要删除吗？"
          confirmLabel="删除"
          cancelLabel="取消"
          onConfirm={() => {
            doDeleteUnit(deleteConfirmUnitId);
            setDeleteConfirmUnitId(undefined);
          }}
          onCancel={() => {
            setDeleteConfirmUnitId(undefined);
          }}
        />
      )}
      {isCompleteConfirmOpen && completionStage && (
        <ConfirmDialog
          title={completionStage === "proofread" ? "确认完成校对" : "确认完成翻译"}
          description={
            completionStage === "proofread"
              ? "确认将当前章节的校对阶段标记为已完成吗？" + "未保存内容会先自动保存。"
              : "确认将当前章节的翻译阶段标记为已完成吗？" + "未保存内容会先自动保存。"
          }
          confirmLabel="确认完成"
          cancelLabel="取消"
          confirmTone="success"
          loading={isCompletingStage}
          onConfirm={() => {
            void handleCompleteStage().catch((error: unknown) => {
              console.error("[Translator] 完成阶段失败:", error);
            });
          }}
          onCancel={() => {
            if (!isCompletingStage) setIsCompleteConfirmOpen(false);
          }}
        />
      )}
    </>
  );
}
