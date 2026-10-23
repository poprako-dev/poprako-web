import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { Result } from "@/shared/utility/result";
import { deferred } from "@/test-resource/deferred";
import { useComicDetailAssignments } from "./use-comic-detail-assignments";
import { makeMember } from "./test/comic-detail-story-fixtures";
import type { DetailContract } from "./comic-detail-type";

afterEach(cleanup);

function assignment(chapterId: string, roles = 32): AssignmentInfo {
  return {
    id: "assignment-" + chapterId,
    chapterId,
    userId: "user",
    roles,
    createdAt: 0,
    updatedAt: 0,
  };
}

function scenario(): Parameters<typeof useComicDetailAssignments>[0] {
  return {
    selectedChapterId: "pinned",
    isSelectedChapterAvailable: true,
    pinnedChapterId: "pinned",
    currentUserId: "user",
    activeMember: makeMember("user", "Member"),
    onLoadAssignments: vi
      .fn<DetailContract["onLoadAssignments"]>()
      .mockResolvedValue({ success: true, data: [assignment("pinned")] }),
    showToast: vi.fn(),
  };
}

test("selected and pinned share one request and refreshed permissions", async () => {
  const args = scenario();
  const load = vi.mocked(args.onLoadAssignments);
  load.mockResolvedValueOnce({ success: true, data: [] });
  const { result } = renderHook(() => useComicDetailAssignments(args));
  await waitFor(() => {
    expect(result.current.isAssignmentsLoading).toBe(false);
  });
  expect(load).toHaveBeenCalledOnce();
  expect(result.current.canCreateChapter).toBe(false);
  await act(async () => {
    await result.current.reloadAssignments();
  });
  expect(load).toHaveBeenCalledTimes(2);
  expect(result.current.canCreateChapter).toBe(true);
  expect(result.current.currentAssignment?.id).toBe("assignment-pinned");
});

test("a pinned read is reused when the selected chapter becomes available", async () => {
  const args = scenario();
  const request = deferred<Result<AssignmentInfo[]>>();
  vi.mocked(args.onLoadAssignments).mockReturnValue(request.promise);
  const { result, rerender } = renderHook(
    (available) =>
      useComicDetailAssignments({
        ...args,
        isSelectedChapterAvailable: available,
      }),
    { initialProps: false },
  );
  rerender(true);
  expect(args.onLoadAssignments).toHaveBeenCalledOnce();
  await act(async () => {
    request.resolve({ success: true, data: [assignment("pinned")] });
    await request.promise;
  });
  expect(result.current.canCreateChapter).toBe(true);
  expect(result.current.currentAssignment?.id).toBe("assignment-pinned");
});

test("switching selection does not cancel the pinned consumer's pending read", async () => {
  const args = scenario();
  const pinned = deferred<Result<AssignmentInfo[]>>();
  vi.mocked(args.onLoadAssignments).mockImplementation((id) =>
    id === "pinned"
      ? pinned.promise
      : Promise.resolve({ success: true, data: [assignment(id, 2)] }),
  );
  const { result, rerender } = renderHook(
    (id) =>
      useComicDetailAssignments({
        ...args,
        selectedChapterId: id,
      }),
    { initialProps: "pinned" },
  );
  rerender("other");
  await waitFor(() => {
    expect(result.current.currentAssignment?.chapterId).toBe("other");
  });
  await act(async () => {
    pinned.resolve({ success: true, data: [assignment("pinned")] });
    await pinned.promise;
  });
  expect(result.current.currentAssignment?.chapterId).toBe("other");
  expect(result.current.canCreateChapter).toBe(true);
  expect(args.onLoadAssignments).toHaveBeenCalledTimes(2);
});

test("a mutation refresh supersedes an older read for both consumers", async () => {
  const args = scenario();
  const old = deferred<Result<AssignmentInfo[]>>();
  vi.mocked(args.onLoadAssignments).mockReturnValueOnce(old.promise);
  const { result } = renderHook(() => useComicDetailAssignments(args));
  await act(async () => {
    await result.current.reloadAssignments();
  });
  expect(result.current.canCreateChapter).toBe(true);
  await act(async () => {
    old.resolve({ success: true, data: [] });
    await old.promise;
  });
  expect(result.current.canCreateChapter).toBe(true);
  expect(result.current.assignments).toEqual([assignment("pinned")]);
});

