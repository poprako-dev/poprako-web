import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";
import { useToastStore } from "@/components/ui/NotificationToast";
import type { TermbaseInfo } from "@/types/termbase";
import type { TermInfo } from "@/types/term";
import type {
  TerminologyDataSource,
  UpdateTermArgs,
  UpdateTermbaseArgs,
} from "@/features/BaseTranslator/types/terminology";
import { useDebouncedValue } from "../../hook/useDebouncedValue";
import TermbasePanel from "./TermbasePanel";
import TermPanel from "./TermPanel";
import TermbaseEditorDialog from "./TermbaseEditorDialog";
import TermEditorDialog from "./TermEditorDialog";

const DEBOUNCE_MS = 300;
const PANEL_ANIMATION_MS = 150;

type Panel = "closed" | "termbases" | "terms";
type OpenPanel = Exclude<Panel, "closed">;
type EditorState =
  | { kind: "termbase"; termbase?: TermbaseInfo }
  | { kind: "term"; term?: TermInfo };

type Props = {
  dataSource: TerminologyDataSource;
};

function firstGrapheme(value: string) {
  const normalized = value.trim();
  if (!normalized) return "术";

  if ("Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return segmenter.segment(normalized)[Symbol.iterator]().next().value?.segment ?? "术";
  }

  return Array.from(normalized)[0] ?? "术";
}

