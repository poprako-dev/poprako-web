import { requestBlob, requestJson, requestText } from "@/api/http-transport";
import { putPresigned } from "@/api/presigned-upload";
import type { ApiDecoder } from "@/api/contract";
import { toSnakeCase } from "@/shared/utility/case-convert";
import type { Result } from "@/shared/utility/result";

type QueryValue = string | number | boolean | null | undefined;
export type ApiQuery = Readonly<Record<string, QueryValue | readonly QueryValue[]>>;
export type ApiAuthMode = "required" | "none";

export type ApiRequestOptions<Value> = {
  query?: ApiQuery | undefined;
  headers?: HeadersInit | undefined;
  auth?: ApiAuthMode | undefined;
  signal?: AbortSignal | undefined;
  timeoutMs?: number | undefined;
  decode: ApiDecoder<Value>;
};

export type ApiTextOptions = Omit<ApiRequestOptions<never>, "decode">;
export type ExternalRequestOptions = {
  headers?: HeadersInit | undefined;
  signal?: AbortSignal | undefined;
  timeoutMs?: number | undefined;
};

export type PresignedUploadOptions = ExternalRequestOptions & {
  url: string;
  file: File;
  onProgress?: ((percent: number) => void) | undefined;
};

export interface ApiClient {
  get<Value>(path: string, options: ApiRequestOptions<Value>): Promise<Result<Value>>;
  post<Value>(
    path: string,
    body: unknown,
    options: ApiRequestOptions<Value>,
  ): Promise<Result<Value>>;
  put<Value>(
    path: string,
    body: unknown,
    options: ApiRequestOptions<Value>,
  ): Promise<Result<Value>>;
  patch<Value>(
    path: string,
    body: unknown,
    options: ApiRequestOptions<Value>,
  ): Promise<Result<Value>>;
  delete<Value>(
    path: string,
    options: ApiRequestOptions<Value> & { body?: unknown },
  ): Promise<Result<Value>>;
  getText(path: string, options?: ApiTextOptions): Promise<Result<string>>;
  download(url: string, options?: ExternalRequestOptions): Promise<Result<Blob>>;
  putPresigned(options: PresignedUploadOptions): Promise<Result<undefined>>;
}

export type ApiClientOptions = {
  onUnauthorized?: ((credential: string, revision: number) => void) | undefined;
  getAuthRevision?: (() => number) | undefined;
  baseUrl: string;
  getAccessToken: () => string | null;
  fetchImpl?: typeof fetch | undefined;
  timeoutMs?: number | undefined;
};

const DEFAULT_TIMEOUT_MS = 30_000;

export function createApiClient(options: ApiClientOptions): ApiClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const defaultTimeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const sendJson = createJsonSender(options, fetchImpl, defaultTimeoutMs);

  return {
    get: <Value>(path: string, requestOptions: ApiRequestOptions<Value>) =>
      sendJson("GET", path, undefined, requestOptions),
    post: <Value>(path: string, body: unknown, requestOptions: ApiRequestOptions<Value>) =>
      sendJson("POST", path, body, requestOptions),
    put: <Value>(path: string, body: unknown, requestOptions: ApiRequestOptions<Value>) =>
      sendJson("PUT", path, body, requestOptions),
    patch: <Value>(path: string, body: unknown, requestOptions: ApiRequestOptions<Value>) =>
      sendJson("PATCH", path, body, requestOptions),
    delete: <Value>(path: string, requestOptions: ApiRequestOptions<Value> & { body?: unknown }) =>
      sendJson("DELETE", path, requestOptions.body, requestOptions),
    getText: (path, requestOptions = {}) =>
      sendText(options, fetchImpl, defaultTimeoutMs, path, requestOptions),
    download: (url, requestOptions = {}) =>
      downloadBlob(fetchImpl, defaultTimeoutMs, url, requestOptions),
    putPresigned: (requestOptions) => uploadPresigned(requestOptions),
  };
}

function notifyUnauthorized<Value>(
  result: Result<Value>,
  headers: Headers,
  revision: number,
  options: ApiClientOptions,
): Result<Value> {
  const credential = headers.get("Authorization");
  if (!result.success && result.httpStatus === 401 && credential?.startsWith("Bearer "))
    options.onUnauthorized?.(credential.slice(7), revision);
  return result;
}

