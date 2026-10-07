export type ReadOnlyView = "unit" | "revision_note";
export type RevisionNote = {
  id: string;
  /** Original artifact number; filtering never renumbers notes. */
  number: number;
  type: string;
  content: string;
  /** Page-relative coordinates in 0–1, independent of PSD layer bounds. */
  rect: { xCoord: number; yCoord: number; width: number; height: number } | null;
  /** PSD document index path; never a translation unit ID or layer name. */
  layerId: string | null;
};
export type LoadRevisionNotes = ((pageId: string) => Promise<RevisionNote[]>) | null;
