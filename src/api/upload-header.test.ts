import { expect, test } from "vitest";
import { toHeadersInit } from "./upload-header";

test("converts named upload headers into a Headers instance", () => {
  const headers = toHeadersInit([
    { name: "content-type", value: "image/png" },
    { name: "content-length", value: "3" },
  ]);
  expect(headers.get("content-type")).toBe("image/png");
  expect(headers.get("content-length")).toBe("3");
});

test("accepts record and tuple header init forms", () => {
  expect(toHeadersInit({ "content-type": "image/png" }).get("content-type")).toBe("image/png");
  expect(toHeadersInit([["content-type", "image/png"]]).get("content-type")).toBe("image/png");
});

test("treats absent headers as empty", () => {
  expect([...toHeadersInit(undefined).keys()]).toEqual([]);
});
