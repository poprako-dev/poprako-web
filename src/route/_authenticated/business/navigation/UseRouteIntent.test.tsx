import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { useRouteIntent } from "./use-route-intent";

const target = { id: "translator" };
const other = { id: "reviewer" };
const loadRouteChunk = vi.fn(() => Promise.resolve());
const preloadRoute = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    routesById: {
      "/_authenticated/translator/$chapterId/$pageId/": target,
      "/_authenticated/reviewer/$chapterId/$pageId/": other,
    },
    loadRouteChunk,
    preloadRoute,
  }),
}));

test("intent loads only the target code without running route preload", async () => {
  const { result } = renderHook(useRouteIntent);
  await act(async () => {
    result.current("/_authenticated/translator/$chapterId/$pageId/");
    await Promise.resolve();
  });
  expect(loadRouteChunk).toHaveBeenCalledExactlyOnceWith(target);
  expect(preloadRoute).not.toHaveBeenCalled();
});

test("a failed speculative chunk load does not reject the interaction", async () => {
  loadRouteChunk.mockRejectedValueOnce(new Error("offline"));
  const { result } = renderHook(useRouteIntent);
  await act(async () => {
    result.current("/_authenticated/reviewer/$chapterId/$pageId/");
    await Promise.resolve();
  });
  expect(loadRouteChunk).toHaveBeenCalledWith(other);
});
