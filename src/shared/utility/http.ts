import type { Result, ResultFailure } from "@/shared/utility/result";
type FormatResponse<T> = {
  code: number;
  message?: string;
  data?: T;
};
export function createHttpFailure(error: string, httpStatus: number): ResultFailure {
  return { success: false, error, httpStatus };
}
export function resolveHttpErrorMessage(
  message: unknown,
  statusText: string,
  httpStatus: number,
): string {
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }
  if (httpStatus === 422) {
    console.error("[API] HTTP 422 响应缺少有效 message", { message });
  }
  return statusText || `HTTP ${String(httpStatus)}`;
}

export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null | (string | number | boolean | undefined | null)[]
>;

export function buildQuery(url: string, params?: QueryParams): string {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  const usp = new URLSearchParams();

  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null) {
      continue;
    }
    if (Array.isArray(val)) {
      for (const v of val) {
        if (v !== undefined && v !== null) {
          usp.append(key, String(v));
        }
      }
    } else {
      usp.append(key, String(val));
    }
  }

  const qs = usp.toString();

  if (!qs) {
    return url;
  }

  return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
}
export function stripNulls(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((value) => stripNulls(value));
  }
  if (typeof obj !== "object") {
    return obj;
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (val === null || val === undefined) {
      continue;
    }
    result[key] = stripNulls(val);
  }
  return result;
}

export async function requestHttp<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 30_000,
): Promise<Result<T>> {
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "omit",
    signal: options.signal
      ? AbortSignal.any([options.signal, AbortSignal.timeout(timeoutMs)])
      : AbortSignal.timeout(timeoutMs),
  };

  const startTime = performance.now();
  const method = options.method ?? "GET";

  try {
    const response = await fetch(url, config);

    if (response.status === 204) {
      if (response.ok) {
        return { success: true, data: undefined as T };
      }

      console.error(`[API] ${method} ${url} → HTTP ${String(response.status)}`, {
        statusText: response.statusText,
        durationMs: Math.round(performance.now() - startTime),
      });
      return {
        success: false,
        error: response.statusText || `HTTP ${String(response.status)}`,
        httpStatus: response.status,
      };
    }

    // clone 一份用于日志，避免 JSON 解析失败后 body 已消费无法读取
    const clonedResponse = response.clone();

    let body: FormatResponse<T> | null = null;
    try {
      body = (await response.json()) as FormatResponse<T>;
    } catch {
      let rawText = "(无法读取响应体)";
      try {
        rawText = await clonedResponse.text();
      } catch {
        // Keep the fallback text when the cloned response cannot be read.
      }
      console.error(`[API] ${method} ${url} → HTTP ${String(response.status)}, JSON 解析失败`, {
        responseLength: rawText.length,
        durationMs: Math.round(performance.now() - startTime),
      });
      const error = response.statusText || `HTTP ${String(response.status)}`;
      return createHttpFailure(error, response.status);
    }

    if (!response.ok) {
      console.error(`[API] ${method} ${url} → HTTP ${String(response.status)}`, {
        code: body.code,
        durationMs: Math.round(performance.now() - startTime),
      });
      const error = resolveHttpErrorMessage(body.message, response.statusText, response.status);
      return createHttpFailure(error, response.status);
    }

    if (body.code !== 0) {
      console.error(`[API] ${method} ${url} → code=${String(body.code)}`, {
        body,
        durationMs: Math.round(performance.now() - startTime),
      });
      return {
        success: false,
        error: body.message ?? `API code ${String(body.code)}`,
      };
    }

    return { success: true, data: body.data as T };
  } catch (error) {
    console.error(
      `[API] ${method} ${url} → 网络异常`,
      error instanceof Error ? error : { message: String(error) },
      { durationMs: Math.round(performance.now() - startTime) },
    );
    const message = error instanceof Error ? error.message : "未知错误";
    return {
      success: false,
      error: message,
    };
  }
}
