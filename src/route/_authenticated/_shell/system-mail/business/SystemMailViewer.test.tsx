import { StrictMode, type ReactElement } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { ApiClient } from "@/api/client";
import { ApiProvider } from "@/route/business/ApiProvider";
import { useAppStore } from "@/route/business/session/session-store";
import { useMailStore } from "@/route/_authenticated/_shell/business/mail/mail-store";
import { useMailRefresh } from "@/route/_authenticated/_shell/business/mail/use-mail-refresh";
import { MAIL_STALE_TIME_MS } from "@/route/_authenticated/_shell/business/mail/mail-state";
import {
  mail,
  mailResponse,
  makeMailClient,
  pendingMailResponse,
} from "@/route/_authenticated/_shell/business/mail/mail-test-fixture";
import { requestAddress } from "@/test-resource/api-client";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { SystemMailViewer } from "./SystemMailViewer";

type Props = { mailbox: boolean };

function ShellFixture({ mailbox }: Props): ReactElement {
  useMailRefresh("unread");
  const hasUnread = useMailStore((state) => state.hasUnread);
  return (
    <>
      <output aria-label="未读状态">{String(hasUnread)}</output>
      {mailbox && <SystemMailViewer />}
    </>
  );
}

function mailScene(client: ApiClient, mailbox: boolean): ReactElement {
  return (
    <StrictMode>
      <ApiProvider client={client}>
        <ShellFixture mailbox={mailbox} />
      </ApiProvider>
    </StrictMode>
  );
}

beforeEach(() => {
  useAppStore.getState().setAccessToken("mail-ui-session");
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      disconnect = vi.fn();
    },
  );
});

afterEach(() => {
  cleanup();
  useAppStore.getState().setAccessToken(null);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("shell probes unread mail and entering or revisiting the mailbox shares its cached page", async () => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(mailResponse([mail]))
    .mockResolvedValueOnce(mailResponse([mail]));
  const client = makeMailClient(fetchImpl);
  const view = render(mailScene(client, false));
  await waitFor(() => expect(screen.getByLabelText("未读状态")).toHaveTextContent("true"));
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  expect(requestAddress(fetchImpl.mock.calls[0]?.[0])).toContain("is_read=false&offset=0&limit=1");
  view.rerender(mailScene(client, true));
  expect(await screen.findByText("内容")).toBeVisible();
  expect(requestAddress(fetchImpl.mock.calls[1]?.[0])).toContain("offset=0&limit=16");
  view.rerender(mailScene(client, false));
  view.rerender(mailScene(client, true));
  expect(screen.getByText("内容")).toBeVisible();
  expect(fetchImpl).toHaveBeenCalledTimes(2);
});

test("refocusing a stale mailbox keeps its content mounted until new mail arrives", async () => {
  const clock = vi.spyOn(Date, "now").mockReturnValue(1_000);
  const fetchImpl = vi.fn<typeof fetch>().mockImplementation((input) => {
    const unread = requestAddress(input).includes("is_read=false");
    return Promise.resolve(mailResponse(unread ? [] : [mail]));
  });
  const client = makeMailClient(fetchImpl);
  render(mailScene(client, true));
  const original = await screen.findByText("内容");
  const refreshedPage = pendingMailResponse();
  fetchImpl.mockImplementation((input) =>
    requestAddress(input).includes("is_read=false")
      ? Promise.resolve(mailResponse([mail]))
      : refreshedPage.promise,
  );
  clock.mockReturnValue(1_000 + MAIL_STALE_TIME_MS);
  act(() => {
    window.dispatchEvent(new Event("focus"));
  });
  expect(useMailStore.getState().isRefreshing).toBe(true);
  expect(screen.getByText("内容")).toBe(original);
  await act(async () => {
    refreshedPage.finish(mailResponse([{ ...mail, id: "new-mail", title: "新消息" }, mail]));
    await useMailStore.getState().loadInitial(client);
  });
  expect(screen.getByText("新消息")).toBeVisible();
  expect(screen.getByLabelText("未读状态")).toHaveTextContent("true");
  expect(fetchImpl).toHaveBeenCalledTimes(4);
});

test("a failed background refresh retains the mailbox and reports the existing error toast", async () => {
  const clock = vi.spyOn(Date, "now").mockReturnValue(1_000);
  const toast = vi.spyOn(useToastStore.getState(), "showToast");
  const fetchImpl = vi.fn<typeof fetch>().mockImplementation((input) => {
    const unread = requestAddress(input).includes("is_read=false");
    return Promise.resolve(mailResponse(unread ? [] : [mail]));
  });
  const client = makeMailClient(fetchImpl);
  render(mailScene(client, true));
  const original = await screen.findByText("内容");
  fetchImpl.mockImplementation(() =>
    Promise.resolve(Response.json({ code: 503, message: "邮件服务暂不可用" }, { status: 503 })),
  );
  clock.mockReturnValue(1_000 + MAIL_STALE_TIME_MS);
  act(() => {
    window.dispatchEvent(new Event("focus"));
  });
  await waitFor(() => {
    expect(toast).toHaveBeenCalledWith("邮件服务暂不可用", "error");
  });
  expect(screen.getByText("内容")).toBe(original);
  expect(screen.queryByRole("button", { name: "重试" })).not.toBeInTheDocument();
});

test("mounted shell and mailbox refresh for the next identity instead of keeping the old page", async () => {
  const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(mailResponse([mail]));
  const client = makeMailClient(fetchImpl);
  render(mailScene(client, true));
  await screen.findByText("内容");
  fetchImpl.mockImplementation((input) =>
    Promise.resolve(
      mailResponse(
        requestAddress(input).includes("is_read=false")
          ? []
          : [{ ...mail, id: "other-mail", content: "另一个身份的内容", is_read: true }],
      ),
    ),
  );
  act(() => {
    useAppStore.getState().setAccessToken("next-mail-session");
  });
  expect(await screen.findByText("另一个身份的内容")).toBeVisible();
  expect(screen.queryByText("内容")).not.toBeInTheDocument();
  expect(screen.getByLabelText("未读状态")).toHaveTextContent("false");
  expect(fetchImpl).toHaveBeenCalledTimes(4);
});
