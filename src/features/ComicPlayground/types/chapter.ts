export type ChapterInclude = "creator";

export type WorkflowTransition =
  | "upload_complete"
  | "translate_start"
  | "translate_complete"
  | "proofread_start"
  | "proofread_complete"
  | "typeset_start"
  | "typeset_complete"
  | "review_complete"
  | "publish_complete";

export type ListChapterArgs = {
  comicId: string;
  offset: number;
  limit: number;
};

export type RawListChapterArgs = {
  comic_id: string;
  offset: number;
  limit: number;
};

export type CreateChapterArgs = {
  comicId: string;
  subtitle?: string;
};

export type RawCreateChapterArgs = {
  comic_id: string;
  subtitle?: string;
};

export type UpdateChapterArgs = {
  subtitle?: string;
  isPinned?: boolean;
  workflowTransition?: WorkflowTransition;
};

export type RawUpdateChapterArgs = {
  chapter_id: string;
  subtitle?: string;
  is_pinned?: boolean;
  workflow_transition?: WorkflowTransition;
};

export type ChapterExportUnit = {
  unitId?: string;
  unitIndex?: number;
  pageId?: string;
  pageIndex?: number;
  translatedText?: string;
  proofreadText?: string;
  translatorId?: string;
  proofreaderId?: string;
  translatorComment?: string;
  proofreaderComment?: string;
  xCoord?: number;
  yCoord?: number;
  isBubble?: boolean;
  isProofread?: boolean;
};

export type ChapterExportPage = {
  pageId: string;
  pageIndex: number;
  imageUrl: string;
  isUploaded: boolean;
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

export type RawChapterExportUnit = {
  unit_id?: string;
  unit_index?: number;
  page_id?: string;
  page_index?: number;
  translated_text?: string;
  proofread_text?: string;
  translator_id?: string;
  proofreader_id?: string;
  translator_comment?: string;
  proofreader_comment?: string;
  x_coord?: number;
  y_coord?: number;
  is_bubble?: boolean;
  is_proofread?: boolean;
};

export type RawChapterExportPage = {
  page_id: string;
  page_index: number;
  image_url: string;
  is_uploaded: boolean;
  units: RawChapterExportUnit[];
};

export type RawChapterExport = {
  comic_id: string;
  comic_title: string;
  chapter_id: string;
  chapter_index: number;
  chapter_subtitle: string;
  pages: RawChapterExportPage[];
};

export type ImportChapterFormat = "json" | "lp";

export type ImportChapterArgs = {
  chapterId: string;
  content: string;
  format: ImportChapterFormat;
};

export type RawImportChapterArgs = {
  chapter_id: string;
  content: string;
  format: ImportChapterFormat;
};

export type ImportChapterResult = {
  importedPageCount: number;
  importedUnitCount: number;
};

export type RawImportChapterResult = {
  imported_page_count: number;
  imported_unit_count: number;
};
