import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { ApiProvider } from "@/route/business/ApiProvider";
import { IssueImportDialog } from "./IssueImportDialog";

const replace = vi.hoisted(() => vi.fn());
vi.mock("@/route/_authenticated/business/issue/issue-request", () => ({
  replaceChapterIssues: replace,
}));
const artworks = vi.hoisted(() => vi.fn());
vi.mock("@/api/page-artwork/page-artwork-api", () => ({ listPageArtworks: artworks }));
function artworkPages(count: number): unknown[] {
  return Array.from({ length: count }, (_, index) => ({
    id: "artwork-" + String(index),
    rawIdent: String(index + 1) + ".psd",
    index,
  }));
}
const client = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => null });
beforeEach(() => {
  artworks.mockReset().mockResolvedValue({ success: true, data: artworkPages(2) });
  replace.mockReset().mockResolvedValue(undefined);
});
afterEach(cleanup);

function choose(text: string): void {
  const file = new File([text], "issues.json", { type: "application/json" });
  // jsdom's File lacks Blob.text; preserve the browser file-reading contract.
  Object.defineProperty(file, "text", { value: () => Promise.resolve(text) });
  fireEvent.change(screen.getByLabelText("选择监稿文件"), { target: { files: [file] } });
}

test("previews full-chapter clearing and submits only after the replacement action", async () => {
  const imported = vi.fn();
  render(
    <ApiProvider client={client}>
      <IssueImportDialog chapterId="chapter" onImported={imported} onClose={vi.fn()} />
    </ApiProvider>,
  );
  choose('{"pages":[{"issues":[]},{"issues":[]}]}');
  await screen.findByText("此次上传将清空整章监稿标注。");
  expect(replace).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "替换整章监稿" }));
  await waitFor(() => {
    expect(imported).toHaveBeenCalledOnce();
  });
  expect(replace.mock.calls[0]?.slice(0, 3)).toEqual([
    client,
    "chapter",
    {
      pages: [
        { pageArtworkId: "artwork-0", issues: [] },
        { pageArtworkId: "artwork-1", issues: [] },
      ],
    },
  ]);
});

test("blocks invalid manifests and exposes backend recovery without treating failure as success", async () => {
  const imported = vi.fn();
  replace.mockRejectedValueOnce(new Error("当前 REVIEWER 指派已失效"));
  render(
    <ApiProvider client={client}>
      <IssueImportDialog chapterId="chapter" onImported={imported} onClose={vi.fn()} />
    </ApiProvider>,
  );
  choose('{"pages":[{"issues":"invalid"}]}');
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "替换整章监稿" })).toBeDisabled();
  const input = { pages: Array.from({ length: 33 }, () => ({ issues: [] })) };
  artworks.mockResolvedValue({ success: true, data: artworkPages(33) });
  choose(JSON.stringify(input));
  await screen.findByText("此次上传将清空整章监稿标注。");
  fireEvent.click(screen.getByRole("button", { name: "替换整章监稿" }));
  expect(replace.mock.calls[0]?.[2]).toEqual({
    pages: input.pages.map((page, index) => ({
      ...page,
      pageArtworkId: "artwork-" + String(index),
    })),
  });
  expect(await screen.findByRole("alert")).toHaveTextContent("当前 REVIEWER 指派已失效");
  expect(imported).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "替换整章监稿" })).toBeEnabled();
});

test("preserves the backend layer name when importing a review file", async () => {
  render(
    <ApiProvider client={client}>
      <IssueImportDialog chapterId="chapter" onImported={vi.fn()} onClose={vi.fn()} />
    </ApiProvider>,
  );
  choose(
    JSON.stringify({
      pages: [
        { issues: [{ variant: "居中错误", layer_name: "  他们两个…  ", note: "向左移动" }] },
        { issues: [] },
      ],
    }),
  );
  await waitFor(() => expect(screen.getByRole("button", { name: "替换整章监稿" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "替换整章监稿" }));
  await waitFor(() => {
    expect(replace).toHaveBeenCalledOnce();
  });
  expect(replace.mock.calls[0]?.[2]).toEqual({
    pages: [
      {
        pageArtworkId: "artwork-0",
        issues: [{ variant: "居中错误", layerName: "  他们两个…  ", rect: null, note: "向左移动" }],
      },
      { pageArtworkId: "artwork-1", issues: [] },
    ],
  });
});
