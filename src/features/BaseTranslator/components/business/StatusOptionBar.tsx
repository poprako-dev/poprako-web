import { FileType, CheckCheck, Lock, CircleSlash, MapPin, Eye, Save, Loader2 } from "lucide-react";
import clsx from "clsx";
import type { TranslatorMode } from "@/types/translatorMode";
import type { ProofreadPreviewVisibility } from "@/features/BaseTranslator/types/preview";

type Props = {
  currMode: TranslatorMode;
  availableModes: TranslatorMode[];
  isRelocationEnabled: boolean;
  isUnitCreationEnabled: boolean;
  proofreadPreviewVisibility: ProofreadPreviewVisibility;
  saving: boolean;
  onCycleMode: () => void;
  onRelocationClick: () => void;
  onUnitCreationClick: () => void;
  onToggleProofreadPreviewClick: () => void;
  onSaveClick: () => Promise<void>;
};

const modeIcon: Record<TranslatorMode, React.ReactNode> = {
  translate: <FileType size={14} />,
  proofread: <CheckCheck size={14} />,
  readOnly: <Lock size={14} />,
};

const modeLabel: Record<TranslatorMode, string> = {
  translate: "翻译模式",
  proofread: "校对模式",
  readOnly: "只读模式",
};

export default function StatusOptionBar({
  currMode,
  availableModes,
  isRelocationEnabled,
  isUnitCreationEnabled,
  proofreadPreviewVisibility,
  saving,
  onCycleMode,
  onRelocationClick,
  onUnitCreationClick,
  onToggleProofreadPreviewClick,
  onSaveClick,
}: Props) {
  const canCycle = availableModes.length > 1;

  const modeCycleTooltip = (() => {
    if (!canCycle) return modeLabel[currMode];
    const idx = availableModes.indexOf(currMode);
    const next = availableModes[(idx + 1) % availableModes.length];
    return `当前：${modeLabel[currMode]}，点击切换到${modeLabel[next]}`;
  })();

  return (
    <div className="flex w-full">
      {canCycle && (
        <button
          title={modeCycleTooltip}
          onClick={onCycleMode}
          className="flex-1 flex items-center justify-center py-1.5 transition-colors bg-green-50 text-green-500"
        >
          {modeIcon[currMode]}
        </button>
      )}
      <button
        title="切换重定位模式"
        onClick={onRelocationClick}
        className={clsx(
          "flex-1 flex items-center justify-center py-1.5 transition-colors",
          isRelocationEnabled
            ? "bg-green-50 text-green-500"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <MapPin size={14} />
      </button>
      {currMode !== "readOnly" && (
        <>
          <button
            title={isUnitCreationEnabled ? "禁用标记创建" : "启用标记创建"}
            onClick={onUnitCreationClick}
            className={clsx(
              "flex-1 flex items-center justify-center py-1.5 transition-colors",
              !isUnitCreationEnabled
                ? "bg-green-50 text-green-500"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <CircleSlash size={14} />
          </button>
          <button
            title="保存"
            disabled={saving}
            onClick={onSaveClick}
            className={clsx(
              "flex-1 flex items-center justify-center py-1.5 transition-colors",
              saving
                ? "text-muted-foreground/40 cursor-not-allowed"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          </button>
        </>
      )}
      <button
        title={
          proofreadPreviewVisibility === "visible"
            ? "降低标记透明度"
            : "恢复标记透明度"
        }
        onClick={onToggleProofreadPreviewClick}
        className={clsx(
          "flex-1 flex items-center justify-center py-1.5 transition-colors",
          proofreadPreviewVisibility === "visible"
            ? "bg-green-50 text-green-500"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Eye size={14} />
      </button>
    </div>
  );
}
