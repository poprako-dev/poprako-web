import type { JSX } from "react";
import clsx from "clsx";
import { hasRole } from "@/route/business/identity/role";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import {
  ROLE_NAMES,
  STATUS_CONFIG,
  STATUS_LABELS,
  WORKFLOW_STEPS,
  workflowStatus,
} from "@/route/_authenticated/_shell/comic-playground/business/progress/workflow-steps";

type Props = {
  chapter: ChapterInfo | null;
  assignments: AssignmentInfo[];
  isOpen: boolean;
  onToggle: () => void;
};

export function ComicProgressMobile({
  chapter,
  assignments,
  isOpen,
  onToggle,
}: Props): JSX.Element {
  return (
    <div className="flex sm:hidden items-center shrink-0">
      <div className="relative">
        <button
          type="button"
          className="flex rounded-xs overflow-hidden cursor-pointer"
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
        >
          {WORKFLOW_STEPS.map((step) => {
            const config = STATUS_CONFIG[workflowStatus(step, chapter)];
            return <div key={step.label} className={clsx("h-2 w-3 shrink-0", config.dot)} />;
          })}
        </button>
        {isOpen && chapter && <MobileWorkflowDetails chapter={chapter} assignments={assignments} />}
      </div>
    </div>
  );
}

type DetailsProps = { chapter: ChapterInfo; assignments: AssignmentInfo[] };

function MobileWorkflowDetails({ chapter, assignments }: DetailsProps): JSX.Element {
  return (
    <div
      className={clsx(
        "absolute top-full right-0 mt-4.5 z-20",
        "bg-surface-white/95 border border-line-stone-200 rounded-sm shadow-sm",
        "py-1.5 px-2.5",
      )}
    >
      <div className="flex flex-col gap-1.5 text-xs whitespace-nowrap">
        {WORKFLOW_STEPS.map((step) => (
          <MobileWorkflowStep
            key={step.label}
            step={step}
            chapter={chapter}
            assignments={assignments}
          />
        ))}
      </div>
    </div>
  );
}

type StepProps = DetailsProps & { step: (typeof WORKFLOW_STEPS)[number] };

function MobileWorkflowStep({ step, chapter, assignments }: StepProps): JSX.Element {
  const status = step.getStatus(chapter);
  const names = assignments
    .filter((assignment) => hasRole(assignment, step.field))
    .map((assignment) => assignment.user?.name ?? assignment.userId)
    .filter(Boolean);
  return (
    <div>
      <div className="text-ink-stone-500">
        <span className="font-bold">{ROLE_NAMES[step.label]}：</span>
        <span className="italic">{STATUS_LABELS[status]}</span>
      </div>
      <div className="text-text-muted-warm italic">{names.length > 0 ? names.join("、") : "—"}</div>
    </div>
  );
}
