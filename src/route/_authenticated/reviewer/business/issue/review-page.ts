import type { PagePreview } from "@/shared/utility/page-geometry";
import type { ReportReviewProgress } from "./review-load-progress";
export type { PageRect } from "@/shared/utility/page-geometry";
export type ReviewPreview = PagePreview;
export type ReviewPage = {
  width?: number;
  height?: number;
  composite: ReviewPreview;
  dispose: () => void | Promise<void>;
};
export type LoadReviewPage =
  | ((
      pageId: string,
      signal: AbortSignal,
      onProgress?: ReportReviewProgress,
    ) => Promise<ReviewPage>)
  | null;
