import type { ReactElement } from "react";
import { LoadingCircle } from "@/shared/component/LoadingCircle";

export function RoutePending(): ReactElement {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LoadingCircle />
    </div>
  );
}
