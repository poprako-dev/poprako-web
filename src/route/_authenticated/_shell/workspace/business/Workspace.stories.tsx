import { ApiProvider } from "@/route/business/ApiProvider";
import { ReadySessionProvider } from "@/route/business/session/ReadySessionProvider";
import { createApiClient } from "@/api/client";
import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Workspace } from "@/route/_authenticated/_shell/workspace/business/Workspace";

const meta: Meta<typeof Workspace> = {
  title: "features/Workspace",
  component: Workspace,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Workspace>;

function FullHeightDecorator(...args: Parameters<Decorator>): ReturnType<Decorator> {
  const [Story] = args;
  const api = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "story",
    fetchImpl: () => Promise.resolve(Response.json({ code: 0, data: [] })),
  });
  const ready = {
    generation: 0,
    userInfo: {
      id: "user",
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
  return (
    <ApiProvider client={api}>
      <ReadySessionProvider value={ready}>
        <div style={{ height: "100vh" }}>
          <Story />
        </div>
      </ReadySessionProvider>
    </ApiProvider>
  );
}

export const Default: Story = {
  decorators: [FullHeightDecorator],
  args: {
    search: {},
    onChangeSearch: fn(),
    onNavigateToTranslator: fn(),
  },
};
