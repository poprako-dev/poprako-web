import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import Workspace from "../../features/Workspace/components/business/Workspace";

const meta: Meta<typeof Workspace> = {
  title: "features/Workspace",
  component: Workspace,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Workspace>;

const fullHeightDecorator: Decorator = (Story) => (
  <div style={{ height: "100vh" }}>
    <Story />
  </div>
);

export const Default: Story = {
  decorators: [fullHeightDecorator],
};
