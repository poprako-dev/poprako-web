import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import CommentChatBox from
  "../../features/Workspace/components/business/CommentChatBox";
import type { CommentInfo } from "../../types/comment";

const now = Date.now();

const mockUser1 = {
  id: "u1",
  qq: "10001",
  name: "花见春",
  avatarUrl: "",
  isAvatarUploaded: false,
  isSuperAdmin: false,
  lastActiveAt: now,
  createdAt: now,
  updatedAt: now,
};

const mockUser2 = {
  id: "u2",
  qq: "10002",
  name: "陆望远",
  avatarUrl: "",
  isAvatarUploaded: false,
  isSuperAdmin: false,
  lastActiveAt: now,
  createdAt: now,
  updatedAt: now,
};

const mockComments: CommentInfo[] = [
  {
    id: "c1",
    teamId: "t1",
    userId: "u1",
    user: mockUser1,
    content: "今天新稿子有没有分到人？",
    createdAt: now - 1000 * 60 * 10,
  },
  {
    id: "c2",
    teamId: "t1",
    userId: "u2",
    user: mockUser2,
    content: "有，已经在翻了，大概后天出初稿",
    createdAt: now - 1000 * 60 * 8,
  },
  {
    id: "c3",
    teamId: "t1",
    userId: "u1",
    user: mockUser1,
    content: "好的，记得留意那几个竖排气泡，上次排版有点乱",
    createdAt: now - 1000 * 60 * 6,
  },
  {
    id: "c4",
    teamId: "t1",
    userId: "u2",
    user: mockUser2,
    content: "了解，我会注意的",
    createdAt: now - 1000 * 60 * 4,
  },
  {
    id: "c5",
    teamId: "t1",
    userId: "u2",
    user: mockUser2,
    content: "顺便问一下，这一话的截止是哪天？",
    createdAt: now - 1000 * 60 * 3,
  },
  {
    id: "c6",
    teamId: "t1",
    userId: "u1",
    user: mockUser1,
    content: "周五之前交上来就好，不用太赶",
    createdAt: now - 1000 * 60 * 1,
  },
];

const meta: Meta<typeof CommentChatBox> = {
  title: "features/Workspace/CommentChatBox",
  component: CommentChatBox,
  parameters: {
    layout: "centered",
  },
  args: {
    onSend: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof CommentChatBox>;

export const WithMessages: Story = {
  args: {
    comments: mockComments,
    loading: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, height: 480, border: "1px solid #e5e7eb" }}>
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = {
  args: {
    comments: [],
    loading: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, height: 480, border: "1px solid #e5e7eb" }}>
        <Story />
      </div>
    ),
  ],
};

export const Loading: Story = {
  args: {
    comments: [],
    loading: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, height: 480, border: "1px solid #e5e7eb" }}>
        <Story />
      </div>
    ),
  ],
};

export const NarrowTall: Story = {
  args: {
    comments: mockComments,
    loading: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 260, height: 640, border: "1px solid #e5e7eb" }}>
        <Story />
      </div>
    ),
  ],
};
