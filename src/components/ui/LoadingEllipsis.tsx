import clsx from "clsx";
import { CircleEllipsis } from "lucide-react";

type Props = {
  className?: string;
  size?: number;
  "aria-label"?: string;
};

export default function LoadingEllipsis({
  className = "h-6 w-6 text-emerald-500 animate-spin",
  size = 24,
  "aria-label": ariaLabel = "loading",
}: Props) {
  return (
    <span role="status" aria-label={ariaLabel} className={clsx(className)}>
      <CircleEllipsis className="h-full w-full" size={size} />
    </span>
  );
}
