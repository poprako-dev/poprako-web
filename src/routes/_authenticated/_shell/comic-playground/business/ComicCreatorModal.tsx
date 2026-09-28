import { useState } from "react";
import type { JSX } from "react";
import { AlignLeft, BookOpen, Layers, Loader2, Type, User } from "lucide-react";
import clsx from "clsx";
import { IconInputRow } from "@/shared/component/IconInputRow";
import { type Role, roleMask } from "@/routes/business/identity/role";
import type { MemberInfo } from "@/routes/business/identity/member";
import type { CreateComicArgs } from "@/routes/_authenticated/business/comic/comic-input";
import type { Result } from "@/shared/utility/result";
import type { WorksetInfo } from "@/routes/_authenticated/business/workset/workset";
import { PresetAssignmentRoleSwitchGroup } from "@/routes/_authenticated/_shell/business/assignment/PresetAssignmentRoleSwitchGroup";

type Props = {
  currWorkset: WorksetInfo;
  activeMember: MemberInfo | null;
  onCreateComic: (args: CreateComicArgs) => Promise<Result<string>>;
  onClose: () => void;
};

export function ComicCreatorModal({
  currWorkset,
  activeMember,
  onCreateComic,
  onClose,
}: Props): JSX.Element {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    firstChapterTitle: "",
  });
  const [presetRoles, setPresetRoles] = useState<Role[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = formData.title.trim().length > 0 && formData.author.trim().length > 0;

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true);
    const result = await onCreateComic({
      worksetId: currWorkset.id,
      title: formData.title.trim(),
      author: formData.author.trim(),
      description: formData.description.trim() || undefined,
      firstChapterTitle: formData.firstChapterTitle.trim() || undefined,
      presetAssignmentRoles: presetRoles.length > 0 ? roleMask(presetRoles) : undefined,
    });
    setIsSubmitting(false);
    if (result.success) onClose();
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "bg-overlay backdrop-blur-sm",
        "animate-in fade-in duration-200",
      )}
    >
      <div
        className={clsx(
          "w-full max-w-70 rounded-xl overflow-hidden",
          "bg-surface-panel",
          "border border-(--color-border-green-200)",
          "shadow-(--shadow-sm)",
          "animate-in zoom-in-95 duration-200",
        )}
      >
        {/* 顶部品牌色条 */}
        <div className="h-1 w-full opacity-20" style={{ background: "var(--color-green-500)" }} />

        <div className="pt-4 pb-2 text-center">
          <h3 className="text-lg font-bold text-foreground">新建作品</h3>
          <div className="mt-2 flex items-center justify-center gap-1.5 px-4">
            <div
              className={clsx(
                "flex items-center gap-1 px-2 py-0.5 rounded-md",
                "bg-green-50 border border-(--color-border-green-200)",
              )}
            >
              <Layers className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground truncate max-w-20">
                {currWorkset.name}
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
          <div className="space-y-2.5">
            <IconInputRow
              icon={<Type size={14} />}
              placeholder="标题"
              value={formData.title}
              onChange={(v) => {
                setFormData({ ...formData, title: v });
              }}
            />

            <IconInputRow
              icon={<User size={14} />}
              placeholder="作者"
              value={formData.author}
              onChange={(v) => {
                setFormData({ ...formData, author: v });
              }}
            />

            <IconInputRow
              icon={<BookOpen size={14} />}
              placeholder="第一章标题（选填）"
              value={formData.firstChapterTitle}
              onChange={(v) => {
                setFormData({ ...formData, firstChapterTitle: v });
              }}
            />

            {/* 描述 textarea — 与 IconInputRow 风格对齐 */}
            <div
              className={clsx(
                "flex items-start gap-2.5 rounded-md px-3 py-2",
                "border border-border bg-surface-panel shadow-sm shadow-border/50",
                "hover:border-border",
                "focus-within:border-border transition-all",
              )}
            >
              <AlignLeft className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <textarea
                placeholder="描述（选填）"
                rows={2}
                className={clsx(
                  "w-full bg-transparent text-sm text-foreground",
                  "placeholder:text-muted-foreground outline-none resize-none",
                )}
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                }}
              />
            </div>
          </div>

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
                "text-muted-foreground bg-muted hover:bg-accent",
                "border border-border",
              )}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className={clsx(
                "flex-1 py-2 text-xs font-semibold rounded-lg",
                "flex items-center justify-center gap-1",
                "transition-all duration-200 active:scale-[0.98]",
                isValid
                  ? [
                      "bg-green-50 text-green-500",
                      "border border-(--color-border-green-200)",
                      "hover:bg-green-100",
                    ]
                  : "bg-muted text-muted-foreground cursor-not-allowed border border-border",
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
