import type { Meta, StoryObj } from "@storybook/react-vite";
import { BaseTranslator } from "@/route/_authenticated/translator/business/BaseTranslator";
import {
  mockProject,
  mockUnits,
  TRANSLATOR_ID,
} from "@/route/_authenticated/translator/business/test/base-translator-story-data";
import { unitTranslatedText } from "@/route/_authenticated/translator/business/unit/unit";
import {
  createStoryArgs,
  mockTerminology,
} from "@/route/_authenticated/translator/business/test/base-translator-story-fixture";
import {
  configureKeyboardFixture,
  verifyTranslatorKeyboard,
} from "@/route/_authenticated/translator/business/test/translator-keyboard-play";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

const meta: Meta<typeof BaseTranslator> = {
  title: "Features/BaseTranslator",
  component: BaseTranslator,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="h-screen w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BaseTranslator>;

export const WithProofread: Story = {
  args: createStoryArgs({
    canTranslate: true,
    canProofread: true,
  }),
};

export const TranslatorOnly: Story = {
  args: createStoryArgs({
    canTranslate: true,
    canProofread: false,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: "切换到只读模式",
      }),
    );
    await expect(
      await canvas.findAllByRole("textbox", {
        name: "翻译与校对差异",
      }),
    ).toHaveLength(mockUnits.length);

    await userEvent.click(
      canvas.getByRole("button", {
        name: "切换到翻译模式",
      }),
    );
    await expect(
      canvas.queryByRole("textbox", {
        name: "翻译与校对差异",
      }),
    ).toBeNull();
    await expect(
      canvas.getByRole("button", {
        name: "切换到只读模式",
      }),
    ).toBeVisible();
  },
};

export const SearchAndTransform: Story = {
  args: createStoryArgs({
    canTranslate: true,
    canProofread: false,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: "工具菜单" }));
    await userEvent.click(page.getByTitle("搜索与替换"));
    await waitFor(async () => {
      await expect(page.getByRole("dialog", { name: "搜索与替换" })).toBeVisible();
    });

    await userEvent.type(page.getByRole("textbox", { name: "查找短语" }), "这");
    await userEvent.click(page.getByRole("button", { name: "搜索" }));
    const matchCount =
      mockProject.pages.length *
      mockUnits.filter((unit) => unitTranslatedText(unit)?.includes("这")).length;
    await expect(await page.findByText(`${String(matchCount)} 个匹配 Unit`)).toBeVisible();

    await userEvent.type(page.getByRole("textbox", { name: "替换短语" }), "那");
    await userEvent.click(page.getByRole("button", { name: "替换" }));
    await expect(await page.findByText("没有找到匹配内容")).toBeVisible();
  },
};

export const EmptyUnits: Story = {
  args: createStoryArgs({
    canTranslate: true,
    canProofread: true,
    units: [],
  }),
};

export const WithTerminology: Story = {
  args: {
    ...createStoryArgs({
      canTranslate: true,
      canProofread: true,
    }),
    terminology: mockTerminology,
  },
};

const keyboardArgs = createStoryArgs({
  canTranslate: true,
  canProofread: false,
});

export const TerminologyKeyboardIsolation: Story = {
  args: {
    ...keyboardArgs,
    currentUserId: TRANSLATOR_ID,
    onLoadUnits: fn(keyboardArgs.onLoadUnits),
    onSaveUnits: fn(keyboardArgs.onSaveUnits),
    onLoadPageImage: () =>
      Promise.resolve(
        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>',
      ),
  },
  beforeEach: configureKeyboardFixture,
  play: verifyTranslatorKeyboard,
};

export const ReadOnlyWithoutTerminology: Story = {
  args: {
    ...createStoryArgs({
      canTranslate: false,
      canProofread: false,
    }),
    terminology: mockTerminology,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByTestId("terminology-lookup")).toBeNull();
    await expect(
      await canvas.findAllByRole("textbox", {
        name: "翻译与校对差异",
      }),
    ).toHaveLength(mockUnits.length);
    await expect(
      canvas.getByRole("button", {
        name: "前进到下一个修改",
      }),
    ).toBeVisible();
  },
};

