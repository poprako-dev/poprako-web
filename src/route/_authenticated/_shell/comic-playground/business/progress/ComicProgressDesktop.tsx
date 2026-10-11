import type { JSX } from "react";
import clsx from "clsx";
import { hasRole } from "@/route/business/identity/role";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import { WorkflowStepDropdown } from "@/route/_authenticated/_shell/comic-playground/business/progress/WorkflowStepDropdown";
import {
  STATUS_CONFIG,
  WORKFLOW_STEPS,
  workflowStatus,
} from "@/route/_authenticated/_shell/comic-playground/business/progress/workflow-steps";
import type { WorkflowStep } from "@/route/_authenticated/_shell/comic-playground/business/progress/workflow-steps";

type Props = {
  chapter: ChapterInfo | null;
  assignments: AssignmentInfo[];
  hoveredStep: string | null;
  setHoveredStep: (step: string | null) => void;
};

export function ComicProgressDesktop({
  chapter,
  assignments,
  hoveredStep,
  setHoveredStep,
}: Props): JSX.Element {
  return (
    <div className="hidden sm:flex items-center gap-1 shrink-0">
      {WORKFLOW_STEPS.map((step) => (
        <DesktopWorkflowStep
          key={step.label}
          step={step}
          chapter={chapter}
          assignments={assignments}
          hovered={hoveredStep === step.label}
          setHoveredStep={setHoveredStep}
        />
      ))}
    </div>
  );
}

type StepProps = Omit<Props, "hoveredStep"> & { step: WorkflowStep; hovered: boolean };

function DesktopWorkflowStep({
  step,
  chapter,
  assignments,
  hovered,
  setHoveredStep,
}: StepProps): JSX.Element {
  const matched = assignments.filter((assignment) => hasRole(assignment, step.field));
  const status = workflowStatus(step, chapter);
  const config = STATUS_CONFIG[status];
  const names = matched
    .map((assignment) => assignment.user?.name ?? assignment.userId)
    .filter(Boolean);
  return (
    <div className="relative">
      <div // eslint-disable-line jsx-a11y/no-static-element-interactions
        className={clsx(
          "w-9 h-6 rounded-xs flex items-center justify-center",
          "text-xs font-bold font-mono select-none",
          "transition-colors duration-150",
          config.bg,
          config.text,
        )}
        onMouseEnter={() => {
          setHoveredStep(step.label);
        }}
        onMouseLeave={() => {
          setHoveredStep(null);
        }}
      >
        {step.label}
      </div>
      <div
        className={clsx(
          "absolute left-0 top-1/2 -translate-y-1/2",
          "w-1 h-2.5 rounded-full",
          config.dot,
        )}
      />
      {hovered && chapter && <WorkflowStepDropdown status={status} names={names} />}
    </div>
  );
}
