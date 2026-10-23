import type { ReactElement } from "react";
import { useModuleResource } from "@/shared/hook/use-module-resource";
import { boundedCompressionModule } from "./utility-modules";
import { UtilityModuleFeedback } from "./UtilityModuleFeedback";

export function AsyncBoundedCompressionTool(): ReactElement {
  const snapshot = useModuleResource(boundedCompressionModule, true);
  if (snapshot.status === "ready") {
    const { BoundedCompressionTool } = snapshot.module;
    return <BoundedCompressionTool />;
  }
  return <UtilityModuleFeedback failed={snapshot.status === "error"} />;
}
