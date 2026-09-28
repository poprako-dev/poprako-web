import { toApiRequestError } from "@/route/business/request-error";
import type { ApiClient } from "@/api/client";
import {
  appendDownloadCacheBuster,
  getImageExtensionFromContentType,
  getImageExtensionFromUrl,
  waitForExportRetry,
} from "@/route/_authenticated/_shell/business/comic-detail/export-download-utils";

type ImageFile = { blob: Blob; extension: string };

type Args = {
  client: ApiClient;
  signal: AbortSignal;
  assertNotAborted: () => void;
};

export async function fetchExportImageWithRetry(
  imageUrl: string,
  args: Args,
  maxAttempts = 3,
): Promise<ImageFile | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    args.assertNotAborted();
    try {
      const result = await args.client.download(appendDownloadCacheBuster(imageUrl), {
        signal: args.signal,
      });
      if (!result.success) throw toApiRequestError(result);
      const blob = result.data;
      const extension =
        getImageExtensionFromContentType(blob.type) ?? getImageExtensionFromUrl(imageUrl) ?? "png";
      return { blob, extension };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      if (attempt >= maxAttempts) {
        console.error("[ComicDetailModal] 下载图片失败，已跳过:", imageUrl, error);
        return null;
      }
      await waitForExportRetry(300 * attempt);
    }
  }
  return null;
}
