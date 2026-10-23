import { expect, test, vi } from "vitest";
import type { Result } from "@/shared/utility/result";
import { PageUnitSource } from "./page-unit-source";
import type { ListPageUnitsResult } from "./translator-request";
import { undoUnit } from "../test/unit-undo-fixture";

type Response = Result<ListPageUnitsResult>;
type Request = { id: string; signal: AbortSignal; resolve: (value: Response) => void };

function page(text = "server"): Response {
  return {
    success: true,
    data: {
      units: [{ ...undoUnit("u", text), proofreadText: "proofread", translationNote: "note" }],
      totalUnitCount: 1,
      translatedUnitCount: 1,
      proofreadUnitCount: 0,
    },
  };
}

function fixture(): {
  source: PageUnitSource;
  requests: Request[];
  time: { now: number };
  finish: (index: number, result?: Response) => void;
} {
  const requests: Request[] = [];
  const time = { now: 0 };
  const source = new PageUnitSource(
    (id, signal) => new Promise((resolve) => requests.push({ id, signal, resolve })),
    () => time.now,
  );
  function finish(index: number, result = page()): void {
    const request = requests[index];
    if (!request) throw new Error("Missing request");
    request.resolve(result);
  }
  return { source, requests, time, finish };
}

test("current page finishes before at most two sequential adjacent requests", async () => {
  const { source, requests, finish } = fixture();
  const current = source.read("p2");
  source.prefetch(["p3", "p1", "p4"]);
  await vi.waitFor(() => {
    expect(requests.map((request) => request.id)).toEqual(["p2"]);
  });
  finish(0);
  await current;
  await vi.waitFor(() => {
    expect(requests.map((request) => request.id)).toEqual(["p2", "p3"]);
  });
  finish(1);
  await vi.waitFor(() => {
    expect(requests.map((request) => request.id)).toEqual(["p2", "p3", "p1"]);
  });
  finish(2);
  const units = await source.read("p1");
  expect(units).toEqual(page());
  expect(requests).toHaveLength(3);
});

test("navigation consumes and promotes an in-flight prefetch without aborting it", async () => {
  const { source, requests, finish } = fixture();
  source.prefetch(["p2", "p0"]);
  await vi.waitFor(() => {
    expect(requests).toHaveLength(1);
  });
  const first = source.read("p2");
  const duplicate = source.read("p2");
  expect(first).toBe(duplicate);
  source.prefetch(["p3", "p1"]);
  expect(requests[0]?.signal.aborted).toBe(false);
  finish(0);
  expect(await first).toEqual(page());
  await vi.waitFor(() => {
    expect(requests.map((request) => request.id)).toEqual(["p2", "p3"]);
  });
  source.clear();
});

test("foreground navigation cancels unrelated prefetch and discards its late response", async () => {
  const { source, requests, finish } = fixture();
  source.prefetch(["p2", "p0"]);
  await vi.waitFor(() => {
    expect(requests).toHaveLength(1);
  });
  const current = source.read("p9");
  await vi.waitFor(() => {
    expect(requests).toHaveLength(2);
  });
  expect(requests[0]?.signal.aborted).toBe(true);
  finish(0, page("obsolete"));
  finish(1);
  await current;
  const revisit = source.read("p2");
  await vi.waitFor(() => {
    expect(requests.map((request) => request.id)).toEqual(["p2", "p9", "p2"]);
  });
  finish(2, page("new"));
  expect(await revisit).toEqual(page("new"));
});

test("prefetch is consumed once and expires after five seconds", async () => {
  const { source, requests, time, finish } = fixture();
  source.prefetch(["p2"]);
  await vi.waitFor(() => {
    expect(requests).toHaveLength(1);
  });
  finish(0);
  await vi.waitFor(async () => {
    expect(await source.read("p2")).toEqual(page());
  });
  const revisit = source.read("p2");
  await vi.waitFor(() => {
    expect(requests).toHaveLength(2);
  });
  finish(1);
  await revisit;
  source.prefetch(["p3"]);
  await vi.waitFor(() => {
    expect(requests).toHaveLength(3);
  });
  finish(2);
  await Promise.resolve();
  time.now = 5_001;
  const expired = source.read("p3");
  await vi.waitFor(() => {
    expect(requests).toHaveLength(4);
  });
  finish(3, page("updated"));
  expect(await expired).toEqual(page("updated"));
});

