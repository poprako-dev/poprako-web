import { describe, expect, test } from "vitest";
import {
  initialPaginationState,
  paginationReducer,
} from "./pagination";

type Item = { id: string; label: string };

describe("terminology pagination reducer", () => {
  test("loads the first page and appends unique items", () => {
    let state = paginationReducer<Item>(initialPaginationState(), {
      type: "reset",
      requestVersion: 1,
    });
    state = paginationReducer(state, {
      type: "resolve",
      requestVersion: 1,
      items: [
        { id: "1", label: "one" },
        { id: "2", label: "two" },
      ],
      pageSize: 2,
      append: false,
    });
    state = paginationReducer(state, {
      type: "load-more",
      requestVersion: 1,
    });
    state = paginationReducer(state, {
      type: "resolve",
      requestVersion: 1,
      items: [
        { id: "2", label: "two again" },
        { id: "3", label: "three" },
      ],
      pageSize: 2,
      append: true,
    });

    expect(state.items.map((item) => item.id)).toEqual(["1", "2", "3"]);
    expect(state.offset).toBe(4);
    expect(state.hasMore).toBe(true);
    expect(state.phase).toBe("ready");
  });

  test("resets results when the query or termbase changes", () => {
    const loaded = paginationReducer<Item>(
      paginationReducer(initialPaginationState(), {
        type: "reset",
        requestVersion: 1,
      }),
      {
        type: "resolve",
        requestVersion: 1,
        items: [{ id: "old", label: "old" }],
        pageSize: 30,
        append: false,
      },
    );

    const reset = paginationReducer(loaded, {
      type: "reset",
      requestVersion: 2,
    });

    expect(reset.items).toEqual([]);
    expect(reset.offset).toBe(0);
    expect(reset.phase).toBe("initial-loading");
    expect(reset.requestVersion).toBe(2);
  });

  test("ignores a late response from an older request version", () => {
    const reset = paginationReducer<Item>(initialPaginationState(), {
      type: "reset",
      requestVersion: 2,
    });
    const resolved = paginationReducer(reset, {
      type: "resolve",
      requestVersion: 1,
      items: [{ id: "stale", label: "stale" }],
      pageSize: 30,
      append: false,
    });

    expect(resolved).toBe(reset);
  });

  test("keeps loaded items when loading the next page fails", () => {
    const loaded = paginationReducer<Item>(
      paginationReducer(initialPaginationState(), {
        type: "reset",
        requestVersion: 1,
      }),
      {
        type: "resolve",
        requestVersion: 1,
        items: [{ id: "1", label: "one" }],
        pageSize: 1,
        append: false,
      },
    );
    const failed = paginationReducer(loaded, {
      type: "reject",
      requestVersion: 1,
      error: "timeout",
    });

    expect(failed.items).toEqual(loaded.items);
    expect(failed.error).toBe("timeout");
    expect(failed.phase).toBe("error");
  });
});
