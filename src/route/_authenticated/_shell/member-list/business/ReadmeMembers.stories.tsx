import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ReadmeShell } from "@/test-resource/ReadmeShell";
import { prepareReadmeSession } from "@/test-resource/readme-session";
import { MemberGlance } from "./MemberGlance";
import { createReadmeMemberClient } from "./readme-member-fixture";

const meta = {
  title: "README/Members",
  component: MemberGlance,
  parameters: { layout: "fullscreen" },
  beforeEach: prepareReadmeSession,
  render: () => (
    <ReadmeShell client={createReadmeMemberClient()} path="/member-list">
      <div className="h-full w-full min-w-0 overflow-x-hidden">
        <MemberGlance />
      </div>
    </ReadmeShell>
  ),
} satisfies Meta<typeof MemberGlance>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("林间晚风")).toBeVisible();
  },
};
