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
