import { describe, expect, test, vi } from "vitest";
import { showLocalApiFailure, showLocalCaughtError, toApiRequestError } from "./request-error";
import type { ResultFailure } from "@/shared/utility/result";

describe("operation error reporting", () => {
  test("reports a 422 once across Result and throwing boundaries", () => {
    const failure: ResultFailure = {
      success: false,
      error: "昵称已存在",
      httpStatus: 422,
      failureKind: "http",
      code: 12,
    };
    const notify = vi.fn();
    showLocalApiFailure(failure, notify, "保存失败");
    const error = toApiRequestError(failure);
    showLocalCaughtError(error, notify, "保存失败");
    expect(notify).toHaveBeenCalledExactlyOnceWith("昵称已存在", "error");
    expect(error.httpStatus).toBe(422);
    expect(error.code).toBe(12);
    expect(error.failureKind).toBe("http");
  });

  test("does not report cancellation, but reports a fresh failed retry", () => {
    const notify = vi.fn();
    showLocalApiFailure({ success: false, error: "cancelled", failureKind: "aborted" }, notify);
    expect(notify).not.toHaveBeenCalled();
    for (let attempt = 0; attempt < 2; attempt += 1) {
      showLocalApiFailure({ success: false, error: "网络失败", failureKind: "network" }, notify);
    }
    expect(notify).toHaveBeenCalledTimes(2);
  });
});
