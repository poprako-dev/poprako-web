import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Tooltip } from "radix-ui";
import type { UserInfo } from "@/types/user";

export type UnitContributor = {
  role: "translator" | "proofreader";
  user: UserInfo;
};

type Props = {
  contributors: UnitContributor[];
  children: ReactNode;
};

type AvatarProps = {
  user: UserInfo;
};

const HOVER_DELAY_MS = 320;

function userDisplayName(user: UserInfo): string {
  return user.name.trim() || user.id;
}

function ContributorAvatar({ user }: AvatarProps) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const avatarUrl = user.avatarThumbnailUrl || user.avatarUrl;
  const displayName = userDisplayName(user);

  return (
    <span
      aria-hidden="true"
      className={
        "flex size-5 shrink-0 items-center justify-center overflow-hidden " +
        "rounded-full border border-stone-500 bg-stone-600 text-[9px] " +
        "font-bold text-stone-100"
      }
    >
      {avatarUrl && failedAvatarUrl !== avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="size-full object-cover"
          onError={() => setFailedAvatarUrl(avatarUrl)}
        />
      ) : (
        <span>{Array.from(displayName)[0] ?? "?"}</span>
      )}
    </span>
  );
}

export default function UnitContributorTooltip({
  contributors,
  children,
}: Props) {
  const [openContributorKey, setOpenContributorKey] = useState<string | null>(
    null,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressedRef = useRef(false);
  const contributorKey = contributors
    .map(({ role, user }) => `${role}:${user.id}`)
    .join("\u0000");
  const open = contributorKey !== "" && openContributorKey === contributorKey;

  function cancelTimer() {
    if (timerRef.current === null) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  function closeTooltip() {
    cancelTimer();
    setOpenContributorKey(null);
  }

  function isContributorTrigger(event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return false;

    const trigger = target.closest("[data-unit-contributor-trigger]");
    return trigger !== null && event.currentTarget.contains(trigger);
  }

  function handlePointerHover(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch" || !isContributorTrigger(event)) {
      closeTooltip();
      return;
    }
    if (suppressedRef.current || open || timerRef.current !== null) return;
    if (contributorKey === "") return;

    const nextContributorKey = contributorKey;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setOpenContributorKey(nextContributorKey);
    }, HOVER_DELAY_MS);
  }

  function handlePointerDown() {
    suppressedRef.current = true;
    closeTooltip();
  }

  function handlePointerLeave() {
    suppressedRef.current = false;
    closeTooltip();
  }

  useEffect(() => () => cancelTimer(), []);

  return (
    <Tooltip.Root open={open}>
      <Tooltip.Trigger asChild>
        <div
          className="w-full min-w-0"
          onPointerOver={handlePointerHover}
          onPointerMove={handlePointerHover}
          onPointerDownCapture={handlePointerDown}
          onPointerLeave={handlePointerLeave}
        >
          {children}
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          align="center"
          sideOffset={15}
          collisionPadding={8}
          className={
            "pointer-events-none z-50 max-w-60 rounded-md border " +
            "border-stone-700 bg-stone-800/95 px-3 py-2 text-stone-50 " +
            "shadow-lg backdrop-blur-sm data-[state=closed]:animate-out " +
            "data-[state=delayed-open]:animate-in data-[state=closed]:fade-out-0 " +
            "data-[state=delayed-open]:fade-in-0"
          }
        >
          <div className="flex flex-col items-center gap-1.5">
            {contributors.map(({ role, user }) => {
              const displayName = userDisplayName(user);

              return (
                <div
                  key={`${role}:${user.id}`}
                  className="flex max-w-full items-center justify-center gap-1.5 text-xs"
                >
                  <span className="w-10 shrink-0 text-right text-stone-300">
                    {role === "translator" ? "翻译：" : "校对："}
                  </span>
                  <ContributorAvatar user={user} />
                  <span className="min-w-0 break-all text-left font-medium">
                    {displayName}
                  </span>
                </div>
              );
            })}
          </div>
          <Tooltip.Arrow className="fill-stone-800" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
