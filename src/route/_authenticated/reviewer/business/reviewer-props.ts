import type { LoadIssues } from "@/route/_authenticated/business/issue/issue";
import type { LoadReviewPage } from "./issue/review-page";
export type ReviewerProject = {
  chapterId: string;
  pages: readonly {
    id: string;
    index: number;
    imageUrl?: string | null;
    imageOptimizedUrl?: string | null;
  }[];
};
export type ReviewerProps = {
  project: ReviewerProject;
  startPageId: string;
  loadReviewPage: LoadReviewPage;
  loadIssues: LoadIssues;
  onImport?: (() => void) | undefined;
  onCancelPreview?: (() => void) | undefined;
  onPageChange?: ((pageId: string) => void) | undefined;
  onExit: () => void;
};
