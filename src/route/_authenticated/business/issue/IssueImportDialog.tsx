import { toApiRequestError } from "@/route/business/request-error";
import { listPageArtworks } from "@/api/page-artwork/page-artwork-api";
import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { FileUp, FileCheck, LoaderCircle } from "lucide-react";
import { FilePicker } from "@/shared/component/FilePicker";
import { AppDialog, AppDialogAction } from "@/shared/component/AppDialog";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { useApiClient } from "@/route/business/api-context";
import { useAppStore } from "@/route/business/session/session-store";
import {
  parseIssueImport,
  resolveIssueImport,
} from "@/route/_authenticated/business/issue/issue-import";
import { replaceChapterIssues } from "@/route/_authenticated/business/issue/issue-request";
import type { ChapterIssuesInput } from "@/route/_authenticated/business/issue/issue";

type Props = {
  chapterId: string;
  onImported: () => void;
  onClose: () => void;
};
type Prepared = { input: ChapterIssuesInput };

export function IssueImportDialog({ chapterId, onImported, onClose }: Props): JSX.Element {
  const client = useApiClient();
  const generation = useAppStore((state) => state.generation);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const selectionRef = useRef(0);
  const selectionRequestRef = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      requestRef.current?.abort();
      selectionRequestRef.current?.abort();
      selectionRef.current++;
    },
    [generation, chapterId],
  );

  async function choose(file: File): Promise<void> {
    const current = ++selectionRef.current;
    selectionRequestRef.current?.abort();
    const selection = new AbortController();
    selectionRequestRef.current = selection;
    setPrepared(null);
    setError(null);
    setFilename(file.name);
    setReading(true);
    try {
      const text = await file.text();
      const fileInput = parseIssueImport(text);
      const pages = await listPageArtworks(client, chapterId, selection.signal);
      if (!pages.success) throw toApiRequestError(pages);
      const input = resolveIssueImport(fileInput, pages.data);
      if (selectionRef.current === current) setPrepared({ input });
    } catch (error) {
      if (selectionRef.current === current)
        setError(error instanceof Error ? error.message : String(error));
    } finally {
      if (selectionRef.current === current) setReading(false);
    }
  }

  async function submit(): Promise<void> {
    if (!prepared || requestRef.current) return;
    const abort = new AbortController();
    requestRef.current = abort;
    setBusy(true);
    setError(null);
    try {
      await replaceChapterIssues(client, chapterId, prepared.input, abort.signal);
      if (useAppStore.getState().generation !== generation) return;
      onImported();
    } catch (error) {
      if (!abort.signal.aborted) setError(error instanceof Error ? error.message : String(error));
    } finally {
      if (!abort.signal.aborted) setBusy(false);
      if (requestRef.current === abort) requestRef.current = null;
    }
  }
  return (
    <AppDialog
      title="上传监稿"
      description="上传后将替换整章监稿。顺序格式按成稿文件自然顺序对应，需包含空页并与成稿页数一致；带页面 ID 的格式可指定部分页面，未指定页面的旧标注也会清空。"
      onClose={onClose}
      locked={busy}
      footer={
        <div className="flex gap-2">
          <AppDialogAction onClick={onClose} disabled={busy}>
            取消
          </AppDialogAction>
          <AppDialogAction
            tone="brand"
            onClick={() => {
              void submit();
            }}
            disabled={!prepared || busy || reading}
          >
            {busy && <LoadingCircle size={16} />}
            {busy ? "正在上传监稿…" : "替换整章监稿"}
          </AppDialogAction>
        </div>
      }
    >
      <FilePicker
        inputLabel="选择监稿文件"
        buttonLabel={filename ? "重新选择监稿" : "选择监稿"}
        accept=".json,application/json"
        disabled={busy}
        invalid={error !== null}
        onSelect={(files) => {
          if (files.length !== 1) {
            selectionRef.current++;
            setReading(false);
            setPrepared(null);
            setError("请选择一个监稿 JSON 文件");
            return;
          }
          const file = files[0];
          if (file) void choose(file);
        }}
      >
        {reading ? (
          <LoaderCircle size={22} className="animate-spin" />
        ) : prepared ? (
          <FileCheck size={22} />
        ) : (
          <FileUp size={22} />
        )}
        <span className="min-w-0 text-left">
          <span className="block break-all text-sm font-semibold">
            {filename ?? "选择或拖入监稿文件"}
          </span>
          <span className="mt-1 block text-xs">
            {reading
              ? "正在读取并检查监稿文件…"
              : filename
                ? "点击或拖入文件重新选择 · JSON"
                : "JSON 格式 · 支持拖入文件"}
          </span>
        </span>
      </FilePicker>
      {reading && (
        <span role="status" className="sr-only">
          正在读取并检查监稿文件
        </span>
      )}
      {error && (
        <p role="alert" className="mt-3 whitespace-pre-wrap text-sm text-text-danger">
          {error}
        </p>
      )}
    </AppDialog>
  );
}
