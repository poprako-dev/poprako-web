import clsx from "clsx";
import { ChevronRight, Plus } from "lucide-react";
import type { WorksetInfo } from "@/types/workset";

type Props = {
  // 当前选中的 workset id，默认为最新的 workset
  activeWorksetId: string;
  // 所有的 workset 信息列表，应该按照创建时间降序排列（最新的在前面）
  worksets: WorksetInfo[];
  // 收起侧边栏的回调函数
  onClose: () => void;
  // 创建 workset 的回调函数，通知父组件呼起创建 workset 的 modal
  onCreateWorkset: () => void;
  // 删除 workset 的回调函数，参数为要删除的 workset id
  onDeleteWorkset: (worksetId: string) => void;
  // 切换 workset 的回调函数，参数为要切换到的 workset id
  onChangeWorkset: (worksetId: string) => void;
  // TODO: isEditEnabled: boolean，是否允许编辑（创建/删除）workset，未来可能会有权限控制相关的功能
};

export default function WorksetSidebar({
  activeWorksetId,
  worksets,
  onClose,
  onCreateWorkset,
  // TODO: onDeleteWorkset,
  onChangeWorkset,
}: Props) {
  return (
    <div className="flex flex-col h-full bg-[#FAF9F4] border-l border-stone-200 w-56">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
        <h2 className="text-md font-bold text-slate-600">作品集</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Workset 列表 */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        {worksets.map((ws) => (
          <div key={ws.id} className="group relative flex items-center">
            <button
              onClick={() => onChangeWorkset(ws.id)}
              className={clsx(
                "flex-1 flex items-center justify-between",
                "px-3 py-2 rounded-md transition-colors text-left",
                "pr-7",
                activeWorksetId === ws.id
                  ? "bg-slate-100 text-slate-700"
                  : "text-slate-500 hover:bg-slate-50",
              )}
            >
              <span className="text-[13px] truncate pr-2">
                【 {ws.index + 1} 】{ws.name}
              </span>
              <span className="text-[11px] text-slate-400 shrink-0">
                {ws.comicCount}
              </span>
            </button>
            {/* TODO: 悬浮删除按钮 */}
            {/* <button
              onClick={() => onDeleteWorkset(ws.id)}
              className={clsx(
                "absolute right-1.5 p-1 rounded",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "text-slate-300 hover:text-rose-400",
              )}
            >
              <Trash2 className="w-3 h-3" strokeWidth={1.5} />
            </button> */}
          </div>
        ))}

        {/* 新建按钮 */}
        <div className="pt-2 mt-1 border-t border-slate-100">
          <button
            onClick={onCreateWorkset}
            className={clsx(
              "w-full flex items-center justify-center gap-1.5",
              "py-1 rounded-md border border-dashed border-slate-200",
              "text-slate-400 hover:text-slate-500 hover:bg-slate-50",
              "transition-colors text-[12px]",
            )}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
