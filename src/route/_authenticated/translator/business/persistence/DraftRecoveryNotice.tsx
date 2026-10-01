import type { JSX } from "react/jsx-runtime";
import { useState, useSyncExternalStore } from "react";
import type { DraftState, DraftStore } from "./draft-store";
const empty: DraftState = { drafts: {}, errors: {}, recoveryErrors: {} };
function subscribeEmpty(): () => void {
  return () => {
    /* No store is attached. */
  };
}
function getEmpty(): DraftState {
  return empty;
}
type Props = {
  store?: DraftStore | undefined;
  pageId?: string | undefined;
  onRetry: () => Promise<void>;
};
export function DraftRecoveryNotice({ store, pageId, onRetry }: Props): JSX.Element | null {
  const state = useSyncExternalStore(
    store?.subscribe ?? subscribeEmpty,
    store?.getState ?? getEmpty,
  );
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const errors = Object.entries(state.recoveryErrors);
  if (!errors.length && !retryError) return null;
  const affectsCurrent = Boolean(
    state.recoveryErrors["*"] ?? (pageId ? state.recoveryErrors[pageId] : undefined),
  );
  async function retry(): Promise<void> {
    setRetrying(true);
    setRetryError(null);
    try {
      await onRetry();
    } catch (error) {
      setRetryError(error instanceof Error ? error.message : String(error));
    } finally {
      setRetrying(false);
    }
  }
  return (
    <div
      role="alert"
      className="border-b border-line-stone-200 bg-surface-stone-50 p-2 text-xs text-ink-stone-700"
    >
      <p>
        {affectsCurrent
          ? "本地草稿未能恢复，当前显示服务器内容；可继续编辑。"
          : "部分页面的本地草稿未能恢复；可继续编辑。"}
      </p>
      <details>
        <summary className="cursor-pointer">错误详情</summary>
        {errors.map(([id, message]) => (
          <p key={id}>
            {id === "*" ? "当前章节" : `页面 ${id}`}：{message}
          </p>
        ))}
        {retryError && <p>{retryError}</p>}
      </details>
      <button
        type="button"
        disabled={retrying}
        onClick={() => {
          void retry();
        }}
        className="mt-1 cursor-pointer underline disabled:opacity-50"
      >
        {retrying ? "正在恢复…" : "重试恢复"}
      </button>
    </div>
  );
}
