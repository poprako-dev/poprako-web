import type { ReactElement, ReactNode } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { ReadySessionProvider } from "./ReadySessionProvider";
import { useAppStore } from "./session-store";
import { useSessionOperation } from "./use-session-operation";

function mountOperation(): ReturnType<
  typeof renderHook<ReturnType<typeof useSessionOperation>, unknown>
> {
  useAppStore.getState().setAccessToken("token");
  const value = {
    generation: useAppStore.getState().generation,
    memberInfos: [],
    userInfo: {
      id: "u",
      qq: "10000",
      name: "成员",
      avatarUrl: "",
      isSuperAdmin: false,
      lastActiveAt: 0,
      createdAt: 0,
      updatedAt: 0,
    },
  };
  function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return <ReadySessionProvider value={value}>{children}</ReadySessionProvider>;
  }
  return renderHook(useSessionOperation, { wrapper: Wrapper });
}
afterEach(() => {
  cleanup();
  useAppStore.getState().setAccessToken(null);
});
test("replacement operations and unmount abort unfinished upload work", () => {
  const view = mountOperation();
  const first = view.result.current();
  const second = view.result.current();
  expect(first.signal.aborted).toBe(true);
  expect(() => {
    first.assertCurrent();
  }).toThrow();
  expect(second.isCurrent()).toBe(true);
  view.unmount();
  expect(second.signal.aborted).toBe(true);
});
test("a same-token login is a new generation and invalidates the old operation", () => {
  const view = mountOperation();
  const operation = view.result.current();
  act(() => {
    useAppStore.getState().setAccessToken("token");
  });
  expect(operation.signal.aborted).toBe(true);
  expect(operation.isCurrent()).toBe(false);
  expect(() => {
    operation.assertCurrent();
  }).toThrow("会话操作已取消");
});
