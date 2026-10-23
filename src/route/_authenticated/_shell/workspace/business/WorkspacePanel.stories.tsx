import { useState } from "react";
import type { ComponentProps, JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { createApiClient } from "@/api/client";
import { ApiProvider } from "@/route/business/ApiProvider";
import { ReadySessionProvider } from "@/route/business/session/ReadySessionProvider";
import { WorkspacePanel } from "./WorkspacePanel";
import { WorkspaceLayout } from "./WorkspaceLayout";

const client = createApiClient({
  baseUrl: "/api/v1",
  getAccessToken: () => "story",
  fetchImpl: () => Promise.resolve(Response.json({ code: 0, data: [] })),
});

const session = {
  generation: 0,
  userInfo: {
    id: "reader",
    name: "测试用户",
    qq: "",
    avatarUrl: "",
    isSuperAdmin: false,
    lastActiveAt: 1,
    createdAt: 1,
    updatedAt: 1,
  },
  memberInfos: [],
};

function PanelPreview(args: ComponentProps<typeof WorkspacePanel>): JSX.Element {
  const [mobileTab, setMobileTab] = useState(0);
  return (
    <ApiProvider client={client}>
      <ReadySessionProvider value={session}>
        <div style={{ height: "100vh" }}>
          <WorkspaceLayout>
            <WorkspacePanel {...args} mobileTab={mobileTab} onChangeMobileTab={setMobileTab} />
          </WorkspaceLayout>
        </div>
      </ReadySessionProvider>
    </ApiProvider>
  );
}

const meta: Meta<typeof WorkspacePanel> = {
  title: "features/Workspace/WorkspacePanel",
  component: WorkspacePanel,
  parameters: { layout: "fullscreen" },
  render: PanelPreview,
  args: {
    username: "测试用户",
    selectedTeamId: "team",
    team: { id: "team", name: "汉化组" },
    isAdmin: false,
    onlineCount: 0,
    onlineUsers: [],
    onlineStatus: "ready",
    comments: [
      {
        id: "comment",
        teamId: "team",
        userId: "reader",
        user: session.userInfo,
        content: "今天的稿件已经更新。",
        createdAt: 1,
      },
    ],
    commentsLoading: false,
    onSendComment: () => Promise.resolve(),
    mobileTab: 0,
    onChangeMobileTab: () => undefined,
    onTouchStart: () => undefined,
    onTouchEnd: () => undefined,
    comicListRefreshKey: 0,
    onComicClick: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof WorkspacePanel>;

export const Responsive: Story = {};

export const NoTeam: Story = {
  args: { team: null, selectedTeamId: null },
};
