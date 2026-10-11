import { ApiProvider } from "@/route/business/ApiProvider";
import { ReadySessionProvider } from "@/route/business/session/ReadySessionProvider";
import { createTestApi } from "@/test-resource/api-client";
import { useState } from "react";
import type { ReactElement } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useAppStore } from "@/route/business/session/session-store";
import { toMemberInfo, toUserInfo } from "@/route/business/identity/api-adapter";
import { decodeApiMember, decodeApiUser } from "@/api/identity-contract";
import { toCamelCase } from "@/shared/utility/case-convert";
import type { Role } from "@/route/business/identity/role";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { useComicDetailHost } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-host";
import { MemberSelectorModal } from "@/route/_authenticated/_shell/business/comic-detail/MemberSelectorModal";
import {
  detailChapter,
  detailComic,
  detailMember,
  detailUser,
} from "@/route/_authenticated/_shell/business/test/detail-request-fixture";
import type {
  ComicDetailSearch,
  WorkbenchDestination,
} from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-host";

const requests: string[] = [];
const pending = new Map<string, () => void>();

type ProbeProps = {
  returnTo: "/workspace" | "/comic-playground";
  search: ComicDetailSearch;
  onChangeSearch: (comicId: string | null, chapterId: string | null) => void;
  onNavigateToWorkbench: (destination: WorkbenchDestination) => void;
};

function Probe({
  returnTo,
  search,
  onChangeSearch,
  onNavigateToWorkbench,
}: ProbeProps): ReactElement {
  const showToast = useToastStore((s) => s.showToast);
  const host = useComicDetailHost({
    returnTo,
    showToast,
    search,
    onChangeSearch,
    onNavigateToWorkbench,
  });
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  return (
    <div aria-busy={isLoading}>
      <button
        type="button"
        onClick={() => {
          host.openComicDetail("comic-b", "target-chapter");
        }}
      >
        打开 B
      </button>
      <button
        type="button"
        onClick={() => {
          host.openComicDetail("comic-c");
        }}
      >
        打开 C
      </button>
      <button type="button" onClick={host.clearComicDetail}>
        关闭详情
      </button>
      <output aria-label="漫画">{host.selectedComic?.id ?? "none"}</output>
      <output aria-label="团队">{host.detailActiveMember?.teamId ?? "none"}</output>
      <output aria-label="目标章节">{host.urlChapterId ?? "none"}</output>
      <output aria-label="置顶章节">{host.selectedComicPinnedChapter?.id ?? "none"}</output>
      {host.selectedComic && (
        <>
          <button
            type="button"
            onClick={() => {
              setRole("translator");
            }}
          >
            翻译成员
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("proofreader");
            }}
          >
            校对成员
          </button>
          <button
            type="button"
            onClick={() => {
              host.navigateToWorkbench("target-chapter", "page-1");
            }}
          >
            进入翻译器
          </button>
        </>
      )}
      {role && (
        <MemberSelectorModal
          title="职位成员"
          role={role}
          chapterId="target-chapter"
          onLoadMembers={host.loadAssignableMembers}
          setIsLoading={setIsLoading}
          onSelectUser={() => {
            setRole(null);
          }}
          onClose={() => {
            setRole(null);
          }}
        />
      )}
    </div>
  );
}

function TranslatorReturn({
  destination,
  onReturn,
}: {
  destination: WorkbenchDestination;
  onReturn: () => void;
}): ReactElement {
  return (
    <div data-translator-target={`${destination.chapterId}/${destination.pageId}`}>
      <button type="button" onClick={onReturn}>
        返回详情
      </button>
    </div>
  );
}

type Props = { initialEntry: string; delayComic: boolean };

