import { createApiClient } from "@/api/client";
import type { ApiClient } from "@/api/client";
/** Calls the currently installed test fetch stub; no production singleton is involved. */
export function createTestApi(token = "test-token"): ApiClient {
  return createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => token,
    fetchImpl: (input, init) => fetch(input, init),
  });
}

export function parseRequestBody(value: BodyInit | null | undefined): unknown {
  if (typeof value !== "string") throw new TypeError("Expected a JSON request body");
  return JSON.parse(value) as unknown;
}
export function requestAddress(input: RequestInfo | URL | undefined): string {
  if (input === undefined) throw new Error("Missing request");
  return typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
}
