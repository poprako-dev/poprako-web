import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { FileUp } from "lucide-react";
import { useApiClient } from "@/route/business/api-context";
import { useAppStore } from "@/route/business/session/session-store";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { toApiRequestError } from "@/route/business/request-error";
import { listPages } from "@/route/_authenticated/business/page/page-request";
import { IssueImportDialog } from "@/route/_authenticated/business/issue/IssueImportDialog";
import { ActionButton } from "./ActionButton";

type Props = { chapterId: string };

export function ChapterIssueImportButton({ chapterId }: Props): JSX.Element {
  const client = useApiClient();
  const generation = useAppStore((state) => state.generation);
  const showToast = useToastStore((state) => state.showToast);
  const [pageIds, setPageIds] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      requestRef.current?.abort();
    },
    [chapterId, generation],
  );
  async function open(): Promise<void> {
    if (requestRef.current) return;
    const request = new AbortController();
    requestRef.current = request;
    setBusy(true);
    setError(null);
    try {
      const result = await listPages(client, { chapterId });
      request.signal.throwIfAborted();
      if (!result.success) throw toApiRequestError(result);
      setPageIds(result.data.sort((a, b) => a.index - b.index).map((page) => page.id));
    } catch (error) {
      if (!request.signal.aborted) setError(error instanceof Error ? error.message : String(error));
    } finally {
      if (!request.signal.aborted) setBusy(false);
      if (requestRef.current === request) requestRef.current = null;
    }
  }
  return (
    <>
      <ActionButton
        icon={FileUp}
        title="导入 issue"
        disabled={busy}
        onClick={() => {
          void open();
        }}
      />
      {error && (
        <p role="alert" className="px-2 text-xs text-text-danger">
          {error}
        </p>
      )}
      {pageIds && (
        <IssueImportDialog
          chapterId={chapterId}
          pageIds={pageIds}
          onImported={() => {
            setPageIds(null);
            showToast("已替换整章 issue", "success");
          }}
          onClose={() => {
            setPageIds(null);
          }}
        />
      )}
    </>
  );
}
