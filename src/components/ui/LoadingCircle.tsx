import clsx from "clsx";
import { LoaderCircle } from "lucide-react";

type Props = {
  className?: string;
  size?: number;
  "aria-label"?: string;
};

export default function LoadingCircle({
  className = "inline-flex shrink-0 items-center justify-center text-emerald-500 animate-spin",
  size = 24,
  "aria-label": ariaLabel = "loading",
}: Props) {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={clsx(className)}
      style={{ width: size, height: size }}
    >
      <LoaderCircle size={size} />
    </span>
  );
}
