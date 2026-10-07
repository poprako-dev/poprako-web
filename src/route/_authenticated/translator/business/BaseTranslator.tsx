import type { JSX } from "react/jsx-runtime";
import type { EditorProps } from "./editor/editor-props";
import { useEditorSession } from "./editor/use-editor-session";
import { EditorCanvas } from "./editor/EditorCanvas";
import { EditorSidebar } from "./editor/EditorSidebar";
import { EditorDialog } from "./editor/EditorDialog";
import { BaseTranslatorLayout } from "./editor/BaseTranslatorLayout";
import { useReadOnlyView } from "./preference/use-read-only-view";
import { useRevisionWorkspace } from "./revision-note/use-revision-workspace";
export function BaseTranslator(props: EditorProps): JSX.Element {
  const available = props.loadRevisionNotes !== null;
  const preference = useReadOnlyView(available);
  const session = useEditorSession(props, preference.view);
  const revisionActive = session.isReadOnly && preference.view === "revision_note";
  const revision = useRevisionWorkspace({
    pageId: session.project.pages[session.pageIndex]?.id ?? "",
    pageIndex: session.pageIndex,
    pageCount: session.project.pages.length,
    active: revisionActive,
    loadRevisionNotes: props.loadRevisionNotes,
    loadRevisionPage: props.loadRevisionPage,
    shortcuts: session.configurableShortcuts,
    relocation: session.isRelocationEnabled,
    onToggleRelocation: session.toggleRelocation,
    onToggleVisible: () => {
      session.setProofreadPreviewVisibility((value) =>
        value === "visible" ? "dimmed" : "visible",
      );
    },
    onNavigate: session.handleNavigate,
    canvasRef: session.canvasRef,
  });
  return (
    <>
      <BaseTranslatorLayout
        canvas={<EditorCanvas session={session} revision={revisionActive ? revision : null} />}
        sidebar={
          <EditorSidebar
            session={session}
            revision={revisionActive ? revision : null}
            readOnlyView={revisionActive ? "revision_note" : "unit"}
            onSwitchReadOnlyView={available ? preference.toggle : undefined}
          />
        }
      />
      <EditorDialog session={session} />
    </>
  );
}
