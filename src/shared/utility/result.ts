export type Result<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      httpStatus?: number | undefined;
      failureKind?: ResultFailureKind | undefined;
      code?: number | undefined;
    };

export type ResultFailureKind =
  | "http"
  | "business"
  | "network"
  | "timeout"
  | "aborted"
  | "protocol";

export type ResultFailure = Extract<Result<unknown>, { success: false }>;
