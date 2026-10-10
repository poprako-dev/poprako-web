import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { createDetailActions } from "./use-detail-actions";
import { useComicDetailAssignments } from "./use-comic-detail-assignments";

afterEach(cleanup);

function createAssignmentTestClient(): {
  client: ReturnType<typeof createApiClient>;
  fetchImpl: ReturnType<typeof vi.fn<typeof fetch>>;
} {
  let joined = false;
  const assignment = {
    id: "assignment",
    chapter_id: "chapter",
    user_id: "user",
    roles: 2,
    created_at: 1,
    updated_at: 2,
  };
  const fetchImpl = vi.fn<typeof fetch>().mockImplementation((input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url === "/api/v1/assignments/join" && init?.method === "POST") {
      joined = true;
      return Promise.resolve(Response.json({ code: 0, data: assignment }, { status: 201 }));
    }
    if (url.startsWith("/api/v1/assignments?") && init?.method === "GET") {
      return Promise.resolve(Response.json({ code: 0, data: joined ? [assignment] : [] }));
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "session",
    fetchImpl,
  });
  return { client, fetchImpl };
}

test("joining immediately refreshes assignments and permissions without reopening the dialog", async () => {
  const { client, fetchImpl } = createAssignmentTestClient();
  const actions = createDetailActions(client);
  const showToast = vi.fn();
  const onWorkflowRecordsChanged = vi.fn();
  const { result, rerender } = renderHook(() =>
    useComicDetailAssignments({
      selectedChapterId: "chapter",
      isSelectedChapterAvailable: true,
      currentUserId: "user",
      activeMember: { id: "member", userId: "user", teamId: "team", roles: 2 },
      onLoadAssignments: actions.onLoadAssignments,
      onJoinChapterRole: actions.onJoinChapterRole,
      onWorkflowRecordsChanged,
      showToast,
    }),
  );
  await waitFor(() => {
    expect(result.current.isAssignmentsLoading).toBe(false);
  });
  expect(result.current.canJoinRole("translator")).toBe(true);
  expect(result.current.canTranslateOrProofread).toBe(false);
  await act(async () => {
    await result.current.handleJoinRole("translator");
  });
  expect(result.current.currentAssignment?.id).toBe("assignment");
  expect(result.current.canJoinRole("translator")).toBe(false);
  expect(result.current.canTranslateOrProofread).toBe(true);
  expect(showToast).toHaveBeenCalledExactlyOnceWith("加入分工成功", "success");
  expect(onWorkflowRecordsChanged).toHaveBeenCalledOnce();
  expect(fetchImpl).toHaveBeenCalledTimes(3);
  rerender();
  expect(fetchImpl).toHaveBeenCalledTimes(3);
});
