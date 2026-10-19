import type { ApiClient } from "@/api/client";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import type { DetailContract } from "./comic-detail-type";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";

export type ExportOptions = {
  includeImages?: boolean | undefined;
  withRawIdent?: boolean | undefined;
};
type ShowToast = (message: string, type: ToastType) => void;
export type ExportActionArgs = {
  client: ApiClient;
  comicTitle: string;
  comicAuthor?: string | null | undefined;
  comicIndex?: number | null | undefined;
  selectedChapterId: string | null;
  selectedChapter?: { index: number; subtitle?: string | undefined } | undefined;
  pages: PageInfo[];
  assignments: AssignmentInfo[];
  onExportChapter?: DetailContract["onExportChapter"] | undefined;
  onWorkflowRecordsChanged: () => void;
  showToast: ShowToast;
};
export type ProgressUpdate = (title: string, description: string, progress: number) => void;
export type ExportContext = ExportActionArgs & {
  signal: AbortSignal;
  updateProgress: ProgressUpdate;
  assertNotAborted: () => void;
  completedPages: { value: number };
};
