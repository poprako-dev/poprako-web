import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import StatusOptionBar from "@/features/BaseTranslator/components/business/StatusOptionBar";
import type { TranslatorMode } from "@/types/translatorMode";

const meta: Meta<typeof StatusOptionBar> = {
  title: "Features/StatusOptionBar",
  component: StatusOptionBar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof StatusOptionBar>;

function InteractiveWrapper({
  initialMode,
  canSwitchView,
}: {
  initialMode: TranslatorMode;
  canSwitchView: boolean;
}) {
  const [view, setView] = useState<TranslatorMode>(initialMode);
  const [relocation, setRelocation] = useState(false);
  const [previewVisibility, setPreviewVisibility] = useState<
    "visible" | "dimmed"
  >("visible");

  function switchView() {
    setView((current) => current === "proofread" ? "translate" : "proofread");
  }

  return (
    <div className="w-64 border border-border rounded">
      <StatusOptionBar
        currMode={initialMode}
        view={view}
        canSwitchView={canSwitchView}
        isRelocationEnabled={relocation}
        isUnitCreationEnabled={true}
        proofreadPreviewVisibility={previewVisibility}
        onSwitchView={switchView}
        onRelocationClick={() => setRelocation((v) => !v)}
        onUnitCreationClick={() => console.log("unit creation toggled")}
        onToggleProofreadPreviewClick={() =>
          setPreviewVisibility((v) => (v === "visible" ? "dimmed" : "visible"))
        }
        onSaveClick={async () => console.log("saved")}
        saving={false}
      />
    </div>
  );
}

export const TranslateMode: Story = {
  name: "非校对用户（翻译模式，无循环按钮）",
  render: () => (
    <InteractiveWrapper
      initialMode="translate"
      canSwitchView={false}
    />
  ),
};

export const ProofreadModeWithTranslationView: Story = {
  name: "校对模式（可查看翻译视图）",
  render: () => (
    <InteractiveWrapper
      initialMode="proofread"
      canSwitchView
    />
  ),
};

export const ProofreadMode: Story = {
  name: "校对模式（锁定校对视图）",
  render: () => (
    <InteractiveWrapper
      initialMode="proofread"
      canSwitchView={false}
    />
  ),
};

export const ReadOnlyActive: Story = {
  name: "只读模式（编辑按钮隐藏）",
  render: () => (
    <InteractiveWrapper
      initialMode="readOnly"
      canSwitchView={false}
    />
  ),
};
