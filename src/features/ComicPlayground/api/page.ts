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

function extractS3Error(xhr: XMLHttpRequest): string {
  try {
    const text = xhr.responseText;
    if (!text) return "";
    const match = /<Message>([^<]+)<\/Message>/.exec(text);
    if (match && match[1]) return ` (S3: ${match[1]})`;
    // 有些 S3 兼容实现返回不同格式，截取前 200 字符兜底
    const snippet = text.trim().slice(0, 200);
    return snippet ? ` (${snippet})` : "";
  } catch {
    return "";
  }
}

function extractUrlHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "(无法解析的 URL)";
  }
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
    xhr.timeout = 120_000; // 120s 超时，避免永久挂起

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

      const s3Detail = extractS3Error(xhr);
      if (s3Detail) {
        console.error(
          `[uploadToPresignedUrl] S3 错误 (HTTP ${xhr.status}):${s3Detail}`,
        );
      }
      resolve({
        success: false,
        error: `上传失败: HTTP ${xhr.status}`,
        httpStatus: xhr.status,
      });
    };

    xhr.ontimeout = () => {
      const host = extractUrlHost(putUrl);
      console.error(
        `[uploadToPresignedUrl] 上传超时 (120s), 目标: ${host}, 文件: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
      );
      resolve({ success: false, error: "上传超时" });
    };

    xhr.onerror = () => {
      const host = extractUrlHost(putUrl);
      console.error(
        `[uploadToPresignedUrl] 网络错误, 目标: ${host}, 文件: ${file.name}`,
      );
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
