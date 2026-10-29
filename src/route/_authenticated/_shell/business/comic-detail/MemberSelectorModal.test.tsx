import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { WorkerRole } from "@/route/business/identity/role";
import { MemberSelectorModal } from "./MemberSelectorModal";

beforeEach(() => {
  const observer = vi.fn(function () {
    return { observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn() };
  });
  vi.stubGlobal("ResizeObserver", observer);
  vi.stubGlobal("IntersectionObserver", observer);
});

afterEach(() => vi.unstubAllGlobals());

function renderModal(): ReturnType<typeof vi.fn> {
  const role: WorkerRole = "translator";
  const onLoadMembers = vi.fn(() => Promise.resolve({ success: true as const, data: [] }));
  render(
    <MemberSelectorModal
      title="添加「翻译」成员"
      chapterId="chapter-1"
      role={role}
      onLoadMembers={onLoadMembers}
      setIsLoading={vi.fn()}
      onSelectUser={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  return onLoadMembers;
}

test("loads assignable members once for an unchanged query", async () => {
  const onLoadMembers = renderModal();

  await waitFor(() => {
    expect(onLoadMembers).toHaveBeenCalledTimes(1);
  });
  await new Promise((resolve) => setTimeout(resolve, 800));
  expect(onLoadMembers).toHaveBeenCalledTimes(1);
});

test("loads assignable members again after the keyword changes", async () => {
  const onLoadMembers = renderModal();
  await waitFor(() => {
    expect(onLoadMembers).toHaveBeenCalledTimes(1);
  });

  fireEvent.change(screen.getByPlaceholderText("搜索昵称 / QQ"), { target: { value: "LB" } });

  await waitFor(() => {
    expect(onLoadMembers).toHaveBeenCalledTimes(2);
  });
  await new Promise((resolve) => setTimeout(resolve, 800));
  expect(onLoadMembers).toHaveBeenCalledTimes(2);
});
