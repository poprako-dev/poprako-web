import type { JSX } from "react";
import clsx from "clsx";
import type { WorkflowStatus } from "@/routes/_authenticated/business/chapter/workflow";

type Props = {
  status: WorkflowStatus;
  names: string[];
};

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  pending: "待开始",
  ongoing: "进行中",
  completed: "已完成",
  unset: "未设置",
};

export function WorkflowStepDropdown({ status, names }: Props): JSX.Element {
  return (
    <div
      className={clsx(
        "absolute top-full left-1/2 -translate-x-1/2 mt-2.5 z-20",
        "bg-surface-panel border border-border rounded-sm shadow-sm",
        "py-1.5 px-2.5 whitespace-nowrap",
      )}
    >
      <div className="flex flex-col gap-1 text-xs">
        <div>
          <div className="font-bold text-muted-foreground text-center">状态</div>
          <div className="text-muted-foreground italic text-center">{STATUS_LABELS[status]}</div>
        </div>
        <div>
          <div className="font-bold text-muted-foreground text-center">成员</div>
          {names.length > 0 ? (
            names.map((name) => (
              <div key={name} className="text-muted-foreground italic text-center">
                {name}
              </div>
            ))
          ) : (
            <div className="text-muted-foreground italic text-center">—</div>
          )}
        </div>
      </div>
    </div>
  );
}
