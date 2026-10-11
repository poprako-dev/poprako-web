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
    const abort = (): void => {
      request.abort();
    };
    const finish = createFinisher(request, options.signal, resolve, abort);
    try {
      configureUpload(request, options, finish);
      sendUpload(request, options, finish, abort);
    } catch {
      finish({ success: false, error: "无法启动上传请求", failureKind: "network" });
    }
  });
}

function createFinisher(
  request: XMLHttpRequest,
  signal: AbortSignal | undefined,
  resolve: (result: Result<undefined>) => void,
  abort: () => void,
): (result: Result<undefined>) => void {
  let settled = false;
  return (result) => {
    if (settled) return;
    settled = true;
    signal?.removeEventListener("abort", abort);
    request.upload.onprogress = null;
    request.onload = null;
    request.onerror = null;
    request.ontimeout = null;
    request.onabort = null;
    resolve(result);
  };
}

function configureUpload(
  request: XMLHttpRequest,
  options: UploadOptions,
  finish: (result: Result<undefined>) => void,
): void {
  request.open("PUT", options.url, true);
  request.timeout = options.timeoutMs;
  for (const [name, value] of new Headers(options.headers)) {
    if (name.toLowerCase() !== "content-length") request.setRequestHeader(name, value);
  }
  if (options.signal?.aborted) {
    finish({ success: false, error: "上传已取消", failureKind: "aborted" });
    return;
  }
  request.upload.onprogress = (event) => {
    reportUploadProgress(event, options.onProgress);
  };
  request.onload = () => {
    reportUploadResult(request, finish, options.onProgress);
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
}

function reportUploadProgress(event: ProgressEvent, onProgress: UploadOptions["onProgress"]): void {
  if (!event.lengthComputable) return;
  onProgress?.(Math.max(0, Math.min(99, Math.round((event.loaded / event.total) * 100))));
}

function reportUploadResult(
  request: XMLHttpRequest,
  finish: (result: Result<undefined>) => void,
  onProgress: UploadOptions["onProgress"],
): void {
  if (request.status >= 200 && request.status < 300) {
    finish({ success: true, data: undefined });
    onProgress?.(100);
    return;
  }
  finish({
    success: false,
    error: uploadErrorMessage(request.responseText, request.status),
    httpStatus: request.status,
    failureKind: "http",
  });
}

function sendUpload(
  request: XMLHttpRequest,
  options: UploadOptions,
  finish: (result: Result<undefined>) => void,
  abort: () => void,
): void {
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) {
    finish({ success: false, error: "上传已取消", failureKind: "aborted" });
    return;
  }
  try {
    request.send(options.file);
  } catch {
    finish({ success: false, error: "无法启动上传请求", failureKind: "network" });
  }
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
