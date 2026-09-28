import { afterEach, describe, expect, test, vi } from "vitest";
import { buildQuery, requestHttp, stripNulls } from "@/shared/utility/http";

describe("HTTP transport helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test("serializes repeated query values and skips nullish values", () => {
    expect(
      buildQuery("/members?active=true", {
        owner_id: "user 1",
        incl: ["team", null, "user"],
        offset: 0,
        omitted: undefined,
      }),
    ).toBe("/members?active=true&owner_id=user+1&incl=team&incl=user&offset=0");
  });

  test("removes nullish object fields recursively and keeps array positions", () => {
    expect(
      stripNulls({
        top: null,
        nested: { keep: false, remove: undefined },
        items: [null, { remove: null, keep: 0 }],
      }),
    ).toEqual({
      nested: { keep: false },
      items: [null, { keep: 0 }],
    });
  });

  test("turns malformed JSON responses into an HTTP failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response("<html>broken</html>", {
            status: 502,
            statusText: "Bad Gateway",
          }),
        ),
      ),
    );

    await expect(requestHttp("/proxy")).resolves.toEqual({
      success: false,
      error: "Bad Gateway",
      httpStatus: 502,
    });
  });

  test("returns network failures in the shared Result shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))),
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(requestHttp("/offline")).resolves.toEqual({
      success: false,
      error: "offline",
    });
  });
});
