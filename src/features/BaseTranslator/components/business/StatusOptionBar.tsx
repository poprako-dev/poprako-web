import { FileType, CheckCheck, Lock, CircleSlash, MapPin, Eye, Save, Loader2 } from "lucide-react";
import clsx from "clsx";
import type { TranslatorMode } from "@/types/translatorMode";
import type { ProofreadPreviewVisibility } from "@/features/BaseTranslator/types/preview";

type Props = {
  currMode: TranslatorMode;
  view: TranslatorMode;
  canSwitchView: boolean;
  isRelocationEnabled: boolean;
  isUnitCreationEnabled: boolean;
  proofreadPreviewVisibility: ProofreadPreviewVisibility;
  saving: boolean;
  onSwitchView: () => void;
  onRelocationClick: () => void;
  onUnitCreationClick: () => void;
  onToggleProofreadPreviewClick: () => void;
  onSaveClick: () => Promise<void>;
};

const modeIcon: Record<TranslatorMode, React.ReactNode> = {
  translate: <FileType size={18} />,
  proofread: <CheckCheck size={18} />,
  readOnly: <Lock size={18} />,
};

const modeLabel: Record<TranslatorMode, string> = {
  translate: "翻译模式",
  proofread: "校对模式",
  readOnly: "只读模式",
};

export default function StatusOptionBar({
  currMode,
  view,
  canSwitchView,
  isRelocationEnabled,
  isUnitCreationEnabled,
  proofreadPreviewVisibility,
  saving,
  onSwitchView,
  onRelocationClick,
  onUnitCreationClick,
  onToggleProofreadPreviewClick,
  onSaveClick,
}: Props) {
  const btnBase = clsx(
    "flex-1 flex items-center justify-center py-2 transition-colors",
    "text-stone-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]",
  );

  return (
    <div className="flex w-full divide-x divide-stone-200">
      {canSwitchView && (
        <button
          title={`当前：${modeLabel[view].replace("模式", "视图")}，点击切换视图`}
          aria-label={`切换到${view === "proofread" ? "翻译" : "校对"}视图`}
          onClick={onSwitchView}
          className={clsx(btnBase, "bg-green-50 hover:bg-green-100")}
        >
          {modeIcon[view]}
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
        <MapPin size={18} />
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
            <CircleSlash size={18} />
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
              ? <Loader2 size={18} className="animate-spin" />
              : <Save size={18} />}
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
        <Eye size={18} />
      </button>
    </div>
  );
}
