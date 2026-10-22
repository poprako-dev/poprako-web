import { Search } from "lucide-react";
import clsx from "clsx";
import type { TerminologyLookupState } from "./use-terminology-lookup-state";

type Props = { state: TerminologyLookupState; popoverId: string };

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

export function TerminologyLookupControls({ state, popoverId }: Props): React.ReactElement {
  const { selectedTermbase, panel, sourceQuery, setSourceQuery } = state;
  return (
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
        aria-label={selectedTermbase ? `切换术语库，当前为 ${selectedTermbase.name}` : "选择术语库"}
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
  );
}
