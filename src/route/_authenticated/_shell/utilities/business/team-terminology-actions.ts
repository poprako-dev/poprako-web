import type { TermbaseInfo } from "@/route/_authenticated/business/terminology/termbase";
import type { TermInfo } from "@/route/_authenticated/business/terminology/term";
import type {
  UpdateTermArgs,
  UpdateTermbaseArgs,
} from "@/route/_authenticated/business/terminology/terminology-contract";
import type { TeamTerminologyDataSource } from "./team-terminology";
import type { TeamMutation } from "./use-team-mutation";
import { openTeamTermbase, type TeamTerminologyState } from "./use-team-terminology-state";

type Dependencies = {
  dataSource: TeamTerminologyDataSource;
  state: TeamTerminologyState;
  mutate: TeamMutation;
  onActivate: () => void;
};

function refreshBase(state: TeamTerminologyState): void {
  state.setBaseRevision((value) => value + 1);
}

function refreshTerms(state: TeamTerminologyState, countChange: number): void {
  state.setTermRevision((value) => value + 1);
  state.setSelection((current) => {
    if (!current?.info) return current;
    return {
      ...current,
      info: {
        ...current.info,
        termCount: Math.max(0, current.info.termCount + countChange),
      },
    };
  });
  refreshBase(state);
}

function saveBase(
  deps: Dependencies,
  base: TermbaseInfo | undefined,
  args: UpdateTermbaseArgs,
): Promise<boolean> {
  const { dataSource, state, mutate, onActivate } = deps;
  if (!base) {
    return mutate(
      "创建术语库",
      () => dataSource.createTermbase(args),
      (id) => {
        refreshBase(state);
        openTeamTermbase(state, id);
        onActivate();
      },
    );
  }
  return mutate(
    "更新术语库",
    () => dataSource.updateTermbase(base.id, args),
    () => {
      state.setSelection((current) =>
        current?.id === base.id
          ? { id: base.id, info: { ...base, ...args, description: args.description } }
          : current,
      );
      refreshBase(state);
    },
  );
}

function removeBase(deps: Dependencies, base: TermbaseInfo): Promise<boolean> {
  return deps.mutate(
    "删除术语库",
    () => deps.dataSource.deleteTermbase(base.id),
    () => {
      if (deps.state.selection?.id === base.id) {
        deps.state.setSelection(undefined);
        deps.state.setLevel("termbases");
        deps.state.setTermQuery("");
      }
      refreshBase(deps.state);
    },
  );
}

function saveTerm(
  deps: Dependencies,
  term: TermInfo | undefined,
  args: UpdateTermArgs,
): Promise<boolean> {
  const base = deps.state.selection?.info;
  if (!base) return Promise.resolve(false);
  if (term)
    return deps.mutate(
      "更新术语",
      () => deps.dataSource.updateTerm(term.id, args),
      () => {
        refreshTerms(deps.state, 0);
      },
    );
  return deps.mutate(
    "创建术语",
    () => deps.dataSource.createTerm({ termbaseId: base.id, ...args }),
    () => {
      deps.state.setTermQuery("");
      refreshTerms(deps.state, 1);
    },
  );
}

function importBase(deps: Dependencies, file: File): Promise<boolean> {
  return deps.mutate(
    "导入术语库",
    async (isCurrent) => {
      if (!file.name.toLowerCase().endsWith(".json"))
        return { success: false, error: "仅支持 .json 文件" };
      const content = await file.text();
      if (!isCurrent()) return { success: false, error: "导入已取消" };
      return deps.dataSource.importTermbase(content);
    },
    (result) => {
      refreshBase(deps.state);
      openTeamTermbase(deps.state, result.id);
      deps.onActivate();
    },
  );
}

export function createTeamTerminologyActions(deps: Dependencies): TeamTerminologyActions {
  return {
    importBase: (file: File) => importBase(deps, file),
    saveBase: (base: TermbaseInfo | undefined, args: UpdateTermbaseArgs) =>
      saveBase(deps, base, args),
    removeBase: (base: TermbaseInfo) => removeBase(deps, base),
    saveTerm: (term: TermInfo | undefined, args: UpdateTermArgs) => saveTerm(deps, term, args),
    removeTerm: (term: TermInfo) =>
      deps.mutate(
        "删除术语",
        () => deps.dataSource.deleteTerm(term.id),
        () => {
          refreshTerms(deps.state, -1);
        },
      ),
  };
}

export interface TeamTerminologyActions {
  importBase: (file: File) => Promise<boolean>;
  saveBase: (base: TermbaseInfo | undefined, args: UpdateTermbaseArgs) => Promise<boolean>;
  removeBase: (base: TermbaseInfo) => Promise<boolean>;
  saveTerm: (term: TermInfo | undefined, args: UpdateTermArgs) => Promise<boolean>;
  removeTerm: (term: TermInfo) => Promise<boolean>;
}
