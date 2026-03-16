import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import UnitList from "@/features/BaseTranslator/features/UnitList";
import type { UnitInfo } from "@/types/unit";
import type { TranslatorMode } from "@/types/translatorMode";

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
  },
  {
    id: "2",
    index: 1,
    isBubble: true,
    xCoord: 0,
    yCoord: 0.1,
    isProofread: true,
    translatedText: "这是原本的初翻文本。",
    proofreadText: "这一行有校对文本，所以始终显示。",
  },
  {
    id: "3",
    index: 2,
    isBubble: false,
    xCoord: 0,
    yCoord: 0.2,
    isProofread: false,
    translatedText: "（远处传来的螺旋桨轰鸣声）",
  },
  {
    id: "4",
    index: 3,
    isBubble: true,
    xCoord: 0,
    yCoord: 0.3,
    isProofread: false,
    translatedText: "这一行没有校对文本且未选中，校对框已隐藏。",
  },
  {
    id: "5",
    index: 4,
    isBubble: true,
    xCoord: 0,
    yCoord: 0.4,
    isProofread: false,
    translatedText: "",
  },
];

function UnitListWrapper({ initialMode }: { initialMode: TranslatorMode }) {
  const [mode, setMode] = useState<TranslatorMode>(initialMode);
  const [focusedUnitId, setFocusedUnitId] = useState<string | undefined>("2");
  const [units, setUnits] = useState<UnitInfo[]>(initialUnits);

  const handleModifyUnit = (unitId: string, updates: Partial<UnitInfo>) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, ...updates } : u)),
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 font-sans antialiased">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-800">UnitList 交互演示</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            点击行切换聚焦 · 支持输入和模式切换
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

      <main className="flex-1 overflow-y-auto max-w-3xl mx-auto w-full bg-white border-x border-gray-100 shadow-inner p-4">
        <UnitList
          units={units}
          focusedUnitId={focusedUnitId}
          mode={mode}
          onFocusUnit={setFocusedUnitId}
          onModifyUnit={handleModifyUnit}
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
