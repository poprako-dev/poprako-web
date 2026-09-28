import { createApiFailure, toApiRequestError } from "@/routes/business/request";
import {
  appendDownloadCacheBuster,
  getImageExtensionFromContentType,
  getImageExtensionFromUrl,
  waitForExportRetry,
} from "@/routes/_authenticated/_shell/business/comic-detail/export-download-utils";

type ImageFile = { blob: Blob; extension: string };

type Args = {
  accessToken: string | null;
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
      const response = await fetch(appendDownloadCacheBuster(imageUrl), {
        cache: "no-store",
        ...(args.accessToken && {
          headers: { Authorization: `Bearer ${args.accessToken}` },
        }),
        signal: args.signal,
      });
      if (!response.ok) {
        const responseText = await response.text();
        let message = responseText || response.statusText || `HTTP ${String(response.status)}`;
        try {
          const body = JSON.parse(responseText) as { message?: unknown };
          if (typeof body.message === "string") message = body.message;
        } catch {
          const xmlMessage = /<Message>([^<]+)<\/Message>/.exec(responseText);
          if (xmlMessage?.[1]) message = xmlMessage[1];
        }
        throw toApiRequestError(createApiFailure(message, response.status));
      }
      const blob = await response.blob();
      const extension =
        getImageExtensionFromContentType(response.headers.get("content-type")) ??
        getImageExtensionFromUrl(imageUrl) ??
        "png";
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
