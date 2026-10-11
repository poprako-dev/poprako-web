import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
import type { ChangeEvent } from "react";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { MemberInfo } from "@/route/business/identity/member";
import type { Role } from "@/route/business/identity/role";
import type { Result } from "@/shared/utility/result";
import type {
  ChapterExports,
  ImportChapterArgs,
  ImportChapterResult,
  ListChapterArgs,
  ListChapterWorkflowRecordsArgs,
  WorkflowTransition,
} from "@/route/_authenticated/business/chapter/chapter-input";
import type { ChapterWorkflowRecord } from "@/route/_authenticated/business/chapter/chapter-workflow-record";
import type { UserInfo } from "@/route/business/identity/user";

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

export type DetailContract = {
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
  onResolveWorkflowRecordUser: (userId: string) => Promise<Result<UserInfo>>;
  onTransiteWorkflow: (chapterId: string, transition: WorkflowTransition) => Promise<Result<void>>;
  onRemoveAssignment: (chapterId: string, userId: string, role: Role) => Promise<Result<void>>;
  onLoadAssignableMembers: (
    chapterId: string,
    args: {
      role: Role;
      keyword?: string | undefined;
      offset: number;
      limit: number;
    },
  ) => Promise<Result<MemberInfo[]>>;
  onAddAssignment: (chapterId: string, userId: string, role: Role) => Promise<Result<void>>;
  onCreateChapter: (args: {
    comicId: string;
    subtitle?: string | undefined;
    presetAssignmentRoles?: number | undefined;
  }) => Promise<Result<string>>;
  onDeleteChapter: (chapterId: string) => Promise<Result<void>>;
  onNavigateToWorkbench: (
    chapterId: string,
    pageId: string,
    isReadOnly?: boolean,
    mode?: ComicDetailMode,
  ) => void;
  currentUserId: string;
  onDeleteChapterPages: (chapterId: string) => Promise<Result<void>>;
  onJoinChapterRole: (chapterId: string, role: Role) => Promise<Result<void>>;
  onImportChapter: (args: ImportChapterArgs) => Promise<Result<ImportChapterResult>>;
  onExportChapter: (
    chapterId: string,
    options?: {
      signal?: AbortSignal | undefined;
      withRawIdent?: boolean | undefined;
    },
  ) => Promise<Result<ChapterExports>>;
  onArchiveComic: (comicId: string) => Promise<Result<void>>;
  onDeleteComic: (comicId: string) => Promise<Result<void>>;
  onUpdateComic: (args: {
    title: string;
    author: string;
    description?: string | undefined;
  }) => Promise<Result<void>>;
  onUpdateChapter: (chapterId: string, subtitle?: string) => Promise<Result<void>>;
  activeMember: MemberInfo | null;
  onClose: () => void;
};

export type CoverUploadState = {
  isUploadingCover: boolean;
  coverUploadProgress: number | null;
  localCoverUrl: string | null;
  handleCoverFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};
