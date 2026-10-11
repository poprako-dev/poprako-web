import type { Dispatch, SetStateAction } from "react";
import type { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalApiFailure } from "@/route/business/request-error";
import type { ResultFailure } from "@/shared/utility/result";
import type { TermbaseInfo } from "@/route/_authenticated/translator/business/terminology/termbase";
import type { TermInfo } from "@/route/_authenticated/translator/business/terminology/term";
import type {
  TerminologyDataSource,
  UpdateTermArgs,
  UpdateTermbaseArgs,
} from "@/route/_authenticated/translator/business/contract/terminology";
import type { TerminologyLookupState } from "./use-terminology-lookup-state";

type Toast = ReturnType<typeof useToastStore.getState>["showToast"];
type ErrorHandler = (action: string, failure: ResultFailure) => false;
type StateSetter<T> = Dispatch<SetStateAction<T>>;

export interface TerminologyMutationActions {
  handleSaveTermbase: (
    termbase: TermbaseInfo | undefined,
    args: UpdateTermbaseArgs,
  ) => Promise<boolean>;
  handleDeleteTermbase: (termbase: TermbaseInfo) => Promise<boolean>;
  handleSaveTerm: (term: TermInfo | undefined, args: UpdateTermArgs) => Promise<boolean>;
  handleDeleteTerm: (term: TermInfo) => Promise<boolean>;
}

function createMutationErrorHandler(showToast: Toast): ErrorHandler {
  return (action, failure) => {
    console.error(`[TerminologyLookup] ${action}失败`, { error: failure.error });
    showLocalApiFailure(failure, showToast);
    return false;
  };
}

type TermbaseSaveDeps = {
  dataSource: TerminologyDataSource;
  setTermbaseQuery: StateSetter<string>;
  setSelectedTermbase: StateSetter<TermbaseInfo | undefined>;
  setTermbaseRevision: StateSetter<number>;
  onError: ErrorHandler;
  showToast: Toast;
};

function createSaveTermbase(
  deps: TermbaseSaveDeps,
): TerminologyMutationActions["handleSaveTermbase"] {
  return async (termbase, args) => {
    if (!termbase) {
      const result = await deps.dataSource.createTermbase(args);
      if (!result.success) return deps.onError("创建术语库", result);
      deps.setTermbaseQuery("");
      deps.setTermbaseRevision((revision) => revision + 1);
      deps.showToast("术语库已创建", "success");
      return true;
    }
    const result = await deps.dataSource.updateTermbase(termbase.id, args);
    if (!result.success) return deps.onError("更新术语库", result);
    deps.setSelectedTermbase((current) =>
      current?.id === termbase.id
        ? { ...current, ...args, description: args.description ?? "" }
        : current,
    );
    deps.setTermbaseRevision((revision) => revision + 1);
    deps.showToast("术语库已更新", "success");
    return true;
  };
}

type TermbaseDeleteDeps = Pick<
  TermbaseSaveDeps,
  | "dataSource"
  | "setSelectedTermbase"
  | "setTermbaseQuery"
  | "setTermbaseRevision"
  | "onError"
  | "showToast"
> & {
  setTermRevision: StateSetter<number>;
  setRenderedPanel: TerminologyLookupState["setRenderedPanel"];
  setPanel: TerminologyLookupState["setPanel"];
  selectedTermbase: TermbaseInfo | undefined;
};

function createDeleteTermbase(
  deps: TermbaseDeleteDeps,
): TerminologyMutationActions["handleDeleteTermbase"] {
  return async (termbase) => {
    const result = await deps.dataSource.deleteTermbase(termbase.id);
    if (!result.success) return deps.onError("删除术语库", result);
    if (deps.selectedTermbase?.id === termbase.id) {
      deps.setSelectedTermbase(undefined);
      deps.setTermbaseQuery("");
      deps.setRenderedPanel("termbases");
      deps.setPanel("termbases");
    }
    deps.setTermbaseRevision((revision) => revision + 1);
    deps.setTermRevision((revision) => revision + 1);
    deps.showToast("术语库已删除", "success");
    return true;
  };
}

