import { expect, test, vi } from "vitest";
import { createDraftDatabaseFixture } from "../test/draft-database-fixture";
import { limitDraftRows, type DraftRow } from "./draft-database";

function row(key: string, raw: string, touched = 0): DraftRow {
  return { key, raw, touched, scope: "scope", pageId: key };
}

test("evicting multiple pages encodes each record once and preserves surviving order", () => {
  const mib = 1024 * 1024;
  const rows = [
    row("recent", "x".repeat(mib), 3),
    row("older", "x".repeat(mib), 2),
    row("oldest", "x".repeat(mib), 1),
    row("current", "界".repeat(mib), 0),
  ];
  const encode = vi.spyOn(TextEncoder.prototype, "encode");
  const retained = limitDraftRows(rows, "current");
  expect(retained.map((entry) => entry.key)).toEqual(["recent", "current"]);
  expect(encode).toHaveBeenCalledTimes(rows.length);
  expect(rows.map((entry) => entry.key)).toEqual(["recent", "older", "oldest", "current"]);
  expect(retained[0]).toBe(rows[0]);
  expect(retained[1]).toBe(rows[3]);
});

test("a page transaction observes and modifies only the selected record", async () => {
  const database = createDraftDatabaseFixture();
  await database.transact(() => ({
    rows: [row("first", "first"), row("other", "other")],
    result: undefined,
  }));
  const seen = await database.transact(
    (rows) => ({ rows: [], result: rows.map((entry) => entry.key) }),
    "first",
  );
  expect(seen).toEqual(["first"]);
  const surviving = await database.transact((rows) => ({ rows, result: rows }));
  expect(surviving).toEqual([row("other", "other")]);
});
