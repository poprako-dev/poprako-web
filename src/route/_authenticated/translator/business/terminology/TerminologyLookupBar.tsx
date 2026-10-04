import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalApiFailure } from "@/route/business/request-error";
import type { ResultFailure } from "@/shared/utility/result";
import type { TermbaseInfo } from "@/route/_authenticated/translator/business/terminology/termbase";
import type { TermInfo } from "@/route/_authenticated/translator/business/terminology/term";
import type {
  TerminologyDataSource,
  UpdateTermArgs,
  UpdateTermbaseArgs,
} from "@/route/_authenticated/translator/business/contract/terminology";
import { useDebouncedValue } from "@/route/_authenticated/translator/business/terminology/use-debounced-value";
import { TermbasePanel } from "@/route/_authenticated/translator/business/terminology/TermbasePanel";
import { TermPanel } from "@/route/_authenticated/translator/business/terminology/TermPanel";
import { TermbaseEditorDialog } from "@/route/_authenticated/translator/business/terminology/TermbaseEditorDialog";
import { TermEditorDialog } from "@/route/_authenticated/translator/business/terminology/TermEditorDialog";

const DEBOUNCE_MS = 300;
const PANEL_ANIMATION_MS = 150;

type Panel = "closed" | "termbases" | "terms";
type OpenPanel = Exclude<Panel, "closed">;
type EditorState =
  | { kind: "termbase"; termbase?: TermbaseInfo | undefined }
  | { kind: "term"; term?: TermInfo | undefined };

type Props = {
  dataSource: TerminologyDataSource;
};

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

