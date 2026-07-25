import clsx from "clsx";
import type { AssignmentInfo } from "@/types/assignment";

type Props = {
  assignments: AssignmentInfo[];
  isLoading?: boolean;
  showEmpty?: boolean;
  canRemove?: boolean;
  onRequestRemove?: (assignment: AssignmentInfo) => void;
};

const MAX_VISIBLE_AVATARS = 4;

function memberName(assignment: AssignmentInfo): string {
  return assignment.user?.name ?? assignment.userId;
}

function avatarUrl(assignment: AssignmentInfo): string | undefined {
  return assignment.user?.avatarThumbnailUrl || assignment.user?.avatarUrl || undefined;
}

function AvatarContent({ assignment }: { assignment: AssignmentInfo }) {
  const name = memberName(assignment);
  const url = avatarUrl(assignment);

  return url ? (
    <img src={url} alt="" className="h-full w-full object-cover" />
  ) : (
    <span aria-hidden="true">{Array.from(name)[0] ?? "?"}</span>
  );
}

function AvatarTooltip({ name }: { name: string }) {
  return (
    <span
      role="tooltip"
      className={clsx(
        "pointer-events-none absolute bottom-full right-0 z-50 mb-1.5",
        "whitespace-nowrap rounded-sm px-2 py-1",
        "bg-stone-700 text-[10px] font-medium text-stone-50 shadow-sm",
        "invisible opacity-0 transition-opacity duration-150",
        "group-hover/avatar:visible group-hover/avatar:opacity-100",
        "group-focus/avatar:visible group-focus/avatar:opacity-100",
      )}
    >
      {name}
    </span>
  );
}

type MemberAvatarProps = {
  assignment: AssignmentInfo;
  canRemove: boolean;
  onRequestRemove?: (assignment: AssignmentInfo) => void;
};

function MemberAvatar({
  assignment,
  canRemove,
  onRequestRemove,
}: MemberAvatarProps) {
  const name = memberName(assignment);
  const className = clsx(
    "group/avatar relative -ml-2 flex h-8 w-8 shrink-0 first:ml-0",
    "items-center justify-center overflow-visible rounded-full",
    "border-2 border-stone-50 bg-stone-200",
    "text-[11px] font-bold text-stone-600 shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
    "focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-primary/60",
    canRemove ? "cursor-pointer hover:z-20" : "cursor-default",
  );

  if (canRemove) {
    return (
      <button
        type="button"
        aria-label={`移除${name}的当前分工`}
        onClick={(event) => {
          event.stopPropagation();
          onRequestRemove?.(assignment);
        }}
        onKeyDown={(event) => event.stopPropagation()}
        className={className}
      >
        <span
          className={clsx(
            "absolute inset-0 flex items-center justify-center",
            "overflow-hidden rounded-full",
          )}
        >
          <AvatarContent assignment={assignment} />
        </span>
        <AvatarTooltip name={name} />
      </button>
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      tabIndex={0}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      className={className}
    >
      <span
        className={clsx(
          "absolute inset-0 flex items-center justify-center",
          "overflow-hidden rounded-full",
        )}
      >
        <AvatarContent assignment={assignment} />
      </span>
      <AvatarTooltip name={name} />
    </span>
  );
}

type OverflowMembersProps = {
  assignments: AssignmentInfo[];
  canRemove: boolean;
  onRequestRemove?: (assignment: AssignmentInfo) => void;
};

function OverflowMembers({
  assignments,
  canRemove,
  onRequestRemove,
}: OverflowMembersProps) {
  return (
    <div className="group/more relative -ml-1.5 shrink-0 first:ml-0">
      <button
        type="button"
        aria-label={`另有 ${assignments.length} 位成员`}
        aria-haspopup="true"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        className={clsx(
          "flex h-8 w-8 items-center justify-center rounded-full",
          "border-2 border-stone-50 bg-stone-100",
          "text-[10px] font-bold text-stone-500 shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
          "hover:z-20 hover:bg-stone-200",
          "focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-primary/60",
        )}
      >
        +{assignments.length}
      </button>

      <div
        className={clsx(
          "invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-1.5",
          "pointer-events-none opacity-0 transition-opacity duration-150",
          "group-hover/more:visible group-hover/more:pointer-events-auto",
          "group-hover/more:opacity-100 group-focus-within/more:visible",
          "group-focus-within/more:pointer-events-auto group-focus-within/more:opacity-100",
        )}
      >
        <div
          role="list"
          className={clsx(
            "max-h-44 overflow-y-auto rounded-sm border border-stone-200",
            "bg-stone-50 p-1.5 shadow-lg",
          )}
        >
          {assignments.map((assignment) => {
            const name = memberName(assignment);
            if (!canRemove) {
              return (
                <div
                  key={assignment.userId}
                  role="listitem"
                  className="break-words px-2 py-1 text-xs text-stone-600"
                >
                  {name}
                </div>
              );
            }

            return (
              <button
                key={assignment.userId}
                type="button"
                role="listitem"
                onClick={(event) => {
                  event.stopPropagation();
                  onRequestRemove?.(assignment);
                }}
                onKeyDown={(event) => event.stopPropagation()}
                className={clsx(
                  "block w-full rounded-sm px-2 py-1 text-left text-xs",
                  "whitespace-normal break-words",
                  "text-stone-600 hover:bg-rose-50 hover:text-rose-500",
                  "focus-visible:outline-2 focus-visible:outline-rose-300",
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AssignmentAvatarStack({
  assignments,
  isLoading = false,
  showEmpty = true,
  canRemove = false,
  onRequestRemove,
}: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center -space-x-1.5" aria-label="正在加载分工成员">
        {[0, 1, 2].map((item) => (
          <span
            key={item}
            className="h-8 w-8 animate-pulse rounded-full border-2 border-stone-50 bg-stone-200"
          />
        ))}
      </div>
    );
  }

  const sorted = [...assignments].sort((left, right) =>
    memberName(left).localeCompare(memberName(right), "zh-CN", {
      numeric: true,
      sensitivity: "base",
    }),
  );
  const visible = sorted.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = sorted.slice(MAX_VISIBLE_AVATARS);

  if (sorted.length === 0) {
    return showEmpty ? (
      <span
        aria-label="未分配成员"
        className="h-8 w-8 rounded-full border border-dashed border-stone-300 bg-stone-50/70"
      />
    ) : null;
  }

  return (
    <div className="flex min-w-0 items-center" aria-label="已分配成员">
      {visible.map((assignment) => (
        <MemberAvatar
          key={assignment.userId}
          assignment={assignment}
          canRemove={canRemove}
          onRequestRemove={onRequestRemove}
        />
      ))}
      {overflow.length > 0 && (
        <OverflowMembers
          assignments={overflow}
          canRemove={canRemove}
          onRequestRemove={onRequestRemove}
        />
      )}
    </div>
  );
}
