import { api } from "@/api/util";
import type {
  PageInfo,
  ReserveChapterPagesArgs,
  ReserveChapterPagesResult,
} from "@/types";
import type { Result } from "@/types/utils/result";
import {
  unwrapRawPageInfo,
  unwrapRawReserveChapterPagesResult,
  type RawReserveChapterPagesArgs,
  type RawReserveChapterPagesResult,
  type RawPageInfo,
} from "@/types/raw/page";

export type ListPageArgs = {
  chapterId: string;
  offset: number;
  limit: number;
};

export async function listPages(
  args: ListPageArgs,
): Promise<Result<PageInfo[]>> {
  const res = await api.get<RawPageInfo[]>("/pages", {
    chapter_id: args.chapterId,
    offset: args.offset,
    limit: args.limit,
  });
  if (!res.success) return res;

  const items = Array.isArray(res.data) ? res.data : [];
  return {
    success: true,
    data: items.map((raw) => unwrapRawPageInfo(raw)),
  };
}

export async function reserveChapterPages(
  args: ReserveChapterPagesArgs,
): Promise<Result<ReserveChapterPagesResult>> {
  const rawArgs: RawReserveChapterPagesArgs = {
    chapter_id: args.chapterId,
    page_count: args.pageCount,
  };

  const res = await api.post<
    RawReserveChapterPagesResult,
    RawReserveChapterPagesArgs
  >("/pages", rawArgs);
  if (!res.success) return res;

  return {
    success: true,
    data: unwrapRawReserveChapterPagesResult(
      res.data as RawReserveChapterPagesResult,
    ),
  };
}

export async function deletePage(pageId: string): Promise<Result<void>> {
  const res = await api.delete<void>(`/pages/${pageId}`);
  if (!res.success) return res;
  return { success: true, data: undefined };
}
