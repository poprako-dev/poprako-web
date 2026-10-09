import { expect, test } from "vitest";
import { orderArtworkPages } from "./artwork-page-order";

test("matches PSDs in natural filename order independent of archive insertion order", () => {
  const entries = ["10.psd", "2.psd", "README.txt", "1.psd", "3.PSD"].map((filename) => ({
    filename,
    directory: false,
  }));
  entries.push({ filename: "0.psd", directory: true });
  expect(orderArtworkPages(entries, 4).map((entry) => entry.filename)).toEqual([
    "1.psd",
    "2.psd",
    "3.PSD",
    "10.psd",
  ]);
  expect(entries[0]?.filename).toBe("10.psd");
});

test("refuses to silently shift page ownership when PSD counts differ", () => {
  expect(() => orderArtworkPages([{ filename: "2.psd", directory: false }], 2)).toThrow(
    "无法对应预览",
  );
});
