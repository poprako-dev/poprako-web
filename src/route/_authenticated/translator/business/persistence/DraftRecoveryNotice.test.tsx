import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DraftRecoveryNotice } from "./DraftRecoveryNotice";
import { createDraftStore } from "./draft-store";
import { createDraftDatabaseFixture } from "../test/draft-database-fixture";

test("failed reads remain visible, expose context and retry without hiding an unsuccessful recovery", async () => {
  const db = createDraftDatabaseFixture();
  const fail = vi.spyOn(db, "transact").mockRejectedValue(new Error("database unavailable"));
  const store = createDraftStore("u", "c", db);
  await store.ready;
  const retry = vi.fn(async () => {
    await store.readRecovery();
  });
  render(<DraftRecoveryNotice store={store} pageId="p" onRetry={retry} />);
  expect(screen.getByRole("alert")).toHaveTextContent("本地草稿未能恢复，当前显示服务器内容");
  fireEvent.click(screen.getByText("错误详情"));
  expect(screen.getByText(/database unavailable/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "重试恢复" }));
  await waitFor(() => {
    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button")).toBeEnabled();
  });
  expect(screen.getByRole("alert")).toBeInTheDocument();
  fail.mockRestore();
  fireEvent.click(screen.getByRole("button", { name: "重试恢复" }));
  await waitFor(() => {
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
test("page parse failures preserve original bytes and do not clear when unrelated storage state changes", async () => {
  const db = createDraftDatabaseFixture();
  const key = JSON.stringify(["u", "c", "broken"]);
  await db.transact(() => ({
    rows: [
      { key, scope: JSON.stringify(["u", "c"]), pageId: "broken", raw: "broken JSON", touched: 0 },
    ],
    result: undefined,
  }));
  const store = createDraftStore("u", "c", db);
  await store.ready;
  render(
    <DraftRecoveryNotice
      store={store}
      pageId="p"
      onRetry={async () => {
        await store.readRecovery();
      }}
    />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("部分页面的本地草稿未能恢复");
  act(() => {
    store.setState({ errors: {} });
  });
  expect(screen.getByRole("alert")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "重试恢复" }));
  await waitFor(() => {
    expect(screen.getByRole("button")).toBeEnabled();
  });
  expect(await db.transact((rows) => ({ rows, result: rows[0]?.raw }))).toBe("broken JSON");
});
