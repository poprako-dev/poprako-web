import { afterEach, expect, test, vi } from "vitest";
import type { Mock, MockInstance } from "vitest";
import { downloadTermbase } from "./termbase-download";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

type DownloadHarness = {
  link: { href: string; download: string; click: Mock; remove: Mock };
  append: Mock;
  createUrl: MockInstance<typeof URL.createObjectURL>;
  revokeUrl: MockInstance<typeof URL.revokeObjectURL>;
};

function mockDownload(): DownloadHarness {
  vi.useFakeTimers();
  const link = { href: "", download: "", click: vi.fn(), remove: vi.fn() };
  const append = vi.fn();
  vi.stubGlobal("document", { createElement: () => link, body: { append } });
  const createUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:termbase");
  const revokeUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  return { link, append, createUrl, revokeUrl };
}

test("saves the exact JSON with a matching filename and releases the URL after clicking", async () => {
  const { link, append, createUrl, revokeUrl } = mockDownload();
  const content = '{"name":"角色", "terms":[{"source":"団長","targets":["团长","队长"]}]}\n';
  downloadTermbase(content);
  const blob = createUrl.mock.calls[0]?.[0];
  expect(blob).toBeInstanceOf(Blob);
  expect((blob as Blob).type).toBe("application/json;charset=utf-8");
  expect(await (blob as Blob).text()).toBe(content);
  expect(link.download).toBe("角色.json");
  expect(link.href).toBe("blob:termbase");
  expect(append).toHaveBeenCalledExactlyOnceWith(link);
  expect(link.click).toHaveBeenCalledOnce();
  expect(link.remove).toHaveBeenCalledOnce();
  expect(revokeUrl).not.toHaveBeenCalled();
  vi.runAllTimers();
  expect(revokeUrl).toHaveBeenCalledExactlyOnceWith("blob:termbase");
});

test("cleans up the link and URL even when triggering the download throws", () => {
  const { link, revokeUrl } = mockDownload();
  link.click.mockImplementation(() => {
    throw new Error("download failed");
  });
  expect(() => {
    downloadTermbase('{"name":"角色","terms":[]}');
  }).toThrow("download failed");
  expect(link.remove).toHaveBeenCalledOnce();
  vi.runAllTimers();
  expect(revokeUrl).toHaveBeenCalledExactlyOnceWith("blob:termbase");
});
