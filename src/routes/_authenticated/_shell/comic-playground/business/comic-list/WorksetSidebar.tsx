import { type JSX, useCallback, useRef, useState } from "react";
import clsx from "clsx";
import { BookText, ChevronRight, Plus } from "lucide-react";
import type { WorksetInfo } from "@/routes/_authenticated/business/workset/workset";
import type { Result } from "@/shared/utility/result";
import { WorksetModifierModal } from "@/routes/_authenticated/_shell/comic-playground/business/WorksetModifierModal";

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
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressWorksetRef = useRef<WorksetInfo | null>(null);
  const longPressHandledRef = useRef(false);

  const clearLongPress = useCallback(() => {
    if (!longPressTimerRef.current) {
      return;
    }

    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }, []);

  const handleWorksetPointerDown = useCallback(
    (ws: WorksetInfo) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      longPressHandledRef.current = false;
      longPressWorksetRef.current = ws;
      longPressTimerRef.current = setTimeout(() => {
        longPressHandledRef.current = true;
        setWorksetToModify(ws);
      }, 500);
    },
    [],
  );

  const handleWorksetPointerUp = useCallback(
    () => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      clearLongPress();
      if (!longPressHandledRef.current) {
        const ws = longPressWorksetRef.current;
        if (ws) {
          onChangeWorkset(ws.id);
        }
      }
    },
    [clearLongPress, onChangeWorkset],
  );

  const handleWorksetPointerCancel = useCallback(
    () => () => {
      clearLongPress();
    },
    [clearLongPress],
  );

  const handleWorksetContextMenu = useCallback(
    () => (e: React.MouseEvent) => {
      e.preventDefault();
    },
    [],
  );

  return (
    <>
      <div className="flex flex-col h-full bg-surface-hover border-l border-border w-56">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
          <h2 className="text-md font-bold text-text-secondary">作品集</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭作品集面板"
            className="text-muted-foreground hover:text-text-secondary transition-colors p-0.5 rounded"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Workset 列表 */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
          {worksets.map((ws) => (
            <div key={ws.id} className="group relative flex items-center">
              {onUpdateWorkset ? (
                <div
                  onPointerDown={handleWorksetPointerDown(ws)}
                  onPointerUp={handleWorksetPointerUp()}
                  onPointerCancel={handleWorksetPointerCancel()}
                  onPointerLeave={handleWorksetPointerCancel()}
                  onContextMenu={handleWorksetContextMenu()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    onChangeWorkset(ws.id);
                  }}
                  className={clsx(
                    "flex-1 flex items-center justify-between",
                    "px-3 py-2 rounded-md transition-colors text-left",
                    "pr-7 select-none touch-none cursor-pointer",
                    activeWorksetId === ws.id
                      ? "text-primary-text"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  title="长按修改作品集信息"
                >
                  <span className="text-[12px] font-bold truncate pr-2">
                    #{ws.index + 1} {ws.name}
                  </span>
                  <span
                    className={clsx(
                      "text-[11px] font-semibold text-muted-foreground shrink-0 flex",
                      "items-center gap-0.5",
                    )}
                  >
                    <BookText className="w-3 h-3" strokeWidth={2.5} />
                    {ws.comicCount}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onChangeWorkset(ws.id);
                  }}
                  className={clsx(
                    "flex-1 flex items-center justify-between",
                    "px-3 py-2 rounded-md transition-colors text-left",
                    "pr-7",
                    activeWorksetId === ws.id
                      ? "text-primary-text"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span className="text-[12px] font-bold truncate pr-2">
                    #{ws.index + 1} {ws.name}
                  </span>
                  <span
                    className={clsx(
                      "text-[11px] font-semibold text-muted-foreground shrink-0 flex",
                      "items-center gap-0.5",
                    )}
                  >
                    <BookText className="w-3 h-3" strokeWidth={2.5} />
                    {ws.comicCount}
                  </span>
                </button>
              )}
              {/* 右侧 accent bar */}
              <div
                className={clsx(
                  "absolute right-2 top-1/2 -translate-y-1/2",
                  "w-0.75 h-5 rounded-full",
                  "transition-all duration-200 ease-out",
                  activeWorksetId === ws.id
                    ? "bg-green-500/60 scale-y-100"
                    : "bg-green-500/35 scale-y-0 group-hover:scale-y-100",
                )}
              />
            </div>
          ))}

          {/* 新建按钮 */}
          <div className="pt-2 mt-1 border-t border-border">
            <button
              type="button"
              onClick={onCreateWorkset}
              aria-label="新建作品集"
              className={clsx(
                "w-full flex items-center justify-center gap-1.5",
                "py-1 rounded-md border border-dashed border-border",
                "text-muted-foreground hover:text-muted-foreground hover:bg-muted",
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
