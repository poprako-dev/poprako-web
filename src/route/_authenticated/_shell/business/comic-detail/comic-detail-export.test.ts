import { afterEach, expect, test, vi } from "vitest";
import { performComicDetailExport } from "./comic-detail-export";
import {
  createExportContext,
  createExportData,
  readExportJson,
} from "./comic-detail-export-fixture";
import { createDirectoryFixture } from "./export-directory-fixture";

const BASE_NAME = "【#1-1】[作者]漫画（第一话）";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test("chooses the directory during the click before requesting data and writes images plus translation", async () => {
  const fixture = createDirectoryFixture();
  const context = createExportContext();
  const picker = vi.fn().mockResolvedValue(fixture.handle);
  vi.stubGlobal("window", { showDirectoryPicker: picker });
  const exported = performComicDetailExport(context, { includeImages: true, withRawIdent: true });
  expect(picker).toHaveBeenCalledOnce();
  expect(context.onExportChapter).not.toHaveBeenCalled();
  await exported;
  expect(context.onExportChapter).toHaveBeenCalledWith("chapter", {
    signal: context.signal,
    withRawIdent: true,
  });
  expect([...fixture.files.keys()].sort()).toEqual([
    `${BASE_NAME}/assignments.txt`,
    `${BASE_NAME}/images/原图.png`,
    `${BASE_NAME}/translation.lp.txt`,
    `${BASE_NAME}/translation.prk.json`,
  ]);
  expect(fixture.files.get(`${BASE_NAME}/translation.lp.txt`)).toBe("LP translation");
  expect(await (fixture.files.get(`${BASE_NAME}/images/原图.png`) as Blob).text()).toBe("image");
  const data = readExportJson(fixture.files, `${BASE_NAME}/translation.prk.json`);
  expect(data.pages[0]).toMatchObject({
    exportedImagePath: "images/原图.png",
    units: [{ translatedText: "译文" }],
  });
  expect(data.pages[0]).not.toHaveProperty("sourceImageUrl");
  expect(data.skippedImageCount).toBe(0);
  expect(context.showToast).toHaveBeenLastCalledWith(
    expect.stringContaining("章节文件夹"),
    "success",
  );
});

test("translation-only exports keep all three text files and do not download images", async () => {
  const fixture = createDirectoryFixture();
  vi.stubGlobal("window", { showDirectoryPicker: vi.fn().mockResolvedValue(fixture.handle) });
  const context = createExportContext();
  const download = vi.spyOn(context.client, "download");
  await performComicDetailExport(context, { includeImages: false });
  expect(download).not.toHaveBeenCalled();
  expect([...fixture.files.keys()].sort()).toEqual([
    `${BASE_NAME}-翻校数据/assignments.txt`,
    `${BASE_NAME}-翻校数据/translation.lp.txt`,
    `${BASE_NAME}-翻校数据/translation.prk.json`,
  ]);
  const data = readExportJson(fixture.files, `${BASE_NAME}-翻校数据/translation.prk.json`);
  expect(data.pages).toEqual(createExportData().poprako.pages);
  expect(context.onWorkflowRecordsChanged).toHaveBeenCalledOnce();
});

test("cancelling the picker never requests an export or creates a directory", async () => {
  vi.stubGlobal("window", {
    showDirectoryPicker: vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError")),
  });
  const context = createExportContext();
  await expect(performComicDetailExport(context, {})).rejects.toMatchObject({ name: "AbortError" });
  expect(context.onExportChapter).not.toHaveBeenCalled();
  expect(context.showToast).not.toHaveBeenCalled();
});

test("failed image downloads are recorded without blocking the text export", async () => {
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const fixture = createDirectoryFixture();
  vi.stubGlobal("window", { showDirectoryPicker: vi.fn().mockResolvedValue(fixture.handle) });
  const context = createExportContext();
  vi.spyOn(context.client, "download").mockResolvedValue({ success: false, error: "offline" });
  const exported = performComicDetailExport(context, { includeImages: true });
  await vi.runAllTimersAsync();
  await exported;
  const data = readExportJson(fixture.files, `${BASE_NAME}/translation.prk.json`);
  expect(data.skippedImageCount).toBe(1);
  expect(data.pages[0]?.exportedImagePath).toBeNull();
  expect(fixture.files.size).toBe(3);
  expect(context.showToast).toHaveBeenLastCalledWith(expect.stringContaining("1 张图片"), "error");
});

test("write failures reject the export without a success toast", async () => {
  const fixture = createDirectoryFixture();
  vi.stubGlobal("window", { showDirectoryPicker: vi.fn().mockResolvedValue(fixture.handle) });
  const failure = new DOMException("No permission", "NotAllowedError");
  fixture.write.mockRejectedValueOnce(failure);
  const context = createExportContext();
  await expect(performComicDetailExport(context, { includeImages: true })).rejects.toBe(failure);
  expect(context.showToast).not.toHaveBeenCalled();
  expect(fixture.files.size).toBe(0);
});
