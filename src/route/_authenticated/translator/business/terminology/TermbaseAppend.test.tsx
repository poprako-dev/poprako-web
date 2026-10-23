import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { TerminologyLookupBar } from "./TerminologyLookupBar";
import {
  createExportDataSource,
  comicTermbase,
} from "@/route/_authenticated/business/terminology/termbase-export-test-fixture";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";

const content = '{"terms":[{"source":"Elf","targets":["精灵"]}]}';
function appendFile(): File {
  const file = new File([content], "terms.json", { type: "application/json" });
  Object.defineProperty(file, "text", { value: () => Promise.resolve(content) });
  return file;
}

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      disconnect = vi.fn();
    },
  );
  useToastStore.setState({ showToast: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

async function setup(): Promise<{
  dataSource: ReturnType<typeof createExportDataSource>;
  user: ReturnType<typeof userEvent.setup>;
}> {
  const dataSource = createExportDataSource();
  dataSource.appendTermbase.mockResolvedValue({
    success: true,
    data: { added: 1, updated: 2, unchanged: 3 },
  });
  render(
    <TerminologyLookupBar
      dataSource={dataSource}
      termbaseExport={{ exportingIds: new Set(), exportTermbase: vi.fn() }}
    />,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "选择术语库" }));
  await screen.findByRole("button", { name: /角色称谓/ });
  return { user, dataSource };
}

test("only offers append on comic bases and keeps keyboard and long-press selection separate", async () => {
  const { user, dataSource } = await setup();
  const buttons = screen.getAllByRole("button", { name: "追加术语" });
  expect(buttons).toHaveLength(1);
  const button = buttons[0];
  if (!button) throw new Error("Missing append button");
  const input = screen.getByLabelText<HTMLInputElement>("向角色称谓追加术语 JSON 文件");
  const choose = vi.spyOn(input, "click");
  button.focus();
  await user.keyboard("{Enter}");
  expect(choose).toHaveBeenCalledOnce();
  fireEvent.pointerDown(button);
  await act(() => new Promise((resolve) => setTimeout(resolve, 550)));
  fireEvent.pointerUp(button);
  expect(screen.queryByRole("dialog", { name: "编辑术语库" })).toBeNull();
  await user.upload(input, appendFile());
  await waitFor(() => {
    expect(dataSource.appendTermbase).toHaveBeenCalledExactlyOnceWith("comic-base", content);
  });
  expect(dataSource.listTerms).not.toHaveBeenCalled();
  expect(dataSource.createTermbase).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "选择术语库" })).toBeVisible();
  expect(input.value).toBe("");
});

test("preserves selection and both searches while refreshing counts and selected terms", async () => {
  const { user, dataSource } = await setup();
  await user.click(screen.getByRole("button", { name: /角色称谓/ }));
  await user.type(screen.getByRole("combobox", { name: "搜索术语原文" }), "Elf");
  await waitFor(() => {
    expect(dataSource.listTerms).toHaveBeenLastCalledWith(
      expect.objectContaining({ fuzzySource: "Elf" }),
    );
  });
  await user.click(screen.getByRole("button", { name: "切换术语库，当前为 角色称谓" }));
  await user.type(screen.getByRole("textbox", { name: "搜索术语库名称" }), "角色");
  await waitFor(() => {
    expect(dataSource.listTermbases).toHaveBeenLastCalledWith(
      expect.objectContaining({ fuzzyName: "角色" }),
    );
  });
  dataSource.listTermbases.mockResolvedValue({
    success: true,
    data: [{ ...comicTermbase, termCount: 3 }],
  });
  await user.upload(screen.getByLabelText("向角色称谓追加术语 JSON 文件"), appendFile());
  expect(await screen.findByText("3 条")).toBeVisible();
  expect(screen.getByRole("textbox", { name: "搜索术语库名称" })).toHaveValue("角色");
  expect(screen.getByRole("combobox")).toHaveValue("Elf");
  expect(screen.getByRole("button", { name: "切换术语库，当前为 角色称谓" })).toBeVisible();
  dataSource.listTerms.mockClear();
  await user.click(screen.getByRole("combobox"));
  await waitFor(() => {
    expect(dataSource.listTerms).toHaveBeenCalledWith(
      expect.objectContaining({ termbaseId: "comic-base", fuzzySource: "Elf" }),
    );
  });
});

test("a cancelled picker does not submit or display an error", async () => {
  const { dataSource } = await setup();
  const input = screen.getByLabelText("向角色称谓追加术语 JSON 文件");
  fireEvent.change(input, { target: { files: [] } });
  expect(dataSource.appendTermbase).not.toHaveBeenCalled();
  expect(useToastStore.getState().showToast).not.toHaveBeenCalled();
});
