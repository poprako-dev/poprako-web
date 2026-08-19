import type { ReactNode } from "react";

type Props = {
  assignmentPanel: ReactNode;
  recordList: ReactNode;
};

export default function WorkflowPanel({
  assignmentPanel,
  recordList,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent">
      <div className="shrink-0">{assignmentPanel}</div>
      <div className="min-h-0 flex-1">{recordList}</div>
    </div>
  );
}
