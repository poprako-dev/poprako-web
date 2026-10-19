import type { ReactElement } from "react";
import { TermbaseEditorDialog } from "@/route/_authenticated/business/terminology/TermbaseEditorDialog";
import { TermEditorDialog } from "@/route/_authenticated/business/terminology/TermEditorDialog";
import type { TeamTerminologyState } from "./use-team-terminology-state";
import type { TeamTerminologyActions } from "./team-terminology-actions";

type Props = { state: TeamTerminologyState; actions: TeamTerminologyActions };

export function TeamTerminologyEditors({ state, actions }: Props): ReactElement | null {
  const editor = state.editor;
  const onClose = (): void => {
    state.setEditor(undefined);
  };
  if (editor?.kind === "termbase") {
    return (
      <TermbaseEditorDialog
        termbase={editor.termbase}
        onSave={(args) => actions.saveBase(editor.termbase, args)}
        onDelete={editor.termbase ? actions.removeBase.bind(null, editor.termbase) : undefined}
        onClose={onClose}
      />
    );
  }
  if (editor?.kind === "term") {
    return (
      <TermEditorDialog
        term={editor.term}
        onSave={(args) => actions.saveTerm(editor.term, args)}
        onDelete={editor.term ? actions.removeTerm.bind(null, editor.term) : undefined}
        onClose={onClose}
      />
    );
  }
  return null;
}
