import { appConfig } from "@/config/config";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import { useAppStore } from "@/store/app";
import type { Result, ResultFailure } from "@/types/utils/result";

/*
 * API diagnostics are intentionally logged for network and protocol failures.
 */
/* eslint-disable no-console */

interface FormatResponse<T> {
  code: number;
  message?: string | undefined;
  data?: T | undefined;
}

const BASE_URL = appConfig.apiBaseUrl;

export class ApiRequestError extends Error {
  readonly httpStatus?: number;

  constructor(failure: ResultFailure) {
    super(failure.error);
    this.name = "ApiRequestError";
    if (failure.httpStatus !== undefined) {
      this.httpStatus = failure.httpStatus;
    }
  }
}

export function createHttpFailure(
  error: string,
  httpStatus: number,
): ResultFailure {
  if (httpStatus === 422) {
    useToastStore.getState().showToast(error, "error");
  }

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

export function toApiRequestError(failure: ResultFailure): ApiRequestError {
  return new ApiRequestError(failure);
}

export function isReportedValidationError(error: unknown): boolean {
  if (error instanceof ApiRequestError) {
    return error.httpStatus === 422;
  }
  if (typeof error !== "object" || error === null) {
    return false;
  }
  return "httpStatus" in error && error.httpStatus === 422;
}

type ErrorNotifier = (message: string, type: "error") => unknown;

export function showLocalApiFailure(
  failure: ResultFailure,
  showToast: ErrorNotifier,
  fallback = failure.error,
): void {
  if (failure.httpStatus === 422) {return;}
  showToast(fallback, "error");
}

export function showLocalCaughtError(
  error: unknown,
  showToast: ErrorNotifier,
  fallback: string,
  shouldPreserveErrorMessage = false,
): void {
  if (isReportedValidationError(error)) {
    return;
  }
  const message = shouldPreserveErrorMessage && error instanceof Error
    ? error.message
    : fallback;
  showToast(message, "error");
}

type QueryParams = Record<string,
  string
  | number
  | boolean
  | undefined
  | null
  | (string | number | boolean | undefined | null)[]>;

function buildQuery(
  url: string,
  params?: QueryParams,
): string {
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

  if (!qs) {return url;}

  return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
}
function stripNulls(obj: unknown): unknown {
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
    if (val === null || val === undefined) {continue;}
    result[key] = stripNulls(val);
  }
  return result;
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  requiresAuth = true,
): Promise<Result<T>> {
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");

  // 自动携带 Auth 头
  if (requiresAuth) {
    const token = useAppStore.getState().getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "omit",
  };

  const startTime = performance.now();
  const method = options.method ?? "GET";

  try {
    const response = await fetch(`${BASE_URL}${url}`, config);

    if (response.status === 204) {
      if (response.ok) {
        console.debug(
          `[API] ${method} ${url} → ${String(response.status)} `
          + `(${(performance.now() - startTime).toFixed(0)}ms)`,
        );
        return { success: true, data: undefined as T };
      }

      console.error(
        `[API] ${method} ${url} → HTTP ${String(response.status)}`,
        {
          statusText: response.statusText,
          durationMs: Math.round(performance.now() - startTime),
        },
      );
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
      console.error(
        `[API] ${method} ${url} → HTTP ${String(response.status)}, JSON 解析失败`,
        {
          rawBody: rawText.slice(0, 500),
          durationMs: Math.round(performance.now() - startTime),
        },
      );
      const error = response.statusText || `HTTP ${String(response.status)}`;
      return createHttpFailure(error, response.status);
    }

    if (!response.ok) {
      console.error(
        `[API] ${method} ${url} → HTTP ${String(response.status)}`,
        {
          body,
          durationMs: Math.round(performance.now() - startTime),
        },
      );
      const error = resolveHttpErrorMessage(
        body.message,
        response.statusText,
        response.status,
      );
      return createHttpFailure(error, response.status);
    }

    if (body.code !== 0) {
      console.error(
        `[API] ${method} ${url} → code=${String(body.code)}`,
        {
          body,
          durationMs: Math.round(performance.now() - startTime),
        },
      );
      return {
        success: false,
        error: body.message ?? `API code ${String(body.code)}`,
      };
    }

    console.debug(
      `[API] ${method} ${url} → ${String(response.status)} `
      + `(${(performance.now() - startTime).toFixed(0)}ms)`,
    );
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

function buildQueryUrl(
  url: string,
  params?: QueryParams,
) {
  return buildQuery(url, params);
}

function resolveQueryAndAuth(
  queryParamsOrNeedAuth?: QueryParams | boolean,
  requiresAuth = true,
): { queryParams?: QueryParams | undefined; requiresAuth: boolean } {
  if (typeof queryParamsOrNeedAuth === "boolean") {
    return { requiresAuth: queryParamsOrNeedAuth };
  }

    return queryParamsOrNeedAuth === undefined
      ? { requiresAuth }
      : { queryParams: queryParamsOrNeedAuth, requiresAuth };
}

export const api = {
  get: <T>(
    url: string,
    queryParams?: QueryParams,
    requiresAuth = true,
    signal?: AbortSignal,
  ) => request<T>(
    buildQueryUrl(url, queryParams),
    { method: "GET", signal: signal ?? null },
    requiresAuth,
  ),

  // B is retained to preserve the public API's explicit request-body typing.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  post: <T, B>(
    url: string,
    body: B,
    queryParamsOrNeedAuth?: QueryParams | boolean,
    requiresAuth = true,
    signal?: AbortSignal,
  ) => {
    const options = resolveQueryAndAuth(queryParamsOrNeedAuth, requiresAuth);
    return request<T>(
      buildQueryUrl(url, options.queryParams),
      { method: "POST", signal: signal ?? null, body: JSON.stringify(stripNulls(body)) },
      options.requiresAuth,
    );
  },

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  put: <T, B>(
    url: string,
    body: B,
    queryParamsOrNeedAuth?: QueryParams | boolean,
    requiresAuth = true,
  ) => {
    const options = resolveQueryAndAuth(queryParamsOrNeedAuth, requiresAuth);
    return request<T>(
      buildQueryUrl(url, options.queryParams),
      { method: "PUT", body: JSON.stringify(stripNulls(body)) },
      options.requiresAuth,
    );
  },

  delete: <T>(
    url: string,
    queryParamsOrNeedAuth?: QueryParams | boolean,
    requiresAuth = true,
  ) => {
    const options = resolveQueryAndAuth(queryParamsOrNeedAuth, requiresAuth);
    return request<T>(
      buildQueryUrl(url, options.queryParams),
      { method: "DELETE" },
      options.requiresAuth,
    );
  },

  // B is retained to preserve the public API's explicit request-body typing.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  deleteWithBody: <T, B>(
    url: string,
    body: B,
    queryParamsOrNeedAuth?: QueryParams | boolean,
    requiresAuth = true,
  ) => {
    const options = resolveQueryAndAuth(queryParamsOrNeedAuth, requiresAuth);
    return request<T>(
      buildQueryUrl(url, options.queryParams),
      { method: "DELETE", body: JSON.stringify(stripNulls(body)) },
      options.requiresAuth,
    );
  },

  // B is retained to preserve the public API's explicit request-body typing.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  patch: <T, B>(
    url: string,
    body: B,
    queryParamsOrNeedAuth?: QueryParams | boolean,
    requiresAuth = true,
  ) => {
    const options = resolveQueryAndAuth(queryParamsOrNeedAuth, requiresAuth);
    return request<T>(
      buildQueryUrl(url, options.queryParams),
      { method: "PATCH", body: JSON.stringify(stripNulls(body)) },
      options.requiresAuth,
    );
  },
};
