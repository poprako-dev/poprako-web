import { useId } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalApiFailure } from "@/route/business/request-error";
import type { ResultFailure } from "@/shared/utility/result";
import type { TermbaseInfo } from "@/route/_authenticated/translator/business/terminology/termbase";
import type { TerminologyDataSource } from "@/route/_authenticated/translator/business/contract/terminology";
import { useDebouncedValue } from "@/route/_authenticated/translator/business/terminology/use-debounced-value";
import { TermbasePanel } from "@/route/_authenticated/translator/business/terminology/TermbasePanel";
import { TermPanel } from "@/route/_authenticated/translator/business/terminology/TermPanel";
import { TerminologyLookupEditors } from "./TerminologyLookupEditors";
import { useTerminologyLookupState } from "./use-terminology-lookup-state";
import { createTerminologyLookupMutations } from "./use-terminology-lookup-mutations";
import type { TerminologyLookupState } from "./use-terminology-lookup-state";

const DEBOUNCE_MS = 300;
type Props = {
  dataSource: TerminologyDataSource;
};
type Toast = ReturnType<typeof useToastStore.getState>["showToast"];

function firstGrapheme(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "术";

  if ("Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    return segmenter.segment(normalized)[Symbol.iterator]().next().value?.segment ?? "术";
  }

  return Array.from(normalized)[0] ?? "术";
}

function handleLoadError(failure: ResultFailure, showToast: Toast): void {
  console.error("[TerminologyLookup] 加载术语数据失败", { error: failure.error });
  showLocalApiFailure(failure, showToast);
}

function selectTermbase(termbase: TermbaseInfo, state: TerminologyLookupState): void {
  state.setSelectedTermbase(termbase);
  state.setTermbaseQuery("");
  state.setPanel("closed");
}

function toggleTermbasePanel(state: TerminologyLookupState): void {
  if (state.panel === "termbases") {
    state.setPanel("closed");
    return;
  }
  state.setRenderedPanel("termbases");
  state.setPanel("termbases");
}

function openTermPanel(state: TerminologyLookupState): void {
  state.setRenderedPanel("terms");
  state.setPanel("terms");
}

export function TerminologyLookupBar({ dataSource }: Props): React.ReactElement {
  const state = useTerminologyLookupState();
  const {
    panel,
    renderedPanel,
    selectedTermbase,
    termbaseQuery,
    setTermbaseQuery,
    sourceQuery,
    setSourceQuery,
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

        <div
          className={clsx(
            "flex h-8 overflow-hidden rounded-lg",
            "border border-(--brand-leaf-border)",
            "bg-surface-white/95 shadow-(--shadow-sm) backdrop-blur-md",
          )}
        >
          <button
            type="button"
            title={selectedTermbase?.name ?? "选择术语库"}
            aria-label={
              selectedTermbase ? `切换术语库，当前为 ${selectedTermbase.name}` : "选择术语库"
            }
            aria-haspopup="dialog"
            aria-expanded={panel === "termbases"}
            aria-controls={panel === "termbases" ? popoverId : undefined}
            onClick={() => {
              toggleTermbasePanel(state);
            }}
            className={clsx(
              "flex size-8 shrink-0 items-center justify-center border-r",
              "border-line-stone-200 text-xs font-semibold text-ink-stone-600",
              "transition-colors hover:bg-surface-stone-100 focus-visible:outline-2",
              "focus-visible:outline-offset-[-2px] focus-visible:outline-primary-border",
              selectedTermbase ? "bg-surface-green-50" : "bg-surface-white/80",
            )}
          >
            {selectedTermbase ? firstGrapheme(selectedTermbase.name) : "术"}
          </button>

          <label className="relative min-w-0 flex-1">
            <Search
              size={13}
              strokeWidth={1.8}
              className={clsx(
                "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2",
                "text-icon-muted-warm",
              )}
            />
            <span className="sr-only">搜索术语原文</span>
            <input
              role="combobox"
              value={sourceQuery}
              disabled={!selectedTermbase}
              aria-haspopup="dialog"
              aria-expanded={panel === "terms"}
              aria-controls={panel === "terms" ? popoverId : undefined}
              onFocus={() => {
                openTermPanel(state);
              }}
              onChange={(event) => {
                setSourceQuery(event.target.value);
              }}
              placeholder={selectedTermbase ? "搜索原文…" : "先选择术语库"}
              className={clsx(
                "h-full w-full bg-surface-stone-50/45 pl-7.5 pr-2.5 text-xs text-ink-stone-700",
                "outline-none placeholder:text-text-muted-warm focus:bg-surface-white",
                "disabled:cursor-not-allowed disabled:bg-surface-stone-50/70",
                "disabled:text-ink-stone-400 disabled:placeholder:text-ink-stone-400",
              )}
            />
          </label>
        </div>
      </div>
      <TerminologyLookupEditors editor={editor} setEditor={setEditor} mutations={mutations} />
    </>
  );
}
