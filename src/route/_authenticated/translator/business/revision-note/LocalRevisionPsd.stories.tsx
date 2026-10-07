import type { Meta, StoryObj } from "@storybook/react-vite";
import { BaseTranslator } from "../BaseTranslator";
import type { EditorProps } from "../editor/editor-props";
import { createLocalRevisionPsdArgs } from "../test/local-revision-psd-fixture";
import { revisionPreferenceFixture } from "../test/revision-note-story-fixture";

const meta: Meta<typeof BaseTranslator> = {
  title: "Features/Translator/本地 PSD 样本",
  component: BaseTranslator,
  tags: ["!test", "!autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "psd.rar 的 47 页真实 PSD，按页落盘读取。每页 10 条合成的整页批注，不对应原稿错误或特定图层。仅供本地 Storybook 手动体验。",
      },
    },
  },
  beforeEach: () => revisionPreferenceFixture(),
  loaders: [async () => ({ localPsdArgs: await createLocalRevisionPsdArgs() })],
  render: (_, { loaded }) => (
    <div className="h-screen w-full">
      <BaseTranslator {...(loaded.localPsdArgs as EditorProps)} />
    </div>
  ),
};
export default meta;
type Story = StoryObj<typeof meta>;

export const RealPsd: Story = { name: "47 页 · 真实 PSD · 10 条 revision_note" };
