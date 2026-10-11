import { type JSX, useState } from "react";
import clsx from "clsx";
import { ChevronRight, Plus } from "lucide-react";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import type { Result } from "@/shared/utility/result";
import { WorksetModifierModal } from "@/route/_authenticated/_shell/comic-playground/business/WorksetModifierModal";
import { useWorksetInteractions } from "@/route/_authenticated/_shell/comic-playground/business/comic-list/use-workset-interactions";
import { WorksetSidebarItem } from "@/route/_authenticated/_shell/comic-playground/business/comic-list/WorksetSidebarItem";

type UpdateWorksetArgs = {
  name: string;
  description?: string | undefined;
};

type Props = {
  activeWorksetId: string;
  worksets: WorksetInfo[];
  onClose: () => void;
  onCreateWorkset: () => void;
  onChangeWorkset: (worksetId: string) => void;
  onUpdateWorkset?: ((id: string, args: UpdateWorksetArgs) => Promise<Result<void>>) | undefined;
};

export function WorksetSidebar({
  activeWorksetId,
  worksets,
  onClose,
  onCreateWorkset,
  onChangeWorkset,
  onUpdateWorkset,
}: Props): JSX.Element {
  const [worksetToModify, setWorksetToModify] = useState<WorksetInfo | null>(null);
  const {
    handlePointerDown: handleWorksetPointerDown,
    handlePointerUp: handleWorksetPointerUp,
    handlePointerCancel: handleWorksetPointerCancel,
    handleContextMenu: handleWorksetContextMenu,
  } = useWorksetInteractions(onChangeWorkset, setWorksetToModify);

  return (
    <>
      <div className="flex flex-col h-full bg-surface-stone-100/40 border-l border-line-stone-200 w-56">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
          <h2 className="text-md font-bold text-ink-slate-600">作品集</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭作品集面板"
            className="text-text-muted-cool hover:text-ink-slate-600 transition-colors p-0.5 rounded"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Workset 列表 */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
          {worksets.map((workset) => (
            <WorksetSidebarItem
              key={workset.id}
              workset={workset}
              activeWorksetId={activeWorksetId}
              onChangeWorkset={onChangeWorkset}
              onUpdateWorkset={onUpdateWorkset}
              onPointerDown={handleWorksetPointerDown}
              onPointerUp={handleWorksetPointerUp}
              onPointerCancel={handleWorksetPointerCancel}
              onContextMenu={handleWorksetContextMenu}
            />
          ))}

          {/* 新建按钮 */}
          <div className="pt-2 mt-1 border-t border-line-slate-100">
            <button
              type="button"
              onClick={onCreateWorkset}
              aria-label="新建作品集"
              className={clsx(
                "w-full flex items-center justify-center gap-1.5",
                "py-1 rounded-md border border-dashed border-line-slate-200",
                "text-text-muted-cool hover:text-text-muted-cool hover:bg-surface-slate-50",
                "transition-colors text-[12px]",
              )}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
      {worksetToModify && onUpdateWorkset && (
        <WorksetModifierModal
          workset={worksetToModify}
          onUpdate={async (args) => {
            const res = await onUpdateWorkset(worksetToModify.id, args);
            return res;
          }}
          onClose={() => {
            setWorksetToModify(null);
          }}
        />
      )}
    </>
  );
}
