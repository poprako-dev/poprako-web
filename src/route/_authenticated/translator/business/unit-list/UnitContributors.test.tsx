import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { useUnitContributors } from "./use-unit-contributors";
import { UnitContributorCache, type UnitUserResolver } from "./unit-contributor-cache";
import { undoUnit } from "../test/unit-undo-fixture";
import { mockUsers } from "../test/base-translator-story-data";

test("text edits and unit reordering retain the author effect and its pending result", async () => {
  const user = [...mockUsers.values()][0];
  if (!user) throw new Error("Missing contributor fixture");
  const onResolveUser = vi.fn<UnitUserResolver>();
  let finish: ((result: Awaited<ReturnType<UnitUserResolver>>) => void) | undefined;
  onResolveUser.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const resolve = vi.spyOn(UnitContributorCache.prototype, "resolve");
  const units = [
    { ...undoUnit("u1", "first"), translatorId: user.id },
    { ...undoUnit("u2", "second"), proofreaderId: user.id },
  ];
  const { result, rerender } = renderHook(useUnitContributors, {
    initialProps: { units, onResolveUser },
  });
  expect(resolve).toHaveBeenCalledTimes(1);
  rerender({
    units: [...units].reverse().map((unit) => ({ ...unit, translatedText: "edited" })),
    onResolveUser,
  });
  expect(resolve).toHaveBeenCalledTimes(1);
  await act(async () => {
    finish?.({ success: true, data: user });
    await Promise.resolve();
  });
  await waitFor(() => {
    expect(result.current(user.id)).toBe(user);
  });
  expect(onResolveUser).toHaveBeenCalledTimes(1);
  rerender({ units: [], onResolveUser });
  rerender({ units, onResolveUser });
  await waitFor(() => {
    expect(result.current(user.id)).toBe(user);
  });
  expect(onResolveUser).toHaveBeenCalledTimes(1);
});
