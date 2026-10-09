import type { JSX } from "react";
import { revisionNoteAppearance } from "./revision-note-appearance";
import { NoteMarker } from "./NoteMarker";
import type { RevisionNote } from "./revision-note";
type Props = {
  scale: number;
  notes: RevisionNote[];
  focusedId: string | null;
  visible: boolean;
  onSelect: (id: string) => void;
};
export function RevisionNoteOverlay({
  scale,
  notes,
  focusedId,
  visible,
  onSelect,
}: Props): JSX.Element {
  return (
    <>
      {visible &&
        notes.map(
          (note) =>
            note.rect && (
              <NoteMarker
                key={note.id}
                appearance={revisionNoteAppearance(note.type)}
                id={note.id}
                number={note.number}
                rect={note.rect}
                scale={scale}
                isSelected={focusedId === note.id}
                onSelect={onSelect}
              />
            ),
        )}
    </>
  );
}
