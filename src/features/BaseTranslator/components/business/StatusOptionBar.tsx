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

  const btnBase = clsx(
    "flex-1 flex items-center justify-center py-1.5 transition-colors",
    "text-stone-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]",
  );

  return (
    <div className="flex w-full divide-x divide-stone-200">
      {canCycle && (
        <button
          title={modeCycleTooltip}
          onClick={onCycleMode}
          className={clsx(btnBase, "bg-green-50 hover:bg-green-100")}
        >
          {modeIcon[currMode]}
        </button>
      )}
      <button
        title="切换重定位模式"
        onClick={onRelocationClick}
        className={clsx(
          btnBase,
          isRelocationEnabled
            ? "bg-green-50 hover:bg-green-100"
            : "bg-white hover:bg-stone-100",
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
              btnBase,
              !isUnitCreationEnabled
                ? "bg-green-50 hover:bg-green-100"
                : "bg-white hover:bg-stone-100",
            )}
          >
            <CircleSlash size={14} />
          </button>
          <button
            title="保存"
            disabled={saving}
            onClick={onSaveClick}
            className={clsx(
              btnBase,
              "bg-white",
              saving
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-stone-100",
            )}
          >
            {saving
              ? <Loader2 size={14} className="animate-spin" />
              : <Save size={14} />}
          </button>
        </>
      )}
      <button
        title={
          proofreadPreviewVisibility === "visible"
            ? "隐藏预览"
            : "显示预览"
        }
        onClick={onToggleProofreadPreviewClick}
        className={clsx(
          btnBase,
          proofreadPreviewVisibility === "visible"
            ? "bg-green-50 hover:bg-green-100"
            : "bg-white hover:bg-stone-100",
        )}
      >
        <Eye size={14} />
      </button>
    </div>
  );
}
