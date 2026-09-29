import type { JSX } from "react/jsx-runtime";
import type { EditorProps } from "./editor/editor-props";
import { useEditorSession } from "./editor/use-editor-session";
import { EditorCanvas } from "./editor/EditorCanvas";
import { EditorSidebar } from "./editor/EditorSidebar";
import { EditorDialog } from "./editor/EditorDialog";
import { BaseTranslatorLayout } from "./editor/BaseTranslatorLayout";
export function BaseTranslator(props: EditorProps): JSX.Element {
  const session = useEditorSession(props);
  return (
    <>
      <BaseTranslatorLayout
        canvas={<EditorCanvas session={session} />}
        sidebar={<EditorSidebar session={session} />}
      />
      <EditorDialog session={session} />
    </>
  );
}
