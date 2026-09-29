export type ChapterInclude =
  | "comic"
  | "comic.workset"
  | "comic.workset.team"
  | "comic.creator"
  | "creator";

export type WorkflowTransition =
  | "upload_complete"
  | "translate_start"
  | "translate_complete"
  | "proofread_start"
  | "proofread_complete"
  | "typeset_start"
  | "typeset_complete"
  | "review_complete"
  | "publish_complete"
  | "upload_revert"
  | "translate_start_revert"
  | "translate_revert"
  | "proofread_start_revert"
  | "proofread_revert"
  | "typeset_start_revert"
  | "typeset_revert"
  | "review_revert";

export type ListChapterArgs = {
  comicId: string;
  includes?: ChapterInclude[] | undefined;
  offset: number;
  limit: number;
};

export type ListChapterWorkflowRecordsArgs = {
  chapterId: string;
  offset: number;
  limit: number;
};

export type CreateChapterArgs = {
  comicId: string;
  subtitle?: string | undefined;
  presetAssignmentRoles?: number | undefined;
};

export type UpdateChapterArgs = {
  subtitle?: string | undefined;
  isPinned?: boolean | undefined;
  workflowTransition?: WorkflowTransition | undefined;
  revertTransition?: WorkflowTransition | undefined;
};

export type ChapterExportUnit = {
  unitId?: string | undefined;
  unitIndex?: number | undefined;
  pageId?: string | undefined;
  pageIndex?: number | undefined;
  translatedText?: string | undefined;
  proofreadText?: string | undefined;
  translatorId?: string | undefined;
  proofreaderId?: string | undefined;
  translatorComment?: string | undefined;
  proofreaderComment?: string | undefined;
  xCoord?: number | undefined;
  yCoord?: number | undefined;
  isBubble?: boolean | undefined;
  isProofread?: boolean | undefined;
};

export type ChapterExportPage = {
  pageId: string;
  pageIndex: number;
  units: ChapterExportUnit[];
};

export type ChapterExport = {
  comicId: string;
  comicTitle: string;
  chapterId: string;
  chapterIndex: number;
  chapterSubtitle: string;
  pages: ChapterExportPage[];
};

export type ChapterExports = {
  labelPlus: string;
  poprako: ChapterExport;
  rawIdents: PageRawIdent[];
};

export type PageRawIdent = {
  pageId: string;
  rawIdent: string;
};

export type ImportChapterFormat = "json" | "lp";

export type ImportChapterMode = "keep" | "overwrite";

export type ImportChapterArgs = {
  chapterId: string;
  content: string;
  format: ImportChapterFormat;
  mode: ImportChapterMode;
};

export type ImportChapterResult = {
  importedPageCount: number;
  importedUnitCount: number;
};
