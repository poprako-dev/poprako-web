import { act, cleanup, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { useComicDetailImport } from "./use-comic-detail-import";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

type ImportArgs = Parameters<typeof useComicDetailImport>[0];

function createArgs(): ImportArgs {
  return {
    selectedChapterId: "chapter-1",
    onImportChapter: vi.fn(() =>
      Promise.resolve({
        success: true as const,
        data: { importedPageSourceCount: 1, importedUnitCount: 1 },
      }),
    ),
    reloadCurrentPages: vi.fn(() => Promise.resolve()),
    reloadLoadedChapters: vi.fn(() => Promise.resolve()),
    onWorkflowRecordsChanged: vi.fn(),
    showToast: vi.fn(),
  };
}

function selectFile(name: string): ChangeEvent<HTMLInputElement> {
  const file = new File(["content"], name);
  return {
    target: { files: [file], value: name },
  } as unknown as ChangeEvent<HTMLInputElement>;
}

test("stores the detected format and forwards the selected target", async () => {
  const args = createArgs();
  const { result } = renderHook(() => useComicDetailImport(args));

  act(() => {
    result.current.handleImportFileChange(selectFile("chapter.json"));
  });
  expect(result.current.pendingImport?.format).toBe("json");

  await act(async () => {
    await result.current.confirmImport("overwrite", "both");
  });

  expect(args.onImportChapter).toHaveBeenCalledWith({
    chapterId: "chapter-1",
    content: "content",
    format: "json",
    mode: "overwrite",
    target: "both",
  });
  expect(args.reloadCurrentPages).toHaveBeenCalledOnce();
  expect(args.reloadLoadedChapters).toHaveBeenCalledOnce();
  expect(args.onWorkflowRecordsChanged).toHaveBeenCalledOnce();
  expect(args.showToast).toHaveBeenCalledWith("导入成功：1 页，1 单元", "success");
});

test("maps txt uploads to LabelPlus before importing", async () => {
  const args = createArgs();
  const { result } = renderHook(() => useComicDetailImport(args));

  act(() => {
    result.current.handleImportFileChange(selectFile("chapter.txt"));
  });
  expect(result.current.pendingImport?.format).toBe("lp");

  await act(async () => {
    await result.current.confirmImport("keep", "proofread");
  });

  expect(args.onImportChapter).toHaveBeenCalledWith({
    chapterId: "chapter-1",
    content: "content",
    format: "lp",
    mode: "keep",
    target: "proofread",
  });
});

test("rejects unsupported files without opening the dialog", () => {
  const args = createArgs();
  const { result } = renderHook(() => useComicDetailImport(args));

  act(() => {
    result.current.handleImportFileChange(selectFile("chapter.zip"));
  });

  expect(result.current.pendingImport).toBeNull();
  expect(args.showToast).toHaveBeenCalledWith("仅支持 .json 或 .txt 文件", "error");
});
