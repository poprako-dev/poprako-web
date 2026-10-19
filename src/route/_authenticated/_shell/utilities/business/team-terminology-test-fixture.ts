import { beforeEach, afterEach, vi } from "vitest";
import { cleanup, screen, waitFor } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";

export function setupTeamTerminologyTest(): void {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      },
    );
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      },
    );
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });
}

export async function openFixtureBase(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "查看术语库" }));
  await user.click(await screen.findByRole("button", { name: /^奇幻世界共用词/ }));
  await waitFor(() => {
    expectVisibleTermList();
  });
}
function expectVisibleTermList(): void {
  if (!screen.queryByRole("textbox", { name: "搜索术语原文" })) throw new Error("术语列表尚未显示");
}

export function importFile(): File {
  const content = JSON.stringify({
    name: "新导入库",
    terms: [{ source: "星", targets: ["星辰"] }],
  });
  const file = new File([content], "team.json", { type: "application/json" });
  Object.defineProperty(file, "text", { value: () => Promise.resolve(content) });
  return file;
}

export function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}
