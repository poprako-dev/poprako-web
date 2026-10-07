import type { JSX, ReactNode } from "react";
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
  MessageSquareText,
} from "lucide-react";
import clsx from "clsx";
import type { TranslatorMode } from "@/route/_authenticated/translator/business/unit/translator-mode";
import type { ProofreadPreviewVisibility } from "@/route/_authenticated/translator/business/contract/preview";
import type { ReadOnlyView } from "./revision-note/revision-note";

type Props = {
  imageControl?: ReactNode;
  readOnlyView?: ReadOnlyView;
  onSwitchReadOnlyView?: (() => void) | undefined;
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

export function StatusOptionBar({
  imageControl,
  readOnlyView = "unit",
  onSwitchReadOnlyView,
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
}: Props): JSX.Element {
  const btnBase = clsx(
    "flex-1 flex items-center justify-center py-2 transition-colors",
    "text-ink-stone-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]",
  );

  return (
    <div className="flex w-full divide-x divide-separator-stone-200">
      {canSwitchView && (
        <button
          type="button"
          title={`当前：${modeLabel[view].replace("模式", "视图")}，点击切换视图`}
          aria-label={`切换到${modeLabel[nextView]}`}
          onClick={onSwitchView}
          className={clsx(btnBase, "bg-surface-green-50 hover:bg-surface-green-100")}
        >
          {modeIcon[view]}
        </button>
      )}
      {currMode === "readOnly" && onSwitchReadOnlyView && (
        <button
          type="button"
          title={
            readOnlyView === "unit"
              ? "当前：翻校对照，切换到 revision_note"
              : "当前：revision_note，切换到翻校对照"
          }
          aria-label={readOnlyView === "unit" ? "切换到 revision_note" : "切换到翻校对照"}
          aria-pressed={readOnlyView === "revision_note"}
          onClick={onSwitchReadOnlyView}
          className={clsx(
            btnBase,
            readOnlyView === "revision_note"
              ? "bg-surface-green-50 hover:bg-surface-green-100"
              : "bg-surface-white hover:bg-surface-stone-100",
          )}
        >
          {readOnlyView === "revision_note" ? (
            <MessageSquareText size={18} />
          ) : (
            <FileType size={18} />
          )}
        </button>
      )}
      <button
        type="button"
        title="切换重定位模式"
        aria-label="切换重定位模式"
        aria-pressed={isRelocationEnabled}
        onClick={onRelocationClick}
        className={clsx(
          btnBase,
          isRelocationEnabled
            ? "bg-surface-green-50 hover:bg-surface-green-100"
            : "bg-surface-white hover:bg-surface-stone-100",
        )}
      >
        <MapPin size={18} />
      </button>
      {currMode !== "readOnly" && (
        <>
          <button
            type="button"
            title={isUnitCreationEnabled ? "禁用标记创建" : "启用标记创建"}
            onClick={onUnitCreationClick}
            className={clsx(
              btnBase,
              "hidden [@media(any-pointer:coarse)]:flex",
              isUnitCreationEnabled
                ? "bg-surface-white hover:bg-surface-stone-100"
                : "bg-surface-green-50 hover:bg-surface-green-100",
            )}
          >
            <CircleSlash size={18} />
          </button>
          <button
            type="button"
            title={`保存 · ${saveStatus}`}
            aria-label={`保存 · ${saveStatus}`}
            disabled={isLoadingPage}
            onClick={() => void onSaveClick()}
            className={clsx(
              btnBase,
              "bg-surface-white",
              isLoadingPage ? "opacity-40 cursor-not-allowed" : "hover:bg-surface-stone-100",
            )}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          </button>
        </>
      )}
      {imageControl ?? (
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
              ? "bg-surface-green-50 hover:bg-surface-green-100"
              : "bg-surface-white hover:bg-surface-stone-100",
          )}
        >
          <Image size={18} />
        </button>
      )}
      <button
        type="button"
        title={
          readOnlyView === "revision_note"
            ? proofreadPreviewVisibility === "visible"
              ? "隐藏 revision_note 矩形"
              : "显示 revision_note 矩形"
            : proofreadPreviewVisibility === "visible"
              ? "隐藏预览"
              : "显示预览"
        }
        aria-label={
          readOnlyView === "revision_note" ? "切换 revision_note 矩形显示" : "切换预览显示"
        }
        aria-pressed={proofreadPreviewVisibility === "visible"}
        onClick={onToggleProofreadPreviewClick}
        className={clsx(
          btnBase,
          proofreadPreviewVisibility === "visible"
            ? "bg-surface-green-50 hover:bg-surface-green-100"
            : "bg-surface-white hover:bg-surface-stone-100",
        )}
      >
        <Eye size={18} />
      </button>
    </div>
  );
}
