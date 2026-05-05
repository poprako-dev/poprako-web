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

function buildQuery(
  url: string,
  params?: Record<
    string,
    string | number | boolean | (string | number | boolean)[]
  >,
): string {
  if (!params || Object.keys(params).length === 0) return url;

  const usp = new URLSearchParams();

  for (const key of Object.keys(params)) {
    const val = params[key as keyof typeof params] as any;
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
  };

  try {
    const response = await fetch(`${BASE_URL}${url}`, config);

    let body: FormatResponse<T> | null = null;
    try {
      body = (await response.json()) as FormatResponse<T>;
    } catch (e) {
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
    return {
      success: false,
      error: err && (err as any).message ? (err as any).message : "未知错误",
    };
  }
}

function buildQueryUrl(
  url: string,
  params?: Record<
    string,
    string | number | boolean | (string | number | boolean)[]
  >,
) {
  return buildQuery(url, params);
}

export const api = {
  get: <T>(
    url: string,
    queryParams?: Record<
      string,
      string | number | boolean | (string | number | boolean)[]
    >,
    needAuth = true,
  ) => request<T>(buildQueryUrl(url, queryParams), { method: "GET" }, needAuth),

  post: <T, B>(url: string, body: B, needAuth = true) =>
    request<T>(url, { method: "POST", body: JSON.stringify(body) }, needAuth),

  put: <T, B>(url: string, body: B, needAuth = true) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(body) }, needAuth),

  delete: <T>(url: string, needAuth = true) =>
    request<T>(url, { method: "DELETE" }, needAuth),

  deleteWithBody: <T, B>(url: string, body: B, needAuth = true) =>
    request<T>(url, { method: "DELETE", body: JSON.stringify(body) }, needAuth),

  patch: <T, B>(url: string, body: B, needAuth = true) =>
    request<T>(url, { method: "PATCH", body: JSON.stringify(body) }, needAuth),
};
