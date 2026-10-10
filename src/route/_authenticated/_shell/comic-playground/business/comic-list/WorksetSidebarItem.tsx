import type { JSX } from "react";
import clsx from "clsx";
import { BookText } from "lucide-react";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import type { Result } from "@/shared/utility/result";

type UpdateWorksetArgs = {
  name: string;
  description?: string | undefined;
};

type Props = {
  workset: WorksetInfo;
  activeWorksetId: string;
  onChangeWorkset: (worksetId: string) => void;
  onUpdateWorkset?: ((id: string, args: UpdateWorksetArgs) => Promise<Result<void>>) | undefined;
  onPointerDown: (workset: WorksetInfo) => (event: React.PointerEvent) => void;
  onPointerUp: () => (event: React.PointerEvent) => void;
  onPointerCancel: () => () => void;
  onContextMenu: () => (event: React.MouseEvent) => void;
};

export function WorksetSidebarItem({
  workset,
  activeWorksetId,
  onChangeWorkset,
  onUpdateWorkset,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onContextMenu,
}: Props): JSX.Element {
  const isActive = activeWorksetId === workset.id;
  return (
    <div className="group relative flex items-center">
      {onUpdateWorkset ? (
        <div
          onPointerDown={onPointerDown(workset)}
          onPointerUp={onPointerUp()}
          onPointerCancel={onPointerCancel()}
          onPointerLeave={onPointerCancel()}
          onContextMenu={onContextMenu()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") {
              return;
            }
            event.preventDefault();
            onChangeWorkset(workset.id);
          }}
          className={clsx(
            "flex-1 flex items-center justify-between",
            "px-3 py-2 rounded-md transition-colors text-left",
            "pr-7 select-none touch-none cursor-pointer",
            isActive ? "text-navigation-active" : "text-text-muted-cool hover:bg-surface-slate-50",
          )}
          title="长按修改作品集信息"
        >
          <WorksetContent workset={workset} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            onChangeWorkset(workset.id);
          }}
          className={clsx(
            "flex-1 flex items-center justify-between",
            "px-3 py-2 rounded-md transition-colors text-left",
            "pr-7",
            isActive ? "text-navigation-active" : "text-text-muted-cool hover:bg-surface-slate-50",
          )}
        >
          <WorksetContent workset={workset} />
        </button>
      )}
      {/* 右侧 accent bar */}
      <div
        className={clsx(
          "absolute right-2 top-1/2 -translate-y-1/2",
          "w-0.75 h-5 rounded-full",
          "transition-all duration-200 ease-out",
          isActive
            ? "bg-surface-green-500/60 scale-y-100"
            : "bg-surface-green-500/35 scale-y-0 group-hover:scale-y-100",
        )}
      />
    </div>
  );
}

function WorksetContent({ workset }: { workset: WorksetInfo }): JSX.Element {
  return (
    <>
      <span className="text-[12px] font-bold truncate pr-2">
        #{workset.index + 1} {workset.name}
      </span>
      <span
        className={clsx(
          "text-[11px] font-semibold text-text-muted-cool shrink-0 flex",
          "items-center gap-0.5",
        )}
      >
        <BookText className="w-3 h-3" strokeWidth={2.5} />
        {workset.comicCount}
      </span>
    </>
  );
}
