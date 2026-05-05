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
  const res = await api.get<RawPageInfo[]>(`/chapters/${args.chapterId}/pages`, {
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
  >(`/chapters/${args.chapterId}/pages/reserve`, rawArgs);
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

export async function deleteChapterPages(chapterId: string): Promise<Result<void>> {
  const res = await api.delete<void>(`/chapters/${chapterId}/pages`);
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function updatePage(
  pageId: string,
  args: { isUploaded?: boolean },
): Promise<Result<void>> {
  if (!args.isUploaded) {
    return { success: true, data: undefined };
  }
  const res = await api.post<void, Record<string, never>>(
    `/pages/${pageId}/image/uploaded`,
    {},
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function uploadToPresignedUrl(
  putUrl: string,
  file: File,
): Promise<Result<void>> {
  try {
    const response = await fetch(putUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `上传失败: HTTP ${response.status}`,
      };
    }

    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "上传失败",
    };
  }
}
