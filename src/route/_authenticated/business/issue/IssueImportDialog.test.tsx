import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { ApiProvider } from "@/route/business/ApiProvider";
import { IssueImportDialog } from "./IssueImportDialog";

const replace = vi.hoisted(() => vi.fn());
vi.mock("@/route/_authenticated/business/issue/issue-request", () => ({
  replaceChapterIssues: replace,
}));
const client = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => null });
beforeEach(() => {
  replace.mockReset().mockResolvedValue(undefined);
});
afterEach(cleanup);

function choose(text: string): void {
  const file = new File([text], "issues.json", { type: "application/json" });
  // jsdom's File lacks Blob.text; preserve the browser file-reading contract.
  Object.defineProperty(file, "text", { value: () => Promise.resolve(text) });
  fireEvent.change(screen.getByLabelText("选择 issue 文件"), { target: { files: [file] } });
}

test("previews full-chapter clearing and submits only after the replacement action", async () => {
  const imported = vi.fn();
  render(
    <ApiProvider client={client}>
      <IssueImportDialog
        chapterId="chapter"
        pageIds={["first", "second"]}
        onImported={imported}
        onClose={vi.fn()}
      />
    </ApiProvider>,
  );
  choose('{"pages":[{"issues":[]},{"issues":[]}]}');
  await screen.findByText("此次导入将清空整章 issue。");
  expect(replace).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "替换整章 issue" }));
  await waitFor(() => {
    expect(imported).toHaveBeenCalledOnce();
  });
  expect(replace.mock.calls[0]?.slice(0, 4)).toEqual([
    client,
    "chapter",
    { pages: [{ issues: [] }, { issues: [] }] },
    ["first", "second"],
  ]);
});

test("blocks invalid manifests and exposes backend recovery without treating failure as success", async () => {
  const imported = vi.fn();
  replace.mockRejectedValueOnce(new Error("当前 REVIEWER 指派已失效"));
  render(
    <ApiProvider client={client}>
      <IssueImportDialog
        chapterId="chapter"
        pageIds={["page"]}
        onImported={imported}
        onClose={vi.fn()}
      />
    </ApiProvider>,
  );
  choose('{"pages":[]}');
  expect(await screen.findByRole("alert")).toHaveTextContent("当前章节有 1 页");
  expect(screen.getByRole("button", { name: "替换整章 issue" })).toBeDisabled();
  choose('{"pages":[{"issues":[]}]}');
  await screen.findByText("此次导入将清空整章 issue。");
  fireEvent.click(screen.getByRole("button", { name: "替换整章 issue" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("当前 REVIEWER 指派已失效");
  expect(imported).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "替换整章 issue" })).toBeEnabled();
});