export default function TerminologyLookupBar({ dataSource }: Props) {
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

  useEffect(() => {
    if (panel !== "closed" || !renderedPanel) return;

    const timeoutId = window.setTimeout(() => {
      setRenderedPanel(undefined);
    }, PANEL_ANIMATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [panel, renderedPanel]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-terminology-dialog]")
      ) return;
      if (!rootRef.current?.contains(event.target as Node)) {
        setPanel("closed");
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleError = useCallback((error: string) => {
    console.error("[TerminologyLookup] 加载术语数据失败", { error });
    showToast(error, "error");
  }, [showToast]);

  const handleMutationError = (action: string, error: string) => {
    console.error(`[TerminologyLookup] ${action}失败`, { error });
    showToast(error, "error");
    return false;
  };

  const handleSaveTermbase = async (
    termbase: TermbaseInfo | undefined,
    args: UpdateTermbaseArgs,
  ) => {
    if (!termbase) {
      const result = await dataSource.createTermbase(args);
      if (!result.success) return handleMutationError("创建术语库", result.error);
      setTermbaseQuery("");
      setTermbaseRevision((revision) => revision + 1);
      showToast("术语库已创建", "success");
      return true;
    }

    const result = await dataSource.updateTermbase(termbase.id, args);
    if (!result.success) return handleMutationError("更新术语库", result.error);
    setSelectedTermbase((current) => current?.id === termbase.id
      ? { ...current, ...args, description: args.description ?? "" }
      : current);
    setTermbaseRevision((revision) => revision + 1);
    showToast("术语库已更新", "success");
    return true;
  };

  const handleDeleteTermbase = async (termbase: TermbaseInfo) => {
    const result = await dataSource.deleteTermbase(termbase.id);
    if (!result.success) return handleMutationError("删除术语库", result.error);
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
  ) => {
    if (!selectedTermbase) return false;
    if (!term) {
      const result = await dataSource.createTerm({
        termbaseId: selectedTermbase.id,
        ...args,
      });
      if (!result.success) return handleMutationError("创建术语", result.error);
      setSourceQuery("");
      setSelectedTermbase((current) => current
        ? { ...current, termCount: current.termCount + 1 }
        : current);
      setTermbaseRevision((revision) => revision + 1);
      setTermRevision((revision) => revision + 1);
      showToast("术语已创建", "success");
      return true;
    }

    const result = await dataSource.updateTerm(term.id, args);
    if (!result.success) return handleMutationError("更新术语", result.error);
    setTermRevision((revision) => revision + 1);
    showToast("术语已更新", "success");
    return true;
  };

  const handleDeleteTerm = async (term: TermInfo) => {
    const result = await dataSource.deleteTerm(term.id);
    if (!result.success) return handleMutationError("删除术语", result.error);
    setSelectedTermbase((current) => current
      ? { ...current, termCount: Math.max(0, current.termCount - 1) }
      : current);
    setTermbaseRevision((revision) => revision + 1);
    setTermRevision((revision) => revision + 1);
    showToast("术语已删除", "success");
    return true;
  };

  const handleSelectTermbase = (termbase: TermbaseInfo) => {
    setSelectedTermbase(termbase);
    setTermbaseQuery("");
    setPanel("closed");
  };

  const handleToggleTermbases = () => {
    if (panel === "termbases") {
      setPanel("closed");
      return;
    }

    setRenderedPanel("termbases");
    setPanel("termbases");
  };

  const handleOpenTerms = () => {
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
            ? [
                "w-[calc(100%-1rem)]",
                "@[40rem]:w-[max(max(9rem,20%),min(40%,24rem))]",
              ]
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
            "max-h-[min(18rem,calc(100vh-5rem))] overflow-hidden rounded-sm",
            "sm:h-[20dvh]",
            "border border-black/5 bg-white/95 shadow-lg shadow-black/10",
            "backdrop-blur-md duration-150 motion-reduce:animate-none",
            isExpanded
              ? "animate-in fade-in-0 slide-in-from-bottom-1"
              : [
                  "pointer-events-none animate-out fade-out-0",
                  "slide-out-to-bottom-1",
                ],
          )}
        >
          {renderedPanel === "termbases" ? (
            <TermbasePanel
              dataSource={dataSource}
              query={termbaseQuery}
              searchQuery={debouncedTermbaseQuery}
              selectedTermbase={selectedTermbase}
              revision={termbaseRevision}
              onQueryChange={setTermbaseQuery}
              onSelect={handleSelectTermbase}
              onCreate={() => setEditor({ kind: "termbase" })}
              onEdit={(termbase) => setEditor({ kind: "termbase", termbase })}
              onError={handleError}
            />
          ) : selectedTermbase ? (
            <TermPanel
              dataSource={dataSource}
              termbase={selectedTermbase}
              query={debouncedSourceQuery}
              revision={termRevision}
              onCreate={() => setEditor({ kind: "term" })}
              onEdit={(term) => setEditor({ kind: "term", term })}
              onError={handleError}
            />
          ) : null}
        </div>
      )}

      <div
        className={clsx(
          "flex h-8 overflow-hidden rounded-sm border border-black/5",
          "bg-white/95 shadow-lg shadow-black/10 backdrop-blur-md",
        )}
      >
        <button
          type="button"
          title={selectedTermbase?.name ?? "选择术语库"}
          aria-label={selectedTermbase
            ? `切换术语库，当前为 ${selectedTermbase.name}`
            : "选择术语库"}
          aria-haspopup="dialog"
          aria-expanded={panel === "termbases"}
          aria-controls={panel === "termbases" ? popoverId : undefined}
          onClick={handleToggleTermbases}
          className={clsx(
            "flex size-8 shrink-0 items-center justify-center border-r",
            "border-stone-200 text-xs font-semibold text-stone-600",
            "transition-colors hover:bg-stone-100 focus-visible:outline-2",
            "focus-visible:outline-offset-[-2px] focus-visible:outline-primary-border",
            selectedTermbase ? "bg-green-50" : "bg-white/80",
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
              selectedTermbase ? "text-stone-400" : "text-stone-300",
            )}
          />
          <span className="sr-only">搜索术语原文</span>
          <input
            value={sourceQuery}
            disabled={!selectedTermbase}
            aria-haspopup="dialog"
            aria-expanded={panel === "terms"}
            aria-controls={panel === "terms" ? popoverId : undefined}
            onFocus={handleOpenTerms}
            onChange={(event) => setSourceQuery(event.target.value)}
            placeholder={selectedTermbase ? "搜索原文…" : "先选择术语库"}
            className={clsx(
              "h-full w-full bg-stone-50/45 pl-7.5 pr-2.5 text-xs text-stone-700",
              "outline-none placeholder:text-stone-400 focus:bg-white",
              "disabled:cursor-not-allowed disabled:bg-stone-50/70",
              "disabled:text-stone-400 disabled:placeholder:text-stone-400",
            )}
          />
        </label>
      </div>
      </div>
      {editor?.kind === "termbase" && (
        <TermbaseEditorDialog
          termbase={editor.termbase}
          onSave={(args) => handleSaveTermbase(editor.termbase, args)}
          onDelete={editor.termbase
            ? () => handleDeleteTermbase(editor.termbase!)
            : undefined}
          onClose={() => setEditor(undefined)}
        />
      )}
      {editor?.kind === "term" && (
        <TermEditorDialog
          term={editor.term}
          onSave={(args) => handleSaveTerm(editor.term, args)}
          onDelete={editor.term ? () => handleDeleteTerm(editor.term!) : undefined}
          onClose={() => setEditor(undefined)}
        />
      )}
    </>
  );
}
