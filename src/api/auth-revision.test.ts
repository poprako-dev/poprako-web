import { expect, test, vi } from "vitest";
import { createApiClient } from "./client";
import { decodeVoid } from "./contract";

test.each(["json", "text"])(
  "%s 401 carries the request's auth revision, not a later login",
  async (kind) => {
    let revision = 1;
    const pending: { resolve?: (response: Response) => void } = {};
    const callback = vi.fn();
    const client = createApiClient({
      baseUrl: "/api/v1",
      getAccessToken: () => "same-token",
      getAuthRevision: () => revision,
      onUnauthorized: callback,
      fetchImpl: () =>
        new Promise((resolve) => {
          pending.resolve = resolve;
        }),
    });
    const request =
      kind === "json" ? client.get("/private", { decode: decodeVoid }) : client.getText("/private");
    revision = 2;
    if (!pending.resolve) throw new Error("request missing");
    pending.resolve(Response.json({ message: "expired" }, { status: 401 }));
    await request;
    expect(callback).toHaveBeenCalledWith("same-token", 1);
  },
);
test("public failures do not expire the signed-in session", async () => {
  const callback = vi.fn();
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "token",
    onUnauthorized: callback,
    fetchImpl: () => Promise.resolve(Response.json({}, { status: 401 })),
  });
  await client.post("/login", {}, { auth: "none", decode: decodeVoid });
  expect(callback).not.toHaveBeenCalled();
});

test("transport does not bind native fetch to its internal configuration object", async () => {
  function fetchImpl(this: unknown): Promise<Response> {
    expect(this).toBeUndefined();
    return Promise.resolve(new Response(null, { status: 204 }));
  }
  const client = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => null, fetchImpl });
  const result = await client.get("/private", { decode: decodeVoid });
  expect(result.success).toBe(true);
});
