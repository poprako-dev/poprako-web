import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";
import { BaseTranslator } from "./BaseTranslator";
import { createStoryArgs } from "./test/base-translator-story-fixture";
import { TRANSLATOR_ID } from "./test/base-translator-story-data";

function storyArgs(): ReturnType<typeof createStoryArgs> {
  const args = createStoryArgs({
    canTranslate: true,
    canProofread: false,
    units: [
      {
        id: "undo",
        index: 0,
        xCoord: 0.2,
        yCoord: 0.3,
        isBubble: true,
        isFlagged: false,
        isProofread: false,
      },
    ],
  });
  return {
    ...args,
    currentUserId: TRANSLATOR_ID,
    startMode: "translate",
    onSaveUnits: fn(args.onSaveUnits),
    onLoadPageImage: () =>
      Promise.resolve(
        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"/>',
      ),
  };
}

function resetShortcuts(): () => void {
  const previous = localStorage.getItem("configurableShortcuts");
  localStorage.removeItem("configurableShortcuts");
  return () => {
    if (previous === null) localStorage.removeItem("configurableShortcuts");
    else localStorage.setItem("configurableShortcuts", previous);
  };
}

async function undo(): Promise<void> {
  const modifier = navigator.userAgent.includes("Mac") ? "Meta" : "Control";
  await userEvent.keyboard(`{${modifier}>}.{/` + modifier + "}");
}

async function ready(canvasElement: HTMLElement): Promise<HTMLTextAreaElement> {
  const input =
    await within(canvasElement).findByPlaceholderText<HTMLTextAreaElement>("点击输入翻译...");
  await waitFor(async () => {
    await expect(input).not.toHaveAttribute("readonly");
    const image = canvasElement.querySelector<HTMLImageElement>('[role="application"] img');
    await expect(image?.naturalWidth).toBeGreaterThan(0);
  });
  return input;
}

const meta: Meta<typeof BaseTranslator> = {
  title: "Features/BaseTranslator/UniversalUndo",
  component: BaseTranslator,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="h-screen w-full">
        <Story />
      </div>
    ),
  ],
  beforeEach: resetShortcuts,
};
export default meta;
type Story = StoryObj<typeof BaseTranslator>;

export const TypingDeleteAndSave: Story = {
  args: storyArgs(),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const input = await ready(canvasElement);
    await userEvent.type(input, "ab");
    await fireEvent.contextMenu(canvas.getByRole("button", { name: "第 1 个 Unit" }));
    await page.findByRole("dialog", { name: "确认删除" });
    await undo();
    await expect(input).toHaveValue("ab");
    await userEvent.click(page.getByRole("button", { name: "删除" }));
    await expect(canvas.queryByPlaceholderText("点击输入翻译...")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "保存 · 待保存" }));
    await waitFor(async () => {
      await expect(canvas.getByRole("button", { name: "保存 · 已保存" })).toBeEnabled();
    });
    await undo();
    const restored = canvas.getByPlaceholderText("点击输入翻译...");
    await expect(restored).toHaveValue("ab");
    await userEvent.click(restored);
    await undo();
    await expect(restored).toHaveValue("a");
    await undo();
    await expect(restored).toHaveValue("");
    await undo();
    await expect(restored).toHaveValue("");
    await userEvent.click(canvas.getByRole("button", { name: "保存 · 待保存" }));
    await waitFor(async () => {
      await expect(args.onSaveUnits).toHaveBeenCalledTimes(2);
    });
    const saved = await args.onLoadUnits("page-1");
    await expect(saved.map((unit) => unit.id)).toEqual(["page-1-undo"]);
    await expect(saved[0]?.translatedText ?? "").toBe("");
  },
};

export const CompositionAndPageBoundary: Story = {
  args: storyArgs(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await ready(canvasElement);
    await userEvent.type(input, "a");
    await fireEvent.compositionStart(input);
    await fireEvent.input(input, { target: { value: "ani" } });
    await fireEvent.input(input, { target: { value: "a你好" } });
    await fireEvent.compositionEnd(input, { data: "你好" });
    await fireEvent.input(input, { target: { value: "a你好" } });
    await undo();
    await expect(input).toHaveValue("a");
    await undo();
    await expect(input).toHaveValue("");
    await userEvent.type(input, "z");
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await ready(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Previous page" }));
    const returned = await ready(canvasElement);
    await expect(returned).toHaveValue("z");
    await undo();
    await expect(returned).toHaveValue("z");
  },
};
