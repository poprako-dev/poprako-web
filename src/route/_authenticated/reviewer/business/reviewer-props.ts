import type { LoadRevisionNotes } from "./revision-note/revision-note";
import type { LoadRevisionPage } from "./revision-note/revision-page";
export type ReviewerProject = {
  chapterId: string;
  pages: readonly { id: string; index: number }[];
};
export type ReviewerProps = {
  project: ReviewerProject;
  startPageId: string;
  loadRevisionPage: LoadRevisionPage;
  loadRevisionNotes: LoadRevisionNotes;
  onExit: () => void;
};
