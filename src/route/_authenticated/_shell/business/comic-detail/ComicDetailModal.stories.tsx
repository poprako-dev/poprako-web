import { useMemo } from "react";
import type { ReactNode, ReactElement } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { ComicDetailModal } from "./ComicDetailModal";
import { ApiProvider } from "@/route/business/ApiProvider";
import { ReadySessionProvider } from "@/route/business/session/ReadySessionProvider";
import {
  makeMember,
  makeUser,
  mockComic,
  pinnedChapter,
  now,
} from "./test/comic-detail-story-fixtures";
import { createDetailStoryApi, mutationLog } from "./test/detail-story-api";
import type { Scenario } from "./test/detail-story-api";
const team = {
  id: "team-1",
  name: "测试团队",
  description: "",
  avatarUrl: "",
  createdAt: now,
  updatedAt: now,
};
const comic = {
  ...mockComic,
  team,
  workset: {
    id: "ws-1",
    teamId: team.id,
    index: 0,
    name: "作品集",
    description: "",
    comicCount: 1,
    createdAt: now,
    updatedAt: now,
  },
};
type ProviderProps = { scenario: Scenario; children: ReactNode };
function StoryProvider({ scenario, children }: ProviderProps): ReactElement {
  const api = useMemo(() => createDetailStoryApi(scenario), [scenario]);
  const admin = ["admin", "combined", "artwork"].includes(scenario);
  const id = admin ? "u-admin" : scenario === "empty" ? "u-viewer" : "u-aki";
  const ready = {
    generation: 0,
    userInfo: makeUser(id, id),
    memberInfos: [{ ...makeMember(id, id, { roles: admin ? 128 : 6 }), team }],
  };
  return (
    <ApiProvider client={api}>
      <ReadySessionProvider value={ready}>{children}</ReadySessionProvider>
    </ApiProvider>
  );
}
const meta = {
  title: "Route/ComicDetail",
  component: ComicDetailModal,
  parameters: { layout: "fullscreen" },
  args: {
    comicInfo: comic,
    pinnedChapter,
    initialChapterId: null,
    onClose: fn(),
    onChanged: fn(),
    onNavigateToTranslator: fn(),
  },
  decorators: [
    (Story, context) => (
      <div className="min-h-screen bg-surface-slate-100/60 flex items-center justify-center p-4">
        <StoryProvider scenario={(context.parameters["scenario"] ?? "default") as Scenario}>
          <Story />
        </StoryProvider>
      </div>
    ),
  ],
} satisfies Meta<typeof ComicDetailModal>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "默认（200章分页）" };
export const NoPinnedChapter: Story = { name: "无置顶章节", args: { pinnedChapter: null } };
export const ManyPeopleWithLongNames: Story = {
  name: "多成员与长名字",
  parameters: { scenario: "many" },
};
export const EmptyAssignments: Story = { name: "无分工", parameters: { scenario: "empty" } };
export const SlowAssignments: Story = {
  name: "分工加载中",
  parameters: { scenario: "slow-assignment" },
};
export const AdminAssignmentControls: Story = {
  name: "管理员分工操作",
  parameters: { scenario: "admin" },
};
export const SelfServiceControls: Story = {
  name: "成员加入与退出",
  parameters: { scenario: "self" },
};
export const CombinedTypesetRemoval: Story = {
  name: "同时移除嵌字与美工",
  parameters: { scenario: "combined" },
  play: async ({ canvasElement }) => {
    mutationLog.length = 0;
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "工作流记录" }));
    await userEvent.click(await canvas.findByRole("button", { name: "移除Dual Artist的当前分工" }));
    const body = within(document.body);
    await expect(body.queryByRole("heading", { name: "嵌字流程" })).not.toBeInTheDocument();
    await userEvent.click(await body.findByRole("button", { name: "移除" }));
    await waitFor(() =>
      expect(
        mutationLog.filter((item) => item.path.includes("/assignments")).map((item) => item.method),
      ).toEqual(["PUT", "DELETE"]),
    );
  },
};
export const EmptyPages: Story = { name: "无页面", parameters: { scenario: "empty-page" } };
export const SlowNetwork: Story = { name: "慢网络", parameters: { scenario: "slow" } };
export const AllCompleted: Story = { name: "全部完成", parameters: { scenario: "completed" } };
export const LoadError: Story = { name: "加载失败", parameters: { scenario: "error" } };
export const ArtworkActions: Story = {
  name: "嵌稿上传",
  parameters: { scenario: "artwork" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const upload = await canvas.findByRole("button", { name: "上传嵌稿" });
    await expect(canvas.queryByRole("button", { name: "只读查看" })).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "导入翻校" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "清空页面" })).not.toBeInTheDocument();
    await userEvent.click(upload);
    const body = within(document.body);
    await waitFor(async () =>
      expect(await body.findByRole("dialog", { name: "上传嵌稿" })).toBeVisible(),
    );
    await expect(body.getByRole("button", { name: "上传" })).toBeDisabled();
    await expect(body.queryByText(/压缩/)).not.toBeInTheDocument();
    await expect(body.queryByText(/请一次选齐/)).not.toBeInTheDocument();
  },
};
