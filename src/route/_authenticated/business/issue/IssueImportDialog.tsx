import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { AppDialog, AppDialogAction } from "@/shared/component/AppDialog";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { useApiClient } from "@/route/business/api-context";
import { useAppStore } from "@/route/business/session/session-store";
import { parseIssueImport } from "@/route/_authenticated/business/issue/issue-import";
import { replaceChapterIssues } from "@/route/_authenticated/business/issue/issue-request";
import type { ChapterIssuesInput } from "@/route/_authenticated/business/issue/issue";

type Props = {
  chapterId: string;
  pageIds: readonly string[];
  onImported: () => void;
  onClose: () => void;
};
type Prepared = { filename: string; input: ChapterIssuesInput };

export function IssueImportDialog({ chapterId, pageIds, onImported, onClose }: Props): JSX.Element {
  const client = useApiClient();
  const generation = useAppStore((state) => state.generation);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const selectionRef = useRef(0);
  useEffect(
    () => () => {
      requestRef.current?.abort();
      selectionRef.current++;
    },
    [generation],
  );

  async function choose(file: File): Promise<void> {
    const current = ++selectionRef.current;
    setPrepared(null);
    setError(null);
    try {
      const text = await file.text();
      const input = parseIssueImport(text, pageIds.length);
      if (selectionRef.current === current) setPrepared({ filename: file.name, input });
    } catch (error) {
      if (selectionRef.current === current)
        setError(error instanceof Error ? error.message : String(error));
    }
  }

  async function submit(): Promise<void> {
    if (!prepared || requestRef.current) return;
    const abort = new AbortController();
    requestRef.current = abort;
    setBusy(true);
    setError(null);
    try {
      await replaceChapterIssues(client, chapterId, prepared.input, pageIds, abort.signal);
      if (useAppStore.getState().generation !== generation) return;
      onImported();
    } catch (error) {
      if (!abort.signal.aborted) setError(error instanceof Error ? error.message : String(error));
    } finally {
      if (!abort.signal.aborted) setBusy(false);
      if (requestRef.current === abort) requestRef.current = null;
    }
  }
  const issueCount = prepared?.input.pages.reduce((sum, page) => sum + page.issues.length, 0) ?? 0;
  return (
    <AppDialog
      title="导入 issue"
      description="导入将替换整章当前的所有 issue。文件中的页面按当前章节页顺序对应，必须包含没有问题的空页。"
      onClose={onClose}
      locked={busy}
      footer={
        <div className="flex gap-2">
          <AppDialogAction onClick={onClose} disabled={busy}>
            取消
          </AppDialogAction>
          <AppDialogAction
            tone="warning"
            onClick={() => {
              void submit();
            }}
            disabled={!prepared || busy}
          >
            {busy ? <LoadingCircle size={16} /> : "替换整章 issue"}
          </AppDialogAction>
        </div>
      }
    >
      <label className="flex flex-col gap-2 text-sm text-ink-stone-700">
        选择 issue 文件
        <input
          type="file"
          accept=".json,application/json"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void choose(file);
          }}
        />
      </label>
      {prepared && (
        <div
          role="status"
          className="mt-4 rounded-md border border-line-stone-200 bg-surface-stone-50 p-3 text-sm text-ink-stone-700"
        >
          <p className="break-all">{prepared.filename}</p>
          <p className="mt-1">
            {prepared.input.pages.length} 页 · {issueCount} 个 issue
          </p>
          {issueCount === 0 && <p className="mt-2">此次导入将清空整章 issue。</p>}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 whitespace-pre-wrap text-sm text-text-danger">
          {error}
        </p>
      )}
    </AppDialog>
  );
}