function DetailHostScenario({ initialEntry, delayComic }: Props): ReactElement {
  const [location, setLocation] = useState(() => new URL(initialEntry, "http://storybook.local"));
  const [workbenchDestination, setWorkbenchDestination] = useState<WorkbenchDestination | null>(
    null,
  );
  const returnTo = location.pathname === "/comic-playground" ? "/comic-playground" : "/workspace";
  const search: ComicDetailSearch = {
    comicId: location.searchParams.get("comicId") ?? undefined,
    chapterId: location.searchParams.get("chapterId") ?? undefined,
  };
  const onChangeSearch = (comicId: string | null, chapterId: string | null): void => {
    const next = new URL(location);
    if (comicId) next.searchParams.set("comicId", comicId);
    else next.searchParams.delete("comicId");
    if (comicId && chapterId) next.searchParams.set("chapterId", chapterId);
    else next.searchParams.delete("chapterId");
    setLocation(next);
  };
  const onNavigateToWorkbench = (destination: WorkbenchDestination): void => {
    setWorkbenchDestination(destination);
  };
  return workbenchDestination ? (
    <TranslatorReturn
      destination={workbenchDestination}
      onReturn={() => {
        setWorkbenchDestination(null);
        onChangeSearch(workbenchDestination.comicId, workbenchDestination.chapterId);
      }}
    />
  ) : (
    <div data-delay-comic={String(delayComic)}>
      <Probe
        returnTo={returnTo}
        search={search}
        onChangeSearch={onChangeSearch}
        onNavigateToWorkbench={onNavigateToWorkbench}
      />
    </div>
  );
}

function createMockedFetch(originalFetch: typeof fetch, delayComic: boolean): typeof fetch {
  return async (input, init) => {
    const address =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(address, location.origin);
    if (!url.pathname.startsWith("/api/")) return originalFetch(input, init);
    requests.push(url.pathname + url.search);
    const comicId = url.pathname.split("/", 5)[4] ?? "comic-b";
    if (url.pathname.endsWith("/chapters/pinned")) {
      return Response.json({ code: 0, data: detailChapter(comicId) });
    }
    if (url.pathname.endsWith("/members")) {
      const keyword = url.searchParams.get("fuzzy_nickname");
      if (keyword === "fail") {
        return Response.json({ code: 4, message: "成员查询失败" }, { status: 403 });
      }
      const teamId = url.searchParams.get("team_id") ?? "missing";
      const role = Number(url.searchParams.get("role"));
      const name = `${teamId}-${role === 2 ? "translator" : "proofreader"}`;
      return Response.json({
        code: 0,
        data: keyword === "empty" ? [] : [detailMember(teamId, name, role)],
      });
    }
    if (comicId === "comic-b" && delayComic) {
      await new Promise<void>((resolve) => {
        pending.set(comicId, resolve);
      });
    }
    return Response.json({
      code: 0,
      data: detailComic(comicId, comicId.replace("comic", "team")),
    });
  };
}

