import { expect, test } from "vitest";
import JSZip from "jszip";
import { packComicArchives } from "./archive-export";

test("the ZIP preserves each original archive under its month", async () => {
  const first = '{"comic_id":"a","title":"雨后的街角"}';
  const second = '{"comic_id":"b"}';
  const result = await packComicArchives(
    { "2026-09": [first, second], "2025-12": [first] },
    "team-1",
    new AbortController().signal,
  );
  expect(result?.count).toBe(3);
  if (!result) throw new Error("Expected an archive");
  const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
  expect(await zip.file("2026-09/0001.json")?.async("string")).toBe(first);
  expect(await zip.file("2026-09/0002.json")?.async("string")).toBe(second);
  expect(await zip.file("2025-12/0001.json")?.async("string")).toBe(first);
  expect(result.name).toMatch(/^team-1-归档-\d{4}-\d{2}-\d{2}\.zip$/u);
});

test("empty results do not create a download", async () => {
  expect(
    await packComicArchives({ "2026-09": [] }, "team", new AbortController().signal),
  ).toBeNull();
});

test("cancellation stops packing and invalid month paths are rejected", async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    packComicArchives({ "2026-09": ["{}"] }, "team", controller.signal),
  ).rejects.toThrow();
  await expect(
    packComicArchives({ "../other": ["{}"] }, "team", new AbortController().signal),
  ).rejects.toThrow("Invalid archive month");
});
