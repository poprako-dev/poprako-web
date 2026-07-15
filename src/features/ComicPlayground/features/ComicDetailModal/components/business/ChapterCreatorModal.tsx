import { useState } from "react";
import { Loader2, AlignLeft, Layers } from "lucide-react";
import clsx from "clsx";
import IconInputRow from "@/components/ui/IconInputRow";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import { roleMask, type Role } from "@/types/role";
import type { Result } from "@/types/utils/result";
import type { ComicInfo } from "@/types";
import PresetAssignmentRoleSwitchGroup from "../../../../components/business/PresetAssignmentRoleSwitchGroup";

type Props = {
  comicInfo: ComicInfo;
  onCreateChapter: (
    subtitle?: string,
    presetAssignmentRoles?: number,
  ) => Promise<Result<string>>;
  onClose: () => void;
};

export default function ChapterCreatorModal({
  comicInfo,
  onCreateChapter,
  onClose,
}: Props) {
  const { activeMember } = useActiveTeam();
  const [subtitle, setSubtitle] = useState("");
  const [presetRoles, setPresetRoles] = useState<Role[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
        "bg-white/60 backdrop-blur-sm",
        "animate-in fade-in duration-200",
      )}
    >
      <div
        className={clsx(
          "w-full max-w-70 rounded-xl overflow-hidden",
          "bg-white",
          "border border-(--color-border-green-200)",
          "shadow-(--shadow-sm)",
          "animate-in zoom-in-95 duration-200",
        )}
      >
        {/* 顶部品牌色条 */}
        <div
          className="h-1 w-full opacity-20"
          style={{ background: "var(--color-green-500)" }}
        />

        <div className="pt-4 pb-2 text-center">
          <h3 className="text-base font-bold text-slate-800">新建章节</h3>
          <div className="mt-2 flex items-center justify-center gap-1.5 px-4">
            <div
              className={clsx(
                "flex items-center gap-1 px-2 py-0.5 rounded-md",
                "bg-green-50 border border-(--color-border-green-200)",
              )}
            >
              <Layers className="w-2.5 h-2.5 text-slate-400" />
              <span className="text-[11px] text-slate-500 truncate max-w-24">
                {comicInfo.title || "未知作品"}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 pt-3">
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
                "text-slate-400 bg-slate-50 hover:bg-slate-100",
                "border border-slate-100",
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
                "bg-green-50 text-green-500",
                "border border-(--color-border-green-200)",
                "hover:bg-green-100",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "确认"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
