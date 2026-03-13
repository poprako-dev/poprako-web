import clsx from "clsx";
import type {
  AssignmentWithChapterInfo,
  ReviewerAssignmentWithChapterInfo,
  AssignmentInfo,
} from "@/types/assignment";
import TranslatorAssignmentCard from "./TranslatorAssignmentCard";
import ReviewerAssignmentCard from "./ReviewerAssignmentCard";

// NOTE: Add flexible typing for user to include name info in fetched assignment
export type LoadedAssignment = AssignmentInfo & {
  user?: { name: string };
  userName?: string;
};

type Props =
  | {
      assignmentInfo: AssignmentWithChapterInfo;
      mode: "translator";
      onClick: () => void;
      onLoadAssignments?: never;
    }
  | {
      assignmentInfo: ReviewerAssignmentWithChapterInfo;
      mode: "reviewer";
      onClick: () => void;
      onLoadAssignments: (chapterId: string) => Promise<LoadedAssignment[]>;
    };

// 固定高度、宽度自适应的细长卡片容器
// mode 由父组件注入，自身不负责切换
export default function AssignmentCard(props: Props) {
  const { assignmentInfo, mode, onClick } = props;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "w-full h-32 flex flex-col",
        "bg-white rounded-lg overflow-hidden shadow-sm",
        "transition-colors cursor-pointer",
        "hover:bg-slate-50",
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
