import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState, type ReactElement } from "react";
import { expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { requestAddress } from "@/test-resource/api-client";
import { OnlineUserPopover } from "../OnlineUserPopover";
import { deferredResponse, onlineUserResponse, workspaceSession } from "../workspace-test-fixture";
import { WorkspaceTestProvider } from "../WorkspaceTestFixture";
import { useOnlineUserIds, useOnlineUsers } from "./use-online-users";

function Probe({ teamId = "team-a" }: { teamId?: string }): ReactElement {
  const [open, setOpen] = useState(false);
  const ids = useOnlineUserIds(teamId);
  const details = useOnlineUsers(teamId, ids, open);
  return (
    <OnlineUserPopover
      onlineCount={ids.userIds.size}
      countStatus={ids.status}
      users={details.users}
      status={details.status}
      onOpenChange={setOpen}
    />
  );
}

test("fetches IDs first and only fetches profiles after opening, with reuse on reopen", async () => {
  const fetchImpl = vi.fn<typeof fetch>((input) =>
    Promise.resolve(
      Response.json({
        code: 0,
        data: requestAddress(input).endsWith("online-users")
          ? ["one", "two"]
          : onlineUserResponse(requestAddress(input).endsWith("one") ? "one" : "two"),
      }),
    ),
  );
  const client = createApiClient({ baseUrl: "/api", getAccessToken: () => "token", fetchImpl });
  render(
    <WorkspaceTestProvider client={client} session={workspaceSession()}>
      <Probe />
    </WorkspaceTestProvider>,
  );
  const trigger = await screen.findByRole("button", { name: "2 人在线" });
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  fireEvent.click(trigger);
  await screen.findByText("one");
  expect(screen.getByText("two")).toBeVisible();
  expect(fetchImpl).toHaveBeenCalledTimes(3);
  fireEvent.keyDown(document, { key: "Escape" });
  fireEvent.click(trigger);
  await screen.findByText("one");
  expect(fetchImpl).toHaveBeenCalledTimes(3);
});

test("closing cancels profile reads while preserving the independent online count", async () => {
  const profile = deferredResponse();
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ code: 0, data: ["one"] }))
    .mockReturnValueOnce(profile.promise);
  const client = createApiClient({ baseUrl: "/api", getAccessToken: () => "token", fetchImpl });
  render(
    <WorkspaceTestProvider client={client} session={workspaceSession()}>
      <Probe />
    </WorkspaceTestProvider>,
  );
  fireEvent.click(await screen.findByRole("button", { name: "1 人在线" }));
  await waitFor(() => {
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  const signal = fetchImpl.mock.calls[1]?.[1]?.signal;
  fireEvent.keyDown(document, { key: "Escape" });
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    profile.resolve(onlineUserResponse("one"));
    await profile.promise;
  });
  expect(screen.getByRole("button", { name: "1 人在线" })).toBeVisible();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("profile caches are isolated when the same user's session generation changes", async () => {
  let version = "old profile";
  const fetchImpl = vi.fn<typeof fetch>((input) =>
    Promise.resolve(
      Response.json({
        code: 0,
        data: requestAddress(input).endsWith("online-users")
          ? ["one"]
          : { ...onlineUserResponse("one"), nickname: version },
      }),
    ),
  );
  const client = createApiClient({ baseUrl: "/api", getAccessToken: () => "token", fetchImpl });
  const view = render(
    <WorkspaceTestProvider client={client} session={workspaceSession(1)}>
      <Probe />
    </WorkspaceTestProvider>,
  );
  fireEvent.click(await screen.findByRole("button", { name: "1 人在线" }));
  await screen.findByText("old profile");
  version = "new profile";
  view.rerender(
    <WorkspaceTestProvider client={client} session={workspaceSession(2)}>
      <Probe />
    </WorkspaceTestProvider>,
  );
  expect(screen.queryByText("old profile")).not.toBeInTheDocument();
  await screen.findByText("new profile");
  expect(fetchImpl).toHaveBeenCalledTimes(4);
});

test("provided users still work without session or API providers", () => {
  render(<OnlineUserPopover onlineCount={0} users={[]} status="ready" />);
  fireEvent.click(screen.getByRole("button", { name: "0 人在线" }));
  expect(screen.getByText("暂无在线组员")).toBeVisible();
});

test("switching teams aborts an online ID read and ignores its late result", async () => {
  const old = deferredResponse();
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce(Response.json({ code: 0, data: ["new-member"] }));
  const client = createApiClient({ baseUrl: "/api", getAccessToken: () => "token", fetchImpl });
  const view = render(
    <WorkspaceTestProvider client={client} session={workspaceSession()}>
      <Probe />
    </WorkspaceTestProvider>,
  );
  const signal = fetchImpl.mock.calls[0]?.[1]?.signal;
  view.rerender(
    <WorkspaceTestProvider client={client} session={workspaceSession()}>
      <Probe teamId="team-b" />
    </WorkspaceTestProvider>,
  );
  expect(signal?.aborted).toBe(true);
  await screen.findByRole("button", { name: "1 人在线" });
  await act(async () => {
    old.resolve(["one", "two"]);
    await old.promise;
  });
  expect(screen.getByRole("button", { name: "1 人在线" })).toBeVisible();
  expect(fetchImpl).toHaveBeenCalledTimes(2);
});