const meta = {
  title: "Features/ComicDetailHost",
  component: DetailHostScenario,
  args: { initialEntry: "/workspace", delayComic: false },
  decorators: [
    (Story) => {
      const state = useAppStore.getState();
      if (!state.loginState) throw new Error("Story session is missing");
      return (
        <ApiProvider client={createTestApi()}>
          <ReadySessionProvider value={{ ...state.loginState, generation: state.generation }}>
            <Story />
          </ReadySessionProvider>
        </ApiProvider>
      );
    },
  ],
  beforeEach: ({ args }) => {
    const originalFetch = fetch;
    const previousStore = useAppStore.getState();
    requests.length = 0;
    pending.clear();
    useAppStore.setState({
      accessToken: null,
      selectedTeamId: "team-a",
      loginState: {
        userInfo: toUserInfo(decodeApiUser(toCamelCase(detailUser()))),
        memberInfos: ["team-a", "team-b", "team-c"].map((teamId) => ({
          ...toMemberInfo(decodeApiMember(toCamelCase(detailMember(teamId)))),
          team: {
            id: teamId,
            name: teamId,
            description: "",
            avatarUrl: "",
            createdAt: 1,
            updatedAt: 1,
          },
        })),
      },
    });
    const mockedFetch = createMockedFetch(originalFetch, args.delayComic);
    Object.defineProperty(globalThis, "fetch", {
      value: mockedFetch,
      configurable: true,
    });
    return () => {
      Object.defineProperty(globalThis, "fetch", {
        value: originalFetch,
        configurable: true,
      });
      for (const resolve of pending.values()) resolve();
      pending.clear();
      useAppStore.setState(previousStore);
      useToastStore.getState().hideToast();
    };
  },
} satisfies Meta<typeof DetailHostScenario>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WorkspaceCardAndReturn: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "打开 B" }));
    await waitFor(() => expect(canvas.getByLabelText("团队")).toHaveTextContent("team-b"));
    await expect(canvas.getByLabelText("目标章节")).toHaveTextContent("target-chapter");
    await userEvent.click(canvas.getByRole("button", { name: "翻译成员" }));
    await expect(await screen.findByText("team-b-translator")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "关闭" }));
    await userEvent.click(canvas.getByRole("button", { name: "进入翻译器" }));
    await userEvent.click(await canvas.findByRole("button", { name: "返回详情" }));
    await waitFor(() => expect(canvas.getByLabelText("团队")).toHaveTextContent("team-b"));
    await expect(requests.filter((url) => url.endsWith("comic-b?incl=workset.team"))).toHaveLength(
      2,
    );
    await userEvent.click(canvas.getByRole("button", { name: "校对成员" }));
    await expect(await screen.findByText("team-b-proofreader")).toBeVisible();
    await userEvent.type(screen.getByRole("textbox"), "fail");
    await expect(await screen.findByRole("alert")).toHaveTextContent("成员查询失败");
    await expect(screen.queryByText("没有可添加的成员")).not.toBeInTheDocument();
    await userEvent.clear(screen.getByRole("textbox"));
    await userEvent.type(screen.getByRole("textbox"), "empty");
    await expect(await screen.findByText("没有可添加的成员")).toBeVisible();
  },
};

export const PlaygroundUrl: Story = {
  args: {
    initialEntry: "/comic-playground?comicId=comic-b&chapterId=target-chapter",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByLabelText("团队")).toHaveTextContent("team-b"));
    await expect(canvas.getByLabelText("置顶章节")).toHaveTextContent("pinned-comic-b");
    await expect(canvas.getByLabelText("目标章节")).toHaveTextContent("target-chapter");
    await userEvent.click(canvas.getByRole("button", { name: "翻译成员" }));
    const screen = within(canvasElement.ownerDocument.body);
    await expect(await screen.findByText("team-b-translator")).toBeVisible();
  },
};

export const WorkspaceUrl: Story = {
  ...PlaygroundUrl,
  args: { initialEntry: "/workspace?comicId=comic-b&chapterId=target-chapter" },
};

export const PlaygroundCardAndReturn: Story = {
  ...WorkspaceCardAndReturn,
  args: { initialEntry: "/comic-playground" },
};

export const LateResponseAfterSwitch: Story = {
  args: { delayComic: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "打开 B" }));
    await waitFor(() => expect(pending.has("comic-b")).toBe(true));
    await userEvent.click(canvas.getByRole("button", { name: "打开 C" }));
    await waitFor(() => expect(canvas.getByLabelText("团队")).toHaveTextContent("team-c"));
    pending.get("comic-b")?.();
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    await expect(canvas.getByLabelText("漫画")).toHaveTextContent("comic-c");
    await expect(canvas.getByLabelText("团队")).toHaveTextContent("team-c");
  },
};

export const LateResponseAfterClose: Story = {
  args: { delayComic: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "打开 B" }));
    await waitFor(() => expect(pending.has("comic-b")).toBe(true));
    await userEvent.click(canvas.getByRole("button", { name: "关闭详情" }));
    pending.get("comic-b")?.();
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    await expect(canvas.getByLabelText("漫画")).toHaveTextContent("none");
  },
};