test("explicit reload replaces a prefetched response even inside its TTL", async () => {
  const { source, requests, finish } = fixture();
  source.prefetch(["p2"]);
  await vi.waitFor(() => {
    expect(requests).toHaveLength(1);
  });
  const fresh = source.read("p2", true);
  await vi.waitFor(() => {
    expect(requests).toHaveLength(2);
  });
  expect(requests[0]?.signal.aborted).toBe(true);
  finish(0, page("old"));
  finish(1, page("authoritative"));
  expect(await fresh).toEqual(page("authoritative"));
});

test("completed prefetch is bypassed by refresh and evicted outside the neighbor window", async () => {
  const { source, requests, finish } = fixture();
  source.prefetch(["p2"]);
  await vi.waitFor(() => {
    expect(requests).toHaveLength(1);
  });
  finish(0);
  await Promise.resolve();
  const fresh = source.read("p2", true);
  await vi.waitFor(() => {
    expect(requests).toHaveLength(2);
  });
  finish(1, page("fresh"));
  expect(await fresh).toEqual(page("fresh"));
  source.prefetch(["p1"]);
  await vi.waitFor(() => {
    expect(requests).toHaveLength(3);
  });
  finish(2);
  await Promise.resolve();
  source.prefetch(["p4", "p6"]);
  const previous = source.read("p1");
  await vi.waitFor(() => {
    expect(requests.at(-1)?.id).toBe("p1");
  });
  finish(requests.length - 1, page("revisited"));
  expect(await previous).toEqual(page("revisited"));
});

test("simultaneous authoritative reloads share one GET until a mutation invalidates it", async () => {
  const { source, requests, finish } = fixture();
  const first = source.read("p2", true);
  const duplicate = source.read("p2", true);
  expect(first).toBe(duplicate);
  await vi.waitFor(() => {
    expect(requests).toHaveLength(1);
  });
  await source.mutate("p2", () => Promise.resolve());
  const afterWrite = source.read("p2", true);
  await vi.waitFor(() => {
    expect(requests).toHaveLength(2);
  });
  finish(0, page("old"));
  finish(1, page("new"));
  expect(await first).toMatchObject({ success: false, failureKind: "aborted" });
  expect(await afterWrite).toEqual(page("new"));
});

test("writes block prefetch and invalidate late reads before and after completion", async () => {
  const { source, requests, finish } = fixture();
  source.prefetch(["p2"]);
  await vi.waitFor(() => {
    expect(requests).toHaveLength(1);
  });
  let complete = (): void => undefined;
  const writing = source.mutate(
    "p2",
    () =>
      new Promise<void>((resolve) => {
        complete = resolve;
      }),
  );
  source.prefetch(["p2", "p3"]);
  finish(0, page("old"));
  await Promise.resolve();
  expect(requests).toHaveLength(1);
  const duringWrite = source.read("p2");
  await vi.waitFor(() => {
    expect(requests).toHaveLength(2);
  });
  complete();
  await writing;
  expect(requests[1]?.signal.aborted).toBe(true);
  finish(1, page("before commit"));
  expect(await duringWrite).toMatchObject({ success: false, failureKind: "aborted" });
  const authoritative = source.read("p2", true);
  await vi.waitFor(() => {
    expect(requests).toHaveLength(3);
  });
  finish(2, page("committed"));
  expect(await authoritative).toEqual(page("committed"));
});

test("a failed background request is retried on demand and clear prevents stale reuse", async () => {
  const { source, requests, finish } = fixture();
  source.prefetch(["p2"]);
  await vi.waitFor(() => {
    expect(requests).toHaveLength(1);
  });
  finish(0, { success: false, error: "offline" });
  await Promise.resolve();
  const retry = source.read("p2");
  await vi.waitFor(() => {
    expect(requests).toHaveLength(2);
  });
  source.clear();
  finish(1);
  expect(await retry).toMatchObject({ success: false, failureKind: "aborted" });
});

test("clearing before the request microtask reports cancellation without calling the loader", async () => {
  const load = vi.fn(() => Promise.resolve(page()));
  const source = new PageUnitSource(load);
  const pending = source.read("p1");
  source.clear();
  expect(await pending).toMatchObject({ success: false, failureKind: "aborted" });
  expect(load).not.toHaveBeenCalled();
});

test("a loader that throws AbortError preserves the cancellation classification", async () => {
  const source = new PageUnitSource(() =>
    Promise.reject(new DOMException("Aborted", "AbortError")),
  );
  expect(await source.read("p1")).toMatchObject({ success: false, failureKind: "aborted" });
});
