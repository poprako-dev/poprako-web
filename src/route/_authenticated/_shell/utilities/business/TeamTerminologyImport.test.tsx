import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import type { Result } from "@/shared/utility/result";
import type { ImportTermbaseResult } from "@/route/_authenticated/business/terminology/termbase-input";
import { Utilities } from "./Utilities";
import { createTeamTerminologyFixture, fixtureBase } from "./team-terminology-fixture";
import { deferred, importFile, setupTeamTerminologyTest } from "./team-terminology-test-fixture";

setupTeamTerminologyTest();

test("imports from a compression tool, then enters the new library", async () => {
  const user = userEvent.setup();
  const source = createTeamTerminologyFixture();
  const imported = vi.spyOn(source, "importTermbase");
  render(<Utilities terminology={{ teamId: "team-1", canEdit: true, dataSource: source }} />);
  await user.upload(screen.getByLabelText("选择团队术语库 JSON 文件"), importFile());
  await waitFor(() => {
    expect(screen.getByText("星辰")).toBeVisible();
  });
  expect(screen.getByRole("button", { name: "查看术语库" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(imported).toHaveBeenCalledTimes(1);
  expect(screen.getByText("新导入库")).toBeVisible();
});

test("retries only reading details after a successful import", async () => {
  const user = userEvent.setup();
  const source = createTeamTerminologyFixture();
  const imported = vi.spyOn(source, "importTermbase");
  const get = vi
    .spyOn(source, "getTermbase")
    .mockResolvedValueOnce({ success: false, error: "详情加载失败" });
  render(<Utilities terminology={{ teamId: "team-1", canEdit: true, dataSource: source }} />);
  await user.upload(screen.getByLabelText("选择团队术语库 JSON 文件"), importFile());
  await user.click(await screen.findByRole("button", { name: "重试" }));
  await waitFor(() => {
    expect(screen.getByText("星辰")).toBeVisible();
  });
  expect(imported).toHaveBeenCalledTimes(1);
  expect(get).toHaveBeenCalledTimes(2);
});

test("keeps the current tool after duplicate-name failure and permits retry", async () => {
  const user = userEvent.setup();
  const source = createTeamTerminologyFixture();
  const imported = vi
    .spyOn(source, "importTermbase")
    .mockResolvedValueOnce({ success: false, error: "术语库名称已存在" });
  render(<Utilities terminology={{ teamId: "team-1", canEdit: true, dataSource: source }} />);
  const input = screen.getByLabelText("选择团队术语库 JSON 文件");
  await user.upload(input, importFile());
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "导入术语库" })).toBeEnabled();
  });
  expect(screen.getByRole("button", { name: "打包并压缩" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await user.upload(input, importFile());
  await waitFor(() => {
    expect(screen.getByText("星辰")).toBeVisible();
  });
  expect(imported).toHaveBeenCalledTimes(2);
});

test("locks while reading the file and does not submit after switching teams", async () => {
  const source = createTeamTerminologyFixture();
  const imported = vi.spyOn(source, "importTermbase");
  const reading = deferred<string>();
  const file = new File([], "pending.json");
  Object.defineProperty(file, "text", { value: () => reading.promise });
  const view = render(
    <Utilities terminology={{ teamId: "team-1", canEdit: true, dataSource: source }} />,
  );
  fireEvent.change(screen.getByLabelText("选择团队术语库 JSON 文件"), {
    target: { files: [file] },
  });
  expect(screen.getByRole("button", { name: "导入术语库" })).toBeDisabled();
  view.rerender(
    <Utilities
      terminology={{ teamId: "team-2", canEdit: true, dataSource: createTeamTerminologyFixture() }}
    />,
  );
  await act(async () => {
    reading.resolve('{"name":"old","terms":[]}');
    await reading.promise;
  });
  expect(imported).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "打包并压缩" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("ignores an import response from the previous team", async () => {
  const source = createTeamTerminologyFixture();
  const pending = deferred<Result<ImportTermbaseResult>>();
  vi.spyOn(source, "importTermbase").mockReturnValue(pending.promise);
  const get = vi.spyOn(source, "getTermbase");
  const view = render(
    <Utilities terminology={{ teamId: "team-1", canEdit: true, dataSource: source }} />,
  );
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText("选择团队术语库 JSON 文件"), importFile());
  view.rerender(
    <Utilities
      terminology={{ teamId: "team-2", canEdit: true, dataSource: createTeamTerminologyFixture() }}
    />,
  );
  await act(async () => {
    pending.resolve({
      success: true,
      data: { id: fixtureBase.id, created: true, createdTermCount: 1, mergedTermCount: 0 },
    });
    await pending.promise;
  });
  expect(get).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "查看术语库" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(screen.queryByRole("button", { name: "返回术语库" })).not.toBeInTheDocument();
});

test("clears browsing on team change and keeps the compression tool available without a team", async () => {
  const user = userEvent.setup();
  const source = createTeamTerminologyFixture();
  const view = render(
    <Utilities terminology={{ teamId: "team-1", canEdit: true, dataSource: source }} />,
  );
  await user.click(screen.getByRole("button", { name: "查看术语库" }));
  await user.click(await screen.findByRole("button", { name: /^奇幻世界共用词/ }));
  await screen.findByRole("textbox", { name: "搜索术语原文" });
  view.rerender(<Utilities />);
  expect(screen.getByText("暂无可用汉化组")).toBeVisible();
  expect(screen.queryByRole("button", { name: "返回术语库" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "定界压缩" }));
  expect(screen.getByRole("button", { name: "定界压缩" })).toHaveAttribute("aria-pressed", "true");
});
