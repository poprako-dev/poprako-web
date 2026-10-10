import { expect, test, vi } from "vitest";
import { writeArtwork } from "./artwork-write";

test("retries only the backend's retryable transaction conflict", async () => {
  const signal = new AbortController().signal;
  const request = vi
    .fn()
    .mockResolvedValueOnce({
      success: false,
      httpStatus: 409,
      code: 8,
      error: "资源已被并发修改，请重试请求",
    })
    .mockResolvedValue({ success: true, data: "confirmed" });
  expect(await writeArtwork("chapter", signal, request)).toEqual({
    success: true,
    data: "confirmed",
  });
  expect(request).toHaveBeenCalledTimes(2);
  const stale = { success: false as const, httpStatus: 422, code: 2, error: "图片版本已过期" };
  request.mockReset().mockResolvedValue(stale);
  expect(await writeArtwork("chapter", signal, request)).toEqual(stale);
  expect(request).toHaveBeenCalledTimes(1);
});
