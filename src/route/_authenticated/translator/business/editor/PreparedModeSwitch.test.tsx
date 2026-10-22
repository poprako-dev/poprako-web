import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { createModuleResource } from "@/shared/utility/module-resource";
import { usePreparedModeSwitch } from "./use-prepared-mode-switch";
import type { TranslatorMode } from "../unit/translator-mode";

const mock = vi.hoisted((): { resource: unknown; toast: ReturnType<typeof vi.fn> } => ({
  resource: null,
  toast: vi.fn(),
}));
vi.mock("./translator-mode-module", () => ({ translatorModeModule: () => mock.resource }));
vi.mock("@/shared/component/notification-toast/toast-store", () => ({
  useToastStore: { getState: () => ({ showToast: mock.toast }) },
}));

function deferred(): {
  promise: Promise<object>;
  resolve: (value: object) => void;
  reject: (error: Error) => void;
} {
  let resolve!: (value: object) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<object>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  mock.toast.mockClear();
});

test("commits once only after the complete target mode is ready", async () => {
  const load = deferred();
  const loader = vi.fn(() => load.promise);
  mock.resource = createModuleResource(loader);
  const commit = vi.fn();
  const hook = renderHook(() =>
    usePreparedModeSwitch({ currentView: "translate", nextView: "readOnly", commit }),
  );
  act(() => {
    hook.result.current();
    hook.result.current();
  });
  expect(commit).not.toHaveBeenCalled();
  await act(async () => {
    load.resolve({});
    await load.promise;
  });
  expect(loader).toHaveBeenCalledTimes(1);
  expect(commit).toHaveBeenCalledTimes(1);
});

test("a failed native module keeps the current view and asks for a saved-page refresh", async () => {
  const loader = vi
    .fn<() => Promise<object>>()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue({});
  mock.resource = createModuleResource(loader);
  const commit = vi.fn();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const hook = renderHook(() =>
    usePreparedModeSwitch({ currentView: "translate", nextView: "readOnly", commit }),
  );
  act(() => {
    hook.result.current();
  });
  await waitFor(() => {
    expect(mock.toast).toHaveBeenCalledWith("加载模式失败，请保存后刷新页面重试", "error");
  });
  expect(commit).not.toHaveBeenCalled();
  act(() => {
    hook.result.current();
  });
  expect(commit).not.toHaveBeenCalled();
  expect(loader).toHaveBeenCalledTimes(1);
  vi.restoreAllMocks();
});

test("a mode finishing after unmount cannot update the session", async () => {
  const load = deferred();
  mock.resource = createModuleResource(() => load.promise);
  const commit = vi.fn();
  const hook = renderHook(() =>
    usePreparedModeSwitch({ currentView: "translate", nextView: "readOnly", commit }),
  );
  act(() => {
    hook.result.current();
  });
  hook.unmount();
  await act(async () => {
    load.resolve({});
    await load.promise;
  });
  expect(commit).not.toHaveBeenCalled();
});

test("permission changes invalidate a pending mode switch", async () => {
  const load = deferred();
  mock.resource = createModuleResource(() => load.promise);
  const commit = vi.fn();
  const hook = renderHook(
    ({ nextView }: { nextView: TranslatorMode | undefined }) =>
      usePreparedModeSwitch({ currentView: "translate", nextView, commit }),
    { initialProps: { nextView: "readOnly" as TranslatorMode | undefined } },
  );
  act(() => {
    hook.result.current();
  });
  hook.rerender({ nextView: undefined });
  await act(async () => {
    load.resolve({});
    await load.promise;
  });
  expect(commit).not.toHaveBeenCalled();
});
