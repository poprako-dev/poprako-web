import type { ResultFailure } from "@/shared/utility/result";

const reportedFailures = new WeakSet();

export class ApiRequestError extends Error {
  readonly httpStatus?: number;
  readonly failureKind?: ResultFailure["failureKind"];
  readonly code?: number;
  readonly failure: ResultFailure;

  constructor(failure: ResultFailure) {
    super(failure.error);
    this.name = "ApiRequestError";
    this.failure = failure;
    this.failureKind = failure.failureKind;
    if (failure.code !== undefined) this.code = failure.code;
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
    return error.httpStatus === 422 && reportedFailures.has(error.failure);
  }
  if (typeof error !== "object" || error === null) {
    return false;
  }
  return "httpStatus" in error && error.httpStatus === 422 && reportedFailures.has(error);
}

type ErrorNotifier = (message: string, type: "error") => unknown;

export function showLocalApiFailure(
  failure: ResultFailure,
  showToast: ErrorNotifier,
  fallback = failure.error,
): void {
  if (failure.failureKind === "aborted" || reportedFailures.has(failure)) return;
  reportedFailures.add(failure);
  showToast(failure.httpStatus === 422 ? failure.error : fallback, "error");
}

export function showLocalCaughtError(
  error: unknown,
  showToast: ErrorNotifier,
  fallback: string,
  shouldPreserveErrorMessage = false,
): void {
  if (error instanceof ApiRequestError) {
    showLocalApiFailure(
      error.failure,
      showToast,
      shouldPreserveErrorMessage ? error.message : fallback,
    );
    return;
  }
  if (typeof error === "object" && error !== null && reportedFailures.has(error)) {
    return;
  }
  if (typeof error === "object" && error !== null) reportedFailures.add(error);
  const message = shouldPreserveErrorMessage && error instanceof Error ? error.message : fallback;
  showToast(message, "error");
}
