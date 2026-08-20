import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";
import { useToastStore } from "@/components/ui/NotificationToast";
import type { TermbaseInfo } from "@/types/termbase";
import type { TerminologyDataSource } from "@/features/BaseTranslator/types/terminology";
import { useDebouncedValue } from "../../hook/useDebouncedValue";
import TermbasePanel from "./TermbasePanel";
import TermPanel from "./TermPanel";

const DEBOUNCE_MS = 300;
const PANEL_ANIMATION_MS = 150;

type Panel = "closed" | "termbases" | "terms";
type OpenPanel = Exclude<Panel, "closed">;

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
              onQueryChange={setTermbaseQuery}
              onSelect={handleSelectTermbase}
              onError={handleError}
            />
          ) : selectedTermbase ? (
            <TermPanel
              dataSource={dataSource}
              termbase={selectedTermbase}
              query={debouncedSourceQuery}
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
  );
}
