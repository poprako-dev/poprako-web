import { LoaderCircle } from "lucide-react";
import type { ReactElement } from "react";

type Props = {
  className?: string;
  size?: number;
  "aria-label"?: string;
};

export function LoadingCircle({
  className,
  size = 24,
  "aria-label": ariaLabel = "loading",
}: Props): ReactElement {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: "inline-flex",
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        color: "var(--primary)",
        animation: "poprako-spin 1s linear infinite",
        width: size,
        height: size,
      }}
    >
      <LoaderCircle size={size} />
    </span>
  );
}
