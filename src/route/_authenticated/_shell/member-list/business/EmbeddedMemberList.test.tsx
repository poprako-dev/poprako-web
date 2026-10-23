import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { MemberInfo } from "@/route/business/identity/member";
import type { PageLoader } from "@/shared/hook/paged-list";
import type { Result } from "@/shared/utility/result";
import { deferred } from "@/test-resource/deferred";
import { EmbeddedMemberList } from "./EmbeddedMemberList";

afterEach(() => vi.restoreAllMocks());

function member(id: string): MemberInfo {
  return {
    id,
    userId: id,
    teamId: "team",
    roles: 0,
    user: {
      id,
      name: id,
      qq: "",
      avatarUrl: "",
      isSuperAdmin: false,
      lastActiveAt: 0,
      createdAt: 0,
      updatedAt: 0,
    },
  };
}

test("switching member filters aborts the old request and never mixes its members", async () => {
  const pending = deferred<Result<MemberInfo[]>>();
  const first = vi.fn<PageLoader<MemberInfo>>(() => pending.promise);
  const next = vi
    .fn<PageLoader<MemberInfo>>()
    .mockResolvedValue({ success: true, data: [member("当前成员")] });
  const { rerender } = render(<EmbeddedMemberList onLoadMembers={first} />);
  const signal = first.mock.calls[0]?.[2];
  rerender(<EmbeddedMemberList onLoadMembers={next} />);
  expect(signal?.aborted).toBe(true);
  expect(await screen.findByText("当前成员")).toBeInTheDocument();
  await act(async () => {
    pending.resolve({ success: true, data: [member("过期成员")] });
    await pending.promise;
  });
  expect(screen.queryByText("过期成员")).not.toBeInTheDocument();
  expect(screen.getByText("当前成员")).toBeInTheDocument();
});

test("member failures remain retryable and do not render an empty success state", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const loader = vi
    .fn<PageLoader<MemberInfo>>()
    .mockResolvedValueOnce({ success: false, error: "连接失败" })
    .mockResolvedValueOnce({ success: true, data: [member("重试成员")] });
  render(<EmbeddedMemberList onLoadMembers={loader} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("连接失败");
  expect(screen.queryByText("暂无成员")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "重试" }));
  expect(await screen.findByText("重试成员")).toBeInTheDocument();
  expect(loader.mock.calls.map(([offset]) => offset)).toEqual([0, 0]);
});
