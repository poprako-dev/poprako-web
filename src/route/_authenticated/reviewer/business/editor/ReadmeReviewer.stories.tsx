import { useMemo, type JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Reviewer } from "../Reviewer";
import { createReadmeReviewerFixture } from "../test/readme-reviewer-fixture";

function ReadmeReviewer(): JSX.Element {
  const fixture = useMemo(() => createReadmeReviewerFixture(), []);
  return (
    <div className="h-screen w-full">
      <Reviewer {...fixture} />
    </div>
  );
}

const meta = {
  title: "README/Reviewer",
  component: ReadmeReviewer,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ReadmeReviewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {
  name: "监修工作台",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByLabelText("标注 5 说明");
    await waitFor(() =>
      expect(canvasElement.querySelector("img")?.naturalWidth).toBeGreaterThan(0),
    );
    await userEvent.click(canvas.getByRole("button", { name: "定位标注 1" }));
  },
};