export const ReadOnlyPageStatistics: Story = {
  args: {
    ...createStoryArgs({ canTranslate: true, canProofread: true }),
    onLoadPageImage: () =>
      Promise.resolve(
        "data:image/svg+xml," +
          encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"/>'),
      ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await expect(canvas.queryByRole("button", { name: "页面 unit 统计" })).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "切换到翻译模式" }));
    await expect(canvas.queryByRole("button", { name: "页面 unit 统计" })).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "切换到只读模式" }));

    const trigger = canvas.getByRole("button", { name: "页面 unit 统计" });
    await waitFor(async () => {
      await expect(trigger).toBeEnabled();
    });
    await userEvent.click(trigger);
    await userEvent.click(
      await page.findByRole("button", {
        name: "第 2 页，翻译 10，编辑 3，追加 2",
      }),
    );
    await expect(page.queryByRole("dialog")).toBeNull();
    await waitFor(async () => {
      await expect(trigger).toBeEnabled();
    });
    await userEvent.click(trigger);
    await expect(
      await page.findByRole("button", {
        name: "第 2 页，翻译 10，编辑 3，追加 2",
      }),
    ).toHaveAttribute("aria-current", "page");
    await userEvent.keyboard("{Escape}");
    await expect(trigger).toHaveFocus();
    await userEvent.click(trigger);
    await expect(
      await page.findByRole("button", {
        name: "第 2 页，翻译 10，编辑 3，追加 2",
      }),
    ).toHaveAttribute("aria-current", "page");
  },
};

export const AutoSaveRace: Story = {
  args: (() => {
    const args = createStoryArgs({
      canTranslate: true,
      canProofread: false,
      units: Array.from({ length: 100 }, (_, index) => ({
        id: `autosave-${String(index)}`,
        index,
        xCoord: 0.1 + (index % 10) * 0.08,
        yCoord: 0.1 + Math.floor(index / 10) * 0.08,
        isBubble: true,
        isFlagged: false,
        isProofread: false,
        translatedText: `文本 ${String(index)}`,
      })),
    });
    const save = args.onSaveUnits;
    return {
      ...args,
      startMode: "translate",
      onSaveUnits: async (pageId, diff, saveId) => {
        dispatchEvent(
          new CustomEvent("translator-save", {
            detail: { phase: "start", pageId, diff, saveId },
          }),
        );
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 5000);
        });
        const result = await save(pageId, diff, saveId);
        dispatchEvent(
          new CustomEvent("translator-save", {
            detail: { phase: "done", pageId, saveId },
          }),
        );
        return result;
      },
    };
  })(),
};

export const FlaggedSave: Story = {
  args: (() => {
    const args = createStoryArgs({
      canTranslate: true,
      canProofread: false,
      units: [
        {
          id: "flag-test",
          index: 0,
          xCoord: 0.2,
          yCoord: 0.3,
          isBubble: true,
          isFlagged: false,
          isProofread: false,
          translatedText: "需要确认的译文",
        },
      ],
    });
    return {
      ...args,
      onSaveUnits: fn(args.onSaveUnits),
      onLoadPageImage: () =>
        Promise.resolve(
          "data:image/svg+xml," +
            encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"/>',
            ),
        ),
    };
  })(),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const star = await canvas.findByRole("button", { name: "标记待回看" });
    await waitFor(async () => {
      await expect(star).toBeEnabled();
    });
    await userEvent.click(star);
    await expect(canvas.getByRole("button", { name: "保存 · 待保存" })).toBeEnabled();
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await waitFor(async () => {
      await expect(args.onSaveUnits).toHaveBeenCalledTimes(1);
      await expect(canvas.getByRole("button", { name: "Previous page" })).toBeEnabled();
    });
    await userEvent.click(canvas.getByRole("button", { name: "Open page list" }));
    await expect(await canvas.findByLabelText("1 个待回看的标记")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Close page list" }));
    await userEvent.click(canvas.getByRole("button", { name: "Previous page" }));
    const restored = await canvas.findByRole("button", { name: "取消标记" });
    await waitFor(async () => {
      await expect(restored).toBeEnabled();
    });
    await userEvent.click(restored);
    await userEvent.click(canvas.getByRole("button", { name: "保存 · 待保存" }));
    await waitFor(async () => {
      await expect(canvas.getByRole("button", { name: "保存 · 已保存" })).toBeEnabled();
    });
    const units = await args.onLoadUnits("page-1");
    await expect(units[0]).toMatchObject({
      isFlagged: false,
      translatedText: "需要确认的译文",
    });
    await expect(units[0]?.translatorId).toBeUndefined();
    await expect(units[0]?.proofreaderId).toBeUndefined();
  },
};
