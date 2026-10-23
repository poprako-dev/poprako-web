import type { ReactElement, ReactNode } from "react";
import { renderHook, type RenderHookResult } from "@testing-library/react";
import { vi, type Mock } from "vitest";
import type { ApiClient } from "@/api/client";
import { ApiProvider } from "@/route/business/ApiProvider";
import { useAppStore } from "@/route/business/session/session-store";
import { createTestApi } from "@/test-resource/api-client";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import { useComicPlaygroundWorksets } from "./use-comic-playground-worksets";

type ShowToast = (message: string, type: ToastType) => void;
type WorksetView = RenderHookResult<
  ReturnType<typeof useComicPlaygroundWorksets>,
  { teamId: string }
>;
type Fixture = {
  client: ApiClient;
  showToast: Mock<ShowToast>;
  mount: (teamId?: string, strict?: boolean) => WorksetView;
};

export function workset(id: string, teamId = "first"): WorksetInfo {
  return {
    id,
    teamId,
    name: id,
    index: 0,
    description: "",
    comicCount: 0,
    createdAt: 0,
    updatedAt: 0,
  };
}

export function deferred<Value>(): {
  promise: Promise<Value>;
  resolve: (value: Value) => void;
} {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

export function fixture(): Fixture {
  useAppStore.getState().setAccessToken("workset-test");
  useAppStore.setState({ selectedTeamId: "first" });
  const client = createTestApi();
  const showToast = vi.fn<ShowToast>();
  function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return <ApiProvider client={client}>{children}</ApiProvider>;
  }
  function mount(teamId = "first", strict = false): WorksetView {
    return renderHook((args) => useComicPlaygroundWorksets({ ...args, showToast }), {
      wrapper: Wrapper,
      initialProps: { teamId },
      reactStrictMode: strict,
    });
  }
  return { client, mount, showToast };
}
