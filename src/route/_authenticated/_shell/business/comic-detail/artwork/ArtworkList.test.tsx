import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { ApiProvider } from "@/route/business/ApiProvider";
import { usePageArtworks } from "@/route/_authenticated/business/artwork/use-page-artworks";
import { toSnakeCase } from "@/shared/utility/case-convert";
import { ArtworkList } from "./ArtworkList";
import { ChapterIssueImportButton } from "../ChapterIssueImportButton";

function Fixture(): React.ReactElement {
  const artworks = usePageArtworks("chapter", true);
  return (
    <>
      {artworks.error && <p role="alert">{artworks.error}</p>}
      <button type="button" onClick={artworks.reload}>
        刷新
      </button>
      <ChapterIssueImportButton chapterId="chapter" onImported={artworks.reload} />
      <ArtworkList
        pages={artworks.pages}
        issueCounts={artworks.issueCounts}
        canUpload={false}
        onOpen={vi.fn()}
        onUpload={vi.fn()}
        onChanged={artworks.reload}
      />
    </>
  );
}

function setup(failIssues = false): { setIssuePage: (id: string) => void } {
  let issuePage = "second";
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => null,
    fetchImpl: (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.endsWith("/issues/import")) {
        issuePage = "first";
        return Promise.resolve(
          Response.json({ code: 0, data: { imported_page_count: 2, imported_issue_count: 2 } }),
        );
      }
      if (url.endsWith("/issues")) {
        if (failIssues)
          return Promise.resolve(Response.json({ code: 1, message: "统计失败" }, { status: 503 }));
        return Promise.resolve(
          Response.json({
            code: 0,
            data: toSnakeCase(
              [0, 1].map((index) => ({
                id: String(index),
                pageArtworkId: issuePage,
                index,
                variant: "文字",
                layerName: null,
                rect: null,
                note: "修正",
              })),
            ),
          }),
        );
      }
      return Promise.resolve(
        Response.json({
          code: 0,
          data: toSnakeCase(
            ["first", "second"].map((id, index) => ({
              id,
              chapterId: "chapter",
              index,
              rawIdent: `${id}.psd`,
              imageUrl: "/preview.webp",
              imageOptimizedUrl: null,
              imageThumbnailUrl: null,
              imageHash: "hash",
              ext: "webp",
              imageVersion: 1,
              imageUploaded: true,
              createdAt: 0,
              updatedAt: 0,
            })),
          ),
        }),
      );
    },
  });
  render(
    <ApiProvider client={client}>
      <Fixture />
    </ApiProvider>,
  );
  return {
    setIssuePage(id) {
      issuePage = id;
    },
  };
}

afterEach(cleanup);

test("refreshes artwork issue indicators immediately after importing review issues", async () => {
  setup();
  expect(await screen.findByLabelText("第 2 页有 issue")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "上传监稿" }));
  const text = JSON.stringify({
    pages: [{ issues: [{ variant: "文字", layer_name: "对白", note: "修正" }] }, { issues: [] }],
  });
  const file = new File([text], "issues.json", { type: "application/json" });
  Object.defineProperty(file, "text", { value: () => Promise.resolve(text) });
  fireEvent.change(screen.getByLabelText("选择监稿文件"), { target: { files: [file] } });
  await waitFor(() => expect(screen.getByRole("button", { name: "替换整章监稿" })).toBeEnabled());
  expect(screen.queryByText(/条监稿标注/u)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "替换整章监稿" }));
  expect(await screen.findByLabelText("第 1 页有 issue")).toBeVisible();
  expect(screen.queryByLabelText("第 2 页有 issue")).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog", { name: "上传监稿" })).not.toBeInTheDocument();
});

test("maps issue counts to artwork IDs and refreshes the orange indicator", async () => {
  const fixture = setup();
  const indicator = await screen.findByLabelText("第 2 页有 issue");
  expect(screen.queryByText(/\d+ issue/u)).not.toBeInTheDocument();
  expect(indicator.firstElementChild).toHaveClass("bg-surface-orange-400");
  expect(screen.queryByLabelText("第 1 页有 issue")).not.toBeInTheDocument();
  expect(screen.queryByText("first.psd")).not.toBeInTheDocument();
  fixture.setIssuePage("first");
  fireEvent.click(screen.getByRole("button", { name: "刷新" }));
  expect(await screen.findByLabelText("第 1 页有 issue")).toBeVisible();
  expect(screen.queryByLabelText("第 2 页有 issue")).not.toBeInTheDocument();
});

test("keeps artwork previews and reports failed issue statistics", async () => {
  setup(true);
  expect(await screen.findByRole("alert")).toHaveTextContent("issue 数量加载失败");
  expect(screen.getByRole("button", { name: "查看第 1 页嵌稿" })).toBeEnabled();
  expect(screen.queryByText("2 issue")).not.toBeInTheDocument();
  expect(screen.queryByText("0 issue")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("第 1 页有 issue")).not.toBeInTheDocument();
});
