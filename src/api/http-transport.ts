import { ApiDecodeError } from "@/api/api-error";
import { toCamelCase } from "@/shared/utility/case-convert";
import type { Result, ResultFailure, ResultFailureKind } from "@/shared/utility/result";

export type Decode<Value> = (value: unknown) => Value;

type RequestConfig = {
  fetchImpl: typeof fetch;
  url: string;
  init: RequestInit;
  timeoutMs: number;
  signal?: AbortSignal | undefined;
};

type ApiEnvelope = {
  code: number;
  message?: string | undefined;
  data?: unknown;
};

type RequestScope = {
  signal: AbortSignal;
  failure(): ResultFailure;
  dispose(): void;
};

export function requestJson<Value>(
  config: RequestConfig,
  decode: Decode<Value>,
): Promise<Result<Value>> {
  return withResponse(config, async (response) => {
    if (response.status === 204) {
      return decodeResponse(undefined, decode, response.status);
    }

    const responseText = await response.text();
    let body: unknown;
    try {
      body = JSON.parse(responseText) as unknown;
    } catch {
      return response.ok
        ? failure("响应格式无效", "protocol", response.status)
        : responseFailure(response, responseText);
    }

    const envelope = readEnvelope(body);
    if (!envelope.success) {
      return response.ok
        ? failure(envelope.error, "protocol", response.status)
        : responseFailure(response, responseText);
    }
    if (!response.ok) {
      return failure(
        safeMessage(envelope.data.message, response.statusText, response.status),
        "http",
        response.status,
        envelope.data.code,
      );
    }
    if (envelope.data.code !== 0) {
      return failure(
        safeMessage(envelope.data.message, "", response.status, envelope.data.code),
        "business",
        response.status,
        envelope.data.code,
      );
    }

    return decodeResponse(
      toCamelCase(envelope.data.data, { preserveObjectKeys: ["headers"] }),
      decode,
      response.status,
    );
  });
}

export function requestText(config: RequestConfig): Promise<Result<string>> {
  return withResponse(config, async (response) => {
    const text = await response.text();
    if (!response.ok) return responseFailure(response, text);
    return { success: true, data: text };
  });
}

export function requestBlob(config: RequestConfig): Promise<Result<Blob>> {
  return withResponse(config, async (response) => {
    if (!response.ok) return responseFailure(response, await response.text());
    return { success: true, data: await response.blob() };
  });
}

async function withResponse<Value>(
  config: RequestConfig,
  consume: (response: Response) => Promise<Result<Value>>,
): Promise<Result<Value>> {
  const scope = createRequestScope(config.signal, config.timeoutMs);
  try {
    // Browser fetch is a Web IDL function: do not bind it to RequestConfig.
    const { fetchImpl } = config;
    const response = await fetchImpl(config.url, {
      ...config.init,
      signal: scope.signal,
    });
    return await consume(response);
  } catch (error) {
    console.error("HTTP transport failed", error);
    return scope.failure();
  } finally {
    scope.dispose();
  }
}

function createRequestScope(signal: AbortSignal | undefined, timeoutMs: number): RequestScope {
  const controller = new AbortController();
  let timedOut = false;
  const onAbort = (): void => {
    controller.abort();
  };
  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener("abort", onAbort, { once: true });
  }
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  return {
    signal: controller.signal,
    failure: () => {
      if (signal?.aborted) return failure("请求已取消", "aborted");
      if (timedOut) return failure("请求超时", "timeout");
      return failure("网络连接失败", "network");
    },
    dispose: () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    },
  };
}

function readEnvelope(value: unknown): { success: true; data: ApiEnvelope } | ResultFailure {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return failure("响应格式无效", "protocol");
  }
  const record = value as Record<string, unknown>;
  if (typeof record["code"] !== "number" || !Number.isFinite(record["code"])) {
    return failure("响应缺少有效业务状态码", "protocol");
  }
  const message = typeof record["message"] === "string" ? record["message"] : undefined;
  return {
    success: true,
    data: {
      code: record["code"],
      ...(message === undefined ? {} : { message }),
      data: record["data"],
    },
  };
}

function decodeResponse<Value>(
  value: unknown,
  decode: Decode<Value>,
  httpStatus?: number,
): Result<Value> {
  try {
    return { success: true, data: decode(value) };
  } catch (error) {
    const message = error instanceof ApiDecodeError ? error.message : "响应数据无法解码";
    return failure(message, "protocol", httpStatus);
  }
}

function responseFailure(response: Response, body: string): ResultFailure {
  let message: string | undefined;
  let code: number | undefined;
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      const converted = toCamelCase(parsed);
      if (typeof converted === "object" && converted !== null && !Array.isArray(converted)) {
        const record = converted as Record<string, unknown>;
        if (typeof record["message"] === "string") message = record["message"];
        if (typeof record["code"] === "number") code = record["code"];
      }
    }
  } catch {
    // Axum extractor rejections are plain text, outside the API envelope.
    if (response.headers.get("Content-Type")?.split(";")[0]?.trim() === "text/plain") {
      message = body.trim();
    }
  }
  return failure(
    safeMessage(message, response.statusText, response.status, code),
    "http",
    response.status,
    code,
  );
}

function safeMessage(
  message: string | undefined,
  statusText: string,
  httpStatus: number,
  code?: number,
): string {
  if (message?.trim()) return message;
  if (code !== undefined && code !== 0) return `API code ${String(code)}`;
  return httpMessage(statusText, httpStatus);
}

function httpMessage(statusText: string, httpStatus: number): string {
  return statusText || `HTTP ${String(httpStatus)}`;
}

function failure(
  error: string,
  failureKind: ResultFailureKind,
  httpStatus?: number,
  code?: number,
): ResultFailure {
  return {
    success: false,
    error,
    ...(httpStatus === undefined ? {} : { httpStatus }),
    failureKind,
    ...(code === undefined ? {} : { code }),
  };
}
