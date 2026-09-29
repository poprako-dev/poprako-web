import type { ApiClient } from "@/api/client";
import {
  allocChapterPages as allocatePages,
  allocExistingPageUpload as allocateExistingPage,
  deleteChapterPages as deletePages,
  getPage as getPageResponse,
  listPages as getPages,
  markPageImageUploaded,
} from "@/api/page/page-api";
import type { PageResponse } from "@/api/page/page-api";
import { ensureHttpsUrl } from "@/shared/utility/url";
import {
  listPageUnitDiffStats as getPageDiffStats,
  listPageUnitFlaggedStats as getPageFlaggedStats,
} from "@/api/page/page-api";
import type {
  AllocatedPage,
  AllocChapterPagesArgs,
  AllocChapterPagesResult,
  PageInfo,
  PageUnitDiffStats,
  PageUnitFlaggedStats,
} from "@/route/_authenticated/business/page/page";
import type { Result } from "@/shared/utility/result";

export type ListPageArgs = {
  chapterId: string;
  offset?: number | undefined;
  limit?: number | undefined;
};

export function toPageInfo(page: PageResponse): PageInfo {
  return {
    id: page.id,
    chapterId: page.chapterId,
    index: page.index,
    imageUrl: ensureHttpsUrl(page.imageUrl),
    imageOptimizedUrl: ensureHttpsUrl(page.imageOptimizedUrl),
    imageThumbnailUrl: ensureHttpsUrl(page.imageThumbnailUrl),
    isUploaded: Boolean(page.imageUrl),
    ...(page.imageHash === null || page.imageHash === undefined
      ? {}
      : { imageHash: page.imageHash }),
    ...(page.ext === null || page.ext === undefined ? {} : { extension: page.ext }),
    totalUnitCount: page.totalUnitCount,
    translatedUnitCount: page.translatedUnitCount,
    proofreadUnitCount: page.proofreadUnitCount,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  };
}

export async function listPageUnitFlaggedStats(
  client: ApiClient,
  chapterId: string,
): Promise<Result<PageUnitFlaggedStats[]>> {
  return getPageFlaggedStats(client, chapterId);
}

export async function listPageUnitDiffStats(
  client: ApiClient,
  chapterId: string,
): Promise<Result<PageUnitDiffStats[]>> {
  const result = await getPageDiffStats(client, chapterId);
  if (!result.success) return result;
  return {
    success: true,
    data: result.data.map(({ edittedUnitCount, ...stats }) => ({
      ...stats,
      editedUnitCount: edittedUnitCount,
    })),
  };
}

export async function listPages(
  client: ApiClient,
  args: ListPageArgs,
): Promise<Result<PageInfo[]>> {
  const res = await getPages(client, args.chapterId, args.offset, args.limit);
  if (!res.success) return res;
  return {
    success: true,
    data: res.data.map(toPageInfo),
  };
}

export async function allocChapterPages(
  client: ApiClient,
  args: AllocChapterPagesArgs,
): Promise<Result<AllocChapterPagesResult>> {
  const res = await allocatePages(
    client,
    args.chapterId,
    args.pages.map((page) => ({
      pageId: page.pageId,
      rawIdent: page.rawIdent,
      imageHash: page.imageHash,
      newByteLen: page.newByteLen,
      ext: page.extension,
    })),
  );
  if (!res.success) return res;
  return {
    success: true,
    data: {
      pages: res.data.pages.map((page) => ({
        pageId: page.pageId,
        index: page.index,
        imageHash: page.imageHash,
        extension: page.ext,
        slot: page.slot,
      })),
    },
  };
}

type AllocExistingPageUploadArgs = {
  pageId: string;
  rawIdent?: string | undefined;
  imageHash: string;
  newByteLen: number;
  extension: string;
};

type AllocExistingPageUploadResult = AllocatedPage;

export async function allocExistingPageUpload(
  client: ApiClient,
  args: AllocExistingPageUploadArgs,
): Promise<Result<AllocExistingPageUploadResult>> {
  const res = await allocateExistingPage(client, args.pageId, {
    rawIdent: args.rawIdent,
    imageHash: args.imageHash,
    newByteLen: args.newByteLen,
    ext: args.extension,
  });
  if (!res.success) return res;
  return {
    success: true,
    data: {
      pageId: res.data.pageId,
      index: res.data.index,
      imageHash: res.data.imageHash,
      extension: res.data.ext,
      slot: res.data.slot,
    },
  };
}

export async function getPage(client: ApiClient, pageId: string): Promise<Result<PageInfo>> {
  const res = await getPageResponse(client, pageId);
  if (!res.success) return res;
  return { success: true, data: toPageInfo(res.data) };
}

export function deletePage(_pageId: string): Promise<Result<undefined>> {
  return Promise.resolve({
    success: false,
    error: "当前后端不支持删除单页",
  });
}

export async function deleteChapterPages(
  client: ApiClient,
  chapterId: string,
): Promise<Result<undefined>> {
  return deletePages(client, chapterId);
}

export async function updatePage(
  client: ApiClient,
  pageId: string,
  args: { isUploaded?: boolean | undefined; imageVersion?: number | undefined },
): Promise<Result<undefined>> {
  if (!args.isUploaded) {
    return { success: true, data: undefined };
  }
  return markPageImageUploaded(client, pageId, args.imageVersion ?? 0);
}
