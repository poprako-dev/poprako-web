/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @eslint-react/dom-no-missing-button-type -- toolbar callbacks. */
import {
  CheckCheck,
  CircleSlash,
  Eye,
  FileType,
  Image,
  Loader2,
  Lock,
  MapPin,
  Save,
} from "lucide-react";
import clsx from "clsx";
import type { TranslatorMode } from "@/types/translatorMode";
import type { ProofreadPreviewVisibility } from "@/features/BaseTranslator/types/preview";

interface Props {
  currMode: TranslatorMode;
  view: TranslatorMode;
  nextView: TranslatorMode;
  canSwitchView: boolean;
  isRelocationEnabled: boolean;
  isUnitCreationEnabled: boolean;
  proofreadPreviewVisibility: ProofreadPreviewVisibility;
  isHighResolution: boolean;
  isLoadingPage: boolean;
  saving: boolean;
  saveStatus: string;
  onSwitchView: () => void;
  onRelocationClick: () => void;
  onUnitCreationClick: () => void;
  onToggleProofreadPreviewClick: () => void;
  onToggleImageQualityClick: () => Promise<void>;
  onSaveClick: () => Promise<void>;
}

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
  nextView,
  canSwitchView,
  isRelocationEnabled,
  isUnitCreationEnabled,
  proofreadPreviewVisibility,
  isHighResolution,
  isLoadingPage,
  saving,
  saveStatus,
  onSwitchView,
  onRelocationClick,
  onUnitCreationClick,
  onToggleProofreadPreviewClick,
  onToggleImageQualityClick,
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
          aria-label={`切换到${modeLabel[nextView]}`}
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
              "hidden [@media(any-pointer:coarse)]:flex",
              isUnitCreationEnabled
                ? "bg-white hover:bg-stone-100"
                : "bg-green-50 hover:bg-green-100",
            )}
          >
            <CircleSlash size={18} />
          </button>
          <button
            title={`保存 · ${saveStatus}`}
            aria-label={`保存 · ${saveStatus}`}
            disabled={isLoadingPage}
            onClick={onSaveClick}
            className={clsx(
              btnBase,
              "bg-white",
              isLoadingPage
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
        type="button"
        title={
          isHighResolution
            ? "当前：高清原图，点击切换到优化图片"
            : "当前：优化图片，点击切换到高清原图"
        }
        aria-label={isHighResolution ? "切换到优化图片" : "切换到高清原图"}
        aria-pressed={isHighResolution}
        disabled={isLoadingPage}
        onClick={() => void onToggleImageQualityClick()}
        className={clsx(
          btnBase,
          isLoadingPage && "cursor-not-allowed opacity-40",
          isHighResolution
            ? "bg-green-50 hover:bg-green-100"
            : "bg-white hover:bg-stone-100",
        )}
      >
        <Image size={18} />
      </button>
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
