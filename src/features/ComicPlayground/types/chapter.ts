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
