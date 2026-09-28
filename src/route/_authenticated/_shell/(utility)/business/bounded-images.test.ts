import { expect, test } from "vitest";
import {
  imageLimit,
  limitBytes,
  sortImages,
  validateImages,
  webpName,
} from "@/route/_authenticated/_shell/(utility)/business/bounded-images";

function item(
  name: string,
  limitKiB: string | null = null,
): { id: string; file: File; limitKiB: string | null } {
  return { id: name, file: new File([], name), limitKiB };
}

test("natural filename order chooses the cover regardless of selection order", () => {
  const sorted = sortImages([item("10.png"), item("2.png"), item("1.png")]);
  expect(sorted.map((entry) => entry.file.name)).toEqual(["1.png", "2.png", "10.png"]);
  expect(sorted.map((entry, index) => imageLimit(entry, index, "1024", "512"))).toEqual([
    "512",
    "1024",
    "1024",
  ]);
  expect(sortImages([item("page10.png"), item("Page2.png")])[0]?.file.name).toBe("Page2.png");
});

test("custom limits survive changes to defaults and cover position", () => {
  const custom = item("2.png", "256");
  expect(imageLimit(custom, 0, "2048", "128")).toBe("256");
  expect(imageLimit(custom, 1, "2048", "128")).toBe("256");
  expect(imageLimit({ ...custom, limitKiB: null }, 0, "2048", "128")).toBe("128");
});

test("binary size limits reject invalid and unsafe values", () => {
  expect(limitBytes("1024")).toBe(1024 ** 2);
  expect(limitBytes("512")).toBe(512 * 1024);
  for (const value of ["", "0", "-1", "Infinity", "abc", "0.1", "1e30"]) {
    expect(limitBytes(value)).toBeNull();
  }
});

test("WebP output names cannot collide or escape the archive", () => {
  expect(webpName("page.01.PNG")).toBe("page.01.webp");
  expect(validateImages([item("1.jpg"), item("1.png")])).toContain("同名文件");
  expect(validateImages([item("É.png"), item("e\u{0301}.jpg")])).toContain("同名文件");
  expect(validateImages([item("../1.png")])).toContain("不支持的字符");
  expect(validateImages([item("1.gif")])).toContain("不支持的图片");
  expect(validateImages([item("1.png"), item("2.webp")])).toBeNull();
});
