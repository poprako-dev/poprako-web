import type { ChangeEvent } from "react";
import type {
  ChapterInfo,
  ComicInfo,
  AllocatedPage,
  PageInfo,
  UploadProgressCallbacks,
} from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { MemberInfo } from "@/types/member";
import type { Role } from "@/types/role";
import type { Result } from "@/types/utils/result";
import type {
  ChapterExports,
  ImportChapterArgs,
  ImportChapterResult,
  ListChapterArgs,
  ListChapterWorkflowRecordsArgs,
  WorkflowTransition,
} from "@/features/ComicPlayground/types/chapter";
import type { ChapterWorkflowRecord } from "@/types/chapterWorkflowRecord";
import type { UserInfo } from "@/types/user";

export interface ExportProgressState {
  title: string;
  description: string;
  progress: number;
}

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

export interface ComicDetailModalProps {
  comicInfo: ComicInfo;
  pinnedChapter: ChapterInfo | null;
  pinnedChapterAssignments?: AssignmentInfo[] | undefined;
  initialChapterId?: string | null | undefined;
  onLoadChapters: (args: ListChapterArgs) => Promise<Result<ChapterInfo[]>>;
  onLoadAssignments: (chapterId: string) => Promise<Result<AssignmentInfo[]>>;
  onLoadPages: (chapterId: string) => Promise<Result<PageInfo[]>>;
  onLoadWorkflowRecords: (
    args: ListChapterWorkflowRecordsArgs,
  ) => Promise<Result<ChapterWorkflowRecord[]>>;
  onResolveWorkflowRecordUser: (
    userId: string,
  ) => Promise<Result<UserInfo>>;
  onTransiteWorkflow: (
    chapterId: string,
    transition: WorkflowTransition,
  ) => Promise<Result<void>>;
  onRemoveAssignment?: ((
    chapterId: string,
    userId: string,
    role: Role,
  ) => Promise<Result<void>>) | undefined;
  onLoadAssignableMembers?: ((
    chapterId: string,
    args: {
      role: Role;
      keyword?: string | undefined;
      offset: number;
      limit: number;
    },
  ) => Promise<Result<MemberInfo[]>>) | undefined;
  onAddAssignment?: ((
    chapterId: string,
    userId: string,
    role: Role,
  ) => Promise<Result<void>>) | undefined;
  onCreateChapter?: ((args: {
    comicId: string;
    subtitle?: string | undefined;
    presetAssignmentRoles?: number | undefined;
  }) => Promise<Result<string>>) | undefined;
  onDeleteChapter?: ((chapterId: string) => Promise<Result<void>>) | undefined;
  onNavigateToTranslator?: ((
    chapterId: string,
    pageId: string,
    isReadOnly?: boolean,
  ) => void) | undefined;
  currentUserId?: string | null | undefined;
  onAddPages?: ((
    chapterId: string,
    files: File[],
    callbacks?: UploadProgressCallbacks,
  ) => Promise<void>) | undefined;
  onDeleteChapterPages?: ((chapterId: string) => Promise<Result<void>>) | undefined;
  onAllocPageUpload?: ((args: {
    pageId: string;
    rawIdent?: string | undefined;
    imageHash: string;
    newByteLen: number;
    extension: string;
  }) => Promise<Result<AllocatedPage>>) | undefined;
  onJoinChapterRole?: ((chapterId: string, role: Role) => Promise<Result<void>>) | undefined;
  onImportChapter: (args: ImportChapterArgs) => Promise<Result<ImportChapterResult>>;
  onExportChapter?: ((
    chapterId: string,
    options?: {
      signal?: AbortSignal | undefined;
      withRawIdent?: boolean | undefined;
    },
  ) => Promise<Result<ChapterExports>>) | undefined;
  onArchiveComic?: ((comicId: string) => Promise<Result<void>>) | undefined;
  onDeleteComic?: ((comicId: string) => Promise<Result<void>>) | undefined;
  onUpdateComic?: ((args: {
    title: string;
    author: string;
    description?: string | undefined;
  }) => Promise<Result<void>>) | undefined;
  onUpdateChapter?: ((chapterId: string, subtitle?: string) => Promise<Result<void>>) | undefined;
  activeMember: MemberInfo | null;
  onClose: () => void;
}

export interface CoverUploadState {
  isUploadingCover: boolean;
  coverUploadProgress: number | null;
  localCoverUrl: string | null;
  handleCoverFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}
