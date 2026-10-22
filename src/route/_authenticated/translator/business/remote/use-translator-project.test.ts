import { createTestApi } from "@/test-resource/api-client";
import { describe, expect, test, vi } from "vitest";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { Result } from "@/shared/utility/result";
import { loadTranslatorAccess } from "@/route/_authenticated/translator/business/remote/use-translator-project";

function assignment(overrides: Partial<AssignmentInfo> = {}): AssignmentInfo {
  return {
    id: "assignment",
    roles: 0,
    chapterId: "chapter",
    userId: "user",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("loadTranslatorAccess", () => {
  test("reports assignment load failures instead of treating them as no access", async () => {
    const loadAssignments = vi.fn(() =>
      Promise.resolve({
        success: false as const,
        error: "assignment service unavailable",
      }),
    );

    const result = await loadTranslatorAccess(createTestApi(), "chapter", "user", loadAssignments);

    expect(result).toEqual({
      success: false,
      error: "assignment service unavailable",
    });
  });

  test("grants no roles when a successful load has no assignment", async () => {
    const loadAssignments = vi.fn(() => Promise.resolve({ success: true as const, data: [] }));

    const result = await loadTranslatorAccess(createTestApi(), "chapter", "user", loadAssignments);

    expect(result).toEqual({
      success: true,
      data: { canTranslate: false, canProofread: false },
    });
  });

  test("derives capabilities from the current user's assignment", async () => {
    const loadAssignments = vi.fn(() =>
      Promise.resolve({
        success: true as const,
        data: [assignment({ roles: 4 })],
      }),
    ) satisfies (args: {
      chapterId: string;
      offset: number;
      limit: number;
      includes?: string[] | undefined;
    }) => Promise<Result<AssignmentInfo[]>>;

    const result = await loadTranslatorAccess(createTestApi(), "chapter", "user", loadAssignments);

    expect(result).toEqual({
      success: true,
      data: { canTranslate: false, canProofread: true },
    });
  });
});

test("loads later chapter assignment pages until the current user is found", async () => {
  const loadAssignments = vi
    .fn()
    .mockResolvedValueOnce({
      success: true,
      data: Array.from({ length: 100 }, (_, index) =>
        assignment({ userId: `other-${String(index)}` }),
      ),
    })
    .mockResolvedValueOnce({ success: true, data: [assignment({ roles: 6 })] });
  const client = createTestApi();

  const result = await loadTranslatorAccess(client, "chapter", "user", loadAssignments);

  expect(loadAssignments).toHaveBeenNthCalledWith(
    1,
    client,
    { chapterId: "chapter", offset: 0, limit: 100 },
    undefined,
  );
  expect(loadAssignments).toHaveBeenNthCalledWith(
    2,
    client,
    { chapterId: "chapter", offset: 100, limit: 100 },
    undefined,
  );
  expect(result).toEqual({
    success: true,
    data: { canTranslate: true, canProofread: true },
  });
});

test("cancelled assignment pagination forwards the signal and cannot load the next page", async () => {
  const request = new AbortController();
  let finish!: (result: Result<AssignmentInfo[]>) => void;
  const response = new Promise<Result<AssignmentInfo[]>>((resolve) => {
    finish = resolve;
  });
  const load = vi.fn(() => response);
  const client = createTestApi();
  const pending = loadTranslatorAccess(client, "chapter", "user", load, () => true, request.signal);
  request.abort();
  finish({
    success: true,
    data: Array.from({ length: 100 }, () => assignment({ userId: "other" })),
  });
  expect(await pending).toEqual({ success: false, error: "会话已失效", failureKind: "aborted" });
  expect(load).toHaveBeenCalledExactlyOnceWith(
    client,
    { chapterId: "chapter", offset: 0, limit: 100 },
    request.signal,
  );
});
