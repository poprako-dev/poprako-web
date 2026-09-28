import type { ResultFailure } from "@/shared/utility/result";
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
  if (failure.httpStatus === 422) return;
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
  const message = shouldPreserveErrorMessage && error instanceof Error ? error.message : fallback;
  showToast(message, "error");
}
