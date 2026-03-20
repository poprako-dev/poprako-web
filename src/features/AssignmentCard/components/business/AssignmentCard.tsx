import clsx from "clsx";
import type { AssignmentInfo } from "@/types/assignment";
import type { ViewMode } from "../../types/types";
import TranslatorAssignmentCard from "./TranslatorAssignmentCard";
import ReviewerAssignmentCard from "./ReviewerAssignmentCard";

type Props = {
  assignmentInfo: AssignmentInfo;
  mode: ViewMode;
  onClick: () => void;
  onLoadAssignments: (chapterId: string) => Promise<AssignmentInfo[]>;
};

// 固定高度、宽度自适应的细长卡片容器
// mode 由父组件注入，自身不负责切换
export default function AssignmentCard(props: Props) {
  const { assignmentInfo, mode, onClick } = props;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "w-full flex flex-col",
        "bg-white rounded-lg overflow-hidden shadow-md",
        "border border-slate-200",
        "transition-all cursor-pointer duration-300",
        "hover:bg-slate-50",
        mode === "translator" ? "h-30" : "h-36",
      )}
    >
      {mode === "translator" && (
        <TranslatorAssignmentCard assignmentInfo={assignmentInfo} />
      )}
      {mode === "reviewer" && (
        <ReviewerAssignmentCard
          assignmentInfo={assignmentInfo}
          onLoadAssignments={props.onLoadAssignments}
        />
      )}
    </div>
  );
}
