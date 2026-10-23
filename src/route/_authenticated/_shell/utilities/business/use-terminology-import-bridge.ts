import { useCallback, useEffect, useRef, useState } from "react";
import type { TeamTerminologyHandle } from "./TeamTerminologyTool";
import { teamTerminologyModule } from "./utility-modules";

type PendingImport = { file: File; resolve: (success: boolean) => void };
type ImportBridge = {
  requested: boolean;
  attach: (tool: TeamTerminologyHandle | null) => void;
  importFile: TeamTerminologyHandle["importFile"];
};

export function useTerminologyImportBridge(onActivate: () => void): ImportBridge {
  const [requested, setRequested] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toolRef = useRef<TeamTerminologyHandle | null>(null);
  const attach = useCallback((tool: TeamTerminologyHandle | null) => {
    toolRef.current = tool;
    if (tool) setMounted(true);
  }, []);
  const pendingRef = useRef<PendingImport | null>(null);
  useEffect(() => {
    const tool = toolRef.current;
    const pending = pendingRef.current;
    if (!tool || !pending) return;
    pendingRef.current = null;
    void tool.importFile(pending.file).then(pending.resolve);
  }, [mounted]);
  useEffect(
    () => () => {
      pendingRef.current?.resolve(false);
      pendingRef.current = null;
    },
    [],
  );
  function importFile(file: File): Promise<boolean> {
    if (toolRef.current) return toolRef.current.importFile(file);
    if (pendingRef.current) return Promise.resolve(false);
    setRequested(true);
    const promise = new Promise<boolean>((resolve) => {
      pendingRef.current = { file, resolve };
    });
    void teamTerminologyModule.load().catch((error: unknown) => {
      console.error("[Utilities] 加载术语库工具失败", error);
      if (pendingRef.current) onActivate();
    });
    return promise;
  }
  return { requested, attach, importFile };
}
