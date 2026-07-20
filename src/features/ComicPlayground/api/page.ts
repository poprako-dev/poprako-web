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
  const res = await api.get<RawPageInfo[]>(
    `/chapters/${args.chapterId}/pages`,
    {
      offset: args.offset,
      limit: args.limit,
    },
  );
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
    file_ext: args.fileExtension,
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

type ReserveExistingPageUploadArgs = {
  pageId: string;
  fileExtension: string;
};

type RawReserveExistingPageUploadArgs = {
  file_ext: string;
};

type ReserveExistingPageUploadResult = {
  pageId: string;
  putUrl: string;
  imageVersion: number;
};

type RawReserveExistingPageUploadResult = {
  page_id: string;
  put_url: string;
  image_version: number;
};

export async function reserveExistingPageUpload(
  args: ReserveExistingPageUploadArgs,
): Promise<Result<ReserveExistingPageUploadResult>> {
  const rawArgs: RawReserveExistingPageUploadArgs = {
    file_ext: args.fileExtension,
  };

  const res = await api.post<
    RawReserveExistingPageUploadResult,
    RawReserveExistingPageUploadArgs
  >(`/pages/${args.pageId}/image/reserve`, rawArgs);

  if (!res.success) return res;

  return {
    success: true,
    data: {
      pageId: res.data.page_id,
      putUrl: res.data.put_url,
      imageVersion: res.data.image_version,
    },
  };
}

export async function deletePage(_pageId: string): Promise<Result<void>> {
  return {
    success: false,
    error: "当前后端不支持删除单页",
  };
}

export async function deleteChapterPages(chapterId: string): Promise<Result<void>> {
  const res = await api.delete<void>(`/chapters/${chapterId}/pages`);
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function updatePage(
  pageId: string,
  args: { isUploaded?: boolean; imageVersion?: number },
): Promise<Result<void>> {
  if (!args.isUploaded) {
    return { success: true, data: undefined };
  }
  const res = await api.post<void, { image_version: number }>(
    `/pages/${pageId}/image/mark-uploaded`,
    { image_version: args.imageVersion ?? 0 },
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function uploadToPresignedUrl(
  putUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<Result<void> & { httpStatus?: number }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", putUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.max(
        0,
        Math.min(100, Math.round((event.loaded / event.total) * 100)),
      );
      onProgress?.(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve({ success: true, data: undefined, httpStatus: xhr.status });
        return;
      }

      resolve({
        success: false,
        error: `上传失败: HTTP ${xhr.status}`,
        httpStatus: xhr.status,
      });
    };

    xhr.onerror = () => {
      resolve({ success: false, error: "上传失败" });
    };

    xhr.onabort = () => {
      resolve({ success: false, error: "上传已取消" });
    };

    try {
      xhr.send(file);
    } catch (err) {
      resolve({
        success: false,
        error: err instanceof Error ? err.message : "上传失败",
      });
    }
  });
}
