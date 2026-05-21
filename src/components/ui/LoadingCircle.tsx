import { LoaderCircle } from "lucide-react"

type Props = {
  className?: string
  size?: number
  "aria-label"?: string
}

const BASE_STYLE: React.CSSProperties = {
  display: "inline-flex",
  flexShrink: 0,
  alignItems: "center",
  justifyContent: "center",
  color: "#10b981",
  animation: "poprako-spin 1s linear infinite",
}

export default function LoadingCircle({
  className = "",
  size = 24,
  "aria-label": ariaLabel = "loading",
}: Props) {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={className}
      style={{ ...BASE_STYLE, width: size, height: size }}
    >
      <LoaderCircle size={size} />
    </span>
  )
}
