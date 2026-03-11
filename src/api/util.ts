import { useAppStore } from "@/store/app";

type FormatResponse<T> = {
  // 2xx 表示成功
  code: number;
  // 失败时的错误描述，成功时可能是空字符串或是成功信息
  message: string;
  // 失败时可能为 null，成功时为响应数据
  data?: T;
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request<T>(
  url: string,
  options: RequestInit = {},
  needAuth: boolean = true,
): Promise<FormatResponse<T>> {
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

  const response = await fetch(`${BASE_URL}${url}`, config);

  // 这里处理 HTTP 状态码错误（如 401, 500 等）
  if (!response.ok) {
    throw new Error(`HTTP 错误，状态码: ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: <T>(url: string, needAuth = true) =>
    request<T>(url, { method: "GET" }, needAuth),

  post: <T, B>(url: string, body: B, needAuth = true) =>
    request<T>(url, { method: "POST", body: JSON.stringify(body) }, needAuth),

  put: <T, B>(url: string, body: B, needAuth = true) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(body) }, needAuth),

  delete: <T>(url: string, needAuth = true) =>
    request<T>(url, { method: "DELETE" }, needAuth),

  patch: <T, B>(url: string, body: B, needAuth = true) =>
    request<T>(url, { method: "PATCH", body: JSON.stringify(body) }, needAuth),
};
