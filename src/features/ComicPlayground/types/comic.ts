import type {
  BinaryFilter,
  TripleFilter,
} from "@/features/ComcList/types/types";

import {
  publishWorkflowStatus,
  proofreadWorkflowStatus,
  reviewWorkflowStatus,
  translateWorkflowStatus,
  typesetWorkflowStatus,
  uploadWorkflowStatus,
} from "@/types/chapter";

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
  uploadPhase?: number;
  translatePhase?: number;
  proofreadPhase?: number;
  typesetPhase?: number;
  reviewPhase?: number;
  publishPhase?: number;

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

export type ComicClientFilters = {
  fuzzyTitle: string;
  uploadStatus: BinaryFilter;
  translateStatus: TripleFilter;
  proofreadStatus: TripleFilter;
  typesetStatus: TripleFilter;
  reviewStatus: BinaryFilter;
  publishStatus: BinaryFilter;
};

type ChapterWorkflowSnapshot = {
  uploadedAt?: number;
  translatingAt?: number;
  translatedAt?: number;
  typesetAt?: number;
  typesettingAt?: number;
  proofreadAt?: number;
  proofreadingAt?: number;
  reviewedAt?: number;
  publishedAt?: number;
};

function matchFuzzyTitle(
  comic: { index: number; title: string; author: string },
  fuzzyTitle: string,
) {
  const keyword = fuzzyTitle.trim().toLowerCase();
  if (!keyword) return true;

  const haystack = [String(comic.index), comic.title, comic.author]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(keyword);
}

function matchBinaryFilter(
  actual: "pending" | "completed",
  expected: BinaryFilter,
) {
  return expected === "unset" || actual === expected;
}

function matchTripleFilter(
  actual: TripleFilter,
  expected: TripleFilter,
) {
  return expected === "unset" || actual === expected;
}

function toBinaryWorkflowStatus(
  status: "pending" | "ongoing" | "completed" | "unset",
) {
  return status === "completed" ? "completed" : "pending";
}

export function matchComicClientFilters(
  comic: { index: number; title: string; author: string },
  chapter: ChapterWorkflowSnapshot | null,
  filters: ComicClientFilters,
) {
  if (!matchFuzzyTitle(comic, filters.fuzzyTitle)) return false;

  const workflow = chapter ?? {};

  return (
    matchBinaryFilter(
      toBinaryWorkflowStatus(uploadWorkflowStatus(workflow)),
      filters.uploadStatus,
    ) &&
    matchTripleFilter(
      translateWorkflowStatus(workflow),
      filters.translateStatus,
    ) &&
    matchTripleFilter(
      proofreadWorkflowStatus(workflow),
      filters.proofreadStatus,
    ) &&
    matchTripleFilter(typesetWorkflowStatus(workflow), filters.typesetStatus) &&
    matchBinaryFilter(
      toBinaryWorkflowStatus(reviewWorkflowStatus(workflow)),
      filters.reviewStatus,
    ) &&
    matchBinaryFilter(
      toBinaryWorkflowStatus(publishWorkflowStatus(workflow)),
      filters.publishStatus,
    )
  );
}

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
