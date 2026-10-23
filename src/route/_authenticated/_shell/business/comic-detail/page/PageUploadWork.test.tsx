import { useMemo, type JSX } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import { mergePendingPages, usePageTaskView } from "../use-page-task-view";
import { PageList } from "./PageList";
import type * as PageCardModule from "./PageCard";
import {
  clearPageUploadTasks,
  patchPageUploadTask,
  putPageUploadTasks,
  type PageUploadTaskView,
} from "../upload/page-upload-store";

const renderedCard = vi.hoisted(() => vi.fn());
vi.mock("./PageCard", async (importOriginal) => {
  const original = await importOriginal<typeof PageCardModule>();
  return {
    PageCard(props: Parameters<typeof original.PageCard>[0]) {
      renderedCard(props.page.id);
      return <original.PageCard {...props} />;
    },
  };
});

type Props = { chapterId: string; serverPages: PageInfo[] };
const onClickPage = vi.fn();
const onReuploadPage = vi.fn();
const renderedList = vi.fn();
function canReuploadPage(): boolean {
  return true;
}

function UploadPageList({ chapterId, serverPages }: Props): JSX.Element {
  renderedList();
  const view = usePageTaskView(chapterId);
  const pages = useMemo(
    () => mergePendingPages(serverPages, view.taskByPageId),
    [serverPages, view.taskByPageId],
  );
  return (
    <PageList
      pages={pages}
      onClickPage={onClickPage}
      canReuploadPage={canReuploadPage}
      onReuploadPage={onReuploadPage}
      isPageReuploading={(pageId) => view.reuploadingPageIds[pageId] === true}
      uploadProgressByPageId={view.uploadProgressByPageId}
      uploadStatusByPageId={view.uploadStatusByPageId}
      uploadErrorByPageId={view.uploadErrorByPageId}
    />
  );
}

function tasks(chapterId: string): PageUploadTaskView[] {
  return Array.from({ length: 100 }, (_, index) => ({
    taskId: `${chapterId}-${String(index)}`,
    batchId: "batch",
    chapterId,
    pageId: `${chapterId}-${String(index)}`,
    index,
    fileName: `${String(index)}.png`,
    progress: 0,
    attempt: 1,
    status: "uploading",
    error: null,
  }));
}

function pages(chapterId: string): PageInfo[] {
  return tasks(chapterId).map((task) => ({
    id: task.taskId,
    chapterId,
    index: task.index ?? 0,
    imageUrl: "uploaded",
    isUploaded: true,
    totalUnitCount: 0,
    translatedUnitCount: 0,
    proofreadUnitCount: 0,
    createdAt: 0,
    updatedAt: 0,
  }));
}

afterEach(clearPageUploadTasks);

test.each([false, true])("isolates progress work for 100 cards, pending=%s", (pending) => {
  putPageUploadTasks([...tasks("current"), ...tasks("background")]);
  render(<UploadPageList chapterId="current" serverPages={pending ? [] : pages("current")} />);
  expect(renderedCard).toHaveBeenCalledTimes(100);
  renderedCard.mockClear();
  renderedList.mockClear();
  act(() => {
    patchPageUploadTask("background-0", { progress: 35 });
  });
  expect(renderedCard).not.toHaveBeenCalled();
  expect(renderedList).not.toHaveBeenCalled();
  act(() => {
    patchPageUploadTask("current-50", { progress: 35 });
  });
  expect(renderedCard).toHaveBeenCalledExactlyOnceWith("current-50");
  expect(renderedList).toHaveBeenCalledOnce();
  expect(screen.getByText("35%")).toBeInTheDocument();
  renderedCard.mockClear();
  act(() => {
    patchPageUploadTask("current-50", { progress: 35 });
  });
  expect(renderedCard).not.toHaveBeenCalled();
});

test("switching chapters reads the latest background snapshot and failure recovery stays visible", () => {
  putPageUploadTasks([...tasks("current"), ...tasks("background")]);
  const view = render(<UploadPageList chapterId="current" serverPages={[]} />);
  act(() => {
    patchPageUploadTask("background-0", { status: "failed", error: "timeout" });
  });
  view.rerender(<UploadPageList chapterId="background" serverPages={[]} />);
  expect(screen.getByText("上传失败，可重传")).toHaveAttribute("title", "timeout");
  expect(screen.getByRole("button", { name: "重上传第 1 页" })).toBeEnabled();
  const input = view.container.querySelector('input[type="file"]');
  if (!input) throw new Error("重上传控件缺失");
  const replacement = new File(["replacement"], "replacement.png");
  fireEvent.change(input, { target: { files: [replacement] } });
  expect(onReuploadPage).toHaveBeenCalledWith("background-0", replacement);
});

test("memoized rows use updated navigation callbacks", () => {
  const currentPages = pages("current").slice(0, 1);
  const first = vi.fn();
  const second = vi.fn();
  const view = render(<PageList pages={currentPages} onClickPage={first} />);
  view.rerender(<PageList pages={currentPages} onClickPage={second} />);
  fireEvent.click(screen.getByRole("button"));
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledExactlyOnceWith("current-0");
});
