import type { ReactElement, ReactNode } from "react";
import { act, renderHook, type RenderHookResult } from "@testing-library/react";
import { vi, type Mock } from "vitest";
import { createApiClient } from "@/api/client";
import { ApiProvider } from "@/route/business/ApiProvider";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import type { Result } from "@/shared/utility/result";
import type { DetailContract } from "./comic-detail-type";
import { useComicDetailPages } from "./use-comic-detail-pages";
import { putPageUploadTask } from "./upload/page-upload-store";
type Props = { children: ReactNode };
type Harness = RenderHookResult<ReturnType<typeof useComicDetailPages>, { chapterId: string }> & {
  response: Deferred<Response>;
  responseAt: (index: number) => Deferred<Response>;
  fetchImpl: Mock<typeof fetch>;
  onLoadPages: Mock<DetailContract["onLoadPages"]>;
  onDeleteChapterPages: Mock<DetailContract["onDeleteChapterPages"]>;
  showToast: Mock;
  reloadLoadedChapters: Mock<() => Promise<ChapterInfo[] | null>>;
};
export type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};
export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
export function page(chapterId: string, imageUrl = "fresh"): PageInfo {
  return {
    id: "page",
    chapterId,
    index: 1,
    imageUrl,
    isUploaded: true,
    totalUnitCount: 0,
    translatedUnitCount: 0,
    proofreadUnitCount: 0,
    createdAt: 0,
    updatedAt: 0,
  };
}
export function task(taskId = "task"): void {
  putPageUploadTask({
    taskId,
    batchId: "batch",
    chapterId: "a",
    pageId: "page",
    index: 1,
    fileName: "page.png",
    progress: 100,
    attempt: 1,
    status: "succeeded",
    error: null,
  });
}
export function harness(
  onLoadPages = vi.fn(() => Promise.resolve<Result<PageInfo[]>>({ success: true, data: [] })),
  strict = false,
): Harness {
  const response = deferred<Response>();
  const responses = [response];
  let requestCount = 0;
  const fetchImpl = vi.fn<typeof fetch>(() => {
    const request = requestCount++;
    responses[request] ??= deferred<Response>();
    return responses[request].promise;
  });
  function responseAt(index: number): Deferred<Response> {
    const item = responses[index];
    if (!item) throw new Error(`请求 ${String(index)} 尚未开始`);
    return item;
  }
  const client = createApiClient({ baseUrl: "/api", getAccessToken: () => "token", fetchImpl });
  function Wrapper({ children }: Props): ReactElement {
    const content = <ApiProvider client={client}>{children}</ApiProvider>;
    return content;
  }
  const onDeleteChapterPages = vi.fn(() =>
    Promise.resolve<Result<void>>({ success: true, data: undefined }),
  );
  const showToast = vi.fn();
  const reloadLoadedChapters = vi.fn(() => Promise.resolve<ChapterInfo[] | null>([]));
  const view = renderHook(
    ({ chapterId }) =>
      useComicDetailPages({
        chapterId,
        comicId: "comic",
        isSelectedChapterAvailable: true,
        onLoadPages,
        onLoadChapters: () => Promise.resolve({ success: true, data: [] }),
        onDeleteChapterPages,
        reloadLoadedChapters,
        showToast,
      }),
    { initialProps: { chapterId: "a" }, wrapper: Wrapper, reactStrictMode: strict },
  );
  return {
    ...view,
    response,
    responseAt,
    fetchImpl,
    onLoadPages,
    onDeleteChapterPages,
    showToast,
    reloadLoadedChapters,
  };
}
export async function flush(action: () => void): Promise<void> {
  await act(async () => {
    action();
    await Promise.resolve();
  });
}
