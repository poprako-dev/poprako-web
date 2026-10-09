import type { JSX } from "react";
import clsx from "clsx";
import { Layers } from "lucide-react";
import { revisionNoteAppearance } from "./revision-note-appearance";
import { WorkbenchItemFrame } from "@/shared/component/WorkbenchItemFrame";
import type { RevisionNote } from "./revision-note";

type Props = {
  layerName: string;
  note: RevisionNote;
  isFocused: boolean;
  onSelect: (id: string) => void;
};

export function RevisionNoteItem({ note, layerName, isFocused, onSelect }: Props): JSX.Element {
  const appearance = revisionNoteAppearance(note.type);
  return (
    <WorkbenchItemFrame
      isFocused={isFocused}
      data-revision-note-id={note.id}
      leading={
        <>
          <div
            className="shrink-0 border-l-4"
            style={{ borderColor: appearance.color }}
            title={note.type}
            data-note-type={note.type}
          />
          <button
            type="button"
            title={note.type}
            onClick={() => {
              onSelect(note.id);
            }}
            aria-label={`revision_note ${String(note.number)}：${note.type}`}
            aria-pressed={isFocused}
            className={clsx(
              "w-8 shrink-0 flex items-center justify-center select-none touch-none",
              "font-mono text-xs font-bold tracking-tighter transition-colors duration-150",
              "cursor-pointer hover:bg-surface-stone-200/70",
              isFocused ? "text-ink-stone-600" : "text-text-muted-warm hover:text-ink-stone-600",
            )}
          >
            {note.number}
          </button>
        </>
      }
    >
      <div className="mb-1 flex min-w-0 items-center gap-2" aria-label="图层与问题类型">
        <span
          className="flex min-w-0 flex-1 items-center gap-1 text-sm font-semibold leading-5 text-ink-gray-600"
          title={layerName}
        >
          <Layers size={14} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{layerName}</span>
        </span>
        <span
          className="max-w-[50%] truncate rounded-xs border px-1.5 py-0.5 text-xs leading-4 text-ink-stone-600"
          style={{
            borderColor: `color-mix(in srgb, ${appearance.border} 35%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${appearance.color} 15%, transparent)`,
          }}
          title={note.type}
        >
          {note.type}
        </span>
      </div>
      <div
        role="textbox"
        aria-readonly="true"
        aria-label={`revision_note ${String(note.number)} 内容`}
        tabIndex={0}
        onFocus={() => {
          onSelect(note.id);
        }}
        className={clsx(
          "min-h-7 pr-4 whitespace-pre-wrap break-words text-base leading-relaxed outline-none",
          isFocused ? "font-medium text-ink-stone-900" : "text-ink-stone-700",
        )}
      >
        {note.content || note.type}
      </div>
    </WorkbenchItemFrame>
  );
}
