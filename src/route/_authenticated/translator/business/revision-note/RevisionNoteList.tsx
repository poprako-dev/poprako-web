import { useEffect, useRef } from "react";
import type { JSX } from "react";
import type { RevisionNote } from "./revision-note";
import type { RevisionLayer } from "./revision-page";
import { RevisionNoteItem } from "./RevisionNoteItem";
function layerLabel(layers: RevisionLayer[], id: string | null): string {
  if (id === null) return "整页";
  const name = layers.find((layer) => layer.id === id)?.name.trim();
  return name !== undefined && name.length > 0 ? name : `图层 ${id}`;
}
type Props = {
  layers: RevisionLayer[];
  notes: RevisionNote[];
  focusedId: string | null;
  onSelect: (id: string) => void;
};
export function RevisionNoteList({ layers, notes, focusedId, onSelect }: Props): JSX.Element {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: "nearest" });
  }, [focusedId]);
  return (
    <div
      ref={listRef}
      role="region"
      aria-label="revision_note 列表"
      className="h-full w-full overflow-y-auto bg-surface-stone-50"
    >
      {notes.map((note) => (
        <RevisionNoteItem
          key={note.id}
          note={note}
          layerName={layerLabel(layers, note.layerId)}
          isFocused={focusedId === note.id}
          onSelect={onSelect}
        />
      ))}
      {notes.length === 0 && (
        <span role="status" className="sr-only">
          本页没有 revision_note
        </span>
      )}
    </div>
  );
}
