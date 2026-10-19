import { act, render, screen, waitFor, within } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import type { TerminologyDataSource } from "../contract/terminology";
import { TerminologyLookupBar } from "./TerminologyLookupBar";
import { useTermbaseExport } from "./use-termbase-export";
import { downloadTermbase } from "./termbase-download";
import type { DeferredExport, ExportDataSource } from "./termbase-export-test-fixture";
import {
  createExportDataSource,
  deferredExport,
  exportContent,
} from "./termbase-export-test-fixture";

vi.mock("./termbase-download", () => ({ downloadTermbase: vi.fn() }));

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

type Props = { dataSource: TerminologyDataSource; isReadOnly?: boolean };

function ExportFixture({ dataSource, isReadOnly = false }: Props): React.ReactElement | null {
  const termbaseExport = useTermbaseExport(dataSource, "project-1");
  return isReadOnly ? null : (
    <TerminologyLookupBar dataSource={dataSource} termbaseExport={termbaseExport} />
  );
}

type ExportHarness = RenderResult & {
  dataSource: ExportDataSource;
  pending: DeferredExport;
  user: ReturnType<typeof userEvent.setup>;
  share: HTMLElement;
};

async function startExport(): Promise<ExportHarness> {
  const dataSource = createExportDataSource();
  const pending = deferredExport();
  dataSource.exportTermbase.mockReturnValue(pending.promise);
  const view = render(<ExportFixture dataSource={dataSource} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "选择术语库" }));
  const list = await screen.findByRole("list", { name: "术语库列表" });
  const rows = within(list).getAllByRole("listitem");
  expect(rows).toHaveLength(2);
  for (const row of rows)
    expect(within(row).getByRole("button", { name: "导出术语库" })).toBeEnabled();
  const firstRow = rows[0];
  if (!firstRow) throw new Error("Missing comic termbase row");
  const share = within(firstRow).getByRole("button", { name: "导出术语库" });
  await user.click(share);
  return { ...view, dataSource, pending, user, share };
}

async function finishExport(pending: DeferredExport): Promise<void> {
  await act(async () => {
    pending.resolve({ success: true, data: exportContent });
    await pending.promise;
  });
  await waitFor(() => {
    expect(downloadTermbase).toHaveBeenCalledExactlyOnceWith(exportContent);
  });
}

test("keeps selection and the panel unchanged, then finishes after closing the panel", async () => {
  const { user, share, dataSource, pending } = await startExport();
  expect(screen.getByRole("dialog", { name: "选择术语库" })).toBeVisible();
  expect(screen.getByRole("combobox", { name: "搜索术语原文" })).toBeDisabled();
  expect(share).toBeDisabled();
  await user.click(share);
  expect(dataSource.exportTermbase).toHaveBeenCalledOnce();
  await user.click(screen.getByRole("button", { name: "选择术语库" }));
  await waitFor(() => {
    expect(screen.queryByRole("list", { hidden: true })).toBeNull();
  });
  expect(dataSource.exportTermbase.mock.calls[0]?.[1]?.aborted).toBe(false);
  await finishExport(pending);
  expect(dataSource.listTerms).not.toHaveBeenCalled();
});

test("keeps the task when searching hides its row, and restores its loading state", async () => {
  const { user, dataSource, pending } = await startExport();
  const query = screen.getByRole("textbox", { name: "搜索术语库名称" });
  await user.type(query, "团队");
  await waitFor(() => {
    expect(screen.queryByRole("button", { name: /角色称谓/ })).toBeNull();
  });
  expect(dataSource.exportTermbase.mock.calls[0]?.[1]?.aborted).toBe(false);
  await user.clear(query);
  await screen.findByRole("button", { name: /角色称谓/ });
  expect(screen.getByRole("status", { name: "正在导出术语库" })).toBeVisible();
  await finishExport(pending);
});

test("continues through a view change that unmounts the lookup bar", async () => {
  const { rerender, dataSource, pending } = await startExport();
  rerender(<ExportFixture dataSource={dataSource} isReadOnly />);
  expect(screen.queryByTestId("terminology-lookup")).toBeNull();
  expect(dataSource.exportTermbase.mock.calls[0]?.[1]?.aborted).toBe(false);
  await finishExport(pending);
});
