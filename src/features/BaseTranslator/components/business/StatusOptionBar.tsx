import { FileType, CheckCheck, CircleSlash, MapPin, Save } from "lucide-react";
import clsx from "clsx";
import type { TranslatorMode } from "@/types/translatorMode";

type Props = {
  currMode: TranslatorMode;
  enabledModes: TranslatorMode[];
  isRelocationEnabled: boolean;
  isUnitCreationEnabled: boolean;
  onTranslateModeClick: () => void;
  onProofreadModeClick: () => void;
  onRelocationClick: () => void;
  onUnitCreationClick: () => void;
  onSaveClick: () => Promise<void>;
};

// 纯受控 UI 组件，不含内部状态
export default function StatusOptionBar({
  currMode,
  enabledModes,
  isRelocationEnabled,
  isUnitCreationEnabled,
  onTranslateModeClick,
  onProofreadModeClick,
  onRelocationClick,
  onUnitCreationClick,
  onSaveClick,
}: Props) {
  const hasProofread = enabledModes.includes("proofread");

  return (
    <div className="flex w-full">
      <button
        title="翻译模式"
        onClick={onTranslateModeClick}
        className={clsx(
          "flex-1 flex items-center justify-center py-1.5 transition-colors",
          currMode === "translate"
            ? "bg-green-50 text-green-500"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <FileType size={14} />
      </button>
      {hasProofread && (
        <button
          title="校对模式"
          onClick={onProofreadModeClick}
          className={clsx(
            "flex-1 flex items-center justify-center py-1.5 transition-colors",
            currMode === "proofread"
              ? "bg-green-50 text-green-500"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <CheckCheck size={14} />
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
            onClick={onSaveClick}
            className={clsx(
              "flex-1 flex items-center justify-center py-1.5 transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Save size={14} />
          </button>
    </div>
  );
}
