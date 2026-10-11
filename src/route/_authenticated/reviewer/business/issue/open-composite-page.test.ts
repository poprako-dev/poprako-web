import { afterEach, expect, test, vi } from "vitest";
import { openCompositePage } from "./open-composite-page";

afterEach(() => vi.unstubAllGlobals());

test("passes the artwork URL directly to PageImage without fetching or decoding a blob", async () => {
  const fetch = vi.fn();
  const image = vi.fn();
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("Image", image);
  const page = await openCompositePage(
    "https://artwork.test/page.webp",
    new AbortController().signal,
  );
  expect(page.composite.source).toBe("https://artwork.test/page.webp");
  expect(fetch).not.toHaveBeenCalled();
  expect(image).not.toHaveBeenCalled();
  await page.dispose();
});

test("does not publish a URL after navigation aborts its request", () => {
  const controller = new AbortController();
  controller.abort();
  expect(() => openCompositePage("/page.webp", controller.signal)).toThrow();
});
