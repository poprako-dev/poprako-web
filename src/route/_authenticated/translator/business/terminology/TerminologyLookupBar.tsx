import { useTermbaseAppend } from "@/route/_authenticated/business/terminology/use-termbase-append";
import { useId } from "react";
import { TerminologyLookupControls } from "./TerminologyLookupControls";
import clsx from "clsx";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalApiFailure } from "@/route/business/request-error";
import type { ResultFailure } from "@/shared/utility/result";
import type { TermbaseInfo } from "@/route/_authenticated/business/terminology/termbase";
import type { TerminologyDataSource } from "@/route/_authenticated/business/terminology/terminology-contract";
import { useDebouncedValue } from "@/route/_authenticated/business/terminology/use-debounced-value";
import { TermbasePanel } from "@/route/_authenticated/business/terminology/TermbasePanel";
import { TermPanel } from "@/route/_authenticated/business/terminology/TermPanel";
import { TerminologyLookupEditors } from "./TerminologyLookupEditors";
import { useTerminologyLookupState } from "./use-terminology-lookup-state";
import { createTerminologyLookupMutations } from "./use-terminology-lookup-mutations";
import type { TerminologyLookupState } from "./use-terminology-lookup-state";
import type { TermbaseExportActions } from "@/route/_authenticated/business/terminology/use-termbase-export";

const DEBOUNCE_MS = 300;
type Props = {
  dataSource: TerminologyDataSource;
  termbaseExport: TermbaseExportActions;
};
type Toast = ReturnType<typeof useToastStore.getState>["showToast"];

function handleLoadError(failure: ResultFailure, showToast: Toast): void {
  console.error("[TerminologyLookup] 加载术语数据失败", { error: failure.error });
  showLocalApiFailure(failure, showToast);
}

function selectTermbase(termbase: TermbaseInfo, state: TerminologyLookupState): void {
  state.setSelectedTermbase(termbase);
  state.setTermbaseQuery("");
  state.setPanel("closed");
}

export function TerminologyLookupBar({ dataSource, termbaseExport }: Props): React.ReactElement {
  const state = useTerminologyLookupState();
  const appends = useTermbaseAppend(dataSource, (id, result) => {
    state.setTermbaseRevision((revision) => revision + 1);
    state.setTermRevision((revision) => revision + 1);
    state.setSelectedTermbase((current) =>
      current?.id === id && result
        ? { ...current, termCount: current.termCount + result.added }
        : current,
    );
  });
  const {
    panel,
    renderedPanel,
    selectedTermbase,
    termbaseQuery,
    setTermbaseQuery,
    sourceQuery,
    termbaseRevision,
    termRevision,
    editor,
    setEditor,
    rootRef,
  } = state;
  const popoverId = useId();
  const showToast = useToastStore((state) => state.showToast);
  const mutations = createTerminologyLookupMutations(dataSource, state, showToast);
  const debouncedTermbaseQuery = useDebouncedValue(termbaseQuery, DEBOUNCE_MS);
  const debouncedSourceQuery = useDebouncedValue(sourceQuery, DEBOUNCE_MS);
  const isExpanded = panel !== "closed";

  return (
    <>
      <div
        ref={rootRef}
        data-testid="terminology-lookup"
        className={clsx(
          "absolute bottom-2 left-2 z-40 max-w-[calc(100%-1rem)]",
          "transition-[width] duration-300 ease-out motion-reduce:transition-none",
          isExpanded
            ? ["w-[calc(100%-1rem)]", "@[40rem]:w-[max(max(9rem,20%),min(40%,24rem))]"]
            : "w-[min(max(9rem,20%),calc(100%-1rem))]",
        )}
      >
        {renderedPanel && (
          <div
            id={popoverId}
            role="dialog"
            aria-hidden={!isExpanded}
            inert={!isExpanded}
            aria-label={renderedPanel === "termbases" ? "选择术语库" : "查询术语"}
            className={clsx(
              "absolute bottom-[calc(100%+0.25rem)] left-0 flex w-full flex-col",
              "max-h-[min(18rem,calc(100vh-5rem))] overflow-hidden rounded-lg",
              "sm:h-[20dvh]",
              "border border-(--brand-leaf-border) bg-surface-white/95",
              "shadow-(--shadow-sm)",
              "backdrop-blur-md duration-150 motion-reduce:animate-none",
              isExpanded
                ? "animate-in fade-in-0 slide-in-from-bottom-1"
                : ["pointer-events-none animate-out fade-out-0", "slide-out-to-bottom-1"],
            )}
          >
            {renderedPanel === "termbases" ? (
              <TermbasePanel
                canCreate
                canEdit={(termbase) => Boolean(termbase.comicId)}
                termbaseExport={termbaseExport}
                termbaseAppend={appends}
                dataSource={dataSource}
                query={termbaseQuery}
                searchQuery={debouncedTermbaseQuery}
                {...(selectedTermbase ? { selectedTermbase } : {})}
                revision={termbaseRevision}
                onQueryChange={setTermbaseQuery}
                onSelect={(termbase) => {
                  selectTermbase(termbase, state);
                }}
                onCreate={() => {
                  setEditor({ kind: "termbase" });
                }}
                onEdit={(termbase) => {
                  setEditor({ kind: "termbase", termbase });
                }}
                onError={(failure) => {
                  handleLoadError(failure, showToast);
                }}
              />
            ) : selectedTermbase ? (
              <TermPanel
                canEdit={Boolean(selectedTermbase.comicId)}
                dataSource={dataSource}
                termbase={selectedTermbase}
                query={debouncedSourceQuery}
                revision={termRevision}
                onCreate={() => {
                  setEditor({ kind: "term" });
                }}
                onEdit={(term) => {
                  setEditor({ kind: "term", term });
                }}
                onError={(failure) => {
                  handleLoadError(failure, showToast);
                }}
              />
            ) : null}
          </div>
        )}

        <TerminologyLookupControls state={state} popoverId={popoverId} />
      </div>
      <TerminologyLookupEditors editor={editor} setEditor={setEditor} mutations={mutations} />
    </>
  );
}
