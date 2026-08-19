import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import UnitList from "@/features/BaseTranslator/features/UnitList";
import {
  moveUnitToIndex,
  type UnitEdit,
  type UnitInfo,
} from "@/types/unit";
import type { TranslatorMode } from "@/types/translatorMode";
import type { UserInfo } from "@/types/user";
import type { Result } from "@/types/utils/result";

const STORY_AVATAR_URL = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
    '<rect width="40" height="40" fill="#a8a29e"/>' +
    '<circle cx="20" cy="16" r="8" fill="#f5f5f4"/>' +
    '<path d="M7 40c1-10 6-15 13-15s12 5 13 15" fill="#f5f5f4"/>' +
    "</svg>",
);

const storyUsers = new Map<string, UserInfo>([
  [
    "translator-1",
    {
      id: "translator-1",
      qq: "",
      name: "森川秋",
      avatarUrl: STORY_AVATAR_URL,
      isSuperAdmin: false,
      lastActiveAt: 0,
      createdAt: 0,
      updatedAt: 0,
    },
  ],
  [
    "translator-2",
    {
      id: "translator-2",
      qq: "",
      name: "没有头像但用户名很长的翻译成员",
      avatarUrl: "",
      isSuperAdmin: false,
      lastActiveAt: 0,
      createdAt: 0,
      updatedAt: 0,
    },
  ],
  [
    "proofreader-1",
    {
      id: "proofreader-1",
      qq: "",
      name: "林澄",
      avatarUrl: "",
      isSuperAdmin: false,
      lastActiveAt: 0,
      createdAt: 0,
      updatedAt: 0,
    },
  ],
]);

async function resolveStoryUser(userId: string): Promise<Result<UserInfo>> {
  const user = storyUsers.get(userId);
  return user
    ? { success: true, data: user }
    : { success: false, error: "Story user not found" };
}

const meta: Meta<typeof UnitList> = {
  title: "Features/UnitList",
  component: UnitList,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof UnitList>;

const initialUnits: UnitInfo[] = [
  {
    id: "1",
    index: 0,
    isBubble: true,
    xCoord: 0,
    yCoord: 0,
    isProofread: false,
    translatedText: "早安，今天的天气看起来非常不错。",
    translatorId: "translator-1",
  },
  {
    id: "2",
    index: 1,
    isBubble: true,
    xCoord: 0,
    yCoord: 0.1,
    isProofread: true,
    translatedText: "这是原本的初翻文本。",
    translatorId: "translator-1",
    proofreadText: "这一行有校对文本，所以始终显示。",
    proofreaderId: "proofreader-1",
  },
  {
    id: "3",
    index: 2,
    isBubble: false,
    xCoord: 0,
    yCoord: 0.2,
    isProofread: false,
    translatedText: "（远处传来的螺旋桨轰鸣声）",
    translatorId: "missing-user",
  },
  {
    id: "4",
    index: 3,
    isBubble: true,
    xCoord: 0,
    yCoord: 0.3,
    isProofread: false,
    translatedText: "这一行没有校对文本且未选中，校对框已隐藏。",
    translatorId: "translator-2",
  },
  {
    id: "5",
    index: 4,
    isBubble: true,
    xCoord: 0,
    yCoord: 0.4,
    isProofread: false,
    translatedText: "",
    translatorId: "translator-2",
  },
  ...Array.from({ length: 7 }, (_, offset): UnitInfo => {
    const index = offset + 5;
    return {
      id: String(index + 1),
      index,
      isBubble: index % 3 !== 0,
      xCoord: 0,
      yCoord: index / 12,
      isProofread: index % 4 === 0,
      translatedText: `用于验证长列表自动滚动的 Unit ${index + 1}。`,
    };
  }),
];

type UnitListWrapperProps = {
  initialMode: TranslatorMode;
  readOnly?: boolean;
};

function UnitListWrapper({
  initialMode,
  readOnly = false,
}: UnitListWrapperProps) {
  const [mode, setMode] = useState<TranslatorMode>(initialMode);
  const [focusedUnitId, setFocusedUnitId] = useState<string | undefined>("2");
  const [units, setUnits] = useState<UnitInfo[]>(initialUnits);

  const handleModifyUnit = (unitId: string, updates: UnitEdit) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, ...updates } : u)),
    );
  };

  const handleReorderUnit = (unitId: string, targetIndex: number) => {
    setUnits((prev) => moveUnitToIndex(prev, unitId, targetIndex));
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 font-sans antialiased">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-800">UnitList 交互演示</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {readOnly
              ? "只读模式 · 点击序号仍可聚焦"
              : "拖动序号排序 · 点击序号聚焦 · 支持输入和模式切换"}
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setMode("translate")}
            className={`px-4 py-1.5 text-sm font-medium transition-all rounded-md ${
              mode === "translate"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            翻译模式
          </button>
          <button
            onClick={() => setMode("proofread")}
            className={`px-4 py-1.5 text-sm font-medium transition-all rounded-md ${
              mode === "proofread"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            校对模式
          </button>
        </div>
      </header>

      <main
        className={
          "mx-auto flex-1 w-full max-w-3xl overflow-hidden border-x "
          + "border-gray-100 bg-white p-4 shadow-inner"
        }
      >
        <UnitList
          units={units}
          focusedUnitId={focusedUnitId}
          mode={mode}
          onFocusUnit={setFocusedUnitId}
          onModifyUnit={readOnly ? undefined : handleModifyUnit}
          onReorderUnit={readOnly ? undefined : handleReorderUnit}
          onResolveUser={resolveStoryUser}
          enableReadOnly={readOnly}
        />
      </main>
    </div>
  );
}

export const TranslateMode: Story = {
  render: () => <UnitListWrapper initialMode="translate" />,
};

export const ProofreadMode: Story = {
  render: () => <UnitListWrapper initialMode="proofread" />,
};

export const ReadOnly: Story = {
  render: () => <UnitListWrapper initialMode="proofread" readOnly />,
};
