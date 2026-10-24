import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ApiProvider } from "@/route/business/ApiProvider";
import { ReadySessionProvider } from "@/route/business/session/ReadySessionProvider";
import { toCamelCase } from "@/shared/utility/case-convert";
import { ComicDetailModal } from "./ComicDetailModal";
import type { DetailComicInfo } from "./detail-request";
import { createDetailStoryApi } from "./test/detail-story-api";
import { makeMember, makeUser, mockComic, pinnedChapter } from "./test/comic-detail-story-fixtures";
import { detailComic } from "../test/detail-request-fixture";

beforeEach(() => {
  const observer = vi.fn(function () {
    return { observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn() };
  });
  vi.stubGlobal("ResizeObserver", observer);
  vi.stubGlobal("IntersectionObserver", observer);
});

afterEach(() => vi.unstubAllGlobals());

function renderDetail(roles: number): void {
  const fixture = toCamelCase(detailComic("comic-1", "team-1"));
  const comic: DetailComicInfo = {
    ...mockComic,
    workset: fixture.workset,
    team: { ...fixture.team, avatarUrl: "" },
  };
  render(
    <ApiProvider client={createDetailStoryApi("default")}>
      <ReadySessionProvider
        value={{
          generation: 0,
          userInfo: makeUser("team-admin", "管理员"),
          memberInfos: [{ ...makeMember("team-admin", "管理员", { roles }), team: comic.team }],
        }}
      >
        <ComicDetailModal
          comicInfo={comic}
          pinnedChapter={pinnedChapter}
          initialChapterId={null}
          onClose={vi.fn()}
          onChanged={vi.fn()}
          onNavigateToWorkbench={vi.fn()}
        />
      </ReadySessionProvider>
    </ApiProvider>,
  );
}

async function pressChapter(): Promise<void> {
  const triggers = await screen.findAllByRole("button", { name: /#43/ });
  const trigger = triggers[0];
  if (!trigger) throw new Error("Chapter dropdown trigger is missing");
  fireEvent.click(trigger);
  const label = await screen.findByText("#2", { selector: "span.w-4" });
  const entry = label.closest("button, [role=button]");
  if (!entry) throw new Error("Chapter dropdown entry is missing");
  fireEvent.pointerDown(entry, { button: 0 });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 550));
  });
  fireEvent.pointerUp(entry, { button: 0 });
}

test("team administrators can long press a chapter without any chapter assignment", async () => {
  renderDetail(128);
  await pressChapter();
  expect(screen.getByRole("heading", { name: "修改章节信息" })).toBeInTheDocument();
  expect(screen.getByPlaceholderText("章节副标题")).toHaveValue("");
});

test("ordinary members cannot open chapter editing by long press", async () => {
  renderDetail(2);
  await pressChapter();
  expect(screen.queryByRole("heading", { name: "修改章节信息" })).not.toBeInTheDocument();
});

test("team administrators manage assignments and workflow without chapter assignments", async () => {
  renderDetail(128);
  fireEvent.click(await screen.findByRole("button", { name: "工作流记录" }));
  expect(await screen.findByRole("button", { name: "分配翻译成员" })).toBeInTheDocument();
  expect(await screen.findByRole("button", { name: "移除Aki的当前分工" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^翻译，/ })).toBeInTheDocument();
});

test("ordinary members cannot manage other assignments or unrelated workflow stages", async () => {
  renderDetail(2);
  fireEvent.click(await screen.findByRole("button", { name: "工作流记录" }));
  expect(await screen.findByText("Aki", { selector: "[role=tooltip]" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "分配翻译成员" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "移除Aki的当前分工" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /^翻译，/ })).not.toBeInTheDocument();
});
