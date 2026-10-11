import { useApiClient } from "@/route/business/api-context";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import type { MemberInfo } from "@/route/business/identity/member";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type {
  CoverUploadState,
  DetailContract,
  ExportProgressState,
} from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";
import { useComicDetailCoverUpload } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-cover-upload";
import { useComicDetailImport } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-import";
import { useComicDetailExportAction } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-export-action";

type ShowToast = (message: string, type: ToastType) => void;
type Args = {
  comicId: string;
  comicTitle: string;
  comicAuthor?: string | null | undefined;
  comicIndex?: number | null | undefined;
  comicCoverThumbnailUrl?: string | null | undefined;
  isCoverUploaded: boolean;
  selectedChapterId: string | null;
  selectedChapter?: { index: number; subtitle?: string | undefined } | undefined;
  pages: PageInfo[];
  assignments: AssignmentInfo[];
  activeMember: MemberInfo | null;
  canUploadRawPages: boolean;
  onExportChapter?: DetailContract["onExportChapter"] | undefined;
  onImportChapter: DetailContract["onImportChapter"];
  reloadCurrentPages: () => Promise<void>;
  reloadLoadedChapters: () => Promise<void>;
  onWorkflowRecordsChanged: () => void;
  showToast: ShowToast;
};
type ExportOptions = { includeImages?: boolean | undefined; withRawIdent?: boolean | undefined };
type ComicDetailExportState = ReturnType<typeof useComicDetailImport> & {
  isExportingData: boolean;
  exportProgress: ExportProgressState;
  canUploadCover: boolean;
  handleExportData: (options?: ExportOptions) => Promise<void>;
  coverUpload: CoverUploadState;
  cancelExport: () => void;
};

export function useComicDetailExport(args: Args): ComicDetailExportState {
  const client = useApiClient();
  const importState = useComicDetailImport({
    selectedChapterId: args.selectedChapterId,
    onImportChapter: args.onImportChapter,
    reloadCurrentPages: args.reloadCurrentPages,
    reloadLoadedChapters: args.reloadLoadedChapters,
    onWorkflowRecordsChanged: args.onWorkflowRecordsChanged,
    showToast: args.showToast,
  });
  const exportState = useComicDetailExportAction({
    client,
    comicTitle: args.comicTitle,
    comicAuthor: args.comicAuthor,
    comicIndex: args.comicIndex,
    selectedChapterId: args.selectedChapterId,
    selectedChapter: args.selectedChapter,
    pages: args.pages,
    assignments: args.assignments,
    onExportChapter: args.onExportChapter,
    onWorkflowRecordsChanged: args.onWorkflowRecordsChanged,
    showToast: args.showToast,
  });
  const { canUploadCover, coverUpload } = useComicDetailCoverUpload({
    comicId: args.comicId,
    isCoverUploaded: args.isCoverUploaded,
    comicCoverThumbnailUrl: args.comicCoverThumbnailUrl,
    selectedChapterIndex: args.selectedChapter?.index,
    pages: args.pages,
    activeMember: args.activeMember,
    canUploadRawPages: args.canUploadRawPages,
    showToast: args.showToast,
  });
  return { ...importState, ...exportState, canUploadCover, coverUpload };
}