function createJsonSender(
  options: ApiClientOptions,
  fetchImpl: typeof fetch,
  defaultTimeoutMs: number,
) {
  return function sendJson<Value>(
    method: string,
    path: string,
    body: unknown,
    requestOptions: ApiRequestOptions<Value>,
  ): Promise<Result<Value>> {
    const revision = options.getAuthRevision?.() ?? 0;
    const url = buildUrl(options.baseUrl, path, requestOptions.query);
    const headers = createHeaders(
      requestOptions.headers,
      requestOptions.auth ?? "required",
      options.getAccessToken,
      body !== undefined,
    );
    const init: RequestInit = {
      method,
      headers,
      credentials: "omit",
      ...(body === undefined
        ? {}
        : { body: JSON.stringify(toSnakeCase(body, { preserveObjectKeys: ["headers"] })) }),
    };
    return requestJson(
      {
        fetchImpl,
        url,
        init,
        timeoutMs: requestOptions.timeoutMs ?? defaultTimeoutMs,
        ...(requestOptions.signal ? { signal: requestOptions.signal } : {}),
      },
      requestOptions.decode,
    ).then((result) => notifyUnauthorized(result, headers, revision, options));
  };
}

function sendText(
  options: ApiClientOptions,
  fetchImpl: typeof fetch,
  defaultTimeoutMs: number,
  path: string,
  requestOptions: ApiTextOptions,
): Promise<Result<string>> {
  const revision = options.getAuthRevision?.() ?? 0;
  const headers = createHeaders(
    requestOptions.headers,
    requestOptions.auth ?? "required",
    options.getAccessToken,
    false,
  );
  return requestText({
    fetchImpl,
    url: buildUrl(options.baseUrl, path, requestOptions.query),
    init: { method: "GET", headers, credentials: "omit" },
    timeoutMs: requestOptions.timeoutMs ?? defaultTimeoutMs,
    ...(requestOptions.signal ? { signal: requestOptions.signal } : {}),
  }).then((result) => notifyUnauthorized(result, headers, revision, options));
}

function downloadBlob(
  fetchImpl: typeof fetch,
  defaultTimeoutMs: number,
  url: string,
  requestOptions: ExternalRequestOptions,
): Promise<Result<Blob>> {
  return requestBlob({
    fetchImpl,
    url,
    init: { method: "GET", headers: new Headers(requestOptions.headers), credentials: "omit" },
    timeoutMs: requestOptions.timeoutMs ?? defaultTimeoutMs,
    ...(requestOptions.signal ? { signal: requestOptions.signal } : {}),
  });
}

function uploadPresigned(requestOptions: PresignedUploadOptions): Promise<Result<undefined>> {
  return putPresigned({ ...requestOptions, timeoutMs: requestOptions.timeoutMs ?? 8 * 60_000 });
}

function createHeaders(
  input: HeadersInit | undefined,
  auth: ApiAuthMode,
  getAccessToken: () => string | null,
  hasJsonBody: boolean,
): Headers {
  const headers = new Headers(input);
  if (auth === "required" && !headers.has("Authorization")) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  if (hasJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

function buildUrl(baseUrl: string, path: string, query?: ApiQuery): string {
  const normalizedPath = `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  if (!query || Object.keys(query).length === 0) return normalizedPath;
  const snakeQuery = toSnakeCase(query);
  if (typeof snakeQuery !== "object" || snakeQuery === null || Array.isArray(snakeQuery)) {
    throw new TypeError("API query must be an object");
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(snakeQuery)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isQueryValue(item)) params.append(key, String(item));
      }
    } else if (isQueryValue(value)) {
      params.append(key, String(value));
    }
  }
  const queryText = params.toString();
  if (!queryText) return normalizedPath;
  const hashIndex = normalizedPath.indexOf("#");
  const address = hashIndex < 0 ? normalizedPath : normalizedPath.slice(0, hashIndex);
  const hash = hashIndex < 0 ? "" : normalizedPath.slice(hashIndex);
  return `${address}${address.includes("?") ? "&" : "?"}${queryText}${hash}`;
}

function isQueryValue(value: unknown): value is QueryValue {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}
