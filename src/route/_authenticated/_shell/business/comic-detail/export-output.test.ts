import JSZip from "jszip";
import { afterEach, expect, test, vi } from "vitest";
import { createDirectoryFixture } from "./export-directory-fixture";
import { createExportOutput, selectExportDirectory } from "./export-output";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("writes files under a new chapter directory without replacing existing exports", async () => {
  const fixture = createDirectoryFixture();
  fixture.directories.add("chapter");
  fixture.files.set("chapter/translation.lp.txt", "previous export");
  fixture.files.set("chapter (2)", "existing file");
  const progress = vi.fn();
  const output = await createExportOutput(
    fixture.handle,
    "chapter",
    new AbortController().signal,
    progress,
  );
  const image = new Blob(["image"], { type: "image/png" });
  await output.write("translation.lp.txt", "new translation");
  await output.write("images/000.png", image);
  await output.finish();
  expect(fixture.files.get("chapter/translation.lp.txt")).toBe("previous export");
  expect(fixture.files.get("chapter (2)")).toBe("existing file");
  expect(fixture.files.get("chapter (3)/translation.lp.txt")).toBe("new translation");
  expect(fixture.files.get("chapter (3)/images/000.png")).toBe(image);
  expect(progress).toHaveBeenLastCalledWith("下载完成", "文件已保存。", 100);
});

test("cancelling a write aborts its stream and prevents further writes", async () => {
  const fixture = createDirectoryFixture();
  const controller = new AbortController();
  const output = await createExportOutput(fixture.handle, "chapter", controller.signal, vi.fn());
  fixture.write.mockImplementationOnce(() => {
    controller.abort();
    return Promise.resolve();
  });
  await expect(output.write("data.txt", "data")).rejects.toMatchObject({ name: "AbortError" });
  expect(fixture.abort).toHaveBeenCalledOnce();
  expect(fixture.close).not.toHaveBeenCalled();
  await expect(output.write("next.txt", "data")).rejects.toMatchObject({ name: "AbortError" });
  expect(fixture.write).toHaveBeenCalledOnce();
  expect(fixture.files.size).toBe(0);
});

test("a disk failure aborts the stream and never reports completion", async () => {
  const fixture = createDirectoryFixture();
  const failure = new DOMException("Disk full", "QuotaExceededError");
  fixture.write.mockRejectedValueOnce(failure);
  const progress = vi.fn();
  const output = await createExportOutput(
    fixture.handle,
    "chapter",
    new AbortController().signal,
    progress,
  );
  await expect(output.write("data.txt", "data")).rejects.toBe(failure);
  expect(fixture.abort).toHaveBeenCalledOnce();
  expect(fixture.close).not.toHaveBeenCalled();
  expect(progress).not.toHaveBeenCalled();
});

test("picker cancellation and permission errors are propagated instead of triggering ZIP downloads", async () => {
  const picker = vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError"));
  vi.stubGlobal("window", { showDirectoryPicker: picker });
  const selection = selectExportDirectory();
  expect(picker).toHaveBeenCalledWith({ id: "chapter-export", mode: "readwrite" });
  await expect(selection).rejects.toMatchObject({ name: "AbortError" });
  picker.mockRejectedValueOnce(new DOMException("Denied", "NotAllowedError"));
  await expect(selectExportDirectory()).rejects.toMatchObject({ name: "NotAllowedError" });
});

test("unsupported browsers download a ZIP containing the same directory structure", async () => {
  vi.stubGlobal("window", {});
  const link = { href: "", download: "", click: vi.fn(), remove: vi.fn() };
  vi.stubGlobal("document", { createElement: () => link, body: { append: vi.fn() } });
  const createUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:export");
  const revokeUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  expect(await selectExportDirectory()).toBeNull();
  const progress = vi.fn();
  const output = await createExportOutput(null, "chapter", new AbortController().signal, progress);
  await output.write("translation.lp.txt", "translation");
  await output.write("images/000.png", "image bytes");
  await output.finish();
  const blob = createUrl.mock.calls[0]?.[0];
  expect(blob).toBeInstanceOf(Blob);
  const zip = await JSZip.loadAsync(await (blob as Blob).arrayBuffer());
  expect(await zip.file("translation.lp.txt")?.async("string")).toBe("translation");
  expect(await zip.file("images/000.png")?.async("string")).toBe("image bytes");
  expect(link.download).toBe("chapter.zip");
  expect(link.click).toHaveBeenCalledOnce();
  expect(revokeUrl).toHaveBeenCalledWith("blob:export");
  expect(progress).toHaveBeenLastCalledWith("下载完成", "文件已开始下载。", 100);
});