export function TerminologyLookupBar({ dataSource }: Props): React.ReactElement {
  const [panel, setPanel] = useState<Panel>("closed");
  const [renderedPanel, setRenderedPanel] = useState<OpenPanel>();
  const [selectedTermbase, setSelectedTermbase] = useState<TermbaseInfo>();
  const [termbaseQuery, setTermbaseQuery] = useState("");
  const [sourceQuery, setSourceQuery] = useState("");
  const [termbaseRevision, setTermbaseRevision] = useState(0);
  const [termRevision, setTermRevision] = useState(0);
  const [editor, setEditor] = useState<EditorState>();
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  const showToast = useToastStore((state) => state.showToast);
  const debouncedTermbaseQuery = useDebouncedValue(termbaseQuery, DEBOUNCE_MS);
  const debouncedSourceQuery = useDebouncedValue(sourceQuery, DEBOUNCE_MS);
  const isExpanded = panel !== "closed";

  useEffect((): (() => void) | undefined => {
    if (panel !== "closed" || !renderedPanel) return;

    const timeoutId = globalThis.setTimeout(() => {
      setRenderedPanel(undefined);
    }, PANEL_ANIMATION_MS);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [panel, renderedPanel]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent): void => {
      if (event.target instanceof Element && event.target.closest("[data-app-dialog]")) return;
      if (!rootRef.current?.contains(event.target as Node)) {
        setPanel("closed");
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const handleError = useCallback(
    (failure: ResultFailure): void => {
      console.error("[TerminologyLookup] 加载术语数据失败", {
        error: failure.error,
      });
      showLocalApiFailure(failure, showToast);
    },
    [showToast],
  );

  const handleMutationError = (action: string, failure: ResultFailure): false => {
    console.error(`[TerminologyLookup] ${action}失败`, {
      error: failure.error,
    });
    showLocalApiFailure(failure, showToast);
    return false;
  };

  const handleSaveTermbase = async (
    termbase: TermbaseInfo | undefined,
    args: UpdateTermbaseArgs,
  ): Promise<boolean> => {
    if (!termbase) {
      const result = await dataSource.createTermbase(args);
      if (!result.success) return handleMutationError("创建术语库", result);
      setTermbaseQuery("");
      setTermbaseRevision((revision) => revision + 1);
      showToast("术语库已创建", "success");
      return true;
    }

    const result = await dataSource.updateTermbase(termbase.id, args);
    if (!result.success) return handleMutationError("更新术语库", result);
    setSelectedTermbase((current) =>
      current?.id === termbase.id
        ? { ...current, ...args, description: args.description ?? "" }
        : current,
    );
    setTermbaseRevision((revision) => revision + 1);
    showToast("术语库已更新", "success");
    return true;
  };

  const handleDeleteTermbase = async (termbase: TermbaseInfo): Promise<boolean> => {
    const result = await dataSource.deleteTermbase(termbase.id);
    if (!result.success) return handleMutationError("删除术语库", result);
    if (selectedTermbase?.id === termbase.id) {
      setSelectedTermbase(undefined);
      setSourceQuery("");
      setRenderedPanel("termbases");
      setPanel("termbases");
    }
    setTermbaseRevision((revision) => revision + 1);
    setTermRevision((revision) => revision + 1);
    showToast("术语库已删除", "success");
    return true;
  };

  const handleSaveTerm = async (
    term: TermInfo | undefined,
    args: UpdateTermArgs,
  ): Promise<boolean> => {
    if (!selectedTermbase) return false;
    if (!term) {
      const result = await dataSource.createTerm({
        termbaseId: selectedTermbase.id,
        ...args,
      });
      if (!result.success) return handleMutationError("创建术语", result);
      setSourceQuery("");
      setSelectedTermbase((current) =>
        current ? { ...current, termCount: current.termCount + 1 } : current,
      );
      setTermbaseRevision((revision) => revision + 1);
      setTermRevision((revision) => revision + 1);
      showToast("术语已创建", "success");
      return true;
    }

    const result = await dataSource.updateTerm(term.id, args);
    if (!result.success) return handleMutationError("更新术语", result);
    setTermRevision((revision) => revision + 1);
    showToast("术语已更新", "success");
    return true;
  };

  const handleDeleteTerm = async (term: TermInfo): Promise<boolean> => {
    const result = await dataSource.deleteTerm(term.id);
    if (!result.success) return handleMutationError("删除术语", result);
    setSelectedTermbase((current) =>
      current ? { ...current, termCount: Math.max(0, current.termCount - 1) } : current,
    );
    setTermbaseRevision((revision) => revision + 1);
    setTermRevision((revision) => revision + 1);
    showToast("术语已删除", "success");
    return true;
  };

  const handleSelectTermbase = (termbase: TermbaseInfo): void => {
    setSelectedTermbase(termbase);
    setTermbaseQuery("");
    setPanel("closed");
  };

  const handleToggleTermbases = (): void => {
    if (panel === "termbases") {
      setPanel("closed");
      return;
    }

    setRenderedPanel("termbases");
    setPanel("termbases");
  };

  const handleOpenTerms = (): void => {
    setRenderedPanel("terms");
    setPanel("terms");
  };

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
                onSelect={handleSelectTermbase}
                onCreate={() => {
                  setEditor({ kind: "termbase" });
                }}
                onEdit={(termbase) => {
                  setEditor({ kind: "termbase", termbase });
                }}
                onError={handleError}
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
                onError={handleError}
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
            onClick={handleToggleTermbases}
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
                "text-text-muted-warm",
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
              onFocus={handleOpenTerms}
              onChange={(event) => {
                setSourceQuery(event.target.value);
              }}
              placeholder={selectedTermbase ? "搜索原文…" : "先选择术语库"}
              className={clsx(
                "h-full w-full bg-surface-stone-50/45 pl-7.5 pr-2.5 text-xs text-ink-stone-700",
                "outline-none placeholder:text-text-muted-warm focus:bg-surface-white",
                "disabled:cursor-not-allowed disabled:bg-surface-stone-50/70",
                "disabled:text-text-muted-warm disabled:placeholder:text-text-muted-warm",
              )}
            />
          </label>
        </div>
      </div>
      {editor?.kind === "termbase" && (
        <TermbaseEditorDialog
          termbase={editor.termbase}
          onSave={(args) => handleSaveTermbase(editor.termbase, args)}
          onDelete={editor.termbase ? handleDeleteTermbase.bind(null, editor.termbase) : undefined}
          onClose={() => {
            setEditor(undefined);
          }}
        />
      )}
      {editor?.kind === "term" && (
        <TermEditorDialog
          term={editor.term}
          onSave={(args) => handleSaveTerm(editor.term, args)}
          onDelete={editor.term ? handleDeleteTerm.bind(null, editor.term) : undefined}
          onClose={() => {
            setEditor(undefined);
          }}
        />
      )}
    </>
  );
}
