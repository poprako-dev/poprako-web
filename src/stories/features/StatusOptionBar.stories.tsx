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
  availableModes,
}: {
  initialMode: TranslatorMode;
  availableModes: TranslatorMode[];
}) {
  const [view, setView] = useState<TranslatorMode>(initialMode);
  const [relocation, setRelocation] = useState(false);
  const [isHighResolution, setIsHighResolution] = useState(false);
  const [previewVisibility, setPreviewVisibility] = useState<
    "visible" | "dimmed"
  >("visible");

  function switchView() {
    setView((current) => {
      const currentIndex = availableModes.indexOf(current);
      return availableModes[(currentIndex + 1) % availableModes.length] ?? current;
    });
  }

  const nextView = availableModes[
    (availableModes.indexOf(view) + 1) % availableModes.length
  ] ?? view;

  return (
    <div className="w-64 border border-border rounded">
      <StatusOptionBar
        currMode={view}
        view={view}
        nextView={nextView}
        canSwitchView={availableModes.length > 1}
        isRelocationEnabled={relocation}
        isUnitCreationEnabled={true}
        proofreadPreviewVisibility={previewVisibility}
        isHighResolution={isHighResolution}
        isLoadingPage={false}
        onSwitchView={switchView}
        onRelocationClick={() => { setRelocation((v) => !v); }}
        onUnitCreationClick={() => { return; }}
        onToggleProofreadPreviewClick={() =>
          { setPreviewVisibility((v) => (v === "visible" ? "dimmed" : "visible")); }
        }
        onToggleImageQualityClick={async () => {
          await Promise.resolve();
          setIsHighResolution((current) => !current);
        }}
        onSaveClick={() => Promise.resolve()}
        saving={false}
        saveStatus="已保存"
      />
    </div>
  );
}

export const TranslateMode: Story = {
  name: "纯翻译（可切换只读模式）",
  render: () => (
    <InteractiveWrapper
      initialMode="translate"
      availableModes={["translate", "readOnly"]}
    />
  ),
};

export const TranslateAndProofreadMode: Story = {
  name: "翻校（可切换翻译与只读模式）",
  render: () => (
    <InteractiveWrapper
      initialMode="proofread"
      availableModes={["proofread", "translate", "readOnly"]}
    />
  ),
};

export const ProofreadMode: Story = {
  name: "纯校对（可切换只读模式）",
  render: () => (
    <InteractiveWrapper
      initialMode="proofread"
      availableModes={["proofread", "readOnly"]}
    />
  ),
};

export const ReadOnlyActive: Story = {
  name: "只读模式（编辑按钮隐藏）",
  render: () => (
    <InteractiveWrapper
      initialMode="readOnly"
      availableModes={["readOnly"]}
    />
  ),
};
