import { appConfig } from "@/routes/business/configuration";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { useAppStore } from "@/routes/business/session/session-store";
import { buildQuery, type QueryParams, requestHttp, stripNulls } from "@/shared/utility/http";
import type { Result, ResultFailure } from "@/shared/utility/result";
export {
  ApiRequestError,
  isReportedValidationError,
  showLocalApiFailure,
  showLocalCaughtError,
  toApiRequestError,
} from "@/routes/business/request-error";

/** Report a validation response once at custom request boundaries. */
export function createApiFailure(error: string, httpStatus: number): ResultFailure {
  if (httpStatus === 422) {
    useToastStore.getState().showToast(error, "error");
  }
  return { success: false, error, httpStatus };
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  requiresAuth = true,
): Promise<Result<T>> {
  const headers = new Headers(options.headers);
  if (requiresAuth) {
    const token = useAppStore.getState().accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  const result = await requestHttp<T>(appConfig.apiBaseUrl + url, {
    ...options,
    headers,
  });
  if (!result.success && result.httpStatus === 422) {
    useToastStore.getState().showToast(result.error, "error");
  }
  return result;
}
function buildQueryUrl(url: string, params?: QueryParams): string {
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
  get: <T>(url: string, queryParams?: QueryParams, requiresAuth = true, signal?: AbortSignal) =>
    request<T>(
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
      {
        method: "POST",
        signal: signal ?? null,
        body: JSON.stringify(stripNulls(body)),
      },
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

  delete: <T>(url: string, queryParamsOrNeedAuth?: QueryParams | boolean, requiresAuth = true) => {
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