test("provided pinned assignments are shared and explicit refresh replaces them", async () => {
  const args = { ...scenario(), pinnedChapterAssignments: [assignment("pinned")] };
  vi.mocked(args.onLoadAssignments).mockResolvedValue({ success: true, data: [] });
  const { result, rerender } = renderHook(() => useComicDetailAssignments(args));
  await waitFor(() => {
    expect(result.current.canCreateChapter).toBe(true);
  });
  expect(args.onLoadAssignments).not.toHaveBeenCalled();
  await act(async () => {
    await result.current.reloadAssignments();
  });
  rerender();
  expect(result.current.canCreateChapter).toBe(false);
  expect(args.onLoadAssignments).toHaveBeenCalledOnce();
});

test("old team reads cannot populate the replacement owner's permissions", async () => {
  const args = scenario();
  const old = deferred<Result<AssignmentInfo[]>>();
  vi.mocked(args.onLoadAssignments)
    .mockReturnValueOnce(old.promise)
    .mockResolvedValue({ success: true, data: [] });
  const { result, rerender } = renderHook(
    (teamId) =>
      useComicDetailAssignments({
        ...args,
        activeMember: makeMember("user", "Member", { teamId }),
      }),
    { initialProps: "team-a" },
  );
  rerender("team-b");
  await waitFor(() => {
    expect(result.current.isAssignmentsLoading).toBe(false);
  });
  await act(async () => {
    old.resolve({ success: true, data: [assignment("pinned")] });
    await old.promise;
  });
  expect(result.current.canCreateChapter).toBe(false);
  expect(result.current.assignments).toEqual([]);
  expect(args.onLoadAssignments).toHaveBeenCalledTimes(2);
});

test("new pinned props update both consumers without reverting local edits on selection", async () => {
  const args = scenario();
  const original = [assignment("pinned")];
  const { result, rerender } = renderHook(
    ({ selectedChapterId, pinnedChapterAssignments }) =>
      useComicDetailAssignments({ ...args, selectedChapterId, pinnedChapterAssignments }),
    { initialProps: { selectedChapterId: "pinned", pinnedChapterAssignments: original } },
  );
  await waitFor(() => {
    expect(result.current.canCreateChapter).toBe(true);
  });
  act(() => {
    result.current.setAssignments([]);
  });
  rerender({ selectedChapterId: "other", pinnedChapterAssignments: original });
  await waitFor(() => {
    expect(result.current.isAssignmentsLoading).toBe(false);
  });
  rerender({ selectedChapterId: "pinned", pinnedChapterAssignments: original });
  expect(result.current.canCreateChapter).toBe(false);
  rerender({ selectedChapterId: "pinned", pinnedChapterAssignments: [assignment("pinned")] });
  expect(result.current.canCreateChapter).toBe(true);
  expect(result.current.currentAssignment?.roles).toBe(32);
  rerender({ selectedChapterId: "pinned", pinnedChapterAssignments: [] });
  expect(result.current.canCreateChapter).toBe(false);
  expect(result.current.assignments).toEqual([]);
  expect(args.onLoadAssignments).toHaveBeenCalledOnce();
});

test("unmount aborts owner requests and ignores late errors and mutation callbacks", async () => {
  const args = scenario();
  const pending = deferred<Result<AssignmentInfo[]>>();
  vi.mocked(args.onLoadAssignments).mockReturnValue(pending.promise);
  const { result, unmount } = renderHook(() => useComicDetailAssignments(args));
  const refresh = result.current.reloadAssignments;
  const signal = vi.mocked(args.onLoadAssignments).mock.calls[0]?.[1];
  expect(signal?.aborted).toBe(false);
  unmount();
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    pending.resolve({ success: false, error: "old owner error" });
    await pending.promise;
    await refresh();
  });
  expect(args.showToast).not.toHaveBeenCalled();
  expect(args.onLoadAssignments).toHaveBeenCalledOnce();
});
