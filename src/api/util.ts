import { appConfig } from "@/config/config";
import { useAppStore } from "@/store/app";
import type { Result } from "@/types/utils/result";

type FormatResponse<T> = {
  // 2xx 表示成功
  code: number;
  // 失败时的错误描述，成功时可能是空字符串或是成功信息
  message: string;
  // 失败时可能为 null，成功时为响应数据
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
    credentials: "include", // 允许携带 cookie，适用于需要登录状态的请求
  };

  try {
    const response = await fetch(`${BASE_URL}${url}`, config);

    let body: FormatResponse<T> | null = null;
    try {
      body = (await response.json()) as FormatResponse<T>;
    } catch {
      body = {
        code: response.ok ? 200 : response.status,
        message: response.statusText || "未知错误",
      } as FormatResponse<T>;
    }

    if (!response.ok) {
      return {
        success: false,
        error: body.message ?? response.statusText ?? "未知错误",
      };
    }

    if (body.data !== undefined && body.data !== null) {
      return { success: true, data: body.data as T };
    }

    return { success: true, data: body.message as unknown as T };
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
      { method: "POST", body: JSON.stringify(body) },
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
      { method: "PUT", body: JSON.stringify(body) },
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
      { method: "DELETE", body: JSON.stringify(body) },
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
      { method: "PATCH", body: JSON.stringify(body) },
      options.needAuth,
    );
  },
};
