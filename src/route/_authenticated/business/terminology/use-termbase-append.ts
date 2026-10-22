import { useEffect, useMemo, useRef, useState } from "react";
import { showLocalApiFailure } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import type { ResultFailure } from "@/shared/utility/result";
import type { TerminologyDataSource } from "./terminology-contract";
import type { AppendTermbaseResult } from "./termbase-append-request";
import { MAX_APPEND_FILE_BYTES } from "./termbase-append-document";

export type TermbaseAppendActions = {
  pendingId: string | null;
  appendTermbase: (id: string, file: File) => Promise<void>;
};
type Scope = { dataSource: TerminologyDataSource };
type Toast = ReturnType<typeof useToastStore.getState>["showToast"];
type Refresh = (id: string, result?: AppendTermbaseResult) => void;

function reportFailure(failure: ResultFailure, showToast: Toast): void {
  console.error("[Terminology] 追加术语失败", failure);
  if (
    (failure.failureKind && !["http", "business"].includes(failure.failureKind)) ||
    (failure.httpStatus ?? 0) >= 500
  ) {
    showToast("追加结果尚未确认，请先查看术语库内容，勿重复追加", "error");
  } else {
    showLocalApiFailure(failure, showToast);
  }
}

async function runAppend(
  scope: Scope,
  id: string,
  file: File,
  showToast: Toast,
  refresh: Refresh,
  isActive: () => boolean,
): Promise<void> {
  if (!file.name.toLowerCase().endsWith(".json")) {
    showToast("仅支持 .json 文件", "error");
    return;
  }
  if (file.size > MAX_APPEND_FILE_BYTES) {
    showToast("术语文件不能超过 8 MiB", "error");
    return;
  }
  let submitted = false;
  try {
    const content = await file.text();
    if (!isActive()) return;
    submitted = true;
    const result = await scope.dataSource.appendTermbase(id, content);
    if (!isActive()) return;
    if (!result.success) {
      reportFailure(result, showToast);
      refresh(id);
      return;
    }
    const { added, updated, unchanged } = result.data;
    showToast(
      `已追加：新增 ${String(added)} 条，更新 ${String(updated)} 条，未变更 ${String(unchanged)} 条`,
      "success",
    );
    refresh(id, result.data);
  } catch (error) {
    console.error("[Terminology] 追加术语异常", { id, error });
    if (!isActive()) return;
    showToast(
      submitted
        ? "追加结果尚未确认，请先查看术语库内容，勿重复追加"
        : "无法读取术语文件，请重新选择",
      "error",
    );
    if (submitted) refresh(id);
  }
}

export function useTermbaseAppend(
  dataSource: TerminologyDataSource,
  refresh: Refresh,
): TermbaseAppendActions {
  const scope = useMemo<Scope>(() => ({ dataSource }), [dataSource]);
  const activeRef = useRef<Scope | null>(null);
  const runningRef = useRef<Scope | null>(null);
  const [pending, setPending] = useState<{ scope: Scope; id: string | null }>({ scope, id: null });
  const showToast = useToastStore((state) => state.showToast);
  useEffect(() => {
    activeRef.current = scope;
    return () => {
      activeRef.current = null;
    };
  }, [scope]);
  async function appendTermbase(id: string, file: File): Promise<void> {
    if (activeRef.current !== scope || runningRef.current === scope) return;
    runningRef.current = scope;
    setPending({ scope, id });
    try {
      await runAppend(scope, id, file, showToast, refresh, () => activeRef.current === scope);
    } finally {
      if (runningRef.current === scope) runningRef.current = null;
      if (activeRef.current === scope) setPending({ scope, id: null });
    }
  }
  return { pendingId: pending.scope === scope ? pending.id : null, appendTermbase };
}
