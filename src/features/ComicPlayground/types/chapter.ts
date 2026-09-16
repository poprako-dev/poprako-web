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

export interface ListChapterArgs {
  comicId: string;
  includes?: ChapterInclude[] | undefined;
  offset: number;
  limit: number;
}

export interface ListChapterWorkflowRecordsArgs {
  chapterId: string;
  offset: number;
  limit: number;
}

export interface RawListChapterArgs {
  comic_id: string;
  incl?: ChapterInclude[] | undefined;
  offset: number;
  limit: number;
}

export interface CreateChapterArgs {
  comicId: string;
  subtitle?: string | undefined;
  presetAssignmentRoles?: number | undefined;
}

export interface RawCreateChapterArgs {
  comic_id: string;
  subtitle?: string | undefined;
  preset_assignment_roles?: number | undefined;
}

export interface UpdateChapterArgs {
  subtitle?: string | undefined;
  isPinned?: boolean | undefined;
  workflowTransition?: WorkflowTransition | undefined;
  revertTransition?: WorkflowTransition | undefined;
}

export interface RawUpdateChapterArgs {
  id: string;
  subtitle?: string | undefined;
}

export interface RawUpdateChapterStageArgs {
  id: string;
  stage:
    | "raw_provide"
    | "translate"
    | "proofread"
    | "typeset_redraw"
    | "review"
    | "publish";
  oper: "advance" | "revert";
}

export interface ChapterExportUnit {
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
}

export interface ChapterExportPage {
  pageId: string;
  pageIndex: number;
  units: ChapterExportUnit[];
}

export interface ChapterExport {
  comicId: string;
  comicTitle: string;
  chapterId: string;
  chapterIndex: number;
  chapterSubtitle: string;
  pages: ChapterExportPage[];
}

export interface RawChapterExportUnit {
  unit_id?: string | undefined;
  unit_index?: number | undefined;
  page_id?: string | undefined;
  page_index?: number | undefined;
  translated_text?: string | undefined;
  proofread_text?: string | undefined;
  translator_id?: string | undefined;
  proofreader_id?: string | undefined;
  translator_comment?: string | undefined;
  proofreader_comment?: string | undefined;
  x_coord?: number | undefined;
  y_coord?: number | undefined;
  is_bubble?: boolean | undefined;
  is_proofread?: boolean | undefined;
}

export interface RawChapterExportPage {
  page_id: string;
  page_index: number;
  units: RawChapterExportUnit[];
}

export interface RawChapterExport {
  comic_id: string;
  comic_title: string;
  chapter_id: string;
  chapter_index: number;
  chapter_subtitle: string;
  pages: RawChapterExportPage[];
}

export interface ChapterExports {
  labelPlus: string;
  poprako: ChapterExport;
  rawIdents: PageRawIdent[];
}

export interface PageRawIdent {
  pageId: string;
  rawIdent: string;
}

export interface RawChapterExports {
  label_plus: string | null;
  poprako: RawChapterExport | null;
  raw_idents: RawPageRawIdent[] | null;
}

export interface RawPageRawIdent {
  page_id: string;
  raw_ident: string;
}

export type ImportChapterFormat = "json" | "lp";

export type RawImportChapterFormat = "poprako" | "label_plus";

export type ImportChapterMode = "keep" | "overwrite";

export interface ImportChapterArgs {
  chapterId: string;
  content: string;
  format: ImportChapterFormat;
  mode: ImportChapterMode;
}

export interface RawImportChapterArgs {
  content: string;
  format: RawImportChapterFormat;
  mode: ImportChapterMode;
}

export interface ImportChapterResult {
  importedPageCount: number;
  importedUnitCount: number;
}

export interface RawImportChapterResult {
  imported_page_count: number;
  imported_unit_count: number;
}
