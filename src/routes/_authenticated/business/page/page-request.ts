import { api, createApiFailure } from "@/routes/business/request";
import type {
  AllocatedPage,
  AllocChapterPagesArgs,
  AllocChapterPagesResult,
  PageInfo,
} from "@/routes/_authenticated/business/page/page";
import type { Result } from "@/shared/utility/result";
import {
  type RawAllocatedPage,
  type RawAllocChapterPagesArgs,
  type RawAllocChapterPagesResult,
  type RawPageInfo,
  unwrapRawAllocChapterPagesResult,
  unwrapRawPageInfo,
} from "@/routes/_authenticated/business/page/raw-page";

export type ListPageArgs = {
  chapterId: string;
  offset?: number | undefined;
  limit?: number | undefined;
};

export async function listPages(args: ListPageArgs): Promise<Result<PageInfo[]>> {
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

export async function allocChapterPages(
  args: AllocChapterPagesArgs,
): Promise<Result<AllocChapterPagesResult>> {
  const rawArgs: RawAllocChapterPagesArgs = {
    chapter_id: args.chapterId,
    pages: args.pages.map((page) => ({
      page_id: page.pageId,
      raw_ident: page.rawIdent,
      image_hash: page.imageHash,
      new_byte_len: page.newByteLen,
      ext: page.extension,
    })),
  };

  const res = await api.post<RawAllocChapterPagesResult, RawAllocChapterPagesArgs>(
    `/chapters/${args.chapterId}/pages/alloc`,
    rawArgs,
  );
  if (!res.success) return res;

  return {
    success: true,
    data: unwrapRawAllocChapterPagesResult(res.data),
  };
}

type AllocExistingPageUploadArgs = {
  pageId: string;
  rawIdent?: string | undefined;
  imageHash: string;
  newByteLen: number;
  extension: string;
};

type RawAllocExistingPageUploadArgs = {
  raw_ident?: string | undefined;
  image_hash: string;
  new_byte_len: number;
  ext: string;
};

type AllocExistingPageUploadResult = AllocatedPage;
type RawAllocExistingPageUploadResult = RawAllocatedPage;

export async function allocExistingPageUpload(
  args: AllocExistingPageUploadArgs,
): Promise<Result<AllocExistingPageUploadResult>> {
  const rawArgs: RawAllocExistingPageUploadArgs = {
    raw_ident: args.rawIdent,
    image_hash: args.imageHash,
    new_byte_len: args.newByteLen,
    ext: args.extension,
  };

  const res = await api.post<RawAllocExistingPageUploadResult, RawAllocExistingPageUploadArgs>(
    `/pages/${args.pageId}/image/alloc`,
    rawArgs,
  );

  if (!res.success) return res;

  return {
    success: true,
    data:
      unwrapRawAllocChapterPagesResult({ pages: [res.data] }).pages[0] ??
      (() => {
        throw new Error("分配页面响应为空");
      })(),
  };
}

export async function getPage(pageId: string): Promise<Result<PageInfo>> {
  const res = await api.get<RawPageInfo>(`/pages/${pageId}`);
  if (!res.success) return res;
  return { success: true, data: unwrapRawPageInfo(res.data) };
}

export function deletePage(_pageId: string): Promise<Result<undefined>> {
  return Promise.resolve({
    success: false,
    error: "当前后端不支持删除单页",
  });
}

export async function deleteChapterPages(chapterId: string): Promise<Result<undefined>> {
  const res = await api.delete<undefined>(`/chapters/${chapterId}/pages`);
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function updatePage(
  pageId: string,
  args: { isUploaded?: boolean | undefined; imageVersion?: number | undefined },
): Promise<Result<undefined>> {
  if (!args.isUploaded) {
    return { success: true, data: undefined };
  }
  const res = await api.post<undefined, { image_version: number }>(
    `/pages/${pageId}/image/mark-uploaded`,
    { image_version: args.imageVersion ?? 0 },
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}

function extractUploadError(xhr: XMLHttpRequest): string {
  try {
    const text = xhr.responseText.trim();
    if (!text) return "";

    try {
      const body = JSON.parse(text) as { message?: unknown };
      if (typeof body.message === "string") return body.message;
    } catch {
      // Object storage commonly returns XML rather than JSON.
    }

    const match = /<Message>([^<]+)<\/Message>/.exec(text);
    if (match?.[1]) return match[1];
    return text.slice(0, 200);
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

function isBrowserManagedHeader(name: string): boolean {
  return name.toLowerCase() === "content-length";
}

export async function uploadToPresignedUrl(
  putUrl: string,
  file: File,
  headersOrOnProgress: Record<string, string> | ((percent: number) => void) = {},
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<
  Result<undefined> & {
    httpStatus?: number | undefined;
    failureKind?: "http" | "timeout" | "network" | "aborted" | undefined;
  }
> {
  const headers = typeof headersOrOnProgress === "function" ? {} : headersOrOnProgress;
  const progress = typeof headersOrOnProgress === "function" ? headersOrOnProgress : onProgress;

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    let isSettled = false;

    const finish = (
      result: Result<undefined> & {
        httpStatus?: number | undefined;
        failureKind?: "http" | "timeout" | "network" | "aborted" | undefined;
      },
    ): void => {
      if (isSettled) return;
      isSettled = true;
      signal?.removeEventListener("abort", abortUpload);
      resolve(result);
    };

    const abortUpload = (): void => {
      xhr.abort();
    };

    xhr.open("PUT", putUrl, true);
    for (const [name, value] of Object.entries(headers)) {
      if (isBrowserManagedHeader(name)) continue;
      xhr.setRequestHeader(name, value);
    }
    xhr.timeout = 8 * 60_000; // 8 分钟超时，容纳对象存储完成写入与响应。
    signal?.addEventListener("abort", abortUpload, { once: true });
    if (signal?.aborted) {
      finish({ success: false, error: "上传已取消", failureKind: "aborted" });
      return;
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.max(0, Math.min(99, Math.round((event.loaded / event.total) * 100)));
      progress?.(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        finish({ success: true, data: undefined, httpStatus: xhr.status });
        return;
      }

      const responseMessage = extractUploadError(xhr);
      if (responseMessage) {
        console.error(
          `[uploadToPresignedUrl] S3 错误 (HTTP ${String(xhr.status)}): ${responseMessage}`,
        );
      }
      const error = responseMessage || `上传失败: HTTP ${String(xhr.status)}`;
      const failure = createApiFailure(error, xhr.status);
      finish({
        ...failure,
        failureKind: "http",
      });
    };

    xhr.ontimeout = () => {
      const host = extractUrlHost(putUrl);
      const sizeMiB = (file.size / 1024 / 1024).toFixed(1);
      console.error(
        `[uploadToPresignedUrl] 上传超时 (8m), 目标: ${host}, ` +
          `文件: ${file.name} (${sizeMiB}MB)`,
      );
      finish({ success: false, error: "上传超时", failureKind: "timeout" });
    };

    xhr.onerror = () => {
      const host = extractUrlHost(putUrl);
      console.error(`[uploadToPresignedUrl] 网络错误, 目标: ${host}, 文件: ${file.name}`);
      finish({ success: false, error: "上传失败", failureKind: "network" });
    };

    xhr.onabort = () => {
      finish({ success: false, error: "上传已取消", failureKind: "aborted" });
    };

    try {
      xhr.send(file);
    } catch (error) {
      finish({
        success: false,
        error: error instanceof Error ? error.message : "上传失败",
        failureKind: "network",
      });
    }
  });
}
