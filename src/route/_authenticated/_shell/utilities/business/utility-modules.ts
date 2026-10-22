import { createModuleResource } from "@/shared/utility/module-resource";

export const boundedCompressionModule = createModuleResource(
  () => import("./BoundedCompressionTool"),
);
export const teamTerminologyModule = createModuleResource(() => import("./TeamTerminologyTool"));
