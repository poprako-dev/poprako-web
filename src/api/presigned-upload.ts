import type { Result } from "@/shared/utility/result";

type UploadOptions = {
  url: string;
  file: File;
  headers?: HeadersInit | undefined;
  onProgress?: ((percent: number) => void) | undefined;
  signal?: AbortSignal | undefined;
  timeoutMs: number;
};

export function putPresigned(options: UploadOptions): Promise<Result<undefined>> {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    let settled = false;
    const finish = (result: Result<undefined>): void => {
      if (settled) return;
      settled = true;
      options.signal?.removeEventListener("abort", abort);
      request.upload.onprogress = null;
      request.onload = null;
      request.onerror = null;
      request.ontimeout = null;
      request.onabort = null;
      resolve(result);
    };
    const abort = (): void => {
      request.abort();
    };

    try {
      request.open("PUT", options.url, true);
      request.timeout = options.timeoutMs;
      for (const [name, value] of new Headers(options.headers)) {
        if (name.toLowerCase() !== "content-length") request.setRequestHeader(name, value);
      }
      options.signal?.addEventListener("abort", abort, { once: true });
      if (options.signal?.aborted) {
        finish({ success: false, error: "上传已取消", failureKind: "aborted" });
        return;
      }
      request.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        options.onProgress?.(
          Math.max(0, Math.min(99, Math.round((event.loaded / event.total) * 100))),
        );
      };
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          finish({ success: true, data: undefined });
          options.onProgress?.(100);
          return;
        }
        finish({
          success: false,
          error: uploadErrorMessage(request.responseText, request.status),
          httpStatus: request.status,
          failureKind: "http",
        });
      };
      request.onerror = () => {
        finish({ success: false, error: "网络连接失败", failureKind: "network" });
      };
      request.ontimeout = () => {
        finish({ success: false, error: "上传超时", failureKind: "timeout" });
      };
      request.onabort = () => {
        finish({ success: false, error: "上传已取消", failureKind: "aborted" });
      };
      request.send(options.file);
    } catch {
      finish({ success: false, error: "无法启动上传请求", failureKind: "network" });
    }
  });
}

function uploadErrorMessage(responseText: string, status: number): string {
  const text = responseText.trim();
  if (text) {
    try {
      const body: unknown = JSON.parse(text);
      if (typeof body === "object" && body !== null && "message" in body) {
        const message = body.message;
        if (typeof message === "string" && message.trim()) return message;
      }
    } catch {
      const match = /<Message>([^<]+)<\/Message>/.exec(text);
      if (match?.[1]) return match[1];
    }
  }
  return `上传失败: HTTP ${String(status)}`;
}
