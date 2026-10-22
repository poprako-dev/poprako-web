import { useEffect, useSyncExternalStore } from "react";
import type { ModuleResource, ModuleSnapshot } from "@/shared/utility/module-resource";

export function useModuleResource<Module>(
  resource: ModuleResource<Module>,
  enabled = true,
): ModuleSnapshot<Module> {
  const snapshot = useSyncExternalStore(resource.subscribe, resource.getSnapshot);
  useEffect(() => {
    if (!enabled || snapshot.status !== "idle") return;
    void resource.load().catch((error: unknown) => {
      console.error("[ModuleResource] 加载失败:", error);
    });
  }, [resource, enabled, snapshot.status]);
  return snapshot;
}
