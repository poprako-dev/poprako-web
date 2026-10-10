import type { ReactElement, Dispatch, SetStateAction } from "react";
import { TermbaseEditorDialog } from "./TermbaseEditorDialog";
import { TermEditorDialog } from "./TermEditorDialog";
import type { TerminologyMutationActions } from "./use-terminology-lookup-mutations";
import type { LookupEditorState } from "./use-terminology-lookup-state";

type Props = {
  editor: LookupEditorState | undefined;
  setEditor: Dispatch<SetStateAction<LookupEditorState | undefined>>;
  mutations: TerminologyMutationActions;
};

export function TerminologyLookupEditors({ editor, setEditor, mutations }: Props): ReactElement {
  return (
    <>
      {editor?.kind === "termbase" && (
        <TermbaseEditorDialog
          termbase={editor.termbase}
          onSave={(args) => mutations.handleSaveTermbase(editor.termbase, args)}
          onDelete={
            editor.termbase ? mutations.handleDeleteTermbase.bind(null, editor.termbase) : undefined
          }
          onClose={() => {
            setEditor(undefined);
          }}
        />
      )}
      {editor?.kind === "term" && (
        <TermEditorDialog
          term={editor.term}
          onSave={(args) => mutations.handleSaveTerm(editor.term, args)}
          onDelete={editor.term ? mutations.handleDeleteTerm.bind(null, editor.term) : undefined}
          onClose={() => {
            setEditor(undefined);
          }}
        />
      )}
    </>
  );
}
