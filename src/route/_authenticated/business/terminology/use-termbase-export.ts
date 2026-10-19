import { useCallback, useEffect, useMemo, useState } from "react";
import { showLocalCaughtError, toApiRequestError } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import type { TerminologyDataSource } from "./terminology-contract";
import { downloadTermbase } from "./termbase-download";

export type TermbaseExportActions = {
  exportingIds: ReadonlySet<string>;
  exportTermbase: (id: string) => Promise<void>;
};

type ExportScope = {
  dataSource: TerminologyDataSource;
  projectId: string;
  controllers: Map<string, AbortController>;
};
type PendingExports = { scope: ExportScope; ids: ReadonlySet<string> };
type Toast = ReturnType<typeof useToastStore.getState>["showToast"];

const EMPTY_IDS: ReadonlySet<string> = new Set();

async function runExport(
  dataSource: TerminologyDataSource,
  id: string,
  signal: AbortSignal,
  showToast: Toast,
): Promise<void> {
  try {
    const result = await dataSource.exportTermbase(id, signal);
    if (signal.aborted) return;
    if (!result.success) throw toApiRequestError(result);
    downloadTermbase(result.data);
    showToast("已开始下载", "success");
  } catch (error: unknown) {
    if (signal.aborted) return;
    console.error("[TerminologyLookup] 导出术语库失败", { termbaseId: id, error });
    showLocalCaughtError(error, showToast, "导出失败，请重试", true);
  }
}

export function useTermbaseExport(
  dataSource: TerminologyDataSource,
  projectId: string,
): TermbaseExportActions {
  const scope = useMemo<ExportScope>(
    () => ({ dataSource, projectId, controllers: new Map() }),
    [dataSource, projectId],
  );
  const [pending, setPending] = useState<PendingExports>({ scope, ids: EMPTY_IDS });
  const showToast = useToastStore((state) => state.showToast);
  useEffect(() => {
    return () => {
      for (const controller of scope.controllers.values()) controller.abort();
      scope.controllers.clear();
    };
  }, [scope]);
  const exportTermbase = useCallback(
    async (id: string) => {
      if (scope.controllers.has(id)) return;
      const controller = new AbortController();
      scope.controllers.set(id, controller);
      setPending({ scope, ids: new Set(scope.controllers.keys()) });
      try {
        await runExport(scope.dataSource, id, controller.signal, showToast);
      } finally {
        if (scope.controllers.get(id) === controller) {
          scope.controllers.delete(id);
          setPending({ scope, ids: new Set(scope.controllers.keys()) });
        }
      }
    },
    [scope, showToast],
  );
  return { exportingIds: pending.scope === scope ? pending.ids : EMPTY_IDS, exportTermbase };
}
