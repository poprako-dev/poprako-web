import type {
  BinaryFilter,
  TripleFilter,
} from "@/features/ComcList/types/types";

// 定义了漫画在反向单射查询时，要求服务端填充那些内嵌字段
export type ComicInclude = "workset" | "workset.team" | "creator";

export type ListComicArgs = {
  // 必选的作品集 ID 参数，表示要列出哪个作品集下的漫画
  worksetId: string;
  // 可选的模糊标题搜索参数
  // 模糊搜索 composedTitle（包括 index、title、author）字段
  fuzzyTitle?: string;

  // 进度筛选，注意 unset 时禁止赋值
  uploadStatus?: BinaryFilter;
  translateStatus?: TripleFilter;
  proofreadStatus?: TripleFilter;
  typesetStatus?: TripleFilter;
  reviewStatus?: BinaryFilter;
  publishStatus?: BinaryFilter;

  includes?: ComicInclude[];

  offset: number;
  limit: number;
};

export type RawListComicArgs = {
  workset_id: string;
  fuzzy_title?: string;

  upload_status?: BinaryFilter;
  translate_status?: TripleFilter;
  proofread_status?: TripleFilter;
  typeset_status?: TripleFilter;
  review_status?: BinaryFilter;
  publish_status?: BinaryFilter;
  includes?: ComicInclude[];

  offset: number;
  limit: number;
};

export type CreateComicArgs = {
  worksetId: string;
  title: string;
  author: string;
  description?: string;
};

export type RawCreateComicArgs = {
  workset_id: string;
  title: string;
  author: string;
  description?: string;
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
