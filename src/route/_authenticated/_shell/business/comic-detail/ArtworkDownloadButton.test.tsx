import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { ApiProvider } from "@/route/business/ApiProvider";
import { ArtworkDownloadButton } from "./ArtworkDownloadButton";

function createClient(request: typeof fetch): ReturnType<typeof createApiClient> {
  return createApiClient({ baseUrl: "/api/v1", getAccessToken: () => "token", fetchImpl: request });
}

function createDelayedRequest(): {
  request: ReturnType<typeof vi.fn<typeof fetch>>;
  resolve: (response: Response) => void;
} {
  let resolveRequest: ((response: Response) => void) | undefined;
  const request = vi
    .fn<typeof fetch>()
    .mockImplementationOnce(() => new Promise<Response>((callback) => (resolveRequest = callback)))
    .mockResolvedValue(
      Response.json({
        code: 0,
        data: {
          artwork_version: 2,
          artwork_hash: "hash",
          ext: "xz",
          download_url: "https://storage.example/new",
        },
      }),
    );
  return {
    request,
    resolve: (response) => {
      if (!resolveRequest) {
        throw new Error("The delayed request has not started.");
      }
      resolveRequest(response);
    },
  };
}

function renderDownloadButton(
  client: ReturnType<typeof createApiClient>,
  onExported: () => void,
): void {
  render(
    <ApiProvider client={client}>
      <ArtworkDownloadButton chapterId="chapter" onExported={onExported} />
    </ApiProvider>,
  );
}

async function expectSuccessfulExport(
  exported: ReturnType<typeof vi.fn>,
  request: ReturnType<typeof vi.fn<typeof fetch>>,
  click: ReturnType<typeof vi.spyOn>,
): Promise<void> {
  await waitFor(() => {
    expect(exported).toHaveBeenCalledOnce();
  });
  expect(request).toHaveBeenCalledOnce();
  expect(click).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "下载嵌稿" })).toBeEnabled();
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
test("hands the signed URL to the browser without buffering the artifact", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      code: 0,
      data: {
        artwork_version: 1,
        artwork_hash: "hash",
        ext: "zst",
        download_url: "https://storage.example/file?signature=opaque",
      },
    }),
  );
  const client = createClient(request);
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    expect(this.href).toBe("https://storage.example/file?signature=opaque");
    expect(this.download).toBe("chapter-chapter-artwork.zst");
  });
  const exported = vi.fn();
  renderDownloadButton(client, exported);
  fireEvent.click(screen.getByRole("button", { name: "下载嵌稿" }));
  await expectSuccessfulExport(exported, request, click);
});
test("changing chapter cancels the old export and ignores a late response", async () => {
  const { request, resolve } = createDelayedRequest();
  const client = createClient(request);
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
    /* Prevent navigation in the DOM test. */
  });
  const exported = vi.fn();
  const view = render(
    <ApiProvider client={client}>
      <ArtworkDownloadButton chapterId="old" onExported={exported} />
    </ApiProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "下载嵌稿" }));
  view.rerender(
    <ApiProvider client={client}>
      <ArtworkDownloadButton chapterId="new" onExported={exported} />
    </ApiProvider>,
  );
  expect(request.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  expect(screen.getByRole("button", { name: "下载嵌稿" })).toBeEnabled();
  resolve(
    Response.json({
      code: 0,
      data: {
        artwork_version: 1,
        artwork_hash: "hash",
        ext: "xz",
        download_url: "https://storage.example/old",
      },
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "下载嵌稿" }));
  await waitFor(() => {
    expect(exported).toHaveBeenCalledOnce();
  });
  expect(click).toHaveBeenCalledOnce();
});
