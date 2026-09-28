import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { SettingsPanel } from "./SettingsPanel";
import { ApiProvider } from "@/route/business/ApiProvider";
import { ReadySessionProvider } from "@/route/business/session/ReadySessionProvider";
import { useAppStore } from "@/route/business/session/session-store";
import { createApiClient } from "@/api/client";
const navigate = vi.hoisted(() => vi.fn());
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
afterEach(() => {
  useAppStore.getState().setAccessToken(null);
  vi.restoreAllMocks();
});
test("settings stays light-only and clears persisted login even if logout fails", async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ code: 1, message: "offline" }, { status: 503 }));
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => useAppStore.getState().accessToken,
    fetchImpl: request,
  });
  const login = {
    userInfo: {
      id: "user",
      name: "用户",
      qq: "10000",
      avatarUrl: "",
      isSuperAdmin: false,
      lastActiveAt: 1,
      createdAt: 1,
      updatedAt: 1,
    },
    memberInfos: [],
  };
  useAppStore.getState().setAccessToken("token");
  useAppStore.getState().setLoginState(login);
  const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  render(
    <ApiProvider client={client}>
      <ReadySessionProvider value={{ ...login, generation: useAppStore.getState().generation }}>
        <SettingsPanel />
      </ReadySessionProvider>
    </ApiProvider>,
  );
  expect(screen.queryByText(/深色|跟随系统|主题模式/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /退出登录/ }));
  await waitFor(() => {
    expect(navigate).toHaveBeenCalledWith({ to: "/login" });
  });
  expect(request.mock.calls[0]?.[0]).toBe("/api/v1/auth/logout");
  expect(useAppStore.getState()).toMatchObject({
    accessToken: null,
    loginState: null,
    selectedTeamId: null,
  });
  expect(JSON.parse(localStorage.getItem("app-store") ?? "null")).toMatchObject({
    state: { accessToken: null, selectedTeamId: null },
  });
  expect(error).toHaveBeenCalledOnce();
});