type TermSaveDeps = {
  dataSource: TerminologyDataSource;
  selectedTermbase: TermbaseInfo | undefined;
  setSourceQuery: StateSetter<string>;
  setSelectedTermbase: StateSetter<TermbaseInfo | undefined>;
  setTermbaseRevision: StateSetter<number>;
  setTermRevision: StateSetter<number>;
  onError: ErrorHandler;
  showToast: Toast;
};

function createSaveTerm(deps: TermSaveDeps): TerminologyMutationActions["handleSaveTerm"] {
  return async (term, args) => {
    const termbase = deps.selectedTermbase;
    if (!termbase) return false;
    if (!term) {
      const result = await deps.dataSource.createTerm({ termbaseId: termbase.id, ...args });
      if (!result.success) return deps.onError("创建术语", result);
      deps.setSourceQuery("");
      deps.setSelectedTermbase((current) =>
        current ? { ...current, termCount: current.termCount + 1 } : current,
      );
      deps.setTermbaseRevision((revision) => revision + 1);
      deps.setTermRevision((revision) => revision + 1);
      deps.showToast("术语已创建", "success");
      return true;
    }
    const result = await deps.dataSource.updateTerm(term.id, args);
    if (!result.success) return deps.onError("更新术语", result);
    deps.setTermRevision((revision) => revision + 1);
    deps.showToast("术语已更新", "success");
    return true;
  };
}

function createDeleteTerm(
  dataSource: TerminologyDataSource,
  setSelectedTermbase: StateSetter<TermbaseInfo | undefined>,
  setTermbaseRevision: StateSetter<number>,
  setTermRevision: StateSetter<number>,
  onError: ErrorHandler,
  showToast: Toast,
): TerminologyMutationActions["handleDeleteTerm"] {
  return async (term) => {
    const result = await dataSource.deleteTerm(term.id);
    if (!result.success) return onError("删除术语", result);
    setSelectedTermbase((current) =>
      current ? { ...current, termCount: Math.max(0, current.termCount - 1) } : current,
    );
    setTermbaseRevision((revision) => revision + 1);
    setTermRevision((revision) => revision + 1);
    showToast("术语已删除", "success");
    return true;
  };
}

export function createTerminologyLookupMutations(
  dataSource: TerminologyDataSource,
  state: TerminologyLookupState,
  showToast: Toast,
): TerminologyMutationActions {
  const onError = createMutationErrorHandler(showToast);
  const termbaseDeps = {
    dataSource,
    setTermbaseQuery: state.setTermbaseQuery,
    setSelectedTermbase: state.setSelectedTermbase,
    setTermbaseRevision: state.setTermbaseRevision,
    onError,
    showToast,
  };
  return {
    handleSaveTermbase: createSaveTermbase(termbaseDeps),
    handleDeleteTermbase: createDeleteTermbase({
      ...termbaseDeps,
      selectedTermbase: state.selectedTermbase,
      setTermRevision: state.setTermRevision,
      setRenderedPanel: state.setRenderedPanel,
      setPanel: state.setPanel,
    }),
    handleSaveTerm: createSaveTerm({
      dataSource,
      selectedTermbase: state.selectedTermbase,
      setSourceQuery: state.setSourceQuery,
      setSelectedTermbase: state.setSelectedTermbase,
      setTermbaseRevision: state.setTermbaseRevision,
      setTermRevision: state.setTermRevision,
      onError,
      showToast,
    }),
    handleDeleteTerm: createDeleteTerm(
      dataSource,
      state.setSelectedTermbase,
      state.setTermbaseRevision,
      state.setTermRevision,
      onError,
      showToast,
    ),
  };
}
