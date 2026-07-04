import type { ChangeEvent } from "react";
import type {
  ChapterInfo,
  ComicInfo,
  PageInfo,
  UploadProgressCallbacks,
} from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { MemberInfo } from "@/types/member";
import type { Role } from "@/types/role";
import type { Result } from "@/types/utils/result";
import type {
  ChapterExport,
  ImportChapterFormat,
  ImportChapterResult,
  ListChapterArgs,
  WorkflowTransition,
} from "@/features/ComicPlayground/types/chapter";

export type ExportProgressState = {
  title: string;
  description: string;
  progress: number;
};

export const DEFAULT_EXPORT_PROGRESS: ExportProgressState = {
  title: "正在准备下载",
  description: "正在收集导出内容，请稍候。",
  progress: 0,
};

export const ROLE_TITLE_LABEL: Record<Role, string> = {
  rawProvider: "图源",
  translator: "翻译",
  proofreader: "校对",
  typesetter: "嵌字",
  redrawer: "美工",
  reviewer: "监修",
  publisher: "发布",
  admin: "管理员",
};

export type ComicDetailModalProps = {
  comicInfo: ComicInfo;
  pinnedChapter: ChapterInfo | null;
  initialChapterId?: string | null;
  onLoadChapters: (args: ListChapterArgs) => Promise<Result<ChapterInfo[]>>;
  onLoadAssignments: (chapterId: string) => Promise<Result<AssignmentInfo[]>>;
  onLoadPages: (chapterId: string) => Promise<Result<PageInfo[]>>;
  onTransiteWorkflow: (
    chapterId: string,
    transition: WorkflowTransition,
  ) => Promise<Result<void>>;
  onRemoveAssignment?: (
    chapterId: string,
    userId: string,
    role: Role,
  ) => Promise<Result<void>>;
  onLoadAssignableMembers?: (
    chapterId: string,
    args: {
      role: Role;
      keyword?: string;
      offset: number;
      limit: number;
    },
  ) => Promise<Result<MemberInfo[]>>;
  onAddAssignment?: (
    chapterId: string,
    userId: string,
    role: Role,
  ) => Promise<Result<void>>;
  onCreateChapter?: (args: {
    comicId: string;
    subtitle?: string;
  }) => Promise<Result<string>>;
  onDeleteChapter?: (chapterId: string) => Promise<Result<void>>;
  onNavigateToTranslator?: (
    chapterId: string,
    pageId: string,
    readOnly?: boolean,
  ) => void;
  currentUserId?: string | null;
  onAddPages?: (
    chapterId: string,
    files: File[],
    callbacks?: UploadProgressCallbacks,
  ) => Promise<void>;
  onDeleteChapterPages?: (chapterId: string) => Promise<Result<void>>;
  onReservePageUpload?: (args: {
    pageId: string;
    fileExtension: string;
  }) => Promise<Result<{ pageId: string; putUrl: string }>>;
  onJoinChapterRole?: (chapterId: string, role: Role) => Promise<Result<void>>;
  onImportChapter?: (args: {
    chapterId: string;
    content: string;
    format: ImportChapterFormat;
  }) => Promise<Result<ImportChapterResult>>;
  onExportChapter?: (
    chapterId: string,
    options?: { signal?: AbortSignal },
  ) => Promise<Result<ChapterExport>>;
  onExportChapterLp?: (
    chapterId: string,
    options?: { signal?: AbortSignal },
  ) => Promise<Result<string>>;
  onDeleteComic?: (comicId: string) => Promise<Result<void>>;
  onUpdateComic?: (args: {
    title: string;
    author: string;
    description?: string;
  }) => Promise<Result<void>>;
  onUpdateChapter?: (chapterId: string, subtitle?: string) => Promise<Result<void>>;
  onResolveActiveMember: () => MemberInfo | null | Promise<MemberInfo | null>;
  onClose: () => void;
};

export type CoverUploadState = {
  isUploadingCover: boolean;
  coverUploadProgress: number | null;
  localCoverUrl: string | null;
  handleCoverFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};
