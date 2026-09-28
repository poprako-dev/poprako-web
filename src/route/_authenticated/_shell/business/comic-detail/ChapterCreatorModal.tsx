import { type JSX, useState } from "react";
import { AlignLeft, Layers, Loader2 } from "lucide-react";
import clsx from "clsx";
import { IconInputRow } from "@/shared/component/IconInputRow";
import type { MemberInfo } from "@/route/business/identity/member";
import { type Role, roleMask } from "@/route/business/identity/role";
import type { Result } from "@/shared/utility/result";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import { PresetAssignmentRoleSwitchGroup } from "@/route/_authenticated/_shell/business/assignment/PresetAssignmentRoleSwitchGroup";

type Props = {
  comicInfo: ComicInfo;
  activeMember: MemberInfo | null;
  onCreateChapter: (subtitle?: string, presetAssignmentRoles?: number) => Promise<Result<string>>;
  onClose: () => void;
};

export function ChapterCreatorModal({
  comicInfo,
  activeMember,
  onCreateChapter,
  onClose,
}: Props): JSX.Element {
  const [subtitle, setSubtitle] = useState("");
  const [presetRoles, setPresetRoles] = useState<Role[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await onCreateChapter(
      subtitle.trim() || undefined,
      presetRoles.length > 0 ? roleMask(presetRoles) : undefined,
    );
    setIsSubmitting(false);
    if (result.success) onClose();
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "bg-surface-panel/60 backdrop-blur-sm",
        "animate-in fade-in duration-200",
      )}
    >
      <div
        className={clsx(
          "w-full max-w-70 rounded-xl overflow-hidden",
          "bg-surface-panel",
          "border border-status-success/30",
          "shadow-(--shadow-sm)",
          "animate-in zoom-in-95 duration-200",
        )}
      >
        {/* 顶部品牌色条 */}
        <div className="h-1 w-full opacity-20" style={{ background: "var(--status-success)" }} />

        <div className="pt-4 pb-2 text-center">
          <h3 className="text-base font-bold text-foreground">新建章节</h3>
          <div className="mt-2 flex items-center justify-center gap-1.5 px-4">
            <div
              className={clsx(
                "flex items-center gap-1 px-2 py-0.5 rounded-md",
                "bg-status-success/10 border border-status-success/30",
              )}
            >
              <Layers className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground truncate max-w-24">
                {comicInfo.title || "未知作品"}
              </span>
            </div>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="px-5 pb-5 pt-3"
        >
          <IconInputRow
            icon={<AlignLeft size={14} />}
            placeholder="章节副标题（选填）"
            value={subtitle}
            onChange={setSubtitle}
          />

          <PresetAssignmentRoleSwitchGroup
            activeMember={activeMember}
            value={presetRoles}
            onChange={setPresetRoles}
          />

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={clsx(
                "flex-1 py-2 text-xs font-semibold rounded-lg",
                "transition-all duration-200 active:scale-[0.98]",
                "text-muted-foreground bg-surface-workspace hover:bg-surface-hover",
                "border border-border",
              )}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={clsx(
                "flex-1 py-2 text-xs font-semibold rounded-lg",
                "flex items-center justify-center gap-1",
                "transition-all duration-200 active:scale-[0.98]",
                "bg-status-success/10 text-status-success",
                "border border-status-success/30",
                "hover:bg-status-success/10",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "确认"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
