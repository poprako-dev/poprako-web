import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { TerminologyLookupBar } from "./TerminologyLookupBar";
import {
  comicTermbase,
  createExportDataSource,
} from "@/route/_authenticated/business/terminology/termbase-export-test-fixture";
import type { ExportDataSource } from "@/route/_authenticated/business/terminology/termbase-export-test-fixture";
import {
  createImportFile,
  importContent,
  importedTermbase,
} from "@/route/_authenticated/business/terminology/termbase-import-test-fixture";

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      disconnect = vi.fn();
    },
  );
  useToastStore.setState({ showToast: vi.fn() });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => vi.unstubAllGlobals());

type ImportHarness = {
  dataSource: ExportDataSource;
  user: ReturnType<typeof userEvent.setup>;
  input: HTMLInputElement;
};

async function setupImport(selectCurrent = false): Promise<ImportHarness> {
  const dataSource = createExportDataSource();
  render(
    <TerminologyLookupBar
      dataSource={dataSource}
      termbaseExport={{ exportingIds: new Set(), exportTermbase: vi.fn() }}
    />,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "选择术语库" }));
  if (selectCurrent) {
    await user.click(await screen.findByRole("button", { name: /角色称谓/ }));
    await user.click(screen.getByRole("button", { name: "切换术语库，当前为 角色称谓" }));
  }
  await user.click(await screen.findByRole("button", { name: "新建术语库" }));
  const input = screen.getByLabelText<HTMLInputElement>("选择术语库 JSON 文件");
  return { dataSource, user, input };
}

test("uses file content, refreshes the list and clears search without changing selection", async () => {
  const { dataSource, user, input } = await setupImport(true);
  fireEvent.change(screen.getByLabelText("搜索术语库名称"), { target: { value: "角色" } });
  await user.type(screen.getByRole("textbox", { name: "名称" }), "不应使用的名称");
  await user.type(screen.getByRole("textbox", { name: "描述" }), "不应使用的描述");
  dataSource.importTermbase.mockResolvedValue({ success: true, data: importedTermbase });
  dataSource.listTermbases.mockResolvedValue({
    success: true,
    data: [
      comicTermbase,
      { ...comicTermbase, id: importedTermbase.id, name: "文件中的名称", termCount: 1 },
    ],
  });
  await user.upload(input, createImportFile().file);
  await waitFor(() => {
    expect(screen.queryByRole("dialog", { name: "新建术语库" })).toBeNull();
  });
  expect(dataSource.importTermbase).toHaveBeenCalledExactlyOnceWith(importContent);
  expect(dataSource.createTermbase).not.toHaveBeenCalled();
  expect(screen.getByRole("textbox", { name: "搜索术语库名称" })).toHaveValue("");
  expect(await screen.findByRole("button", { name: /文件中的名称/ })).toBeVisible();
  expect(screen.getByRole("button", { name: "切换术语库，当前为 角色称谓" })).toBeVisible();
  expect(useToastStore.getState().showToast).toHaveBeenCalledWith("术语库已导入", "success");
});

test("keeps the form on duplicate-name failure and allows the same file to be retried", async () => {
  const { dataSource, user, input } = await setupImport();
  dataSource.importTermbase.mockResolvedValueOnce({
    success: false,
    httpStatus: 422,
    error: "术语库名称已存在",
  });
  await user.type(screen.getByRole("textbox", { name: "名称" }), "未保存的名称");
  await user.type(screen.getByRole("textbox", { name: "描述" }), "未保存的描述");
  const { file } = createImportFile();
  await user.upload(input, file);
  await waitFor(() => expect(screen.getByRole("button", { name: "导入" })).toBeEnabled());
  expect(screen.getByRole("textbox", { name: "名称" })).toHaveValue("未保存的名称");
  expect(screen.getByRole("textbox", { name: "描述" })).toHaveValue("未保存的描述");
  expect(useToastStore.getState().showToast).toHaveBeenCalledWith("术语库名称已存在", "error");
  expect(dataSource.importTermbase).toHaveBeenCalledOnce();
  dataSource.importTermbase.mockResolvedValue({ success: true, data: importedTermbase });
  await user.upload(input, file);
  await waitFor(() => {
    expect(screen.queryByRole("dialog", { name: "新建术语库" })).toBeNull();
  });
  expect(dataSource.importTermbase).toHaveBeenCalledTimes(2);
});

test("rejects non-JSON extensions even when the file has a JSON MIME type", async () => {
  const { dataSource, input } = await setupImport();
  const { file, read } = createImportFile("terms.txt");
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect(screen.getByRole("button", { name: "导入" })).toBeEnabled());
  expect(read).not.toHaveBeenCalled();
  expect(dataSource.importTermbase).not.toHaveBeenCalled();
  expect(useToastStore.getState().showToast).toHaveBeenCalledWith("仅支持 .json 文件", "error");
});

test("locks from the start of file reading and recovers from a read failure", async () => {
  const { dataSource, user, input } = await setupImport();
  let rejectRead: (error: Error) => void = () => undefined;
  const reading = new Promise<string>((_resolve, reject) => {
    rejectRead = reject;
  });
  const { file, read } = createImportFile();
  read.mockReturnValue(reading);
  await user.upload(input, file);
  expect(screen.getByRole("button", { name: "导入" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "关闭" })).toBeDisabled();
  expect(dataSource.importTermbase).not.toHaveBeenCalled();
  await act(async () => {
    rejectRead(new Error("read failed"));
    await reading.catch(() => undefined);
  });
  expect(screen.getByRole("button", { name: "导入" })).toBeEnabled();
  expect(screen.getByRole("dialog", { name: "新建术语库" })).toBeVisible();
  expect(useToastStore.getState().showToast).toHaveBeenCalledWith("导入术语库失败", "error");
  read.mockResolvedValue(importContent);
  dataSource.importTermbase.mockResolvedValue({ success: true, data: importedTermbase });
  await user.upload(input, file);
  await waitFor(() => {
    expect(screen.queryByRole("dialog", { name: "新建术语库" })).toBeNull();
  });
});

test("restores the dialog after an unexpected request rejection", async () => {
  const { dataSource, user, input } = await setupImport();
  dataSource.importTermbase.mockRejectedValue(new Error("unexpected"));
  await user.upload(input, createImportFile("terms.JSON").file);
  await waitFor(() => expect(screen.getByRole("button", { name: "导入" })).toBeEnabled());
  expect(screen.getByRole("dialog", { name: "新建术语库" })).toBeVisible();
  expect(useToastStore.getState().showToast).toHaveBeenCalledWith("导入术语库失败", "error");
});
