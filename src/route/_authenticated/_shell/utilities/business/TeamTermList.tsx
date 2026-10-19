import type { ReactElement } from "react";
import { FolderOpen } from "lucide-react";
import { TermPanel } from "@/route/_authenticated/business/terminology/TermPanel";
import { useDebouncedValue } from "@/route/_authenticated/business/terminology/use-debounced-value";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { Button } from "@/shared/component/Button";
import type { ResultFailure } from "@/shared/utility/result";
import type { TeamTerminology } from "./team-terminology";
import type { TeamTerminologyState } from "./use-team-terminology-state";
import { TeamTerminologyToolbar } from "./TeamTerminologyToolbar";

type Props = {
  terminology: TeamTerminology;
  state: TeamTerminologyState;
  active: boolean;
  onError: (error: ResultFailure) => void;
};

export function TeamTermList({ terminology, state, active, onError }: Props): ReactElement {
  const query = useDebouncedValue(state.termQuery, 250);
  const selection = state.selection;
  if (!selection?.info) {
    return (
      <div className="flex min-h-28 flex-1 flex-col items-center justify-center gap-2">
        {selection?.error ? (
          <>
            <p role="alert" className="text-xs text-text-muted-warm">
              {selection.error}
            </p>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                state.setSelection({ id: selection.id });
              }}
            >
              重试
            </Button>
          </>
        ) : (
          <LoadingCircle size={18} aria-label="正在加载术语库" />
        )}
      </div>
    );
  }
  return (
    <TermPanel
      key={selection.id}
      dataSource={terminology.dataSource}
      termbase={selection.info}
      query={query}
      revision={state.termRevision}
      enabled={active}
      canEdit={terminology.canEdit}
      directory
      header={
        <>
          <TeamTerminologyToolbar
            query={state.termQuery}
            placeholder="搜索术语原文"
            createLabel="新建术语"
            canCreate={terminology.canEdit}
            onQueryChange={state.setTermQuery}
            onCreate={() => {
              state.setEditor({ kind: "term" });
            }}
          />
          <div className="flex min-h-12 shrink-0 items-center gap-2 border-b border-line-stone-200/80 px-2.5 py-2">
            <FolderOpen size={18} className="shrink-0 text-icon-muted-warm" aria-hidden="true" />
            <h3 className="min-w-0 truncate text-base font-semibold">{selection.info.name}</h3>
            <span className="shrink-0 text-xs tabular-nums text-text-muted-warm">
              {selection.info.termCount} 条
            </span>
          </div>
        </>
      }
      onCreate={() => {
        state.setEditor({ kind: "term" });
      }}
      onEdit={(term) => {
        state.setEditor({ kind: "term", term });
      }}
      onError={onError}
    />
  );
}
