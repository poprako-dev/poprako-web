// 定义了漫画在反向单射查询时，要求服务端填充那些内嵌字段
export type ComicInclude = "workset" | "workset.team" | "creator";

// `with` 参数，附加派生数据（如置顶章节），不同于 incl 的内嵌关联数据
export type ComicWith = "pinned_chapter" | "pinned_chapter_assignment";

export type ListComicArgs = {
  // 必选的作品集 ID 参数，表示要列出哪个作品集下的漫画
  worksetId: string;

  includes?: ComicInclude[];
  withs?: ComicWith[];
  fuzzyTitle?: string;
  stages?: number;

  offset: number;
  limit: number;
};

export type RawListComicArgs = {
  workset_id: string;
  incl?: ComicInclude[];
  with?: ComicWith[];
  fuzzy_title?: string;
  stages?: number;

  offset: number;
  limit: number;
};

export type CreateComicArgs = {
  worksetId: string;
  title: string;
  author: string;
  description?: string;
  firstChapterTitle?: string;
  presetAssignmentRoles?: number;
};

export type RawCreateComicArgs = {
  workset_id: string;
  title: string;
  author: string;
  description?: string;
  first_chapter_subtitle?: string;
  preset_assignment_roles?: number;
};

export type UpdateComicArgs = {
  title: string;
  author: string;
  description?: string;
};

export type RawUpdateComicArgs = {
  id: string;
  title: string;
  author: string;
  description?: string;
};
