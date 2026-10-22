import { useTermbaseAppend } from "@/route/_authenticated/business/terminology/use-termbase-append";
import { useCallback, useImperativeHandle, type ReactElement, type Ref } from "react";
import { ChevronLeft, FolderOpen } from "lucide-react";
import clsx from "clsx";
import { TermbasePanel } from "@/route/_authenticated/business/terminology/TermbasePanel";
import { useDebouncedValue } from "@/route/_authenticated/business/terminology/use-debounced-value";
import { useTermbaseExport } from "@/route/_authenticated/business/terminology/use-termbase-export";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalApiFailure } from "@/route/business/request-error";
import type { ResultFailure } from "@/shared/utility/result";
import type { TeamTerminology } from "./team-terminology";
import { openTeamTermbase, useTeamTerminologyState } from "./use-team-terminology-state";
import { useTeamMutation } from "./use-team-mutation";
import { createTeamTerminologyActions } from "./team-terminology-actions";
import { useTeamTermbaseDetail } from "./use-team-termbase-detail";
import { useDirectoryTransition } from "./use-directory-transition";
import { TeamTerminologyEditors } from "./TeamTerminologyEditors";
import { TeamTermList } from "./TeamTermList";
import { useDirectoryFocus } from "./use-directory-focus";
import { TeamTerminologyToolbar } from "./TeamTerminologyToolbar";

export interface TeamTerminologyHandle {
  importFile: (file: File) => Promise<boolean>;
}
type Props = {
  terminology: TeamTerminology;
  active: boolean;
  onActivate: () => void;
  ref?: Ref<TeamTerminologyHandle>;
};

export function TeamTerminologyTool({ terminology, active, onActivate, ref }: Props): ReactElement {
  const state = useTeamTerminologyState();
  const mutate = useTeamMutation(terminology.canEdit);
  const actions = createTeamTerminologyActions({
    dataSource: terminology.dataSource,
    state,
    mutate,
    onActivate,
  });
  const appends = useTermbaseAppend(terminology.dataSource, (id) => {
    state.setBaseRevision((revision) => revision + 1);
    state.setTermRevision((revision) => revision + 1);
    state.setSelection((current) => (current?.id === id ? { id } : current));
  });
  const exports = useTermbaseExport(terminology.dataSource, terminology.teamId);
  const searchQuery = useDebouncedValue(state.baseQuery, 250);
  const { displayedLevel, fading } = useDirectoryTransition(state.level);
  const sectionRef = useDirectoryFocus(displayedLevel, active);
  const showToast = useToastStore((store) => store.showToast);
  const onError = useCallback(
    (error: ResultFailure) => {
      showLocalApiFailure(error, showToast);
    },
    [showToast],
  );
  useTeamTermbaseDetail(
    terminology.dataSource,
    terminology.teamId,
    state.selection,
    state.setSelection,
  );
  useImperativeHandle(ref, () => ({ importFile: actions.importBase }), [actions.importBase]);

  return (
    <section ref={sectionRef} aria-label="团队术语库" className="flex h-full min-h-0 flex-col">
      <header className="mb-2 flex h-7 shrink-0 items-center gap-2 text-lg font-semibold">
        {state.level === "terms" ? (
          <button
            type="button"
            aria-label="返回术语库"
            onClick={() => {
              state.setLevel("termbases");
            }}
            className="flex items-center gap-1 rounded-md text-sm font-medium text-text-muted-warm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            术语库
          </button>
        ) : (
          <>
            <FolderOpen size={18} aria-hidden="true" />
            <h2>术语库</h2>
          </>
        )}
      </header>
      <div
        className={clsx(
          "min-h-0 flex-1 transition-opacity duration-150 ease-out motion-reduce:transition-none",
          fading ? "opacity-0" : "opacity-100",
        )}
      >
        <div hidden={displayedLevel !== "termbases"} className="h-full min-h-0">
          <div className="flex h-full min-h-0 flex-col">
            <TermbasePanel
              dataSource={terminology.dataSource}
              termbaseExport={exports}
              termbaseAppend={appends}
              query={state.baseQuery}
              searchQuery={searchQuery}
              revision={state.baseRevision}
              enabled={active && state.level === "termbases"}
              canCreate={terminology.canEdit}
              canEdit={() => terminology.canEdit}
              directory
              header={
                <TeamTerminologyToolbar
                  query={state.baseQuery}
                  placeholder="搜索术语库名称"
                  createLabel="新建术语库"
                  canCreate={terminology.canEdit}
                  onQueryChange={state.setBaseQuery}
                  onCreate={() => {
                    state.setEditor({ kind: "termbase" });
                  }}
                />
              }
              onQueryChange={state.setBaseQuery}
              onSelect={(base) => {
                openTeamTermbase(state, base.id, base);
              }}
              onCreate={() => {
                state.setEditor({ kind: "termbase" });
              }}
              onEdit={(termbase) => {
                state.setEditor({ kind: "termbase", termbase });
              }}
              onError={onError}
            />
          </div>
        </div>
        <div hidden={displayedLevel !== "terms"} className="h-full min-h-0">
          <div className="flex h-full min-h-0 flex-col">
            <TeamTermList
              key={state.selection?.id ?? "none"}
              terminology={terminology}
              state={state}
              active={active && state.level === "terms"}
              onError={onError}
            />
          </div>
        </div>
      </div>
      {terminology.canEdit && <TeamTerminologyEditors state={state} actions={actions} />}
    </section>
  );
}
