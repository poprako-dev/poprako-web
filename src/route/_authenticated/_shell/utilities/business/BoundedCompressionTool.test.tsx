import type { ComponentProps, ReactElement } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import type { ArchiveResult } from "./archive";
import type { prepareBoundedArchive } from "./bounded-compression";
import * as boundedActions from "./bounded-compression-actions";
import * as boundedImages from "./bounded-images";
import { BoundedCompressionTool } from "./BoundedCompressionTool";
import type * as ImageSizeInputModule from "./ImageSizeInput";

const { prepare, renderInput } = vi.hoisted(() => ({
  prepare: vi.fn<typeof prepareBoundedArchive>(),
  renderInput: vi.fn<(label: string) => void>(),
}));

vi.mock("./bounded-compression", () => ({ prepareBoundedArchive: prepare }));
vi.mock("./ImageSizeInput", async (importOriginal) => {
  const original = await importOriginal<typeof ImageSizeInputModule>();
  function ImageSizeInput(props: ComponentProps<typeof original.ImageSizeInput>): ReactElement {
    renderInput(props.label);
    return <original.ImageSizeInput {...props} />;
  }
  return { ImageSizeInput };
});

type PendingArchive = {
  promise: Promise<ArchiveResult>;
  resolve: (archive: ArchiveResult) => void;
  reject: (error: unknown) => void;
};

function pendingArchive(): PendingArchive {
  let resolve: (archive: ArchiveResult) => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<ArchiveResult>((complete, fail) => {
    resolve = complete;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function archiveResult(): ArchiveResult {
  return {
    file: new File(["zip"], "定界压缩.zip"),
    url: "blob:bounded-result",
    dispose: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  };
}

function addImages(count = 100): void {
  fireEvent.change(screen.getByLabelText("选择待压缩图片"), {
    target: {
      files: Array.from(
        { length: count },
        (_, index) => new File(["image"], `${String(index + 1)}.png`),
      ),
    },
  });
}

function changeLimit(name: string, value: string): void {
  fireEvent.change(screen.getByRole("spinbutton", { name }), { target: { value } });
}

function renderedRows(): string[] {
  return renderInput.mock.calls
    .map(([label]) => label)
    .filter((label) => label.endsWith("压缩上限"));
}

async function startCompression(): Promise<void> {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "开始压缩" }));
    await Promise.resolve();
  });
}

beforeEach(() => {
  prepare.mockReset();
});

test("100 image rows and input validation stay idle during independent progress updates", async () => {
  const pending = pendingArchive();
  prepare.mockReturnValue(pending.promise);
  const validate = vi.spyOn(boundedActions, "isBoundedInputValid");
  const imageLimit = vi.spyOn(boundedImages, "imageLimit");
  render(<BoundedCompressionTool />);
  addImages();
  expect(screen.getAllByRole("listitem")).toHaveLength(100);
  fireEvent.click(screen.getByRole("button", { name: "开始压缩" }));
  expect(renderedRows()).toHaveLength(200);
  expect(screen.getByRole("status")).toHaveTextContent("已处理 0 / 100 张");
  renderInput.mockClear();
  validate.mockClear();
  imageLimit.mockClear();
  const onProgress = prepare.mock.calls[0]?.[4];
  expect(onProgress).toBeTypeOf("function");
  for (const completed of [1, 2, 50, 100]) {
    act(() => onProgress?.(completed));
    expect(screen.getByRole("status")).toHaveTextContent(`已处理 ${String(completed)} / 100 张`);
  }
  expect(renderedRows()).toEqual([]);
  expect(imageLimit).not.toHaveBeenCalled();
  expect(validate).not.toHaveBeenCalled();
  const archive = archiveResult();
  await act(async () => {
    pending.resolve(archive);
    await pending.promise;
  });
  expect(screen.getByRole("link", { name: "下载 ZIP" })).toHaveAttribute("href", archive.url);
  expect(screen.getByRole("status")).toHaveTextContent("压缩完成");
});

test("changing and resetting a single image only renders its own row", () => {
  render(<BoundedCompressionTool />);
  addImages();
  renderInput.mockClear();
  changeLimit("50.png 压缩上限", "256");
  expect(renderedRows()).toEqual(["50.png 压缩上限"]);
  expect(screen.getByRole("spinbutton", { name: "50.png 压缩上限" })).toHaveValue(256);
  renderInput.mockClear();
  fireEvent.click(screen.getByRole("button", { name: "恢复 50.png 默认上限" }));
  expect(renderedRows()).toEqual(["50.png 压缩上限"]);
  expect(screen.getByRole("spinbutton", { name: "50.png 压缩上限" })).toHaveValue(1024);
  expect(screen.getByRole("button", { name: "恢复 50.png 默认上限" })).toBeDisabled();
});

