import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { Utilities } from "./Utilities";
import { createTeamTerminologyFixture, fixtureBase } from "./team-terminology-fixture";
import { setupTeamTerminologyTest, openFixtureBase } from "./team-terminology-test-fixture";

setupTeamTerminologyTest();

function file(): File {
  const content = '{"terms":[{"source":"星","targets":["星辰"]}]}';
  const file = new File([content], "terms.json", { type: "application/json" });
  Object.defineProperty(file, "text", { value: () => Promise.resolve(content) });
  return file;
}

test("appends to a team base and refreshes its selected detail without losing either query", async () => {
  const dataSource = createTeamTerminologyFixture();
  const append = vi
    .spyOn(dataSource, "appendTermbase")
    .mockResolvedValue({ success: true, data: { added: 1, updated: 0, unchanged: 0 } });
  const getBase = vi
    .spyOn(dataSource, "getTermbase")
    .mockResolvedValue({ success: true, data: { ...fixtureBase, termCount: 3 } });
  const listTerms = vi.spyOn(dataSource, "listTerms");
  render(<Utilities terminology={{ teamId: "team-1", canEdit: true, dataSource }} />);
  const user = userEvent.setup();
  await openFixtureBase(user);
  await user.type(screen.getByRole("textbox", { name: "搜索术语原文" }), "団");
  await user.click(screen.getByRole("button", { name: "返回术语库" }));
  const query = await screen.findByRole("textbox", { name: "搜索术语库名称" });
  await user.type(query, "奇幻");
  await user.upload(screen.getByLabelText(`向${fixtureBase.name}追加术语 JSON 文件`), file());
  await waitFor(() => {
    expect(append).toHaveBeenCalledOnce();
  });
  expect(append.mock.calls[0]?.[0]).toBe(fixtureBase.id);
  await waitFor(() => {
    expect(getBase).toHaveBeenCalledWith(fixtureBase.id);
  });
  expect(query).toHaveValue("奇幻");
  await user.click(await screen.findByRole("button", { name: new RegExp(`^${fixtureBase.name}`) }));
  expect(await screen.findByRole("textbox", { name: "搜索术语原文" })).toHaveValue("団");
  await waitFor(() => {
    expect(listTerms).toHaveBeenLastCalledWith(expect.objectContaining({ fuzzySource: "団" }));
  });
});

test("hides append for team members without editing permission", async () => {
  render(
    <Utilities
      terminology={{ teamId: "team-1", canEdit: false, dataSource: createTeamTerminologyFixture() }}
    />,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "查看术语库" }));
  await screen.findByRole("button", { name: new RegExp(`^${fixtureBase.name}`) });
  expect(screen.queryByRole("button", { name: "追加术语" })).toBeNull();
  expect(screen.queryByLabelText(`向${fixtureBase.name}追加术语 JSON 文件`)).toBeNull();
});
