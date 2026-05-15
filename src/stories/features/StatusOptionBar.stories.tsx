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
  enabledModes,
}: {
  initialMode: TranslatorMode;
  enabledModes: TranslatorMode[];
}) {
  const [mode, setMode] = useState<TranslatorMode>(initialMode);
  const [relocation, setRelocation] = useState(false);
  const [previewVisibility, setPreviewVisibility] = useState<
    "visible" | "dimmed"
  >("visible");

  return (
    <div className="w-64 border border-border rounded">
      <StatusOptionBar
        currMode={mode}
        enabledModes={enabledModes}
        isRelocationEnabled={relocation}
        isUnitCreationEnabled={true}
        proofreadPreviewVisibility={previewVisibility}
        onTranslateModeClick={() => setMode("translate")}
        onProofreadModeClick={() => setMode("proofread")}
        onRelocationClick={() => setRelocation((v) => !v)}
        onUnitCreationClick={() => console.log("unit creation toggled")}
        onToggleProofreadPreviewClick={() =>
          setPreviewVisibility((v) => (v === "visible" ? "dimmed" : "visible"))
        }
        onSaveClick={async () => console.log("saved")}
      />
    </div>
  );
}

export const TranslateOnly: Story = {
  name: "仅翻译模式（三等分）",
  render: () => (
    <InteractiveWrapper initialMode="translate" enabledModes={["translate"]} />
  ),
};

export const WithProofread: Story = {
  name: "含校对模式（四等分）",
  render: () => (
    <InteractiveWrapper
      initialMode="translate"
      enabledModes={["translate", "proofread"]}
    />
  ),
};

export const ProofreadActive: Story = {
  name: "校对模式激活",
  render: () => (
    <InteractiveWrapper
      initialMode="proofread"
      enabledModes={["translate", "proofread"]}
    />
  ),
};
