import { afterEach, expect, test, vi } from "vitest";
import { deferred } from "@/test-resource/deferred";
import { detailResponse, detailClient } from "./test/detail-cache-fixture";
import {
  invalidateComicDetails,
  loadCachedComicDetail,
  peekComicDetail,
} from "./comic-detail-cache";

const scope = { userId: "user", generation: 1, teamId: "team" };

afterEach(() => {
  vi.restoreAllMocks();
});

test("concurrent consumers and immediate reopen reuse a single detail read", async () => {
  const { client, fetchImpl } = detailClient();
  const pending = deferred<Response>();
  fetchImpl.mockReturnValueOnce(pending.promise);
  const first = loadCachedComicDetail(client, scope, "comic");
  const second = loadCachedComicDetail(client, scope, "comic");
  expect(first).toBe(second);
  expect(fetchImpl).toHaveBeenCalledTimes(2);
  pending.resolve(detailResponse("/api/v1/comics/comic"));
  expect(await second).toMatchObject({ success: true });
  await loadCachedComicDetail(client, scope, "comic");
  expect(fetchImpl).toHaveBeenCalledTimes(2);
});

test("the cache is isolated by API client, identity, generation and selected team", async () => {
  const { client, fetchImpl } = detailClient();
  const other = detailClient();
  await loadCachedComicDetail(client, scope, "comic");
  await loadCachedComicDetail(other.client, scope, "comic");
  await loadCachedComicDetail(client, { ...scope, userId: "other" }, "comic");
  await loadCachedComicDetail(client, { ...scope, generation: 2 }, "comic");
  await loadCachedComicDetail(client, { ...scope, teamId: "other-team" }, "comic");
  expect(fetchImpl).toHaveBeenCalledTimes(8);
  expect(other.fetchImpl).toHaveBeenCalledTimes(2);
});

test("expired entries revalidate and old requests cannot refill invalidated data", async () => {
  const { client, fetchImpl } = detailClient();
  vi.spyOn(Date, "now").mockReturnValue(1_000);
  await loadCachedComicDetail(client, scope, "comic");
  vi.spyOn(Date, "now").mockReturnValue(31_001);
  const old = deferred<Response>();
  fetchImpl.mockReturnValueOnce(old.promise);
  const stale = loadCachedComicDetail(client, scope, "comic");
  invalidateComicDetails(client, scope, "comic");
  fetchImpl.mockImplementation((input) => Promise.resolve(detailResponse(input, "updated")));
  await loadCachedComicDetail(client, scope, "comic");
  old.resolve(detailResponse("/api/v1/comics/comic", "obsolete"));
  await stale;
  expect(peekComicDetail(client, scope, "comic")?.comicInfo.title).toBe("updated");
  expect(fetchImpl).toHaveBeenCalledTimes(6);
});

test("failed reads are retried and deletion removes only its owner partition", async () => {
  const { client, fetchImpl } = detailClient();
  fetchImpl.mockResolvedValueOnce(
    Response.json({ code: 1, message: "unavailable" }, { status: 503 }),
  );
  expect(await loadCachedComicDetail(client, scope, "comic")).toMatchObject({ success: false });
  expect(peekComicDetail(client, scope, "comic")).toBeUndefined();
  await loadCachedComicDetail(client, scope, "comic");
  await loadCachedComicDetail(client, { ...scope, teamId: "other-team" }, "comic");
  invalidateComicDetails(client, scope, "comic", true);
  expect(peekComicDetail(client, scope, "comic")).toBeUndefined();
  expect(peekComicDetail(client, { ...scope, teamId: "other-team" }, "comic")).toBeDefined();
  await loadCachedComicDetail(client, scope, "comic");
  expect(fetchImpl).toHaveBeenCalledTimes(8);
});

test("least recently used detail entries are bounded", async () => {
  const { client, fetchImpl } = detailClient();
  for (let index = 0; index < 33; index++) {
    await loadCachedComicDetail(client, scope, "comic-" + String(index));
  }
  expect(peekComicDetail(client, scope, "comic-0")).toBeUndefined();
  await loadCachedComicDetail(client, scope, "comic-32");
  expect(fetchImpl).toHaveBeenCalledTimes(66);
  await loadCachedComicDetail(client, scope, "comic-0");
  expect(fetchImpl).toHaveBeenCalledTimes(68);
});
