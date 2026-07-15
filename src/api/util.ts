import { appConfig } from "@/config/config";
import { useAppStore } from "@/store/app";
import type { Result } from "@/types/utils/result";

type FormatResponse<T> = {
  code: number;
  message?: string;
  data?: T;
};

const BASE_URL = appConfig.apiBaseUrl;

type QueryParams = Record<
  string,
  | string
  | number
  | boolean
  | undefined
  | null
  | (string | number | boolean | undefined | null)[]
>;

function buildQuery(
  url: string,
  params?: QueryParams,
): string {
  if (!params || Object.keys(params).length === 0) return url;

  const usp = new URLSearchParams();

  for (const key of Object.keys(params)) {
    const val = params[key as keyof typeof params];
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) {
      for (const v of val) {
        if (v === undefined || v === null) continue;
        usp.append(key, String(v));
      }
    } else {
      usp.append(key, String(val));
    }
  }

  const qs = usp.toString();

  if (!qs) return url;

  return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
}
function stripNulls(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(stripNulls);
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (val === null || val === undefined) continue;
    result[key] = stripNulls(val);
  }
  return result;
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  needAuth: boolean = true,
): Promise<Result<T>> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  // 自动携带 Auth 头
  if (needAuth) {
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

  try {
    const response = await fetch(`${BASE_URL}${url}`, config);

    if (response.status === 204) {
      if (response.ok) return { success: true, data: undefined as T };

      return {
        success: false,
        error: response.statusText || `HTTP ${response.status}`,
      };
    }

    let body: FormatResponse<T> | null = null;
    try {
      body = (await response.json()) as FormatResponse<T>;
    } catch {
      return {
        success: false,
        error: response.statusText || `HTTP ${response.status}`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: body.message ?? response.statusText ?? `HTTP ${response.status}`,
      };
    }

    if (body.code !== 0) {
      return {
        success: false,
        error: body.message ?? `API code ${body.code}`,
      };
    }

    return { success: true, data: body.data as T };
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
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
  needAuth = true,
): { queryParams?: QueryParams; needAuth: boolean } {
  if (typeof queryParamsOrNeedAuth === "boolean") {
    return { needAuth: queryParamsOrNeedAuth };
  }

  return { queryParams: queryParamsOrNeedAuth, needAuth };
}

export const api = {
  get: <T>(
    url: string,
    queryParams?: QueryParams,
    needAuth = true,
  ) => request<T>(buildQueryUrl(url, queryParams), { method: "GET" }, needAuth),

  post: <T, B>(
    url: string,
    body: B,
    queryParamsOrNeedAuth?: QueryParams | boolean,
    needAuth = true,
  ) => {
    const options = resolveQueryAndAuth(queryParamsOrNeedAuth, needAuth);
    return request<T>(
      buildQueryUrl(url, options.queryParams),
      { method: "POST", body: JSON.stringify(stripNulls(body)) },
      options.needAuth,
    );
  },

  put: <T, B>(
    url: string,
    body: B,
    queryParamsOrNeedAuth?: QueryParams | boolean,
    needAuth = true,
  ) => {
    const options = resolveQueryAndAuth(queryParamsOrNeedAuth, needAuth);
    return request<T>(
      buildQueryUrl(url, options.queryParams),
      { method: "PUT", body: JSON.stringify(stripNulls(body)) },
      options.needAuth,
    );
  },

  delete: <T>(
    url: string,
    queryParamsOrNeedAuth?: QueryParams | boolean,
    needAuth = true,
  ) => {
    const options = resolveQueryAndAuth(queryParamsOrNeedAuth, needAuth);
    return request<T>(
      buildQueryUrl(url, options.queryParams),
      { method: "DELETE" },
      options.needAuth,
    );
  },

  deleteWithBody: <T, B>(
    url: string,
    body: B,
    queryParamsOrNeedAuth?: QueryParams | boolean,
    needAuth = true,
  ) => {
    const options = resolveQueryAndAuth(queryParamsOrNeedAuth, needAuth);
    return request<T>(
      buildQueryUrl(url, options.queryParams),
      { method: "DELETE", body: JSON.stringify(stripNulls(body)) },
      options.needAuth,
    );
  },

  patch: <T, B>(
    url: string,
    body: B,
    queryParamsOrNeedAuth?: QueryParams | boolean,
    needAuth = true,
  ) => {
    const options = resolveQueryAndAuth(queryParamsOrNeedAuth, needAuth);
    return request<T>(
      buildQueryUrl(url, options.queryParams),
      { method: "PATCH", body: JSON.stringify(stripNulls(body)) },
      options.needAuth,
    );
  },
};
