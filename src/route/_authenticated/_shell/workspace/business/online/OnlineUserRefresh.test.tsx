import { act, renderHook, waitFor, type RenderHookResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { onlineUserResponse, workspaceSession } from "../workspace-test-fixture";
import { WorkspaceTestProvider } from "../WorkspaceTestFixture";
import { useOnlineUsers } from "./use-online-users";

type Props = { ids: ReadonlySet<string>; enabled: boolean };

function setup(
  fetchImpl: typeof fetch,
  initialProps: Props,
): RenderHookResult<ReturnType<typeof useOnlineUsers>, Props> {
  const client = createApiClient({ baseUrl: "/api", getAccessToken: () => "token", fetchImpl });
  const session = workspaceSession();
  function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <WorkspaceTestProvider client={client} session={session}>
        {children}
      </WorkspaceTestProvider>
    );
  }
  return renderHook(
    ({ ids, enabled }: Props) =>
      useOnlineUsers("team-a", { userIds: ids, status: "ready" }, enabled),
    { wrapper: Wrapper, initialProps },
  );
}

test("a new successful ID snapshot retries failed profiles even when its IDs are unchanged", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ code: 503, message: "offline" }, { status: 503 }))
    .mockResolvedValueOnce(Response.json({ code: 0, data: onlineUserResponse("one") }));
  const ids = new Set(["one"]);
  const view = setup(fetchImpl, { ids, enabled: true });
  await waitFor(() => {
    expect(view.result.current.status).toBe("error");
  });
  await act(async () => {
    view.rerender({ ids, enabled: true });
    await Promise.resolve();
  });
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  view.rerender({ ids: new Set(["one"]), enabled: true });
  await waitFor(() => {
    expect(view.result.current.status).toBe("ready");
    expect(view.result.current.users[0]?.id).toBe("one");
  });
  expect(fetchImpl).toHaveBeenCalledTimes(2);
});

test("same-ID refreshes reuse fresh profiles, revalidate expired profiles and stay idle when closed", async () => {
  const clock = vi.spyOn(Date, "now").mockReturnValue(0);
  let nickname = "first";
  const fetchImpl = vi.fn<typeof fetch>(() =>
    Promise.resolve(Response.json({ code: 0, data: { ...onlineUserResponse("one"), nickname } })),
  );
  const view = setup(fetchImpl, { ids: new Set(["one"]), enabled: true });
  await waitFor(() => {
    expect(view.result.current.users[0]?.name).toBe("first");
  });
  await act(async () => {
    view.rerender({ ids: new Set(["one"]), enabled: true });
    await Promise.resolve();
  });
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  clock.mockReturnValue(300_001);
  nickname = "refreshed";
  view.rerender({ ids: new Set(["one"]), enabled: true });
  await waitFor(() => {
    expect(view.result.current.users[0]?.name).toBe("refreshed");
  });
  expect(fetchImpl).toHaveBeenCalledTimes(2);
  view.rerender({ ids: new Set(["one"]), enabled: false });
  clock.mockReturnValue(600_002);
  nickname = "reopened";
  await act(async () => {
    view.rerender({ ids: new Set(["one"]), enabled: false });
    await Promise.resolve();
  });
  expect(fetchImpl).toHaveBeenCalledTimes(2);
  view.rerender({ ids: new Set(["one"]), enabled: true });
  await waitFor(() => {
    expect(view.result.current.users[0]?.name).toBe("reopened");
  });
  expect(fetchImpl).toHaveBeenCalledTimes(3);
});
