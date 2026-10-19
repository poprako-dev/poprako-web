import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { Utilities } from "./Utilities";
import { createTeamTerminologyFixture, fixtureBase } from "./team-terminology-fixture";
import { openFixtureBase, setupTeamTerminologyTest } from "./team-terminology-test-fixture";
import { canManageTeamTerminology } from "./team-terminology";

setupTeamTerminologyTest();

async function editTerm(source: string): Promise<void> {
  const row = (await screen.findByText(source)).closest('[role="listitem"]');
  if (!row) throw new Error("缺少术语行");
  fireEvent.pointerDown(row);
  await screen.findByRole("dialog", { name: "编辑术语" });
  fireEvent.pointerUp(row);
}

test("loads on demand and remembers directory, query and scroll across tools and back", async () => {
  const user = userEvent.setup();
  const source = createTeamTerminologyFixture();
  const listBases = vi.spyOn(source, "listTermbases");
  render(<Utilities terminology={{ teamId: "team-1", canEdit: true, dataSource: source }} />);
  expect(listBases).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "查看术语库" }));
  const rootScroll = await screen.findByRole("region", { name: "术语库列表，可滚动" });
  rootScroll.scrollTop = 64;
  const baseSearch = screen.getByRole("textbox", { name: "搜索术语库名称" });
  await user.type(baseSearch, "奇幻");
  await waitFor(() => {
    expect(listBases).toHaveBeenLastCalledWith({ fuzzyName: "奇幻", offset: 0, limit: 30 });
  });
  const filteredScroll = await screen.findByRole("region", { name: "术语库列表，可滚动" });
  filteredScroll.scrollTop = 64;
  await user.click(screen.getByRole("button", { name: /^奇幻世界共用词/ }));
  const search = await screen.findByRole("textbox", { name: "搜索术语原文" });
  await user.type(search, "団");
  await waitFor(() => {
    expect(screen.queryByText("エルフ")).not.toBeInTheDocument();
  });
  await user.click(screen.getByRole("button", { name: "定界压缩" }));
  await user.click(screen.getByRole("button", { name: "查看术语库" }));
  expect(screen.getByRole("textbox", { name: "搜索术语原文" })).toHaveValue("団");
  await user.click(screen.getByRole("button", { name: "返回术语库" }));
  await waitFor(() => {
    expect(baseSearch).toBeVisible();
  });
  expect(baseSearch).toHaveValue("奇幻");
  expect(screen.getByRole("region", { name: "术语库列表，可滚动" }).scrollTop).toBe(64);
});

test("creates and enters a library, then creates and edits its term", async () => {
  const user = userEvent.setup();
  const source = createTeamTerminologyFixture();
  const createTerm = vi.spyOn(source, "createTerm");
  render(<Utilities terminology={{ teamId: "team-1", canEdit: true, dataSource: source }} />);
  await user.click(screen.getByRole("button", { name: "查看术语库" }));
  await user.click(screen.getByRole("button", { name: "新建术语库" }));
  await user.type(screen.getByRole("textbox", { name: "名称" }), "地名");
  await user.click(screen.getByRole("button", { name: "保存" }));
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  await user.click(await screen.findByRole("button", { name: "新建术语" }));
  await user.type(screen.getByRole("textbox", { name: "原文" }), "城");
  await user.type(screen.getByRole("textbox", { name: "译名 1" }), "城堡");
  await user.click(screen.getByRole("button", { name: "保存" }));
  expect(createTerm).toHaveBeenCalledWith(
    expect.objectContaining({ source: "城", targets: ["城堡"] }),
  );
  await editTerm("城");
  const target = screen.getByRole("textbox", { name: "译名 1" });
  await user.clear(target);
  await user.type(target, "王城");
  await user.click(screen.getByRole("button", { name: "保存" }));
  expect(await screen.findByText("王城")).toBeVisible();
});

test("supports long press, preserves failed edits, and confirms deleting a library", async () => {
  const user = userEvent.setup();
  const source = createTeamTerminologyFixture();
  vi.spyOn(source, "updateTermbase").mockResolvedValueOnce({ success: false, error: "名称重复" });
  const remove = vi.spyOn(source, "deleteTermbase");
  render(<Utilities terminology={{ teamId: "team-1", canEdit: true, dataSource: source }} />);
  await user.click(screen.getByRole("button", { name: "查看术语库" }));
  const row = await screen.findByRole("button", { name: /^奇幻世界共用词/ });
  fireEvent.pointerDown(row);
  const dialog = await screen.findByRole("dialog", { name: "编辑术语库" });
  fireEvent.pointerUp(row);
  const name = within(dialog).getByRole("textbox", { name: "名称" });
  await user.type(name, "修改");
  await user.click(within(dialog).getByRole("button", { name: "保存" }));
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "保存" })).toBeEnabled();
  });
  expect(name).toHaveValue(`${fixtureBase.name}修改`);
  await user.click(screen.getByRole("button", { name: "删除" }));
  expect(remove).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "确认删除" }));
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  expect(await screen.findByText("没有找到术语库")).toBeVisible();
});

test("deletes a term with confirmation and refreshes the library count", async () => {
  const user = userEvent.setup();
  const source = createTeamTerminologyFixture();
  const remove = vi.spyOn(source, "deleteTerm");
  render(<Utilities terminology={{ teamId: "team-1", canEdit: true, dataSource: source }} />);
  await openFixtureBase(user);
  await editTerm("団長");
  await user.click(screen.getByRole("button", { name: "删除" }));
  expect(remove).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "确认删除" }));
  await waitFor(() => {
    expect(screen.queryByText("団長")).not.toBeInTheDocument();
  });
  await user.click(screen.getByRole("button", { name: "返回术语库" }));
  const row = await screen.findByRole("button", { name: /^奇幻世界共用词/ });
  await waitFor(() => {
    expect(within(row).getByText("1 条")).toBeVisible();
  });
});

test("read-only members can browse and copy but have no write actions", async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
  render(
    <Utilities
      terminology={{ teamId: "team-1", canEdit: false, dataSource: createTeamTerminologyFixture() }}
    />,
  );
  expect(screen.queryByRole("button", { name: "导入术语库" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "查看术语库" }));
  expect(screen.queryByRole("button", { name: "新建术语库" })).not.toBeInTheDocument();
  expect(await screen.findByRole("button", { name: "导出术语库" })).toBeVisible();
  await openFixtureBase(user);
  expect(screen.queryByRole("button", { name: "新建术语" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /编辑术语/ })).not.toBeInTheDocument();
  const [copyButton] = await screen.findAllByRole("button", { name: "复制首选译名" });
  if (!copyButton) throw new Error("缺少复制按钮");
  await user.click(copyButton);
  expect(copy).toHaveBeenCalledWith("团长");
});

test.each([
  [0, false],
  [128, false],
  [2, true],
  [4, true],
  [130, true],
])("matches backend write roles: %s", (roles, allowed) => {
  expect(canManageTeamTerminology({ roles })).toBe(allowed);
});

test("keeps keyboard navigation usable after entering and returning", async () => {
  const user = userEvent.setup();
  render(
    <Utilities
      terminology={{ teamId: "team-1", canEdit: true, dataSource: createTeamTerminologyFixture() }}
    />,
  );
  await openFixtureBase(user);
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "返回术语库" })).toHaveFocus();
  });
  await user.keyboard("{Enter}");
  await waitFor(() => {
    expect(screen.getByRole("textbox", { name: "搜索术语库名称" })).toHaveFocus();
  });
});