test("batched edits use the latest item collection without losing either limit", () => {
  render(<BoundedCompressionTool />);
  addImages(3);
  renderInput.mockClear();
  act(() => {
    changeLimit("2.png 压缩上限", "128");
    changeLimit("3.png 压缩上限", "256");
  });
  expect(screen.getByRole("spinbutton", { name: "2.png 压缩上限" })).toHaveValue(128);
  expect(screen.getByRole("spinbutton", { name: "3.png 压缩上限" })).toHaveValue(256);
  expect(renderedRows()).toEqual(["2.png 压缩上限", "3.png 压缩上限"]);
});

test("defaults, custom limits and invalid input keep their existing behavior", () => {
  render(<BoundedCompressionTool />);
  addImages(3);
  changeLimit("2.png 压缩上限", "256");
  renderInput.mockClear();
  changeLimit("默认正文大小", "2048");
  expect(renderedRows()).toEqual(["3.png 压缩上限"]);
  expect(screen.getByRole("spinbutton", { name: "1.png 压缩上限" })).toHaveValue(512);
  expect(screen.getByRole("spinbutton", { name: "2.png 压缩上限" })).toHaveValue(256);
  changeLimit("默认封面大小", "128");
  expect(screen.getByRole("spinbutton", { name: "1.png 压缩上限" })).toHaveValue(128);
  changeLimit("3.png 压缩上限", "0");
  expect(screen.getByRole("button", { name: "开始压缩" })).toBeDisabled();
  expect(screen.getByRole("spinbutton", { name: "3.png 压缩上限" })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "恢复 3.png 默认上限" }));
  expect(screen.getByRole("button", { name: "开始压缩" })).toBeEnabled();
  changeLimit("默认正文大小", "");
  expect(screen.getByRole("button", { name: "开始压缩" })).toBeDisabled();
});

test("removing the naturally sorted cover preserves custom limits and promotes the next image", () => {
  render(<BoundedCompressionTool />);
  addImages(12);
  expect(
    screen.getAllByRole("listitem").map((row) => within(row).getByTitle(/\.png$/).textContent),
  ).toEqual(Array.from({ length: 12 }, (_, index) => `${String(index + 1)}.png`));
  changeLimit("3.png 压缩上限", "256");
  renderInput.mockClear();
  fireEvent.click(screen.getByRole("button", { name: "移除 1.png" }));
  expect(renderedRows()).toEqual(["2.png 压缩上限"]);
  expect(screen.queryByRole("spinbutton", { name: "1.png 压缩上限" })).not.toBeInTheDocument();
  expect(screen.getByRole("spinbutton", { name: "2.png 压缩上限" })).toHaveValue(512);
  expect(screen.getByRole("spinbutton", { name: "3.png 压缩上限" })).toHaveValue(256);
  expect(screen.getByText("封面").closest("li")).toHaveTextContent("2.png");
});

test("cancel keeps inputs locked until settlement and retry uses the same selected limits", async () => {
  const pending = pendingArchive();
  prepare.mockReturnValue(pending.promise);
  render(<BoundedCompressionTool />);
  addImages(2);
  changeLimit("2.png 压缩上限", "256");
  fireEvent.click(screen.getByRole("button", { name: "开始压缩" }));
  expect(screen.getByRole("spinbutton", { name: "2.png 压缩上限" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "移除 1.png" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "取消处理" }));
  expect(prepare.mock.calls[0]?.[3].aborted).toBe(true);
  expect(screen.getByRole("spinbutton", { name: "默认正文大小" })).toBeDisabled();
  await act(async () => {
    pending.reject(new DOMException("cancelled", "AbortError"));
    await pending.promise.catch(() => undefined);
  });
  expect(screen.getByRole("status")).toHaveTextContent("已取消，可重新开始");
  const archive = archiveResult();
  prepare.mockResolvedValue(archive);
  await startCompression();
  expect(prepare).toHaveBeenCalledTimes(2);
  expect(prepare.mock.calls[1]?.[0].map((item) => item.limitKiB)).toEqual([null, "256"]);
  expect(prepare.mock.calls[1]?.slice(1, 3)).toEqual(["1024", "512"]);
  expect(screen.getByRole("link", { name: "下载 ZIP" })).toBeVisible();
});

test("an item edit and unmount dispose completed archives", async () => {
  const first = archiveResult();
  const second = archiveResult();
  prepare.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
  const view = render(<BoundedCompressionTool />);
  addImages(2);
  await startCompression();
  changeLimit("2.png 压缩上限", "128");
  expect(first.dispose).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("link", { name: "下载 ZIP" })).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  await startCompression();
  view.unmount();
  expect(second.dispose).toHaveBeenCalledTimes(1);
});

test("unmount aborts compression and disposes a result returned after cancellation", async () => {
  const pending = pendingArchive();
  const archive = archiveResult();
  prepare.mockReturnValue(pending.promise);
  const view = render(<BoundedCompressionTool />);
  addImages(1);
  fireEvent.click(screen.getByRole("button", { name: "开始压缩" }));
  view.unmount();
  expect(prepare.mock.calls[0]?.[3].aborted).toBe(true);
  await act(async () => {
    pending.resolve(archive);
    await pending.promise;
  });
  expect(archive.dispose).toHaveBeenCalledTimes(1);
});
