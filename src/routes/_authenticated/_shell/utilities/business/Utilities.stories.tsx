import type { Meta, StoryObj } from "@storybook/react-vite";
import { Utilities } from "@/routes/_authenticated/_shell/utilities/business/Utilities";

const meta: Meta<typeof Utilities> = {
  title: "Features/Utilities",
  component: Utilities,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <main className="h-dvh overflow-y-auto pb-14 sm:pb-0">
      <Utilities />
    </main>
  ),
};
