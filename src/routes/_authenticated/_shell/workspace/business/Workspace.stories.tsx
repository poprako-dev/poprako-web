import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Workspace } from "@/routes/_authenticated/_shell/workspace/business/Workspace";

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
  return (
    <div style={{ height: "100vh" }}>
      <Story />
    </div>
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
