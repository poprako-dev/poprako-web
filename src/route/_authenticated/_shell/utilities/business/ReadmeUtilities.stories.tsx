import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ReadmeShell } from "@/test-resource/ReadmeShell";
import { prepareReadmeSession } from "@/test-resource/readme-session";
import { Utilities } from "./Utilities";
import { createReadmeTerminology, createReadmeUtilitiesClient } from "./readme-terminology-fixture";

const meta = {
  title: "README/Utilities",
  component: Utilities,
  parameters: { layout: "fullscreen" },
  beforeEach: prepareReadmeSession,
  render: () => (
    <ReadmeShell client={createReadmeUtilitiesClient()} path="/utilities">
      <Utilities terminology={createReadmeTerminology()} />
    </ReadmeShell>
  ),
} satisfies Meta<typeof Utilities>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "查看术语库" }));
    await userEvent.click(await canvas.findByRole("button", { name: /^星之旅途/ }));
    await waitFor(async () => {
      await expect(canvas.getByText("星渡りの旅人")).toBeVisible();
    });
  },
};
