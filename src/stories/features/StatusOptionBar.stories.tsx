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
  const [mode, setMode] = useState<TranslatorMode>(initialMode);
  const [relocation, setRelocation] = useState(false);
  const [previewVisibility, setPreviewVisibility] = useState<
    "visible" | "dimmed"
  >("visible");

  function cycleMode() {
    const idx = availableModes.indexOf(mode);
    const next = availableModes[(idx + 1) % availableModes.length];
    setMode(next);
  }

  return (
    <div className="w-64 border border-border rounded">
      <StatusOptionBar
        currMode={mode}
        availableModes={availableModes}
        isRelocationEnabled={relocation}
        isUnitCreationEnabled={true}
        proofreadPreviewVisibility={previewVisibility}
        onCycleMode={cycleMode}
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

export const NonProofreaderTranslate: Story = {
  name: "非校对用户（翻译模式，无循环按钮）",
  render: () => (
    <InteractiveWrapper
      initialMode="translate"
      availableModes={["translate"]}
    />
  ),
};

export const WithProofreadCycle: Story = {
  name: "校对用户（三模式循环）",
  render: () => (
    <InteractiveWrapper
      initialMode="translate"
      availableModes={["translate", "proofread", "readOnly"]}
    />
  ),
};

export const ProofreadActive: Story = {
  name: "校对模式激活",
  render: () => (
    <InteractiveWrapper
      initialMode="proofread"
      availableModes={["translate", "proofread", "readOnly"]}
    />
  ),
};

export const ReadOnlyActive: Story = {
  name: "只读模式（编辑按钮隐藏）",
  render: () => (
    <InteractiveWrapper
      initialMode="readOnly"
      availableModes={["translate", "proofread", "readOnly"]}
    />
  ),
};
